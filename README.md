# Evetry Icon ✦

> Ultra-Fast Static Icon REST API & Client-Side Vector Engine powered by Iconify.

**Evetry Icon** compiles and serves icon collections as pure static JSON and SVG REST endpoints. Designed to be hosted on edge CDNs (Cloudflare Pages, Vercel, Netlify, or GitHub Pages) with **zero server costs** and **sub-millisecond latency**. It includes a minimalist Web Explorer, instant client-side fuzzy search powered by **uFuzzy**, and an official client package **`@evetry/icon`**.

---

## 🌟 Key Features

- **Zero-Latency Static REST API**: All endpoints are pre-rendered into static JSON and standalone SVG files, ready for global CDN deployment.
- **No Version Prefix**: Clean, predictable URL routing (`/api/collections.json`, `/api/{set}.json`, `/api/{set}/{name}.svg`, `/api/{set}/{name}.json`).
- **Standardized 24px Dimensions**: All generated SVGs default to `width="24" height="24"` while preserving their native `viewBox` coordinates for crisp vector rendering.
- **Lightweight Collection Manifests**: Collection endpoints (`/api/{set}.json`) only return icon names and direct SVG URLs (`/api/{set}/{name}.svg`) without bloated SVG payloads.
- **Super-Lean Search Index**: Uses a compact dictionary format (`{"lucide": { "name": "...", "icons": [...] }}`), eliminating redundant set prefix keys and reducing index size by > 32%.
- **Blazing Fast uFuzzy Search**: Sub-millisecond client-side fuzzy search with typo tolerance.
- **Unified `@evetry/icon` Package**: Complete SDK with single `Icon` class for fetching, searching, and in-browser SVG transformations (color, size, stroke width, rotation, flip, PNG export).
- **Minimalist Web Explorer**: Ultra-clean, fast web interface with instant search and comprehensive documentation.

---

## 📁 Static REST API Endpoints

| Method | Endpoint                 | Format | Description                                                                         |
| :----- | :----------------------- | :----- | :---------------------------------------------------------------------------------- |
| `GET`  | `/api/collections.json`  | JSON   | List of all available collections with author info, license, and total icon count.  |
| `GET`  | `/api/{set}.json`        | JSON   | Collection manifest containing lightweight list of icon names and direct SVG links. |
| `GET`  | `/api/{set}/{name}.svg`  | SVG    | Pure standalone SVG file (ready for HTML `<img>` tags or CSS backgrounds).          |
| `GET`  | `/api/{set}/{name}.json` | JSON   | Complete icon metadata (viewBox, raw path body, width/height).                      |
| `GET`  | `/api/search-index.json` | JSON   | Grouped dictionary search index format optimized for client-side search.            |

### Quick Integration Examples

```html
<!-- Direct HTML Embedding -->
<img
  src="https://icon.evetry.com/api/lucide/heart.svg"
  width="24"
  height="24"
  alt="Heart"
/>
```

```javascript
// Fetch icon metadata via REST API
const response = await fetch("https://icon.evetry.com/api/lucide/heart.json");
const data = await response.json();
console.log(data.viewBox, data.svg);
```

---

## 📦 Client SDK (`@evetry/icon`)

The official client toolkit is located in [`packages/icon`](./packages/icon) and published to NPM:

```bash
# Using bun
bun add @evetry/icon

# Using npm
npm install @evetry/icon
```

### Quick Usage & Hierarchical API

```typescript
import { icon } from '@evetry/icon';

// 1. Search returns IconItem instances equipped with SvgResult methods
const results = await icon.search('heart', { limit: 10 });
const heartItem = results[0]; // IconItem

// Fetch enhanced SvgResult:
const svg = await heartItem.getSvg({ size: 32, fill: 'red' });
document.body.innerHTML = svg;

// Chaining export methods:
const uri = svg.toUri();               // Data URI
const blob = await svg.toBlob(512);    // PNG Blob
svg.download('heart.svg');             // Download SVG
await svg.downloadPng('heart.png');    // Download PNG

// Or directly from IconItem:
await heartItem.download('heart.svg');

// 2. Hierarchical navigation: Collection -> IconSet -> IconItem -> SvgResult
const riCollection = await icon.getCollection('ri');
const iconSet = await riCollection.getIconSet();
const bagIcon = iconSet.getIcon('shopping-bag');
if (bagIcon) {
  const bagSvg = await bagIcon.getSvg();
}
```

### Clean Search Result Properties

Every `IconItem` returned by `icon.search()` provides human-friendly properties:

```json
[
  {
    "set": "ri",
    "setName": "Remix Icon",
    "name": "shopping-bag-2-fill",
    "url": "https://icon.evetry.com/api/ri/shopping-bag-2-fill.svg"
  }
]
```

### Custom Instance (Self-Hosted / Custom Domain)

```typescript
import { Icon } from '@evetry/icon';

const myIcons = new Icon({
  baseUrl: 'https://my-custom-icons.domain.com'
});
```

---

## 🛠️ In-Browser SVG Processing Engine

The [`@evetry/icon`](./packages/icon) package provides rich client-side SVG processing without any server round-trips:

```typescript
import {
  processSvg,
  svgToDataUri,
  svgToPngBlob,
  downloadSvg
} from "@evetry/icon";

// 1. Transform raw or fetched SVG in the client
const customizedSvg = processSvg(rawSvg, {
  size: 48,
  fill: "none",
  stroke: "#10b981",
  strokeWidth: 2,
  rotate: 90,
  flip: "horizontal",
});

// 2. Convert to Data URI for <img> tags or CSS backgrounds
const dataUri = svgToDataUri(customizedSvg);

// 3. Export to PNG Blob directly in the browser
const pngBlob = await svgToPngBlob(customizedSvg, 512);

// 4. Download SVG in browser
downloadSvg(customizedSvg, "my-icon.svg");
```

---

## 🚀 Getting Started (Using Bun)

### Prerequisites

Make sure [Bun](https://bun.sh) is installed on your machine (`bun -v`).

### 1. Start Development Server

```bash
bun run dev
```

Open `http://localhost:5173` in your browser to launch the Web Explorer.

### 2. Generate Static API Endpoints (CLI Parameters)

The icon generator script supports custom collection selection via CLI parameters:

```bash
# A. Default build (curated set: Lucide, Heroicons, Tabler, Remix Icon)
bun run build:icons

# B. Custom selection using --sets=<comma-separated-ids>
bun scripts/build-icons.ts --sets=lucide,heroicons,ph,simple-icons

# C. Build all 238 available collections (~200,000+ icons)
bun scripts/build-icons.ts --all

# D. View CLI options and help
bun scripts/build-icons.ts --help
```

> 📖 **Full Catalog**: See [`COLLECTIONS.md`](./COLLECTIONS.md) for the complete list of all **238 available icon collection IDs**, total counts, categories, and licenses.

### 3. Build for Production

```bash
bun run build
```

This compiles both the static API endpoints into `dist/api/` and the web interface into `dist/`, ready for zero-config static deployment to GitHub Pages, Cloudflare, Vercel, Netlify, or any static CDN.

---

## 📄 License

MIT License. Icon collections belong to their respective creators under their open-source licenses (MIT, ISC, Apache 2.0, SIL OFL).
