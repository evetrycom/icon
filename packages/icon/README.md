# @evetry/icon

> Official client SDK and SVG processing utilities for static icon REST APIs (`icon.evetry.com`).

A zero-overhead toolkit for consuming static icon REST endpoints, transforming SVGs in the client, and running blazing-fast fuzzy searches.

---

## 📦 Installation

```bash
# Using bun
bun add @evetry/icon

# Using npm
npm install @evetry/icon

# Using pnpm
pnpm add @evetry/icon
```

---

## ⚡ Quick Start

```typescript
import { icon, processSvg, IconSearchEngine } from '@evetry/icon';

// 1. Fetch standalone raw SVG directly from default endpoint (icon.evetry.com)
const rawSvg = await icon.getSvg('lucide', 'heart');

// 2. Fetch and transform SVG on the fly
const customizedSvg = await icon.getSvg('lucide', 'sparkles', {
  size: 32,                 // 32x32 px
  stroke: '#60a5fa',        // Custom stroke color
  fill: 'none',             // Custom fill
  strokeWidth: 2,           // Stroke thickness
  rotate: 90,               // Rotate 90 degrees
  flip: 'horizontal'        // Flip horizontally
});

// 3. List collections
const collections = await icon.listCollections();

// 4. List all icons in a collection
const lucide = await icon.listIcons('lucide');
console.log(lucide.icons); // [{ name: "heart", svg: "https://icon.evetry.com/api/lucide/heart.svg" }, ...]

// 5. Instant search across all collections or specific set
const results = await icon.search('camera', { set: 'lucide', limit: 20 });
console.log(results);
```

---

## 🛠️ Custom Endpoint Configuration

If you host your own instance or use a custom subdomain:

```typescript
import { Icon } from '@evetry/icon';

const customIcon = new Icon({
  baseUrl: 'https://my-custom-icons.domain.com'
});
```

---

## 🎨 Client-Side SVG Processing Utilities

Transform any SVG string directly in the browser with zero server round-trips:

```typescript
import { processSvg, svgToDataUri, svgToPngBlob, downloadSvg } from '@evetry/icon';

// Transform SVG attributes
const svg = processSvg(rawSvg, {
  size: 48,
  stroke: '#10b981',
  strokeWidth: 1.5,
});

// Convert to Data URI for <img src="..." /> or CSS background
const dataUri = svgToDataUri(svg);

// Convert to 512x512 PNG Blob in the browser
const pngBlob = await svgToPngBlob(svg, 512);

// Download SVG in browser
downloadSvg(svg, 'my-custom-icon.svg');
```

---

## 🔍 Standalone uFuzzy Search Engine

You can also use the standalone search engine directly:

```typescript
import { IconSearchEngine } from '@evetry/icon';

const search = new IconSearchEngine();
await search.loadIndex('https://icon.evetry.com/api/search-index.json');

const matches = search.search('heart', 'lucide', 25);
```

---

## 📄 License
MIT License
