import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { buildMarkdownExport, parseExportedMarkdownPrompt } from './cardCodec.js';

export async function downloadSavedCardsArchive(items, now = Date.now()) {
  if (!Array.isArray(items) || items.length === 0) return false;

  const zip = new JSZip();
  items.forEach((prompt) => {
    zip.file(`prompt_${prompt.id}.md`, buildMarkdownExport(prompt));
  });
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `virtual_photography_prompts_${now}.zip`);
  return true;
}

export async function parseSavedCardsArchive(file, controls) {
  const zip = await JSZip.loadAsync(file);
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
    importedPrompts.push(parseExportedMarkdownPrompt(markdown, controls, fallbackId));
  }
  return importedPrompts;
}
