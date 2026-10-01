import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getIconData, iconToSVG } from '@iconify/utils';

// CLI argument handling:
// - bun scripts/build-icons.ts --sets=lucide,heroicons
// - bun scripts/build-icons.ts --all
// - bun scripts/build-icons.ts --help
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: bun scripts/build-icons.ts [options]

Options:
  --sets=<set1,set2,...>   Comma-separated list of collection IDs to build (e.g. --sets=lucide,heroicons,tabler)
  --all                    Build all 230+ collections from @iconify/json
  --help, -h               Show this help message

See COLLECTIONS.md for the full list of available collection IDs.
  `);
  process.exit(0);
}

const masterCollectionsPath = join(process.cwd(), 'node_modules', '@iconify', 'json', 'collections.json');
const masterCollections: Record<string, any> = JSON.parse(readFileSync(masterCollectionsPath, 'utf8'));

const setsArg = args.find((a) => a.startsWith('--sets='));
const isAll = args.includes('--all');

const targetSets = isAll
  ? Object.keys(masterCollections)
  : setsArg
  ? setsArg.replace('--sets=', '').split(',').map((s) => s.trim()).filter(Boolean)
  : ['lucide', 'heroicons', 'tabler', 'ri'];

const DIST_API_DIR = join(process.cwd(), 'dist', 'api');

interface CollectionMeta {
  id: string;
  name: string;
  total: number;
  author?: { name: string; url?: string };
  license?: { title: string; spdx?: string; url?: string };
  category?: string;
  palette?: boolean;
}

interface CollectionManifest {
  id: string;
  name: string;
  total: number;
  author?: string;
  license?: string;
  icons: {
    name: string;
    svg: string;
  }[];
}

// Compact Dictionary Search Index: { [set]: { name: string, icons: string[] } }
export type SearchIndexDictionary = Record<
  string,
  {
    name: string;
    total: number;
    icons: string[];
  }
>;

console.log(`🚀 Evetry Icon - Static REST API Generator`);
console.log(`📦 Selected collections: ${targetSets.join(', ')}`);

// Ensure dist/api folder exists
if (!existsSync(DIST_API_DIR)) {
  mkdirSync(DIST_API_DIR, { recursive: true });
}

const collectionsList: CollectionMeta[] = [];
const searchIndexDict: SearchIndexDictionary = {};

let grandTotal = 0;

for (const set of targetSets) {
  const meta = masterCollections[set];
  if (!meta) {
    console.warn(`⚠️ Collection "${set}" not found in @iconify/json, skipping.`);
    continue;
  }

  const iconJsonPath = join(process.cwd(), 'node_modules', '@iconify', 'json', 'json', `${set}.json`);
  if (!existsSync(iconJsonPath)) {
    console.warn(`⚠️ Icon JSON file for "${set}" not found at ${iconJsonPath}, skipping.`);
    continue;
  }

  console.log(`\n⏳ Building collection: [${set}] ${meta.name} (${meta.total} icons)...`);
  const rawData = JSON.parse(readFileSync(iconJsonPath, 'utf8'));

  const setDir = join(DIST_API_DIR, set);
  if (!existsSync(setDir)) {
    mkdirSync(setDir, { recursive: true });
  }

  const manifestIcons: { name: string; svg: string }[] = [];
  const iconNamesList: string[] = [];

  const iconNames = Object.keys(rawData.icons || {});
  const aliases = Object.keys(rawData.aliases || {});
  const allNames = Array.from(new Set([...iconNames, ...aliases]));

  let count = 0;

  for (const name of allNames) {
    const iconData = getIconData(rawData, name);
    if (!iconData) continue;

    // Standardize to 24px default with preserved original viewBox
    const render = iconToSVG(iconData, { width: 24, height: 24 });
    const { attributes, body } = render;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${attributes.width}" height="${attributes.height}" viewBox="${attributes.viewBox}">${body}</svg>`;
    const svgPath = join(setDir, `${name}.svg`);
    const jsonPath = join(setDir, `${name}.json`);

    // Write .svg file
    writeFileSync(svgPath, svgContent, 'utf8');

    // Write individual .json file
    const individualJson = {
      set,
      name,
      width: parseInt(attributes.width as string, 10) || 24,
      height: parseInt(attributes.height as string, 10) || 24,
      viewBox: attributes.viewBox,
      svgUrl: `/api/${set}/${name}.svg`,
      body,
      svg: svgContent,
    };
    writeFileSync(jsonPath, JSON.stringify(individualJson), 'utf8');

    const svgUrl = `/api/${set}/${name}.svg`;
    manifestIcons.push({
      name,
      svg: svgUrl,
    });

    iconNamesList.push(name);
    count++;
  }

  grandTotal += count;

  // Write {set}.json manifest (only name and svg link)
  const setManifest: CollectionManifest = {
    id: set,
    name: meta.name,
    total: count,
    author: meta.author?.name,
    license: meta.license?.title || meta.license?.spdx,
    icons: manifestIcons,
  };
  writeFileSync(join(DIST_API_DIR, `${set}.json`), JSON.stringify(setManifest), 'utf8');

  // Add to collections.json
  collectionsList.push({
    id: set,
    name: meta.name,
    total: count,
    author: meta.author,
    license: meta.license,
    category: meta.category,
    palette: meta.palette,
  });

  // Add to dictionary search index
  searchIndexDict[set] = {
    name: meta.name,
    total: count,
    icons: iconNamesList,
  };

  console.log(`✅ [${set}] Finished: ${count} icons generated.`);
}

// 2. Write master collections.json
writeFileSync(join(DIST_API_DIR, 'collections.json'), JSON.stringify(collectionsList, null, 2), 'utf8');
console.log(`\n📄 Generated /dist/api/collections.json (${collectionsList.length} sets)`);

// 3. Write dictionary search-index.json: { [set]: { name, total, icons: [...] } }
writeFileSync(join(DIST_API_DIR, 'search-index.json'), JSON.stringify(searchIndexDict), 'utf8');
console.log(`🔍 Generated /dist/api/search-index.json (Grouped by collection, zero prefix redundancy)`);

console.log(`\n🎉 Evetry Icon Static API built successfully! Total: ${grandTotal} icons.`);
