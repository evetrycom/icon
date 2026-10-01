export * from './svg-processor';
export * from './search';

export const DEFAULT_BASE_URL = 'https://icon.evetry.com';

export interface ClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface CollectionMeta {
  id: string;
  name: string;
  total: number;
  author?: { name: string; url?: string };
  license?: { title: string; spdx?: string; url?: string };
  category?: string;
  palette?: boolean;
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

/**
 * Static REST API Client
 */
export class Icon {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async getCollections(): Promise<CollectionMeta[]> {
    const res = await fetch(`${this.baseUrl}/api/collections.json`);
    if (!res.ok) throw new Error(`Failed to load collections: ${res.statusText}`);
    return res.json();
  }

  async getCollection(set: string) {
    const res = await fetch(`${this.baseUrl}/api/${set}.json`);
    if (!res.ok) throw new Error(`Failed to load collection "${set}": ${res.statusText}`);
    return res.json();
  }

  async getIcon(set: string, name: string): Promise<IconDetail> {
    const res = await fetch(`${this.baseUrl}/api/${set}/${name}.json`);
    if (!res.ok) throw new Error(`Failed to load icon "${set}/${name}": ${res.statusText}`);
    return res.json();
  }

  getSvgUrl(set: string, name: string): string {
    return `${this.baseUrl}/api/${set}/${name}.svg`;
  }

  async getSvg(set: string, name: string): Promise<string> {
    const res = await fetch(this.getSvgUrl(set, name));
    if (!res.ok) throw new Error(`Failed to fetch SVG "${set}/${name}": ${res.statusText}`);
    return res.text();
  }
}

export const icon = new Icon();
export const iconClient = icon;
export const IconClient = Icon;
