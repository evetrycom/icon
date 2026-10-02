import uFuzzy from '@leeoniya/ufuzzy';
import {
  processSvg,
  svgToDataUri,
  svgToPngBlob,
  downloadSvg,
  type SvgProcessOptions,
} from './svg-processor';

export const DEFAULT_BASE_URL = 'https://icon.evetry.com';

export interface ClientOptions {
  /**
   * Base URL for the static REST API
   * @default 'https://icon.evetry.com'
   */
  baseUrl?: string;
  /**
   * Optional custom fetch implementation (useful for SSR or specific environments)
   */
  fetch?: typeof fetch;
}

export interface CollectionAuthor {
  name: string;
  url?: string;
}

export interface CollectionLicense {
  title: string;
  spdx?: string;
  url?: string;
}

export interface CollectionMeta {
  id: string;
  name: string;
  total: number;
  author?: CollectionAuthor | string;
  license?: CollectionLicense | string;
  category?: string;
  palette?: boolean;
}

export interface IconListItem {
  name: string;
  svg: string;
}

export interface CollectionManifest {
  id: string;
  name: string;
  total: number;
  author?: string;
  license?: string;
  icons: IconListItem[];
}

export interface IconDetail {
  set: string;
  name: string;
  width: number;
  height: number;
  viewBox: string;
  svgUrl: string;
  body: string;
  svg: string;
}

export interface CollectionIndexEntry {
  name: string;
  total: number;
  icons: string[];
}

export type SearchIndexDictionary = Record<string, CollectionIndexEntry>;

export interface SearchOptions {
  set?: string;
  limit?: number;
}

/**
 * Enhanced SVG string with chaining methods for conversion, rendering, and export
 */
export class SvgResult extends String {
  constructor(value: string) {
    super(value);
  }

  /**
   * Convert SVG to Data URI (data:image/svg+xml;utf8,...) for <img> tags or CSS background
   */
  toUri(): string {
    return svgToDataUri(this.toString());
  }

  /**
   * Convert SVG to Data URI (alias for toUri)
   */
  toDataUri(): string {
    return this.toUri();
  }

  /**
   * Render SVG to PNG Blob directly in the browser
   */
  async toBlob(targetSize = 512): Promise<Blob> {
    return svgToPngBlob(this.toString(), targetSize);
  }

  /**
   * Render SVG to PNG Blob (alias for toBlob)
   */
  async toPngBlob(targetSize = 512): Promise<Blob> {
    return this.toBlob(targetSize);
  }

  /**
   * Download SVG file in the browser
   */
  download(filename = 'icon.svg'): void {
    downloadSvg(this.toString(), filename);
  }

  /**
   * Download PNG file in the browser
   */
  async downloadPng(filename = 'icon.png', targetSize = 512): Promise<void> {
    const blob = await this.toBlob(targetSize);
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Further transform SVG with new options
   */
  process(options: SvgProcessOptions): SvgResult {
    return new SvgResult(processSvg(this.toString(), options));
  }
}

/**
 * Data payload to instantiate an IconItem
 */
export interface IconItemData {
  set: string;
  setName?: string;
  name: string;
  url?: string;
}

/**
 * Individual Icon representation with full hierarchy and conversion APIs
 */
export class IconItem {
  public readonly set: string;
  public readonly setName: string;
  public readonly name: string;
  public readonly url: string;
  private _client: Icon;

  constructor(client: Icon, data: IconItemData) {
    this._client = client;
    this.set = (data.set || '').trim().toLowerCase();
    this.setName = data.setName || data.set;
    this.name = (data.name || '').trim();
    this.url = data.url || client.getSvgUrl(this.set, this.name);
  }

  /**
   * Fetch and return enhanced SvgResult for this icon
   */
  async getSvg(options?: SvgProcessOptions): Promise<SvgResult> {
    return this._client.getSvg(this.set, this.name, options);
  }

