# Evetry Icon ✦

> Ultra-Fast Static Icon REST API & Client-Side Vector Engine powered by Iconify.

**Evetry Icon** compiles and serves icon collections as pure static JSON and SVG REST endpoints. Designed to be hosted on edge CDNs (Cloudflare Pages, Vercel, Netlify, or GitHub Pages) with **zero server costs** and **sub-millisecond latency**. It includes a minimalist Web Explorer, instant client-side fuzzy search powered by **uFuzzy**, and an in-browser SVG transformation engine.

---

## 🌟 Key Features

- **Zero-Latency Static REST API**: All endpoints are pre-rendered into static JSON and standalone SVG files, ready for global CDN deployment.
- **No Version Prefix**: Clean, predictable URL routing (`/api/collections.json`, `/api/{set}.json`, `/api/{set}/{name}.svg`, `/api/{set}/{name}.json`).
- **Standardized 24px Dimensions**: All generated SVGs default to `width="24" height="24"` while preserving their native `viewBox` coordinates for crisp vector rendering.
- **Lightweight Collection Manifests**: Collection endpoints (`/api/{set}.json`) only return icon names and direct SVG URLs (`/api/{set}/{name}.svg`) without bloated SVG payloads.
- **Super-Lean Search Index**: Uses a compact dictionary format (`{"lucide": { "name": "...", "icons": [...] }}`), eliminating redundant set prefix keys and reducing index size by > 32%.
- **Blazing Fast uFuzzy Search**: Sub-millisecond client-side fuzzy search with typo tolerance.
- **Client-Side SVG Processor**: Performant in-browser helper to customize size, fill, stroke color, stroke width, rotation, and flip, with direct export to Data URI and PNG.
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
  src="https://icons.evetry.com/api/lucide/heart.svg"
  width="24"
  height="24"
  alt="Heart"
/>
```

```javascript
// Fetch icon metadata via REST API
const response = await fetch("/api/lucide/heart.json");
const data = await response.json();
console.log(data.viewBox, data.svg);
```

---

## 🛠️ Client-Side SVG Processing Engine

The [`src/lib/svg-processor.ts`](./src/lib/svg-processor.ts) module provides rich in-browser SVG transformations without any server round-trips:

```typescript
import {
  processSvg,
  svgToDataUri,
  svgToPngBlob,
} from "./src/lib/svg-processor";

// 1. Transform raw or fetched SVG in the client
const customizedSvg = processSvg(rawSvg, {
  size: 32, // Set both width and height to 32px
  fill: "#ec4899", // Update fill color
  stroke: "#ffffff", // Update stroke color
  strokeWidth: 2.5, // Adjust stroke thickness
  rotate: 90, // Rotate 90 degrees
  flip: "horizontal", // Flip horizontally
});

// 2. Convert to Data URI for <img> tags or CSS backgrounds
const dataUri = svgToDataUri(customizedSvg);

// 3. Export to PNG Blob directly in the browser
const pngBlob = await svgToPngBlob(customizedSvg, 512);
```

---

## 🔍 Instant Search with uFuzzy

The [`src/lib/search.ts`](./src/lib/search.ts) module loads `/api/search-index.json` (grouped dictionary `{ [set]: { name, icons: [...] } }`):

```typescript
import { IconSearchEngine } from "./src/lib/search";

const engine = new IconSearchEngine();
await engine.loadIndex("/api/search-index.json");

// Search with keyword and optional collection filter:
const results = engine.search("heart", "lucide", 50);
console.log(results);
// Output: [{ s: 'lucide', n: 'heart', u: '/api/lucide/heart.svg' }, ...]
```

---

## 📦 High-Level Client SDK

The [`src/lib/index.ts`](./src/lib/index.ts) module exports a lightweight client SDK:

```typescript
import { icon, Icon } from "@evetry/icon";

// Get list of collections
const collections = await icon.listCollections();

// Fetch raw SVG string
const rawSvg = await icon.getSvg("lucide", "sparkles");

// Get direct SVG URL
const url = icon.getSvgUrl("heroicons", "bolt");
```

---

## 🚀 Getting Started (Using Bun)

### Prerequisites

Make sure [Bun](https://bun.sh) is installed on your machine (`bun -v`).

### 1. Start Development Server

```bash
bun run dev
```

Open `http://localhost:5173` in your browser to launch the Web Explorer and SVG Studio.

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

This compiles both the static API endpoints into `dist/api/` and the web interface into `dist/`, ready for zero-config static deployment to Cloudflare Pages, Vercel, Netlify, or any static CDN.

---

## 📄 License

MIT License. Icon collections belong to their respective creators under their open-source licenses (MIT, ISC, Apache 2.0, SIL OFL).
