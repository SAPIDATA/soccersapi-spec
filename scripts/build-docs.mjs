#!/usr/bin/env node
// Builds the public documentation site into dist/ for Cloudflare Pages:
//   index.html                 Scalar API Reference (interactive client, one entry per operation)
//   <route>/<t>/index.html     static page per operation (SEO, stable URLs)
//   <route>/index.html         static page per route
//   guides/<slug>/index.html   static page per guide
//   openapi.yaml               canonical contract; openapi.docs.json is the derived one
//   vendor/scalar-<v>.js       pinned Scalar bundle served from the site
//   sitemap.xml, robots.txt, llms.txt, llms-full.txt, _redirects, _headers, 404.html
//
// The canonical contract stays openapi.yaml; everything here derives from it.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { marked } from 'marked';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const SITE = (process.env.DOCS_SITE_URL || 'https://docs.soccersapi.com').replace(/\/$/, '');
const SCALAR_VERSION = process.env.SCALAR_VERSION || '1.67.0';
const USE_CDN = process.env.DOCS_SCALAR_CDN === '1';
const ANALYTICS = process.env.DOCS_ANALYTICS !== '0';
const GA_ID = 'G-X4GFCYMMQN';
const ADS_ID = 'AW-10816481324';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const BRAND = {
  name: 'SoccersAPI',
  site: 'https://soccersapi.com',
  logo: 'https://soccersapi.com/assets/images/logo-light.svg',
  favicon: 'https://soccersapi.com/favicon/assets/images/soccersapi-icon.webp',
  accent: '#19c96b', accentHover: '#15b05d', dark: '#06110c', darkSoft: '#0b1a12', darkHover: '#103b2a',
  text: '#020617', pageBg: '#f6f8f7', border: '#e5e7eb', muted: '#64748b',
  links: [
    { label: 'Website', href: 'https://soccersapi.com' },
    { label: 'Coverage', href: 'https://soccersapi.com/coverage' },
    { label: 'Pricing', href: 'https://soccersapi.com/pricing' },
    { label: 'Dashboard', href: 'https://admin.soccersapi.com' },
    { label: 'OpenAPI', href: '/openapi.yaml' },
  ],
};

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[`*_]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const code = (s) => `\`${s}\``;
const write = (rel, content) => { const f = resolve(dist, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); };
const routeKey = (path) => path.replace(/^\/v2\.2\//, '').replace(/\/$/, '');
const routeName = (path) => ({ search: 'Search', continents: 'Continents', countries: 'Countries', leagues: 'Leagues', teams: 'Teams', seasons: 'Seasons', stages: 'Stages', groups: 'Groups', rounds: 'Rounds', livescores: 'Livescores', fixtures: 'Fixtures', stats: 'Statistics', h2h: 'Head to head', leaders: 'Leaders', bookmakers: 'Bookmakers', markets: 'Markets', broadcast: 'Broadcast', players: 'Players', coaches: 'Coaches', referees: 'Referees', venues: 'Venues', media: 'Media' }[routeKey(path)] || routeKey(path));
const GROUPS = [
  { name: 'Search', routes: ['Search'] },
  { name: 'Matches', routes: ['Livescores', 'Fixtures', 'Statistics', 'Head to head', 'Leaders'] },
  { name: 'Competitions', routes: ['Leagues', 'Seasons', 'Stages', 'Groups', 'Rounds'] },
  { name: 'Teams and people', routes: ['Teams', 'Players', 'Coaches', 'Referees', 'Venues'] },
  { name: 'Broadcast and odds', routes: ['Broadcast', 'Bookmakers', 'Markets'] },
  { name: 'Geography', routes: ['Continents', 'Countries'] },
  { name: 'Media', routes: ['Media'] },
];

// Markdown: heading ids, guide cross-links resolved to site pages.
const docsDir = resolve(root, 'docs');
const guideFiles = readdirSync(docsDir).filter((f) => /^\d{2}-.*\.md$/.test(f)).sort();
const titleOf = (md) => (md.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
const guides = guideFiles.map((f) => { const md = readFileSync(resolve(docsDir, f), 'utf8').trim(); const title = titleOf(md); return { file: f, title, slug: /^04-/.test(f) ? 'changelog' : slug(title), md }; });
const guideBySlugFile = Object.fromEntries(guides.map((g) => [g.file, g]));
const relinkImg = (md) => md.replace(/\]\(\.\/img\//g, '](/img/');
const relinkSite = (md) => relinkImg(md).replace(/\]\(\.\/(\d{2}-[^)#]+\.md)(#[^)]*)?\)/g, (m, file, hash) => (guideBySlugFile[file] ? `](/guides/${guideBySlugFile[file].slug}/${hash || ''})` : m));
const relinkHash = (md) => relinkImg(md).replace(/\]\(\.\/(\d{2}-[^)#]+\.md)(#[^)]*)?\)/g, (m, file) => (guideBySlugFile[file] ? `](#description/${guideBySlugFile[file].slug})` : m));
marked.use({ renderer: { heading({ tokens, depth }) { const text = this.parser.parseInline(tokens); return `<h${depth} id="${slug(text.replace(/<[^>]+>/g, ''))}">${text}</h${depth}>\n`; } } });
const md2html = (md) => marked.parse(md).replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
const inline = (md) => marked.parseInline(md || '');
const firstParagraph = (md) => (md.replace(/^#.*$/m, '').trim().split(/\n\s*\n/)[0] || '').replace(/[`*_>]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- load and explode
const src = yaml.load(readFileSync(resolve(root, 'openapi.yaml'), 'utf8'));
const resolveParam = (p) => (p.$ref ? src.components.parameters[p.$ref.split('/').pop()] : p);
const ALL_PLANS = ['free', 'standard', 'worldcup', 'odds', 'broadcast'];
const PLAN_NAME = { free: 'Free', standard: 'Standard', worldcup: 'World Cup', odds: 'Odds', broadcast: 'Broadcast' };
const planLabel = (plans) => { if (!plans || plans.length === ALL_PLANS.length) return ''; const themed = plans.filter((p) => ['odds', 'broadcast'].includes(p)).map((p) => PLAN_NAME[p]); return themed.length ? `Standard, World Cup, ${themed.join(', ')}` : 'Standard, World Cup'; };
const stripConditional = (d) => (d || '').replace(/\s*(Required when `t` is [^.]*\.|Optional for [^.]*\.|Required by every operation\.)/g, '').trim();

const routes = [];
for (const [path, item] of Object.entries(src.paths)) {
  const op = item.get;
  const name = routeName(path);
  const comingSoon = op['x-status'] === 'coming-soon';
  const baseParams = op.parameters.map(resolveParam).filter((p) => !['user', 'token', 't'].includes(p.name));
  const byName = Object.fromEntries(baseParams.map((p) => [p.name, p]));
  const examples = op.responses['200']?.content?.['application/json']?.examples || {};
  const ops = op['x-operations'].map((x) => ({
    ...x,
    params: [...x.required, ...x.optional].filter((n) => byName[n]).map((n) => ({ ...byName[n], required: x.required.includes(n), description: stripConditional(byName[n].description) })),
    example: examples[x.t]?.value,
    url: `/${routeKey(path)}/${x.t}/`,
    anchor: `/#tag/${slug(name)}/GET${path}?t=${x.t}`,
    request: `GET ${path}?user=USER&token=TOKEN&t=${x.t}${x.example ? '&' + x.example : ''}`,
  }));
  routes.push({ path, key: routeKey(path), name, comingSoon, operationId: op.operationId, summary: op.summary, description: op.description, intro: op.description.split('\n## ')[0].trim(), ops, url: `/${routeKey(path)}/`, anchor: `/#tag/${slug(name)}` });
}

// ---------------------------------------------------------------- docs spec for Scalar
const paths = {};
const tags = [];
for (const r of routes) {
  tags.push({ name: r.name, description: (r.comingSoon ? '**Coming soon.** This route is not available yet on production.\n\n' : '') + r.description });
  for (const x of r.ops) {
    const lines = [x.purpose || '', '', `Operation selector: ${code(`t=${x.t}`)}${x.required.length ? `. Required: ${x.required.map(code).join(', ')}` : ''}${x.optional.length ? `. Optional: ${x.optional.map(code).join(', ')}` : ''}.`];
    if (x.paginated) lines.push('', 'Paginated: 100 items per page; read `meta.pages` and request the next pages with `page`.');
    if (planLabel(x.plans)) lines.push('', `**Plans: ${planLabel(x.plans)}.** Free plans carry the Standard datasets. Other plans receive \`403\` with \`meta.msg\` = \`Endpoint not available for your plan.\``);
    lines.push('', '```http', x.request, '```', '', `Permanent link: [${SITE}${x.url}](${SITE}${x.url})`);
    const srcOp = src.paths[r.path].get;
    const responses = { ...srcOp.responses, 200: { description: `${x.schema} envelope. See the example for the exact shape.`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${x.schema}` } } } } };
    if (x.example) responses[200].content['application/json'].examples = { [x.t]: { summary: x.title, value: x.example } };
    paths[`${r.path}?t=${x.t}`] = { get: { summary: r.comingSoon ? `${x.title} (coming soon)` : x.title, operationId: `${r.operationId}_${x.t}`, tags: [r.name], description: lines.join('\n'), ...(r.comingSoon ? { 'x-status': 'coming-soon' } : {}), parameters: x.params, responses } };
  }
}
const landing = relinkHash(readFileSync(resolve(docsDir, 'landing.md'), 'utf8').trim()).replace(/^#\s+.+$/m, '# Introduction');
const shift = (md) => md.replace(/^(#{1,5})\s/gm, (m, h) => `${h}# `);
const changelog = guides.find((g) => /^04-/.test(g.file));
const spec = {
  openapi: src.openapi,
  info: { ...src.info, description: [landing, '# Guides', ...guides.filter((g) => g !== changelog).map((g) => shift(relinkHash(g.md)))].join('\n\n') },
  servers: src.servers,
  tags: [...tags, { name: 'Changelog', description: relinkHash(changelog.md) }],
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
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
if (existsSync(resolve(docsDir, 'img'))) { mkdirSync(resolve(dist, 'img'), { recursive: true }); for (const f of readdirSync(resolve(docsDir, 'img'))) copyFileSync(resolve(docsDir, 'img', f), resolve(dist, 'img', f)); }
write('openapi.docs.json', JSON.stringify(spec, null, 2));
copyFileSync(resolve(root, 'openapi.yaml'), resolve(dist, 'openapi.yaml'));

// ---------------------------------------------------------------- Scalar bundle
let scalarSrc = `https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}`;
if (!USE_CDN) {
  const cache = resolve(root, 'tmp/vendor', `scalar-${SCALAR_VERSION}.js`);
  if (!existsSync(cache)) {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}/dist/browser/standalone.js`);
    if (!res.ok) throw new Error(`Could not download Scalar ${SCALAR_VERSION}: HTTP ${res.status}`);
    mkdirSync(dirname(cache), { recursive: true });
    writeFileSync(cache, Buffer.from(await res.arrayBuffer()));
  }
  mkdirSync(resolve(dist, 'vendor'), { recursive: true });
  copyFileSync(cache, resolve(dist, 'vendor', `scalar-${SCALAR_VERSION}.js`));
  scalarSrc = `/vendor/scalar-${SCALAR_VERSION}.js`;
}

// ---------------------------------------------------------------- shared HTML
const analytics = ANALYTICS ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');gtag('config','${ADS_ID}');</script>` : '';
const fonts = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">`;
const headerHtml = `
  <header class="sapi-header">
    <a class="sapi-brand" href="/"><img src="${BRAND.logo}" alt="${BRAND.name}" height="36"><span>Docs</span></a>
    <nav>${BRAND.links.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}<a class="sapi-cta" href="https://admin.soccersapi.com/register">Start free trial</a></nav>
  </header>`;
const headerCss = `
    body { margin: 0; background: ${BRAND.pageBg}; color: ${BRAND.text}; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
    .sapi-header { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 64px; padding: 0 24px; background: #ffffff; border-bottom: 1px solid ${BRAND.border}; font: 500 14px/1 'Inter', system-ui, sans-serif; }
    .sapi-brand { display: flex; align-items: center; gap: 12px; color: ${BRAND.text}; text-decoration: none; }
    .sapi-brand span { padding-left: 12px; border-left: 1px solid ${BRAND.border}; color: ${BRAND.muted}; font-weight: 500; }
    .sapi-header nav { display: flex; align-items: center; gap: 22px; }
    .sapi-header nav a { color: ${BRAND.text}; text-decoration: none; }
    .sapi-header nav a:hover { color: #0f7a44; }
    .sapi-header nav a.sapi-cta { background: ${BRAND.accent}; color: #ffffff; padding: 9px 16px; border-radius: 6px; font-weight: 600; white-space: nowrap; }
    .sapi-header nav a.sapi-cta:hover { background: ${BRAND.accentHover}; color: #ffffff; }
    @media (max-width: 720px) { .sapi-header { height: 56px; padding: 0 16px; } .sapi-header img { height: 30px; } .sapi-brand { gap: 10px; } .sapi-brand span { padding-left: 10px; } .sapi-header nav a:not(.sapi-cta) { display: none; } .sapi-header nav a.sapi-cta { padding: 8px 12px; font-size: 13px; } }`;
const head = ({ title, description, path, extra = '' }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${SITE}${path}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${BRAND.name} documentation">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${SITE}${path}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="${BRAND.favicon}">${fonts}${analytics}${extra}
</head>`;

// ---------------------------------------------------------------- reference (index.html)
const configuration = {
  persistAuth: true, proxyUrl: '', darkMode: false, layout: 'modern', theme: 'none', hideModels: false, searchHotKey: 'k',
  defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
  authentication: { preferredSecurityScheme: [['user', 'token']] },
  agent: { disabled: true }, hideDownloadButton: true, documentDownloadType: 'none',
  metaData: { title: `${BRAND.name} documentation`, description: 'Football data API reference with an interactive client.' },
};
const themeCss = `
:root { --scalar-font: 'Inter', ui-sans-serif, system-ui, sans-serif; --scalar-font-code: 'IBM Plex Mono', ui-monospace, monospace; --scalar-radius: 4px; --scalar-radius-lg: 6px; --scalar-radius-xl: 8px; }
.light-mode {
  --scalar-color-accent: ${BRAND.accent}; --scalar-background-accent: #e7f8ee; --scalar-color-green: ${BRAND.accent};
  --scalar-background-1: #ffffff; --scalar-background-2: ${BRAND.pageBg}; --scalar-background-3: #f1f5f9;
  --scalar-color-1: ${BRAND.text}; --scalar-color-2: #475569; --scalar-color-3: ${BRAND.muted}; --scalar-border-color: ${BRAND.border};
  --scalar-button-1: ${BRAND.accent}; --scalar-button-1-color: #ffffff; --scalar-button-1-hover: ${BRAND.accentHover};
  --scalar-sidebar-background-1: #ffffff; --scalar-sidebar-color-1: ${BRAND.text}; --scalar-sidebar-color-2: ${BRAND.text}; --scalar-sidebar-color-active: #0f7a44;
  --scalar-sidebar-item-hover-background: ${BRAND.pageBg}; --scalar-sidebar-item-hover-color: ${BRAND.text}; --scalar-sidebar-item-active-background: #f1f5f9;
  --scalar-sidebar-border-color: ${BRAND.border}; --scalar-sidebar-search-background: #ffffff; --scalar-sidebar-search-border-color: ${BRAND.border}; --scalar-sidebar-search-color: ${BRAND.text};
  --scalar-sidebar-indent-border: #e5e7eb; --scalar-sidebar-indent-border-hover: #cbd5e1; --scalar-sidebar-indent-border-active: #020617;
}
.dark-mode {
  --scalar-color-accent: ${BRAND.accent}; --scalar-background-accent: rgba(25, 201, 107, .16); --scalar-color-green: ${BRAND.accent};
  --scalar-background-1: ${BRAND.dark}; --scalar-background-2: ${BRAND.darkSoft}; --scalar-background-3: ${BRAND.darkHover};
  --scalar-color-1: #e8f5ee; --scalar-color-2: #b5c9bd; --scalar-color-3: #8ea698; --scalar-border-color: #1c4431;
  --scalar-button-1: ${BRAND.accent}; --scalar-button-1-color: ${BRAND.dark}; --scalar-button-1-hover: ${BRAND.accentHover};
  --scalar-sidebar-background-1: #04100a; --scalar-sidebar-color-1: #e8f5ee; --scalar-sidebar-color-2: #9db5a7; --scalar-sidebar-color-active: ${BRAND.accent};
  --scalar-sidebar-item-hover-background: ${BRAND.darkHover}; --scalar-sidebar-item-active-background: ${BRAND.darkHover}; --scalar-sidebar-border-color: #123324;
  --scalar-sidebar-search-background: ${BRAND.darkSoft}; --scalar-sidebar-search-border-color: #1c4431; --scalar-sidebar-search-color: #e8f5ee;
}
.scalar-api-reference h1, .scalar-api-reference h2, .section-header, .sidebar-heading-type { font-family: 'Inter', sans-serif; letter-spacing: -0.02em; font-weight: 600; }
.scalar-api-reference .sidebar-group-title, .scalar-api-reference .sidebar-heading-type { font-family: 'IBM Plex Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; font-size: 11px; font-weight: 500; }
.scalar-api-reference .references-classic .section, .scalar-api-reference .section { border-color: ${BRAND.border}; }
.scalar-api-reference .scalar-card, .scalar-api-reference .scalar-card-header { box-shadow: none; }
.scalar-api-reference .markdown p:has(> img) { overflow-x: auto; }
@media (max-width: 720px) { .scalar-api-reference .markdown p:has(> img) > img { min-width: 640px; } #app { min-height: calc(100vh - 56px); } }`;
write('index.html', `${head({ title: `${BRAND.name} documentation`, description: 'Reference and interactive client for the SoccersAPI football data API: livescores, fixtures, standings, teams, players, odds and TV broadcasts.', path: '/', extra: `\n  <style>${headerCss}\n    #app { min-height: calc(100vh - 64px); }${themeCss}\n  </style>` })}
<body>${headerHtml}
  <div id="app"></div>
  <script id="sapi-spec" type="application/json">${JSON.stringify(spec).replace(/<\//g, '<\\/')}</script>
  <script src="${scalarSrc}"></script>
  <script>
    const content = JSON.parse(document.getElementById('sapi-spec').textContent);
    Scalar.createApiReference('#app', Object.assign(${JSON.stringify(configuration)}, { content }));
  </script>
</body>
</html>
`);

// ---------------------------------------------------------------- static pages
const pageCss = `${headerCss}
    body { background: #ffffff; }
    .page-head { border-bottom: 1px solid ${BRAND.border}; background: #ffffff; }
    .page-head-inner { max-width: 1120px; margin: 0 auto; padding: 40px 24px 36px; }
    .crumbs { font: 500 12px/1 'IBM Plex Mono', ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: ${BRAND.muted}; margin: 0 0 14px; }
    .crumbs a { color: #0f7a44; text-decoration: none; } .crumbs a:hover { text-decoration: underline; } .crumbs .sep { margin: 0 8px; color: #cbd5e1; }
    .page-head h1 { font-size: 40px; line-height: 1.05; letter-spacing: -0.03em; font-weight: 600; margin: 0; max-width: 24em; text-wrap: balance; }
    .page-head .lead { margin: 12px 0 0; max-width: 44em; }
    .page-head .actions { margin: 22px 0 0; }
    main { max-width: 1120px; margin: 0 auto; padding: 32px 24px 72px; }
    h1, h2, h3 { font-family: 'Inter', sans-serif; letter-spacing: -0.02em; font-weight: 600; } h1 { font-size: 34px; margin: 0 0 10px; } h2 { font-size: 22px; margin: 44px 0 12px; padding-top: 24px; border-top: 1px solid ${BRAND.border}; } h3 { font-size: 17px; margin: 28px 0 8px; }
    main > h2:first-child, .page-head + main > h2:first-of-type { border-top: 0; padding-top: 0; margin-top: 8px; }
    p, li { line-height: 1.65; } p { max-width: 70ch; } a { color: #0f7a44; }
    .lead { font-size: 17px; color: #475569; line-height: 1.6; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 22px 0 30px; }
    .btn { display: inline-block; padding: 11px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; line-height: 1; }
    .btn-primary { background: ${BRAND.accent}; color: #fff; } .btn-primary:hover { background: ${BRAND.accentHover}; }
    .btn-secondary { background: #fff; color: ${BRAND.text}; border: 1px solid ${BRAND.border}; font-weight: 500; } .btn-secondary:hover { border-color: #0f7a44; color: #0f7a44; }
    main img { max-width: 100%; height: auto; background: #fff; border: 1px solid ${BRAND.border}; border-radius: 6px; } main p:has(> img) { max-width: none; overflow-x: auto; }
    .table-wrap { overflow-x: auto; margin: 0 0 16px; } table { border-collapse: collapse; width: 100%; font-size: 13.5px; background: #fff; border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f0f2f1; vertical-align: top; } tr:last-child td { border-bottom: 0; }
    th { font: 500 11px/1.4 'IBM Plex Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: ${BRAND.muted}; background: ${BRAND.pageBg}; border-bottom: 1px solid ${BRAND.border}; }
    code { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px; background: ${BRAND.pageBg}; border: 1px solid ${BRAND.border}; padding: 1px 5px; border-radius: 4px; }
    pre { background: ${BRAND.pageBg}; color: ${BRAND.text}; border: 1px solid ${BRAND.border}; padding: 14px 16px; border-radius: 6px; overflow-x: auto; font-size: 12.5px; line-height: 1.55; } pre code { background: none; border: 0; color: inherit; padding: 0; }
    blockquote { border-left: 2px solid #0f7a44; margin: 0; padding: 4px 16px; color: #475569; }
    .badge { display: inline-block; font: 500 11px/1 'IBM Plex Mono', ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; padding: 4px 7px; border-radius: 4px; background: #e7f8ee; color: #0f7a44; margin-right: 8px; vertical-align: middle; }
    .badge-warn { background: #fdf4e7; color: #9a5b00; }
    .ops { list-style: none; padding: 0; margin: 0; border-top: 1px solid ${BRAND.border}; border-bottom: 1px solid ${BRAND.border}; }
    .ops li { margin: 0; padding: 10px 0; border-bottom: 1px solid #f0f2f1; } .ops li:last-child { border-bottom: 0; } .ops a { text-decoration: none; font-weight: 500; } .ops a:hover { text-decoration: underline; }
    footer { border-top: 1px solid ${BRAND.border}; } footer div { max-width: 1120px; margin: 0 auto; padding: 20px 24px 40px; font: 400 12.5px/1.6 'IBM Plex Mono', ui-monospace, monospace; color: ${BRAND.muted}; }
    @media (max-width: 720px) {
      .page-head-inner { padding: 28px 16px 26px; } main { padding: 24px 16px 56px; } footer div { padding: 18px 16px 32px; }
      .crumbs { letter-spacing: .08em; line-height: 1.6; margin-bottom: 10px; } .page-head h1 { font-size: 30px; } h1 { font-size: 28px; } h2 { font-size: 20px; margin-top: 36px; } .lead { font-size: 16px; }
      .actions .btn { flex: 1 1 auto; text-align: center; }
      .table-wrap table { min-width: 560px; } main p:has(> img) > img { min-width: 640px; }
    }`;
const page = ({ title, description, path, crumbs, body }) => {
  // Lift the h1, lead paragraph and first actions row into the page header band.
  const m = body.match(/^\s*(<h1[^>]*>[\s\S]*?<\/h1>)\s*((?:<p(?: class="lead")?>[\s\S]*?<\/p>)?)\s*((?:<p>(?:(?!<\/p>)[\s\S])*?<code>[\s\S]*?<\/p>)?)\s*((?:<p class="actions">[\s\S]*?<\/p>)?)/);
  const headBits = m ? m[0].replace(/<p>(?=[\s\S]*?<\/p>)/, '<p class="lead">') : '';
  const rest = m ? body.slice(m[0].length) : body;
  return `${head({ title: `${title} · ${BRAND.name} docs`, description, path, extra: `\n  <style>${pageCss}\n  </style>` })}
<body>${headerHtml}
  <div class="page-head"><div class="page-head-inner">
    <div class="crumbs">${crumbs.map((c) => (c.href ? `<a href="${c.href}">${esc(c.label)}</a>` : esc(c.label))).join('<span class="sep">/</span>')}</div>
    ${headBits}
  </div></div>
  <main>
    ${rest}
  </main>
  <footer><div>Built ${BUILD_DATE} from the <a href="/openapi.yaml">OpenAPI contract</a> · <a href="/">Interactive reference</a> · <a href="/llms.txt">llms.txt</a> · <a href="${BRAND.site}">${BRAND.name}</a></div></footer>
</body>
</html>
`;
};
const pretty = (v) => JSON.stringify(v, null, 2);
const sitemap = [{ loc: '/', priority: '1.0' }];

for (const g of guides) {
  const html = md2html(relinkSite(g.md));
  const path = `/guides/${g.slug}/`;
  write(`guides/${g.slug}/index.html`, page({ title: g.title, description: firstParagraph(g.md).slice(0, 160), path, crumbs: [{ label: 'Docs', href: '/' }, { label: 'Guides' }], body: `${html}\n<p class="actions"><a class="btn btn-secondary" href="/#description/${g.slug}">Read in the reference</a></p>` }));
  sitemap.push({ loc: path, priority: '0.7' });
}
write('guides/index.html', page({ title: 'Guides', description: 'Guides for the SoccersAPI football data API: getting started, parameters, includes, errors, statuses and plans.', path: '/guides/', crumbs: [{ label: 'Docs', href: '/' }, { label: 'Guides' }], body: `<h1>Guides</h1><ul class="ops">${guides.map((g) => `<li><a href="/guides/${g.slug}/">${esc(g.title)}</a></li>`).join('')}</ul>` }));
sitemap.push({ loc: '/guides/', priority: '0.6' });

for (const r of routes) {
  const opsList = `<ul class="ops">${r.ops.map((x) => `<li><span class="badge">GET</span><a href="${x.url}">${esc(x.title)}</a>${x.purpose ? ` — ${inline(x.purpose)}` : ''}</li>`).join('')}</ul>`;
  write(`${r.key}/index.html`, page({ title: r.name, description: firstParagraph(r.intro).slice(0, 160), path: r.url, crumbs: [{ label: 'Docs', href: '/' }, { label: 'Reference', href: '/' }, { label: r.name }], body: `<h1>${esc(r.name)}${r.comingSoon ? ' <span class="badge">coming soon</span>' : ''}</h1><p class="lead">${inline(r.intro.replace(/^\*\*Coming soon\.\*\*[^\n]*\n*/, ''))}</p><p class="actions"><a class="btn btn-primary" href="${r.anchor}">Open in the interactive reference</a></p><h2>Operations</h2>${opsList}<h2>Route reference</h2>${md2html(r.description.split('\n## ').slice(1).map((s) => '## ' + s).join('\n'))}` }));
  sitemap.push({ loc: r.url, priority: '0.8' });
  for (const x of r.ops) {
    const params = x.params.length ? `<h2>Parameters</h2><div class="table-wrap"><table><thead><tr><th>Name</th><th>Required</th><th>Description</th><th>Example</th></tr></thead><tbody>${x.params.map((p) => `<tr><td><code>${esc(p.name)}</code></td><td>${p.required ? 'yes' : 'no'}</td><td>${inline(p.description)}</td><td>${p.example !== undefined ? `<code>${esc(p.example)}</code>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '';
    const example = x.example ? `<h2>Example response</h2><pre><code>${esc(pretty(x.example))}</code></pre>` : '';
    const notes = [x.paginated ? '<li>Paginated: 100 items per page; read <code>meta.pages</code> and request the next pages with <code>page</code>.</li>' : '', planLabel(x.plans) ? `<li><strong>Plans: ${esc(planLabel(x.plans))}.</strong> Free plans carry the Standard datasets. Other plans receive <code>403</code> with <code>meta.msg</code> = <code>Endpoint not available for your plan.</code></li>` : '<li>Available on every plan for the leagues the plan covers.</li>', '<li>Every request needs the <code>user</code> and <code>token</code> query parameters of the account.</li>'].filter(Boolean).join('');
    write(`${r.key}/${x.t}/index.html`, page({ title: `${x.title} · ${r.name}`, description: (x.purpose || `${x.title} on the SoccersAPI ${r.name} route.`).replace(/[`*]/g, '').slice(0, 160), path: x.url, crumbs: [{ label: 'Docs', href: '/' }, { label: 'Reference', href: '/' }, { label: r.name, href: r.url }, { label: x.title }], body: `<h1><span class="badge">GET</span>${esc(x.title)}${r.comingSoon ? ' <span class="badge">coming soon</span>' : ''}${planLabel(x.plans) ? ` <span class="badge badge-warn">${esc(planLabel(x.plans))}</span>` : ''}</h1><p class="lead">${inline(x.purpose || '')}</p><p><code>${esc(r.path)}</code> with <code>t=${esc(x.t)}</code></p><p class="actions"><a class="btn btn-primary" href="${x.anchor}">Try it in the interactive reference</a><a class="btn btn-secondary" href="${r.url}">All ${esc(r.name)} operations</a></p><h2>Request</h2><pre><code>${esc(x.request)}</code></pre><ul>${notes}</ul>${params}${example}` }));
    sitemap.push({ loc: x.url, priority: '0.9' });
  }
}

// ---------------------------------------------------------------- crawlers and AI
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${BUILD_DATE}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
const llmsIndex = [`# ${BRAND.name} documentation`, '', `> REST API for football data: livescores, fixtures, standings, teams, players, statistics, odds and TV broadcasts. Every route takes a \`t\` query parameter that selects the operation; every request needs \`user\` and \`token\`.`, '', `- Interactive reference: ${SITE}/`, `- OpenAPI contract: ${SITE}/openapi.yaml`, `- Full text: ${SITE}/llms-full.txt`, '', '## Guides', ...guides.map((g) => `- [${g.title}](${SITE}/guides/${g.slug}/): ${firstParagraph(g.md).slice(0, 140)}`), '', '## Reference'];
for (const g of GROUPS) for (const rn of g.routes) { const r = routes.find((x) => x.name === rn); llmsIndex.push('', `### ${r.name}`, `${firstParagraph(r.intro)}`, '', ...r.ops.map((x) => `- [${x.title}](${SITE}${x.url}): ${(x.purpose || '').replace(/`/g, '')}`)); }
write('llms.txt', llmsIndex.join('\n') + '\n');
const llmsFull = [`# ${BRAND.name} documentation (full text)`, '', ...guides.map((g) => relinkSite(g.md).replace(/^#\s/m, '# Guide: ')), ''];
for (const r of routes) { llmsFull.push(`# Route: ${r.name} (${r.path})`, '', r.description, ''); for (const x of r.ops) llmsFull.push(`## ${x.title} (t=${x.t})`, '', x.purpose || '', '', '```http', x.request, '```', '', x.params.length ? ['| Parameter | Required | Description |', '| --- | --- | --- |', ...x.params.map((p) => `| \`${p.name}\` | ${p.required ? 'yes' : 'no'} | ${p.description} |`)].join('\n') : '', '', x.example ? '```json\n' + pretty(x.example).slice(0, 4000) + '\n```' : '', ''); }
write('llms-full.txt', llmsFull.join('\n') + '\n');

// ---------------------------------------------------------------- Cloudflare Pages
const legacy = JSON.parse(readFileSync(resolve(root, 'scripts/legacy-urls.json'), 'utf8'));
const redirects = ['# Legacy Apidog URLs (docs.soccersapi.com before the switch) -> new pages'];
for (const [from, to] of Object.entries(legacy)) redirects.push(`${from} ${to} 301`, `${from}.md ${to} 301`);
redirects.push('', '# Trailing-slash and index normalisation', '/index.html / 301');
for (const to of new Set(Object.values(legacy))) if (!existsSync(resolve(dist, to.replace(/^\//, ''), 'index.html'))) throw new Error(`Redirect target without a page: ${to}`);
write('_redirects', redirects.join('\n') + '\n');
write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/vendor/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/openapi.yaml\n  Content-Type: application/yaml; charset=utf-8\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=300\n\n/openapi.docs.json\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=300\n\n/llms.txt\n  Content-Type: text/plain; charset=utf-8\n\n/llms-full.txt\n  Content-Type: text/plain; charset=utf-8\n`);
write('404.html', page({ title: 'Page not found', description: 'The page does not exist. Browse the SoccersAPI documentation.', path: '/404.html', crumbs: [{ label: 'Docs', href: '/' }], body: `<h1>Page not found</h1><p class="lead">The address does not match any page of the documentation.</p><p class="actions"><a class="btn btn-primary" href="/">Open the reference</a><a class="btn btn-secondary" href="/guides/">Guides</a></p><h2>Routes</h2><ul class="ops">${routes.map((r) => `<li><a href="${r.url}">${esc(r.name)}</a></li>`).join('')}</ul>` }));

console.log(`dist/: reference + ${routes.length} route pages + ${routes.reduce((n, r) => n + r.ops.length, 0)} operation pages + ${guides.length} guides; ${Object.keys(legacy).length} legacy redirects; Scalar ${SCALAR_VERSION} ${USE_CDN ? 'from CDN' : 'vendored'}; analytics ${ANALYTICS ? 'on' : 'off'}`);