  /**
   * Convert SVG to Data URI (data:image/svg+xml;utf8,...)
   */
  async toUri(options?: SvgProcessOptions): Promise<string> {
    const svg = await this.getSvg(options);
    return svg.toUri();
  }

  /**
   * Render SVG to PNG Blob directly in the browser
   */
  async toBlob(targetSize = 512, options?: SvgProcessOptions): Promise<Blob> {
    const svg = await this.getSvg(options);
    return svg.toBlob(targetSize);
  }

  /**
   * Render SVG to PNG Blob (alias for toBlob)
   */
  async toPngBlob(targetSize = 512, options?: SvgProcessOptions): Promise<Blob> {
    return this.toBlob(targetSize, options);
  }

  /**
   * Download SVG file in the browser
   */
  async download(filename?: string, options?: SvgProcessOptions): Promise<void> {
    const svg = await this.getSvg(options);
    svg.download(filename || `${this.name}.svg`);
  }

  /**
   * Download PNG file in the browser
   */
  async downloadPng(filename?: string, targetSize = 512, options?: SvgProcessOptions): Promise<void> {
    const svg = await this.getSvg(options);
    await svg.downloadPng(filename || `${this.name}.png`, targetSize);
  }

  /**
   * Fetch detailed icon metadata (viewBox, raw path body, width/height)
   */
  async getDetail(): Promise<IconDetail> {
    return this._client.getIcon(this.set, this.name);
  }

  toString(): string {
    return this.name;
  }

  toJSON() {
    return {
      set: this.set,
      setName: this.setName,
      name: this.name,
      url: this.url,
    };
  }
}

/**
 * Type alias for backward compatibility with SearchIconItem
 */
export type SearchIconItem = IconItem;

/**
 * Representation of an Icon Collection with collection-level actions
 */
export class IconCollection {
  public readonly id: string;
  public readonly name: string;
  public readonly total: number;
  public readonly author?: CollectionAuthor | string;
  public readonly license?: CollectionLicense | string;
  public readonly category?: string;
  public readonly palette?: boolean;
  private _client: Icon;
  private _iconSetPromise: Promise<IconSet> | null = null;

  constructor(client: Icon, data: Partial<CollectionMeta> & { id: string }) {
    this._client = client;
    this.id = data.id;
    this.name = data.name || data.id;
    this.total = data.total || 0;
    this.author = data.author;
    this.license = data.license;
    this.category = data.category;
    this.palette = data.palette;
  }

  /**
   * Get the full IconSet instance containing all IconItem instances and collection metadata
   */
  async getIconSet(): Promise<IconSet> {
    if (!this._iconSetPromise) {
      this._iconSetPromise = this._client.getIconSet(this.id);
    }
    return this._iconSetPromise;
  }

  /**
   * List all icons in this collection as IconItem instances
   */
  async getIcons(): Promise<IconItem[]> {
    const iconSet = await this.getIconSet();
    return iconSet.icons;
  }

  /**
   * Get an IconItem instance for a specific icon name in this collection
   */
  getIcon(name: string): IconItem {
    return this._client.getIconItem(this.id, name, this.name);
  }

  /**
   * Search icons within this collection
   */
  async search(query: string, options?: Omit<SearchOptions, 'set'>): Promise<IconItem[]> {
    return this._client.search(query, { ...options, set: this.id });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      total: this.total,
      author: this.author,
      license: this.license,
      category: this.category,
      palette: this.palette,
    };
  }
}

/**
 * Container holding the complete set of icons for a collection with lookup helpers
 */
export class IconSet implements Iterable<IconItem> {
  public readonly id: string;
  public readonly name: string;
  public readonly total: number;
  public readonly author?: string | CollectionAuthor;
  public readonly license?: string | CollectionLicense;
  public readonly icons: IconItem[];
  private _iconMap: Map<string, IconItem>;
  private _client: Icon;

