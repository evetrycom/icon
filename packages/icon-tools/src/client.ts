import { processSvg, type SvgProcessOptions } from './svg-processor';
import { IconSearchEngine, type SearchIconItem } from './search';

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
  author?: CollectionAuthor;
  license?: CollectionLicense;
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

export interface SearchOptions {
  /** Filter to a specific collection (e.g. 'lucide') */
  set?: string;
  /** Maximum number of results to return (default: 100) */
  limit?: number;
}

/**
 * Static REST API Client
 */
export class Icon {
  readonly baseUrl: string;
  private customFetch: typeof fetch;
  private searchEngineInstance: IconSearchEngine | null = null;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.customFetch = options.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (fetch as any));
  }

  /**
   * List all available icon collections
   * Calls: GET {baseUrl}/api/collections.json
   */
  async listCollections(): Promise<CollectionMeta[]> {
    const url = `${this.baseUrl}/api/collections.json`;
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to list collections from ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * List all icons in a specific collection
   * Calls: GET {baseUrl}/api/{set}.json
   *
   * @param set Collection identifier, e.g. 'lucide', 'heroicons', 'tabler'
   */
  async listIcons(set: string): Promise<CollectionManifest> {
    const url = `${this.baseUrl}/api/${encodeURIComponent(set)}.json`;
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to list icons for collection "${set}" from ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Get direct URL to the standalone SVG file
   * Format: {baseUrl}/api/{set}/{name}.svg
   *
   * @param set Collection name (e.g. 'lucide')
   * @param name Icon name (e.g. 'heart')
   */
  getSvgUrl(set: string, name: string): string {
    return `${this.baseUrl}/api/${encodeURIComponent(set)}/${encodeURIComponent(name)}.svg`;
  }

  /**
   * Fetch raw or processed SVG string directly.
   * If options are provided, client-side transformation (color, size, stroke) is applied automatically.
   *
   * @param set Collection name (e.g. 'lucide')
   * @param name Icon name (e.g. 'heart')
   * @param options Optional client-side SVG processing options (size, fill, stroke, strokeWidth, etc.)
   */
  async getSvg(set: string, name: string, options?: SvgProcessOptions): Promise<string> {
    const url = this.getSvgUrl(set, name);
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch SVG "${set}/${name}" from ${url}: ${res.status} ${res.statusText}`);
    }
    const rawSvg = await res.text();
    return options ? processSvg(rawSvg, options) : rawSvg;
  }

  /**
   * Fetch detailed icon metadata (viewBox, raw path body, width/height)
   * Calls: GET {baseUrl}/api/{set}/{name}.json
   *
   * @param set Collection name (e.g. 'lucide')
   * @param name Icon name (e.g. 'heart')
   */
  async getIcon(set: string, name: string): Promise<IconDetail> {
    const url = `${this.baseUrl}/api/${encodeURIComponent(set)}/${encodeURIComponent(name)}.json`;
    const res = await this.customFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch icon "${set}/${name}" from ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Perform ultra-fast fuzzy search across icons.
   * Automatically loads and caches the compact search index from {baseUrl}/api/search-index.json on first run.
   *
   * @param query Search keyword
   * @param options Search filter and limit options
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchIconItem[]> {
    if (!this.searchEngineInstance) {
      this.searchEngineInstance = new IconSearchEngine();
      await this.searchEngineInstance.loadIndex(`${this.baseUrl}/api/search-index.json`);
    }

    const rawResults = this.searchEngineInstance.search(query, options.set, options.limit);

    if (this.baseUrl) {
      return rawResults.map((item) => ({
        ...item,
        u: item.u.startsWith('http') ? item.u : `${this.baseUrl}${item.u}`,
      }));
    }

    return rawResults;
  }
}

/**
 * Default singleton instance pointing to https://icon.evetry.com
 */
export const icon = new Icon();

// Aliases for convenience
export const iconClient = icon;
export const IconClient = Icon;
