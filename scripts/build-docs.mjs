#!/usr/bin/env node
// Builds the public documentation site into dist/:
//   dist/index.html          Scalar API Reference, SoccersAPI theme, one entry per operation
//   dist/openapi.docs.json   the contract prepared for the site
//
// The canonical contract stays openapi.yaml. This script derives a
// documentation build from it: every `t` operation listed in `x-operations`
// becomes its own page (path `/v2.2/route/?t=value`, which Scalar sends as the
// real URL), the full route documentation moves to the tag header, and
// user/token become security schemes so the client stores them once.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCALAR_VERSION = process.env.SCALAR_VERSION || 'latest';

const BRAND = {
  name: 'SoccersAPI',
  site: 'https://soccersapi.com',
  logo: 'https://soccersapi.com/assets/images/logo-dark.svg',
  favicon: 'https://soccersapi.com/favicon/assets/images/soccersapi-icon.webp',
  accent: '#19c96b', accentHover: '#15b05d', dark: '#06110c', darkSoft: '#0b1a12', darkHover: '#103b2a',
  text: '#020617', pageBg: '#f6f8f7',
  links: [
    { label: 'Website', href: 'https://soccersapi.com' },
    { label: 'Coverage', href: 'https://soccersapi.com/coverage' },
    { label: 'Pricing', href: 'https://soccersapi.com/pricing' },
    { label: 'Dashboard', href: 'https://admin.soccersapi.com' },
  ],
};

const src = yaml.load(readFileSync(resolve(root, 'openapi.yaml'), 'utf8'));