  constructor(client: Icon, manifest: CollectionManifest, setName?: string) {
    this._client = client;
    this.id = manifest.id;
    this.name = setName || manifest.name || manifest.id;
    this.total = manifest.total || manifest.icons.length;
    this.author = manifest.author;
    this.license = manifest.license;

    this.icons = manifest.icons.map((item) => {
      return new IconItem(client, {
        set: this.id,
        setName: this.name,
        name: item.name,
        url: client.getSvgUrl(this.id, item.name),
      });
    });

    this._iconMap = new Map();
    for (const icon of this.icons) {
      this._iconMap.set(icon.name.toLowerCase(), icon);
    }
  }

  /**
   * Lookup icon by name
   */
  getIcon(name: string): IconItem | undefined {
    return this._iconMap.get((name || '').trim().toLowerCase());
  }

  [Symbol.iterator](): Iterator<IconItem> {
    return this.icons[Symbol.iterator]();
  }

  find(predicate: (icon: IconItem) => boolean): IconItem | undefined {
    return this.icons.find(predicate);
  }

  filter(predicate: (icon: IconItem) => boolean): IconItem[] {
    return this.icons.filter(predicate);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      total: this.total,
      author: this.author,
      license: this.license,
      icons: this.icons.map((i) => i.toJSON()),
    };
  }
}

/**
 * Single unified Icon Client, Hierarchy Engine & Search for Evetry Icon
 */
export class Icon {
  public baseUrl: string;
  private customFetch: typeof fetch;

  // Search and cache state
  private uf: uFuzzy;
  private collections: SearchIndexDictionary = {};
  private globalHaystack: string[] = [];
  private globalItems: { s: string; sn: string; n: string }[] = [];
  private isIndexLoaded = false;
  private indexLoadPromise: Promise<void> | null = null;
  private collectionsCache: IconCollection[] | null = null;
  private iconSetCache = new Map<string, IconSet>();

  constructor(options: ClientOptions | string = {}) {
    if (typeof options === 'string') {
      this.baseUrl = options.replace(/\/+$/, '');
      this.customFetch = typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (fetch as any);
    } else {
      this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
      this.customFetch = options.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (fetch as any));
    }

