import uFuzzy from '@leeoniya/ufuzzy';

export interface SearchIconItem {
  s: string; // collection set, e.g. "lucide"
  n: string; // icon name, e.g. "heart"
  u: string; // direct SVG url, e.g. "/api/lucide/heart.svg"
}

export interface CollectionIndexEntry {
  name: string;
  total: number;
  icons: string[];
}

export type SearchIndexDictionary = Record<string, CollectionIndexEntry>;

export class IconSearchEngine {
  private uf: uFuzzy;
  private collections: SearchIndexDictionary = {};
  private globalHaystack: string[] = [];
  private globalItems: { s: string; n: string }[] = [];
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.uf = new uFuzzy({
      intraMode: 1,
      intraIns: 1,
    });
  }

  /**
   * Load search index from the static REST endpoint.
   * Format: { [set]: { name: string, total: number, icons: string[] } }
   */
  async loadIndex(url = 'https://icon.evetry.com/api/search-index.json'): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        this.collections = await res.json();

        this.globalHaystack = [];
        this.globalItems = [];

        for (const [setId, col] of Object.entries(this.collections)) {
          for (const iconName of col.icons) {
            this.globalHaystack.push(iconName);
            this.globalItems.push({ s: setId, n: iconName });
          }
        }

        this.isLoaded = true;
      } catch (err) {
        console.error('Failed to load Evetry Icon search index:', err);
        throw err;
      }
    })();

    return this.loadPromise;
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

  getCollectionIcons(set: string): string[] {
    return this.collections[set]?.icons || [];
  }

  search(query: string, set?: string, limit = 100): SearchIconItem[] {
    if (!this.isLoaded) return [];

    const needle = query.trim().toLowerCase();
    const filterSet = set && set !== 'all' ? set : null;

    if (!needle) {
      if (filterSet && this.collections[filterSet]) {
        return this.collections[filterSet].icons.slice(0, limit).map((iconName) => ({
          s: filterSet,
          n: iconName,
          u: `/api/${filterSet}/${iconName}.svg`,
        }));
      }

      return this.globalItems.slice(0, limit).map((item) => ({
        s: item.s,
        n: item.n,
        u: `/api/${item.s}/${item.n}.svg`,
      }));
    }

    if (filterSet && this.collections[filterSet]) {
      const colIcons = this.collections[filterSet].icons;
      const [idxs, info, order] = this.uf.search(colIcons, needle);
      if (!idxs || idxs.length === 0) return [];

      const matchIndices = order ? order.map((i) => info.idx[i]!) : idxs;
      const results: SearchIconItem[] = [];

      for (const idx of matchIndices) {
        const iconName = colIcons[idx];
        if (iconName) {
          results.push({
            s: filterSet,
            n: iconName,
            u: `/api/${filterSet}/${iconName}.svg`,
          });
          if (results.length >= limit) break;
        }
      }
      return results;
    }

    const [idxs, info, order] = this.uf.search(this.globalHaystack, needle);
    if (!idxs || idxs.length === 0) return [];

    const matchIndices = order ? order.map((i) => info.idx[i]!) : idxs;
    const results: SearchIconItem[] = [];

    for (const idx of matchIndices) {
      const item = this.globalItems[idx];
      if (item) {
        results.push({
          s: item.s,
          n: item.n,
          u: `/api/${item.s}/${item.n}.svg`,
        });
        if (results.length >= limit) break;
      }
    }

    return results;
  }
}

export const searchEngine = new IconSearchEngine();
