# @evetry/icon

> Official client SDK with hierarchical OOP API and SVG processing utilities for static icon REST APIs (`icon.evetry.com`).

A zero-overhead, unified client toolkit for consuming static icon REST endpoints, transforming SVGs in the client, and running blazing-fast fuzzy searches with an intuitive, object-oriented hierarchy.

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

## ⚡ Quick Start & Hierarchical API

`@evetry/icon` offers a clean, chained, hierarchical architecture:

```typescript
import { icon } from '@evetry/icon';

// 1. Search returns IconItem instances with direct SVG methods
const results = await icon.search('heart', { limit: 10 });
const heartItem = results[0]; // IconItem

// Directly fetch enhanced SvgResult from the item:
const svg = await heartItem.getSvg({ size: 32, fill: 'red' }); // SvgResult (extends String)

// Use SvgResult directly in HTML or chain export methods:
document.body.innerHTML = svg;
const dataUri = svg.toUri();               // "data:image/svg+xml;utf8,..."
const blob = await svg.toBlob(512);        // PNG Blob 512x512
svg.download('heart.svg');                 // Download SVG
await svg.downloadPng('heart.png', 512);   // Download PNG

// Or trigger exports directly from IconItem:
const uri = await heartItem.toUri();
await heartItem.download('my-heart.svg');
```

---

## 🏛️ Complete Hierarchy: Collection ➔ IconSet ➔ IconItem ➔ SvgResult

### 1. Root Client (`Icon`)

```typescript
import { Icon, icon } from '@evetry/icon';

// Default singleton instance points to https://icon.evetry.com
// Or create a custom instance:
const customIcon = new Icon({ baseUrl: 'https://icon.evetry.com' });

// Get collections
const collections = await icon.getCollections(); // Promise<IconCollection[]>
const lucideCol = await icon.getCollection('lucide'); // Promise<IconCollection>

// Search across all or specific collection
const searchItems = await icon.search('settings'); // Promise<IconItem[]>

// Direct fetch
const svg = await icon.getSvg('lucide', 'settings'); // Promise<SvgResult>
```

### 2. Collection (`IconCollection`)

```typescript
const ri = await icon.getCollection('ri');

console.log(ri.name);    // "Remix Icon"
console.log(ri.total);   // e.g. 2800

// Search inside this collection only:
const searchInRi = await ri.search('shopping'); // Promise<IconItem[]>

// Get an IconItem reference by name:
const shoppingBag = ri.getIcon('shopping-bag'); // IconItem
const bagSvg = await shoppingBag.getSvg();       // Promise<SvgResult>

// Fetch full IconSet for this collection:
const iconSet = await ri.getIconSet(); // Promise<IconSet>
```

### 3. Icon Set (`IconSet`)

```typescript
const iconSet = await icon.getIconSet('lucide');

console.log(iconSet.total); // Total icons
console.log(iconSet.icons); // IconItem[]

// Lookup specific icon from set
const arrow = iconSet.getIcon('arrow-right'); // IconItem | undefined
if (arrow) {
  const svg = await arrow.getSvg();
}

// Iterate over icons:
for (const item of iconSet) {
  console.log(item.name, item.url);
}
```

### 4. Icon Item (`IconItem`)

Each search result or item inside `IconSet` is an `IconItem`:

```typescript
const item = results[0];

// Properties
item.set;     // e.g. "ri"
item.setName; // e.g. "Remix Icon"
item.name;    // e.g. "heart"
item.url;     // e.g. "https://icon.evetry.com/api/ri/heart.svg"

// APIs
await item.getSvg(options?);                       // Promise<SvgResult>
await item.toUri(options?);                        // Promise<string> (Data URI)
await item.toBlob(size?, options?);                // Promise<Blob> (PNG Blob)
await item.download(filename?, options?);          // Downloads SVG in browser
await item.downloadPng(filename?, size?, options?);// Downloads PNG in browser
await item.getDetail();                            // Promise<IconDetail>
```

### 5. Enhanced SVG (`SvgResult`)

Inherits from native JavaScript `String`, seamlessly printable in HTML while providing chaining tools:

```typescript
const svg = await item.getSvg({ size: 48, stroke: '#3b82f6' });

// Can be passed anywhere a string is accepted:
myElement.innerHTML = svg;

// Methods:
svg.toUri();                        // Data URI string
await svg.toBlob(1024);             // High-res PNG Blob
svg.download('icon.svg');           // Download SVG
await svg.downloadPng('icon.png');  // Download PNG
svg.process({ size: 64 });          // Returns new SvgResult with altered attributes
```

---

## 🎨 SVG Processing Options

Pass processing options to `getSvg()`, `icon.processSvg()`, or item conversion methods:

```typescript
export interface SvgProcessOptions {
  size?: number | string;        // Set width and height (e.g. 24, "32px", "2rem")
  fill?: string;                 // Replace fill attribute
  stroke?: string;               // Replace stroke attribute
  strokeWidth?: number | string; // Adjust stroke-width (e.g. 2, 1.5)
  rotate?: number;               // Rotate by angle (e.g. 90, 180, 270)
  flip?: 'horizontal' | 'vertical' | 'both'; // Flip orientation
}
```

---

## 📄 License

MIT © [Evetry](https://github.com/evetrycom)
