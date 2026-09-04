#!/usr/bin/env node
// Builds the public documentation site into dist/:
//   dist/index.html          Scalar API Reference with the guides and the try-it client
//   dist/openapi.docs.json   the contract prepared for the site (auth as security schemes)
//
// The canonical contract stays openapi.yaml; this script only derives a
// documentation build from it.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCALAR_VERSION = process.env.SCALAR_VERSION || 'latest';

const spec = yaml.load(readFileSync(resolve(root, 'openapi.yaml'), 'utf8'));

// --- Authentication as security schemes so the client can store user/token once.
spec.components.securitySchemes = {
  user: { type: 'apiKey', in: 'query', name: 'user', description: 'Account username.' },
  token: { type: 'apiKey', in: 'query', name: 'token', description: 'API token generated in the account dashboard. Use a development token in the browser.' },
};
spec.security = [{ user: [], token: [] }];
for (const item of Object.values(spec.paths)) {
  for (const op of Object.values(item)) {
    if (!op || typeof op !== 'object' || !Array.isArray(op.parameters)) continue;
    op.parameters = op.parameters.filter((p) => !(p.$ref && /\/(User|Token)$/.test(p.$ref)));
    delete op.security;
  }
}
delete spec.components.parameters.User;
delete spec.components.parameters.Token;

// --- Guides become the introduction of the reference.
const docsDir = resolve(root, 'docs');
const guideFiles = readdirSync(docsDir).filter((f) => /^\d{2}-.*\.md$/.test(f)).sort();
const titleOf = (md) => (md.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
const slug = (s) => s.toLowerCase().replace(/[`*_]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const anchors = Object.fromEntries(guideFiles.map((f) => [f, slug(titleOf(readFileSync(resolve(docsDir, f), 'utf8')))]));
const relink = (md) => md.replace(/\]\(\.\/(\d{2}-[^)#]+\.md)(#[^)]*)?\)/g, (m, file) => (anchors[file] ? `](#description/${anchors[file]})` : m));

const landing = readFileSync(resolve(docsDir, 'landing.md'), 'utf8');
const sections = [relink(landing.trim())];
for (const f of guideFiles) {
  const md = readFileSync(resolve(docsDir, f), 'utf8').trim();
  if (/^04-/.test(f)) continue; // the changelog gets its own tag below
  sections.push(relink(md));
}
spec.info.description = sections.join('\n\n---\n\n');
spec.info['x-logo'] = { url: 'https://soccersapi.com/favicon.ico', altText: 'SoccersAPI' };

// --- Sidebar groups.
spec['x-tagGroups'] = [
  { name: 'Football data', tags: ['Search', 'Geography', 'Competitions', 'Teams', 'People', 'Venues'] },
  { name: 'Matches', tags: ['Livescores', 'Fixtures', 'Statistics', 'Head to head', 'Leaders'] },
  { name: 'Broadcast and betting', tags: ['Broadcast', 'Betting'] },
  { name: 'Media', tags: ['Media'] },
];
const changelog = relink(readFileSync(resolve(docsDir, '04-changelog.md'), 'utf8').trim());
spec.tags.push({ name: 'Changelog', description: changelog });
spec['x-tagGroups'].push({ name: 'Release notes', tags: ['Changelog'] });

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/openapi.docs.json'), JSON.stringify(spec, null, 2));

const configuration = {
  // Store user/token in the browser so the try-it client reuses them.
  persistAuth: true,
  // Call api.soccersapi.com directly; it sends Access-Control-Allow-Origin: *.
  proxyUrl: '',
  layout: 'modern',
  theme: 'kepler',
  hideModels: false,
  showSidebar: true,
  searchHotKey: 'k',
  defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
  authentication: { preferredSecurityScheme: [['user', 'token']] },
  metaData: { title: 'SoccersAPI documentation', description: 'Football data API reference with an interactive client.' },
};

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SoccersAPI documentation</title>
  <link rel="icon" href="https://soccersapi.com/favicon.ico">
  <style>
    body { margin: 0; }
    .sapi-note { font: 13px/1.5 system-ui, sans-serif; background: #0f3d2e; color: #d9f5e5; padding: 8px 16px; }
    .sapi-note a { color: #9ae6b4; }
  </style>
</head>
<body>
  <div class="sapi-note">Interactive documentation preview. Requests go straight to <code>api.soccersapi.com</code> with the credentials you enter under <strong>Authentication</strong>; they are stored only in this browser. Use a development token.</div>
  <div id="app"></div>
  <script id="sapi-spec" type="application/json">${JSON.stringify(spec).replace(/<\//g, '<\\/')}</script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}"></script>
  <script>
    const content = JSON.parse(document.getElementById('sapi-spec').textContent);
    Scalar.createApiReference('#app', Object.assign(${JSON.stringify(configuration)}, { content }));
  </script>
</body>
</html>
`;
writeFileSync(resolve(root, 'dist/index.html'), html);
console.log(`dist/index.html written (${Math.round(html.length / 1024)} KB), ${guideFiles.length} guides embedded, Scalar ${SCALAR_VERSION}`);
