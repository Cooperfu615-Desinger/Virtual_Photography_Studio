// Static-only boundary check. Never evaluate production modules while scanning.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';

export const CATALOG_TEST_EXPORTS = new Set(['getCompiledCatalogForTesting', 'getLegacyMappingsForTesting']);
const value = node => node?.type === 'Identifier' ? node.name
  : node?.type === 'Literal' ? node.value
  : node?.type === 'TemplateLiteral' && !node.expressions.length ? node.quasis[0].value.cooked : null;

export function testExportIssues(ast, file, root) {
  const issues = [], engine = resolve(root, 'webapp/src/lib/engine.js');
  const isEngineSource = node => {
    const source = value(node);
    if (typeof source !== 'string') return false;
    const clean = source.split(/[?#]/)[0];
    return [engine, engine.slice(0, -3)].includes(resolve(dirname(file), clean));
  };
  const report = (node, detail) => issues.push({
    code: 'CATALOG_TEST_EXPORT_IN_PRODUCTION',
    itemKey: `${relative(root, file)}:${node.loc.start.line}:${node.loc.start.column + 1}`,
    message: detail, evidence: [relative(root, file)],
  });
  const walk = node => {
    if (!node || typeof node.type !== 'string') return;
    const moduleSource = ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression'].includes(node.type)
      ? value(node.source) : node.type === 'CallExpression' && node.callee.name === 'require' ? value(node.arguments[0]) : null;
    if (typeof moduleSource === 'string' && /\.(?:test|spec)\.[cm]?jsx?(?:[?#].*)?$/.test(moduleSource)) {
      report(node, 'Production must not load exempt test modules or their re-exported aliases');
    }
    if (node.type === 'ImportDeclaration') {
      for (const spec of node.specifiers) {
        if (CATALOG_TEST_EXPORTS.has(value(spec.imported))) report(spec, 'Test-only catalog export imported into production');
        else if (spec.type === 'ImportNamespaceSpecifier' && isEngineSource(node.source)) report(spec, 'Engine namespace exposes test-only catalog exports; use named public imports');
      }
    } else if (node.type === 'ExportNamedDeclaration') {
      for (const spec of node.specifiers) if (CATALOG_TEST_EXPORTS.has(value(spec.local)) || CATALOG_TEST_EXPORTS.has(value(spec.exported))) {
        report(spec, 'Test-only catalog export re-exported by production');
      }
    } else if (node.type === 'ExportAllDeclaration' && isEngineSource(node.source)) {
      report(node, 'Engine wildcard re-export exposes test-only catalog exports');
    } else if ((node.type === 'ImportExpression' && isEngineSource(node.source)) ||
               (node.type === 'CallExpression' && node.callee.name === 'require' && isEngineSource(node.arguments[0]))) {
      report(node, 'Dynamic engine namespace exposes test-only catalog exports; use named public imports');
    } else if (node.type === 'MemberExpression' && CATALOG_TEST_EXPORTS.has(value(node.property))) {
      report(node, 'Test-only catalog export accessed through a namespace');
    } else if (node.type === 'Property' && CATALOG_TEST_EXPORTS.has(value(node.key))) {
      report(node, 'Test-only catalog export captured or forwarded through a property');
    } else if (node.type === 'CallExpression' && CATALOG_TEST_EXPORTS.has(value(node.callee))) {
      report(node, 'Test-only catalog export called from production');
    }
    for (const [key, child] of Object.entries(node)) {
      if (['loc', 'range'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === 'object') walk(child);
    }
  };
  walk(ast);
  return issues;
}

export function scanCatalogTestExports(root) {
  const parse = createRequire(join(root, 'webapp/package.json'))('espree').parse;
  const issues = [];
  let files = 0;
  const walk = dir => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, item.name);
      if (item.isDirectory()) { walk(file); continue; }
      if (!/\.(?:[cm]?js|jsx)$/.test(item.name) || /\.(?:test|spec)\.(?:[cm]?js|jsx)$/.test(item.name)) continue;
      // Helpers/fixtures are not broadly exempted by filename: production can import them.
      files++;
      try {
        const ast = parse(readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module', loc: true, ecmaFeatures: { jsx: true } });
        issues.push(...testExportIssues(ast, file, root));
      } catch (error) {
        issues.push({ code: 'CATALOG_PRODUCTION_PARSE', itemKey: relative(root, file), message: error.message, evidence: [] });
      }
    }
  };
  walk(join(root, 'webapp/src'));
  return { files, issues };
}
