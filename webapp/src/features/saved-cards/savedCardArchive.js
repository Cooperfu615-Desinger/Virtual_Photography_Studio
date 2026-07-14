import JSZip from 'jszip';
import fileSaver from 'file-saver';

import {
  buildMarkdownExport,
  buildSavedCardManifestItem,
  parseExportedMarkdownPrompt,
} from './cardCodec.js';

const { saveAs } = fileSaver;

const SOURCE_PROJECT = 'virtual-photography-studio';

function archiveIdDescriptor(prompt, index) {
  const sourceId = String(prompt?.id || '').trim() || `item-${index + 1}`;
  const safeId = sourceId
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 96) || `item-${index + 1}`;
  return {
    sourceId,
    safeId,
    baseFile: `prompt_${safeId}.md`,
  };
}

function shortArchiveHash(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildArchiveFileNames(items) {
  const descriptors = (Array.isArray(items) ? items : []).map(archiveIdDescriptor);
  const groups = new Map();
  descriptors.forEach((descriptor) => {
    const group = groups.get(descriptor.baseFile) || [];
    group.push(descriptor);
    groups.set(descriptor.baseFile, group);
  });

  const used = new Set();
  return descriptors.map((descriptor) => {
    const group = groups.get(descriptor.baseFile) || [];
    const needsDisambiguation = group.length > 1;
    const hash = shortArchiveHash(descriptor.sourceId);
    let file = needsDisambiguation
      ? `prompt_${descriptor.safeId}_${hash}.md`
      : descriptor.baseFile;
    let suffix = 2;
    while (used.has(file)) {
      file = `prompt_${descriptor.safeId}_${hash}_${suffix}.md`;
      suffix += 1;
    }
    used.add(file);
    return file;
  });
}

function getExportableItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((prompt) => prompt && typeof prompt === 'object' && String(prompt.id || '').trim());
}

function normalizeArchivePath(path) {
  return String(path || '').replace(/^\.\//, '').replace(/\\/g, '/');
}

function findManifestItem(manifestItems, entryName) {
  const normalizedEntryName = normalizeArchivePath(entryName);
  const entryBaseName = normalizedEntryName.split('/').pop();
  return manifestItems.find((item) => {
    const itemFile = normalizeArchivePath(item?.file);
    return itemFile === normalizedEntryName || itemFile.split('/').pop() === entryBaseName;
  }) || null;
}

export async function createSavedCardsArchive(items, now = Date.now(), type = 'blob') {
  const exportItems = getExportableItems(items);
  if (exportItems.length === 0) return null;

  const zip = new JSZip();
  const manifestItems = [];
  const files = buildArchiveFileNames(exportItems);
  exportItems.forEach((prompt, index) => {
    const file = files[index];
    zip.file(file, buildMarkdownExport(prompt));
    manifestItems.push(buildSavedCardManifestItem(prompt, file));
  });
  zip.file('manifest.json', JSON.stringify({
    schemaVersion: 1,
    sourceProject: SOURCE_PROJECT,
    exportedAt: new Date(now).toISOString(),
    items: manifestItems,
  }, null, 2));
  return zip.generateAsync({ type });
}

export async function downloadSavedCardsArchive(items, now = Date.now()) {
  const content = await createSavedCardsArchive(items, now, 'blob');
  if (!content) return false;
  saveAs(content, `virtual_photography_prompts_${now}.zip`);
  return true;
}

export async function parseSavedCardsArchive(file, controls) {
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = Object.values(zip.files).find((entry) => (
    !entry.dir && normalizeArchivePath(entry.name).toLowerCase() === 'manifest.json'
  ));
  let manifest = null;
  if (manifestEntry) {
    try {
      manifest = JSON.parse(await manifestEntry.async('string'));
    } catch {
      throw new Error('manifest.json is invalid');
    }
  }

  const manifestItems = Array.isArray(manifest?.items) ? manifest.items : [];
  const markdownEntries = Object.values(zip.files)
    .filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (markdownEntries.length === 0) {
    throw new Error('zip does not contain exported markdown prompts');
  }

  const importedPrompts = [];
  for (const entry of markdownEntries) {
    const markdown = await entry.async('string');
    const idMatch = entry.name.match(/prompt_(.+)\.md$/i);
    const fallbackId = idMatch?.[1] || `${Date.now()}-${importedPrompts.length}`;
    const manifestItem = findManifestItem(manifestItems, entry.name);
    const parsedPrompt = parseExportedMarkdownPrompt(markdown, controls, manifestItem?.sourceId || fallbackId);
    importedPrompts.push({
      ...parsedPrompt,
      sourceProject: manifest?.sourceProject || '',
      sourceId: manifestItem?.sourceId || fallbackId,
      sourceFileName: entry.name,
      sourceTags: Array.isArray(manifestItem?.tags) ? manifestItem.tags : [],
    });
  }
  return importedPrompts;
}
