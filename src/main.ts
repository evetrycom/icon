import { searchEngine, type SearchIconItem } from './lib/search';

// State
let currentCollection = 'all';
let currentQuery = '';
let currentResults: SearchIconItem[] = [];
let displayedCount = 0;
const PAGE_SIZE = 96;

// Elements
const searchInput = document.getElementById('icon-search-input') as HTMLInputElement;
const searchClearBtn = document.getElementById('search-clear-btn') as HTMLButtonElement;
const collectionFilters = document.getElementById('collection-filters') as HTMLElement;
const iconsGrid = document.getElementById('icons-grid') as HTMLElement;
const loadMoreBtn = document.getElementById('load-more-btn') as HTMLButtonElement;
const paginationWrap = document.getElementById('pagination-wrap') as HTMLElement;
const searchStatusText = document.getElementById('search-status-text') as HTMLElement;
const totalCountEl = document.getElementById('total-count') as HTMLElement;
const toastEl = document.getElementById('toast') as HTMLElement;

// Helper: Toast
let toastTimeout: any;
function showToast(message: string) {
  clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 1800);
}

// 1. Initialize
async function init() {
  try {
    await searchEngine.loadIndex('/api/search-index.json');
    const total = searchEngine.totalIcons;
    if (totalCountEl) totalCountEl.textContent = total.toLocaleString();

    // Populate badges
    for (const c of searchEngine.availableCollections) {
      const badge = document.getElementById(`badge-${c.id}`);
      if (badge) badge.textContent = c.total.toLocaleString();
    }

    executeSearch();
  } catch (err) {
    if (searchStatusText) searchStatusText.textContent = 'Failed to load icons.';
    console.error(err);
  }
}

// 2. Search
function executeSearch() {
  currentResults = searchEngine.search(currentQuery, currentCollection, 3000);

  if (searchStatusText) {
    if (!currentQuery.trim()) {
      searchStatusText.textContent = `Showing ${currentResults.length.toLocaleString()} icons`;
    } else {
      searchStatusText.textContent = `Found ${currentResults.length.toLocaleString()} icons for "${currentQuery}"`;
    }
  }

  displayedCount = 0;
  iconsGrid.innerHTML = '';
  renderIcons();
}

// 3. Render icons
function renderIcons() {
  if (currentResults.length === 0) {
    iconsGrid.innerHTML = '<p style="grid-column: 1/-1; color: #888; padding: 2rem 0;">No icons found.</p>';
    paginationWrap.style.display = 'none';
    return;
  }

  const batch = currentResults.slice(displayedCount, displayedCount + PAGE_SIZE);
  const fragment = document.createDocumentFragment();

  for (const item of batch) {
    const card = document.createElement('div');
    card.className = 'icon-item';
    card.title = `Click to copy ${item.n} SVG`;

    card.innerHTML = `
      <div class="icon-item-svg">
        <img src="${item.u}" alt="${item.n}" loading="lazy" width="24" height="24" />
      </div>
      <div class="icon-item-name">${item.n}</div>
      <div class="icon-item-set">${item.s}</div>
    `;

    // Click icon -> Copy SVG code
    card.addEventListener('click', async () => {
      try {
        const res = await fetch(item.u);
        const svg = await res.text();
        await navigator.clipboard.writeText(svg);
        showToast(`Copied ${item.n} SVG to clipboard`);
      } catch {
        showToast('Failed to copy');
      }
    });

    fragment.appendChild(card);
  }

  iconsGrid.appendChild(fragment);
  displayedCount += batch.length;

  if (displayedCount < currentResults.length) {
    paginationWrap.style.display = 'flex';
  } else {
    paginationWrap.style.display = 'none';
  }
}

// Search input
let searchTimer: any;
searchInput.addEventListener('input', () => {
  currentQuery = searchInput.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    executeSearch();
  }, 25);
});

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  currentQuery = '';
  searchInput.focus();
  executeSearch();
});

// Filters
collectionFilters.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('.filter-btn') as HTMLElement;
  if (!target) return;

  collectionFilters.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  target.classList.add('active');
  currentCollection = target.getAttribute('data-set') || 'all';
  executeSearch();
});

// Load more
loadMoreBtn.addEventListener('click', () => {
  renderIcons();
});

// Boot
init();
