import collections from '@iconify/json/collections.json';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

let md = '# Available Icon Collections\n\n';
md += 'This document lists all **238 icon sets** available in the `@iconify/json` dataset that can be passed to the build script via `--sets=<id1,id2,...>`.\n\n';

md += '## Quick Presets\n\n';
md += '```bash\n';
md += '# 1. Modern UI Curated (Recommended)\n';
md += 'bun scripts/build-icons.ts --sets=lucide,heroicons,tabler,ri,ph\n\n';
md += '# 2. Material & Carbon System Icons\n';
md += 'bun scripts/build-icons.ts --sets=material-symbols,mdi,ic,carbon\n\n';
md += '# 3. Brand & Social Logos\n';
md += 'bun scripts/build-icons.ts --sets=simple-icons,cib\n\n';
md += '# 4. Animated Icons\n';
md += 'bun scripts/build-icons.ts --sets=line-md\n\n';
md += '# 5. Build Everything (All 230+ sets)\n';
md += 'bun scripts/build-icons.ts --all\n';
md += '```\n\n';

md += '## Complete Collections Catalog\n\n';
md += '| Parameter ID | Collection Name | Total Icons | Category | License |\n';
md += '| :--- | :--- | :---: | :--- | :--- |\n';

const entries = Object.entries(collections as Record<string, any>).sort(
  (a, b) => (b[1].total || 0) - (a[1].total || 0)
);

for (const [id, meta] of entries) {
  const name = meta.name || id;
  const total = meta.total || 0;
  const category = meta.category || 'General';
  const license = meta.license?.spdx || meta.license?.title || 'Open Source';
  md += `| \`${id}\` | ${name} | ${total.toLocaleString()} | ${category} | ${license} |\n`;
}

writeFileSync(join(process.cwd(), 'COLLECTIONS.md'), md, 'utf8');
console.log(`✅ COLLECTIONS.md generated successfully with ${entries.length} icon collections!`);
