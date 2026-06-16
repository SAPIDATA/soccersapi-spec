const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const changelogPath = path.join(repoRoot, 'docs', '04-changelog.md');
const openapiPaths = [
    path.join(repoRoot, 'openapi.yaml'),
    path.join(repoRoot, 'docs', 'openapi.yaml'),
];

const baseDescription = [
    'REST API for football (soccer) data: search, livescores, fixtures, leagues,',
    'teams, seasons, players, coaches, referees, venues, statistics, head-to-head,',
    'bookmakers, markets, broadcasts and media.',
    '',
    'Authentication is required on every request via the `user` and `token`',
    'query parameters.',
    '',
    '<!-- BEGIN GENERATED CHANGELOG: docs/04-changelog.md -->',
];

function indentBlock(value, spaces) {
    const prefix = ' '.repeat(spaces);
    return String(value)
        .replace(/\r\n/g, '\n')
        .replace(/\s+$/u, '')
        .split('\n')
        .map((line) => {
            const cleaned = line.replace(/\s+$/u, '');
            return cleaned ? `${prefix}${cleaned}` : '';
        })
        .join('\n');
}

function buildDescription(changelog) {
    const content = [
        ...baseDescription,
        changelog,
        '<!-- END GENERATED CHANGELOG -->',
    ].join('\n');

    return `  description: |-\n${indentBlock(content, 4)}`;
}

function syncOpenapiDescription(filePath, descriptionBlock) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = original.replace(
        /  description: [>|]-\n[\s\S]*?\n  version:/u,
        `${descriptionBlock}\n  version:`,
    );

    if (updated === original) {
        throw new Error(`Could not find info.description block in ${path.relative(repoRoot, filePath)}`);
    }

    fs.writeFileSync(filePath, updated);
}

const changelog = fs.readFileSync(changelogPath, 'utf8');
const descriptionBlock = buildDescription(changelog);

openapiPaths.forEach((filePath) => syncOpenapiDescription(filePath, descriptionBlock));

console.log(`Synced ${path.relative(repoRoot, changelogPath)} into ${openapiPaths.map((filePath) => path.relative(repoRoot, filePath)).join(', ')}`);
