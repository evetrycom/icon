export interface SvgProcessOptions {
  /** Target width & height in px (e.g. 24, 32, 48) */
  size?: number | string;
  /** Custom width override */
  width?: number | string;
  /** Custom height override */
  height?: number | string;
  /** SVG fill color (e.g. '#3b82f6', 'currentColor', 'transparent') */
  fill?: string;
  /** SVG stroke color (e.g. '#ef4444', 'currentColor') */
  stroke?: string;
  /** Stroke width in px or number (e.g. 1.5, 2, '2px') */
  strokeWidth?: number | string;
  /** Stroke linecap */
  strokeLinecap?: 'inherit' | 'round' | 'butt' | 'square';
  /** Stroke linejoin */
  strokeLinejoin?: 'inherit' | 'round' | 'miter' | 'bevel';
  /** Rotation angle in degrees (e.g. 90, 180, 270) */
  rotate?: number;
  /** Flip horizontally, vertically, or both */
  flip?: 'none' | 'horizontal' | 'vertical' | 'both';
  /** Opacity between 0 and 1 */
  opacity?: number;
  /** CSS class name */
  className?: string;
  /** Inline CSS style */
  style?: string | Record<string, string>;
}

/**
 * Process raw SVG string and apply transformations in the client.
 * Uses lightweight DOMParser in browser or clean regex for SSR.
 */
export function processSvg(rawSvg: string, options: SvgProcessOptions = {}): string {
  if (!rawSvg) return '';

  const w = options.width ?? options.size ?? null;
  const h = options.height ?? options.size ?? null;

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) return rawSvg;

    if (w !== null) svgEl.setAttribute('width', String(w));
    if (h !== null) svgEl.setAttribute('height', String(h));

    if (options.fill !== undefined) {
      svgEl.setAttribute('fill', options.fill);
      const filledNodes = svgEl.querySelectorAll('[fill]:not([fill="none"])');
      filledNodes.forEach((node) => node.setAttribute('fill', options.fill!));
    }

    if (options.stroke !== undefined) {
      svgEl.setAttribute('stroke', options.stroke);
      const strokedNodes = svgEl.querySelectorAll('[stroke]:not([stroke="none"])');
      strokedNodes.forEach((node) => node.setAttribute('stroke', options.stroke!));
    }

    if (options.strokeWidth !== undefined) {
      const swStr = String(options.strokeWidth);
      svgEl.setAttribute('stroke-width', swStr);
      const strokedNodes = svgEl.querySelectorAll('[stroke-width]');
      strokedNodes.forEach((node) => node.setAttribute('stroke-width', swStr));
    }

    if (options.strokeLinecap) {
      svgEl.setAttribute('stroke-linecap', options.strokeLinecap);
    }

    if (options.strokeLinejoin) {
      svgEl.setAttribute('stroke-linejoin', options.strokeLinejoin);
    }

    if (options.opacity !== undefined) {
      svgEl.setAttribute('opacity', String(options.opacity));
    }

    if (options.className) {
      const existingClass = svgEl.getAttribute('class') || '';
      svgEl.setAttribute('class', `${existingClass} ${options.className}`.trim());
    }

    if (options.style) {
      const styleString =
        typeof options.style === 'string'
          ? options.style
          : Object.entries(options.style)
              .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
              .join(';');
      const existingStyle = svgEl.getAttribute('style') || '';
      svgEl.setAttribute('style', `${existingStyle};${styleString}`.replace(/^;/, ''));
    }

    // Transforms
    const transforms: string[] = [];
    if (options.rotate && options.rotate % 360 !== 0) {
      transforms.push(`rotate(${options.rotate})`);
    }

    if (options.flip === 'horizontal') {
      transforms.push('scale(-1, 1)');
    } else if (options.flip === 'vertical') {
      transforms.push('scale(1, -1)');
    } else if (options.flip === 'both') {
      transforms.push('scale(-1, -1)');
    }

    if (transforms.length > 0) {
      const currentTransform = svgEl.getAttribute('transform');
      const combined = currentTransform ? `${currentTransform} ${transforms.join(' ')}` : transforms.join(' ');

      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', combined);
      g.setAttribute('transform-origin', 'center');
      while (svgEl.firstChild) {
        g.appendChild(svgEl.firstChild);
      }
      svgEl.appendChild(g);
    }

    return new XMLSerializer().serializeToString(svgEl);
  }

  // SSR Fallback with string replacements
  let result = rawSvg;
  if (w !== null) result = result.replace(/width="[^"]*"/, `width="${w}"`);
  if (h !== null) result = result.replace(/height="[^"]*"/, `height="${h}"`);
  if (options.fill !== undefined) result = result.replace(/fill="(?!none)[^"]*"/g, `fill="${options.fill}"`);
  if (options.stroke !== undefined) result = result.replace(/stroke="(?!none)[^"]*"/g, `stroke="${options.stroke}"`);
  if (options.strokeWidth !== undefined) result = result.replace(/stroke-width="[^"]*"/g, `stroke-width="${options.strokeWidth}"`);
  return result;
}

export function svgToDataUri(svg: string): string {
  const cleaned = svg
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
  return `data:image/svg+xml,${cleaned}`;
}

export function svgToBlob(svg: string): Blob {
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSvg(svg: string, filename = 'icon.svg'): void {
  const blob = svgToBlob(svg);
  downloadBlob(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

export function svgToPngBlob(svg: string, size = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('svgToPngBlob is only available in browser environments'));
    }
    const img = new Image();
    const svgBlob = svgToBlob(svg);
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Failed to get 2D canvas context'));
      }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to PNG blob'));
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image element'));
    };

    img.src = url;
  });
}

export async function fetchAndProcess(svgUrl: string, options?: SvgProcessOptions): Promise<string> {
  const res = await fetch(svgUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch SVG from ${svgUrl}: ${res.statusText}`);
  }
  const rawSvg = await res.text();
  return processSvg(rawSvg, options);
}