// ---------------------------------------------------------------- helpers
const routeName = (path) => {
  const key = path.replace(/^\/v2\.2\//, '').replace(/\/$/, '');
  return { search: 'Search', continents: 'Continents', countries: 'Countries', leagues: 'Leagues', teams: 'Teams', seasons: 'Seasons', stages: 'Stages', groups: 'Groups', rounds: 'Rounds', livescores: 'Livescores', fixtures: 'Fixtures', stats: 'Statistics', h2h: 'Head to head', leaders: 'Leaders', bookmakers: 'Bookmakers', markets: 'Markets', broadcast: 'Broadcast', players: 'Players', coaches: 'Coaches', referees: 'Referees', venues: 'Venues', media: 'Media' }[key] || key;
};
const GROUPS = [
  { name: 'Search', routes: ['Search'] },
  { name: 'Matches', routes: ['Livescores', 'Fixtures', 'Statistics', 'Head to head', 'Leaders'] },
  { name: 'Competitions', routes: ['Leagues', 'Seasons', 'Stages', 'Groups', 'Rounds'] },
  { name: 'Teams and people', routes: ['Teams', 'Players', 'Coaches', 'Referees', 'Venues'] },
  { name: 'Broadcast and odds', routes: ['Broadcast', 'Bookmakers', 'Markets'] },
  { name: 'Geography', routes: ['Continents', 'Countries'] },
  { name: 'Media', routes: ['Media'] },
];
const resolveParam = (p) => (p.$ref ? src.components.parameters[p.$ref.split('/').pop()] : p);
const stripConditional = (d) => (d || '').replace(/\s*(Required when `t` is [^.]*\.|Optional for [^.]*\.|Required by every operation\.)/g, '').trim();
const code = (s) => `\`${s}\``;

// ---------------------------------------------------------------- explode operations
const paths = {};
const tags = [];
for (const [path, item] of Object.entries(src.paths)) {
  const op = item.get;
  const name = routeName(path);
  const comingSoon = op['x-status'] === 'coming-soon';
  tags.push({ name, description: (comingSoon ? '**Coming soon.** This route is not available yet on production.\n\n' : '') + op.description });
  const baseParams = op.parameters.map(resolveParam).filter((p) => !['user', 'token', 't'].includes(p.name));
  const byName = Object.fromEntries(baseParams.map((p) => [p.name, p]));
  const examples = op.responses['200']?.content?.['application/json']?.examples || {};
  for (const x of op['x-operations']) {
    const params = [];
    for (const n of [...x.required, ...x.optional]) {
      const p = byName[n];
      if (!p) continue;
      params.push({ ...p, required: x.required.includes(n), description: stripConditional(p.description) });
    }
    const lines = [x.purpose || '', ''];
    lines.push(`Operation selector: ${code(`t=${x.t}`)}${x.required.length ? `. Required: ${x.required.map(code).join(', ')}` : ''}${x.optional.length ? `. Optional: ${x.optional.map(code).join(', ')}` : ''}.`);
    if (x.paginated) lines.push('', 'Paginated: 100 items per page; read `meta.pages` and request the next pages with `page`.');
    if (x.theme) lines.push('', `Dataset theme: **${x.theme}**. Themed plans include only their own theme; Free and Standard plans include every theme for their leagues.`);
    lines.push('', '```http', `GET ${path}?user=USER&token=TOKEN&t=${x.t}${x.example ? '&' + x.example : ''}`, '```');
    const responses = { ...op.responses, 200: { description: `${x.schema} envelope. See the example for the exact shape.`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${x.schema}` } } } } };
    if (examples[x.t]) responses[200].content['application/json'].examples = { [x.t]: examples[x.t] };
    paths[`${path}?t=${x.t}`] = { get: {
      summary: comingSoon ? `${x.title} (coming soon)` : x.title,
      operationId: `${op.operationId}_${x.t}`,
      tags: [name],
      description: lines.join('\n'),
      ...(comingSoon ? { 'x-status': 'coming-soon' } : {}),
      parameters: params,
      responses,
    } };
  }
}

// ---------------------------------------------------------------- guides
const docsDir = resolve(root, 'docs');
const guideFiles = readdirSync(docsDir).filter((f) => /^\d{2}-.*\.md$/.test(f)).sort();
const titleOf = (md) => (md.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
const slug = (s) => s.toLowerCase().replace(/[`*_]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const anchors = Object.fromEntries(guideFiles.map((f) => [f, slug(titleOf(readFileSync(resolve(docsDir, f), 'utf8')))]));
const relink = (md) => md.replace(/\]\(\.\/(\d{2}-[^)#]+\.md)(#[^)]*)?\)/g, (m, file) => (anchors[file] ? `](#description/${anchors[file]})` : m));
const shift = (md) => md.replace(/^(#{1,5})\s/gm, (m, h) => `${h}# `);

const landing = relink(readFileSync(resolve(docsDir, 'landing.md'), 'utf8').trim()).replace(/^#\s+.+$/m, '# Introduction');
const guides = guideFiles.filter((f) => !/^04-/.test(f)).map((f) => shift(relink(readFileSync(resolve(docsDir, f), 'utf8').trim())));
const changelog = relink(readFileSync(resolve(docsDir, '04-changelog.md'), 'utf8').trim());

// ---------------------------------------------------------------- assemble
const spec = {
  openapi: src.openapi,
  info: { ...src.info, description: [landing, '# Guides', ...guides].join('\n\n') },
  servers: src.servers,
  tags: [...tags, { name: 'Changelog', description: changelog }],
  'x-tagGroups': [...GROUPS.map((g) => ({ name: g.name, tags: g.routes })), { name: 'Release notes', tags: ['Changelog'] }],
  paths,
  components: {
    ...src.components,
    parameters: Object.fromEntries(Object.entries(src.components.parameters).filter(([k]) => !['User', 'Token'].includes(k))),
    securitySchemes: {
      user: { type: 'apiKey', in: 'query', name: 'user', description: 'Account username.' },
      token: { type: 'apiKey', in: 'query', name: 'token', description: 'API token generated in the account dashboard. Use a development token in the browser.' },
    },
  },
  security: [{ user: [], token: [] }],
};

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/openapi.docs.json'), JSON.stringify(spec, null, 2));

const configuration = {
  persistAuth: true,
  proxyUrl: '',
  layout: 'modern',
  theme: 'none',
  hideModels: false,
  searchHotKey: 'k',
  defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
  authentication: { preferredSecurityScheme: [['user', 'token']] },
  // Scalar's hosted AI assistant calls api.scalar.com; keep the site self-contained.
  agent: { disabled: true },
  metaData: { title: `${BRAND.name} documentation`, description: 'Football data API reference with an interactive client.' },
};

const css = `
:root { --scalar-font: 'Onest', ui-sans-serif, system-ui, sans-serif; --scalar-font-code: 'IBM Plex Mono', ui-monospace, monospace; --scalar-radius: 6px; --scalar-radius-lg: 10px; --scalar-radius-xl: 14px; }
.light-mode {
  --scalar-color-accent: ${BRAND.accent}; --scalar-background-accent: rgba(25, 201, 107, .12);
  --scalar-background-1: #ffffff; --scalar-background-2: ${BRAND.pageBg}; --scalar-background-3: #eaf0ec;
  --scalar-color-1: ${BRAND.text}; --scalar-color-2: #3d4a43; --scalar-color-3: #6b7a72; --scalar-border-color: #dfe6e2;
  --scalar-button-1: ${BRAND.accent}; --scalar-button-1-color: ${BRAND.dark}; --scalar-button-1-hover: ${BRAND.accentHover};
  --scalar-sidebar-background-1: ${BRAND.dark}; --scalar-sidebar-color-1: #e8f5ee; --scalar-sidebar-color-2: #9db5a7; --scalar-sidebar-color-active: ${BRAND.accent};
  --scalar-sidebar-item-hover-background: ${BRAND.darkHover}; --scalar-sidebar-item-hover-color: #ffffff; --scalar-sidebar-item-active-background: ${BRAND.darkHover};
  --scalar-sidebar-border-color: #123324; --scalar-sidebar-search-background: ${BRAND.darkSoft}; --scalar-sidebar-search-border-color: #1c4431; --scalar-sidebar-search-color: #e8f5ee;
  --scalar-sidebar-indent-border: #1c4431; --scalar-sidebar-indent-border-hover: #2a5c43; --scalar-sidebar-indent-border-active: ${BRAND.accent};
}
.dark-mode {
  --scalar-color-accent: ${BRAND.accent}; --scalar-background-accent: rgba(25, 201, 107, .16);
  --scalar-background-1: ${BRAND.dark}; --scalar-background-2: ${BRAND.darkSoft}; --scalar-background-3: ${BRAND.darkHover};
  --scalar-color-1: #e8f5ee; --scalar-color-2: #b5c9bd; --scalar-color-3: #8ea698; --scalar-border-color: #1c4431;
  --scalar-button-1: ${BRAND.accent}; --scalar-button-1-color: ${BRAND.dark}; --scalar-button-1-hover: ${BRAND.accentHover};
  --scalar-sidebar-background-1: #04100a; --scalar-sidebar-color-1: #e8f5ee; --scalar-sidebar-color-2: #9db5a7; --scalar-sidebar-color-active: ${BRAND.accent};
  --scalar-sidebar-item-hover-background: ${BRAND.darkHover}; --scalar-sidebar-item-active-background: ${BRAND.darkHover}; --scalar-sidebar-border-color: #123324;
  --scalar-sidebar-search-background: ${BRAND.darkSoft}; --scalar-sidebar-search-border-color: #1c4431; --scalar-sidebar-search-color: #e8f5ee;
}
.sidebar-heading-type, .scalar-api-reference h1, .scalar-api-reference h2 { font-family: 'Sora', 'Onest', sans-serif; }
`;

const header = `
  <header class="sapi-header">
    <a class="sapi-brand" href="${BRAND.site}"><img src="${BRAND.logo}" alt="${BRAND.name}" height="26"><span>Documentation</span></a>
    <nav>${BRAND.links.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}</nav>
  </header>`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${BRAND.name} documentation</title>
  <link rel="icon" href="${BRAND.favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Sora:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
  <style>
    body { margin: 0; background: ${BRAND.dark}; font-family: 'Onest', ui-sans-serif, system-ui, sans-serif; }
    .sapi-header { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 52px; padding: 0 20px; background: ${BRAND.dark}; border-bottom: 1px solid #123324; font: 500 14px/1 'Onest', system-ui, sans-serif; }
    .sapi-brand { display: flex; align-items: center; gap: 12px; color: #e8f5ee; text-decoration: none; }
    .sapi-brand span { padding-left: 12px; border-left: 1px solid #1c4431; color: #9db5a7; font-weight: 500; }
    .sapi-header nav { display: flex; gap: 20px; }
    .sapi-header nav a { color: #b5c9bd; text-decoration: none; }
    .sapi-header nav a:hover { color: ${BRAND.accent}; }
    #app { min-height: calc(100vh - 52px); }
    ${css}
  </style>
</head>
<body>
  ${header}
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
console.log(`dist/index.html written (${Math.round(html.length / 1024)} KB): ${Object.keys(paths).length} operation pages in ${tags.length} routes, ${guideFiles.length} guides, Scalar ${SCALAR_VERSION}`);