    this.uf = new uFuzzy({
      intraMode: 1,
      intraIns: 1,
    });
  }

  /**
   * List all available icon collections as IconCollection instances
   * Calls: GET {baseUrl}/api/collections.json
   */
  async getCollections(): Promise<IconCollection[]> {
    if (this.collectionsCache) {
      return this.collectionsCache;
    }
    const url = `${this.baseUrl}/api/collections.json`;
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to list collections from ${url}: ${res.status} ${res.statusText}`);
    }
    const data: CollectionMeta[] = await res.json();
    this.collectionsCache = data.map((col) => new IconCollection(this, col));
    return this.collectionsCache;
  }

  /**
   * Alias for getCollections()
   */
  async listCollections(): Promise<IconCollection[]> {
    return this.getCollections();
  }

  /**
   * Get an IconCollection instance by set ID (e.g. 'lucide', 'ri')
   */
  async getCollection(set: string): Promise<IconCollection> {
    const clean = (set || '').trim().toLowerCase();
    const collections = await this.getCollections();
    const found = collections.find((c) => c.id.toLowerCase() === clean);
    if (found) return found;
    return new IconCollection(this, { id: clean });
  }

  /**
   * List raw manifest for a specific collection
   * Calls: GET {baseUrl}/api/{set}.json
   *
   * @param set Collection key (e.g. 'lucide', 'ri', 'tabler')
   */
  async listIcons(set: string): Promise<CollectionManifest> {
    const cleanSet = (set || '').trim().toLowerCase();
    const url = `${this.baseUrl}/api/${encodeURIComponent(cleanSet)}.json`;
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to list icons for collection "${set}" from ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Get the full IconSet for a collection (cached)
   *
   * @param set Collection key (e.g. 'lucide', 'ri')
   */
  async getIconSet(set: string): Promise<IconSet> {
    const cleanSet = (set || '').trim().toLowerCase();
    if (this.iconSetCache.has(cleanSet)) {
      return this.iconSetCache.get(cleanSet)!;
    }
    const manifest = await this.listIcons(cleanSet);
    const colName = this.collections[cleanSet]?.name;
    const iconSet = new IconSet(this, manifest, colName);
    this.iconSetCache.set(cleanSet, iconSet);
    return iconSet;
  }

  /**
   * Get list of IconItem instances for a collection
   *
   * @param set Collection key (e.g. 'lucide', 'ri')
   */
  async getIcons(set: string): Promise<IconItem[]> {
    const iconSet = await this.getIconSet(set);
    return iconSet.icons;
  }

  /**
   * Create an IconItem instance for a specific icon
   */
  getIconItem(set: string, name: string, setName?: string): IconItem {
    return new IconItem(this, { set, name, setName });
  }

  /**
   * Get direct URL to the standalone SVG file
   * Format: {baseUrl}/api/{set}/{name}.svg
   *
   * @param set Collection key (e.g. 'lucide', 'ri')
   * @param name Icon name (e.g. 'heart', 'broom-sparkles')
   */
  getSvgUrl(set: string, name: string): string {
    const cleanSet = (set || '').trim().toLowerCase();
    const cleanName = (name || '').trim().toLowerCase();
    return `${this.baseUrl}/api/${encodeURIComponent(cleanSet)}/${encodeURIComponent(cleanName)}.svg`;
  }

  /**
   * Fetch raw or processed SVG directly.
   * Returns an enhanced SvgResult with .toUri(), .toBlob(), .download(), and .process() helpers.
   *
   * @param set Collection key (e.g. 'lucide', 'ri')
   * @param name Icon name (e.g. 'heart', 'broom-sparkles')
   * @param options Optional client-side SVG processing options (size, fill, stroke, strokeWidth, etc.)
   */
  async getSvg(set: string, name: string, options?: SvgProcessOptions): Promise<SvgResult> {
    const url = this.getSvgUrl(set, name);
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch SVG "${set}/${name}" from ${url}: ${res.status} ${res.statusText}`);
    }
    const rawSvg = await res.text();
    const finalSvg = options ? processSvg(rawSvg, options) : rawSvg;
    return new SvgResult(finalSvg);
  }

  /**
   * Transform any SVG string directly in the client
   */
  processSvg(rawSvg: string, options: SvgProcessOptions): SvgResult {
    return new SvgResult(processSvg(rawSvg, options));
  }

  /**
   * Convert SVG string to Data URI for <img> tags or CSS background
   */
  toUri(svg: string): string {
    return svgToDataUri(svg);
  }

  /**
   * Convert SVG string to Data URI (alias)
   */
  toDataUri(svg: string): string {
    return svgToDataUri(svg);
  }

  /**
   * Render SVG string to PNG Blob in the browser
   */
  async toBlob(svg: string, targetSize = 512): Promise<Blob> {
    return svgToPngBlob(svg, targetSize);
  }

  /**
   * Render SVG string to PNG Blob (alias)
   */
  async toPngBlob(svg: string, targetSize = 512): Promise<Blob> {
    return svgToPngBlob(svg, targetSize);
  }

  /**
   * Download SVG file in the browser
   */
  downloadSvg(svg: string, filename = 'icon.svg'): void {
    downloadSvg(svg, filename);
  }

  /**
   * Download PNG file in the browser
   */
  async downloadPng(svg: string, filename = 'icon.png', targetSize = 512): Promise<void> {
    const blob = await this.toBlob(svg, targetSize);
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Fetch detailed icon metadata (viewBox, raw path body, width/height)
   * Calls: GET {baseUrl}/api/{set}/{name}.json
   *
   * @param set Collection key (e.g. 'lucide', 'ri')
   * @param name Icon name (e.g. 'heart')
   */
  async getIcon(set: string, name: string): Promise<IconDetail> {
    const cleanSet = (set || '').trim().toLowerCase();
    const cleanName = (name || '').trim().toLowerCase();
    const url = `${this.baseUrl}/api/${encodeURIComponent(cleanSet)}/${encodeURIComponent(cleanName)}.json`;
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch icon "${set}/${name}" from ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Load search index from {baseUrl}/api/search-index.json
   */
  async loadSearchIndex(): Promise<void> {
    if (this.isIndexLoaded) return;
    if (this.indexLoadPromise) return this.indexLoadPromise;

    this.indexLoadPromise = (async () => {
      try {
        const url = `${this.baseUrl}/api/search-index.json`;
        const res = await this.customFetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        this.collections = await res.json();

        this.globalHaystack = [];
        this.globalItems = [];

        for (const [setId, col] of Object.entries(this.collections)) {
          const s = setId.toLowerCase();
          const sn = col.name || setId;

          for (const iconName of col.icons) {
            this.globalHaystack.push(iconName);
            this.globalItems.push({ s, sn, n: iconName });
          }
        }

        this.isIndexLoaded = true;
      } catch (err) {
        console.error('Failed to load Evetry Icon search index:', err);
        throw err;
      }
    })();

    return this.indexLoadPromise;
  }

  get totalIcons(): number {
    return this.globalHaystack.length;
  }

  get availableCollections(): { id: string; name: string; total: number }[] {
    return Object.entries(this.collections).map(([id, col]) => ({
      id,
      name: col.name,
      total: col.total || col.icons.length,
    }));
  }

  /**
   * Perform ultra-fast fuzzy search across icons.
   * Returns array of IconItem instances, each equipped with .getSvg(), .toUri(), .toBlob(), .download().
   * Automatically loads and caches the compact search index on first run.
   *
   * @param query Search keyword
   * @param options Search filter and limit options
   */
  async search(query: string, options: SearchOptions = {}): Promise<IconItem[]> {
    await this.loadSearchIndex();

    const needle = (query || '').trim().toLowerCase();
    const filterSet = options.set && options.set !== 'all' ? options.set.trim().toLowerCase() : null;
    const limit = options.limit || 100;

    const toIconItem = (item: { s: string; sn: string; n: string }): IconItem => {
      return new IconItem(this, {
        set: item.s,
        setName: item.sn,
        name: item.n,
      });
    };

    // Case 1: Empty query - return directly
    if (!needle) {
      if (filterSet && this.collections[filterSet]) {
        const col = this.collections[filterSet];
        return col.icons.slice(0, limit).map((iconName) =>
          toIconItem({ s: filterSet, sn: col.name, n: iconName })
        );
      }

      return this.globalItems.slice(0, limit).map(toIconItem);
    }

    // Case 2: Filtered collection search
    if (filterSet && this.collections[filterSet]) {
      const col = this.collections[filterSet];
      const colIcons = col.icons;
      const [idxs, info, order] = this.uf.search(colIcons, needle);
      if (!idxs || idxs.length === 0) return [];

      const matchIndices = order ? order.map((i) => info.idx[i]!) : idxs;
      const results: IconItem[] = [];

      for (const idx of matchIndices) {
        const iconName = colIcons[idx];
        if (iconName) {
          results.push(toIconItem({ s: filterSet, sn: col.name, n: iconName }));
          if (results.length >= limit) break;
        }
      }
      return results;
    }

    // Case 3: Global search
    const [idxs, info, order] = this.uf.search(this.globalHaystack, needle);
    if (!idxs || idxs.length === 0) return [];

    const matchIndices = order ? order.map((i) => info.idx[i]!) : idxs;
    const results: IconItem[] = [];

    for (const idx of matchIndices) {
      const item = this.globalItems[idx];
      if (item) {
        results.push(toIconItem(item));
        if (results.length >= limit) break;
      }
    }

    return results;
  }
}

/**
 * Default singleton instance pointing to https://icon.evetry.com
 */
export const icon = new Icon();

// Aliases for convenience
export const iconClient = icon;
export const IconClient = Icon;
