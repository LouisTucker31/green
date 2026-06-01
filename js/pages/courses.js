// Green PWA | Page — course browser

const CoursesPage = (() => {

  // ─── STATE ──────────────────────────────────────────────
  let loadedClubs      = [];
  let allClubs         = [];
  let currentFilter    = 'all';
  let searchQuery      = '';
  let currentPage      = 1;
  let totalPages       = 1;
  let isSearching      = false;
  let allCoursesLoaded = false;
  let initialised      = false;

  // ─── CACHE ──────────────────────────────────────────────
  const SEARCH_INDEX_KEY = 'green_search_index';
  const SEARCH_INDEX_TTL = 7 * 24 * 60 * 60 * 1000;

  // ─── ELEMENTS ───────────────────────────────────────────
  // Declared as let and assigned in init() to ensure DOM is ready
  let searchInput, searchClear, loadingState, errorState;
  let emptyState, emptyMessage, nearbySection, allSection;
  let allTitle, courseCount, alphaGroups, nearbyList;
  let retryBtn, filterTabs, loadMoreWrap, loadMoreBtn;

  function assignElements() {
    searchInput   = document.getElementById('search-input');
    searchClear   = document.getElementById('search-clear');
    loadingState  = document.getElementById('loading-state');
    errorState    = document.getElementById('error-state');
    emptyState    = document.getElementById('empty-state');
    emptyMessage  = document.getElementById('empty-message');
    nearbySection = document.getElementById('nearby-section');
    allSection    = document.getElementById('all-section');
    allTitle      = document.getElementById('all-section-title');
    courseCount   = document.getElementById('course-count');
    alphaGroups   = document.getElementById('alpha-groups');
    nearbyList    = document.getElementById('nearby-list');
    retryBtn      = document.getElementById('retry-btn');
    filterTabs    = document.querySelectorAll('.filter-tab');
    loadMoreWrap  = document.getElementById('load-more-wrap');
    loadMoreBtn   = document.getElementById('load-more-btn');
  }

  // ─── INIT ───────────────────────────────────────────────
  async function init() {
    assignElements();
    bindEvents();
    await loadPage(1);
    initialised = true;
    tryNearby();
    loadSearchIndex();
  }

  // ─── LOAD PAGE ──────────────────────────────────────────
  async function loadPage(page) {
    showLoading(true);
    try {
      const data     = await API.Clubs.list({ per_page: 50, page });
      totalPages     = data.total_pages;
      currentPage    = page;
      const newClubs = data.clubs.map(c => API.normalise(c));
      loadedClubs    = page === 1 ? newClubs : loadedClubs.concat(newClubs);
      showLoading(false);
      loadMoreWrap.classList.toggle('hidden', currentPage >= totalPages || currentFilter !== 'all');
      render();
    } catch (e) {
      console.error(e);
      showLoading(false);
      showError(true);
    }
  }

  // ─── SEARCH INDEX ───────────────────────────────────────
  async function loadSearchIndex() {
    try {
      const raw = localStorage.getItem(SEARCH_INDEX_KEY);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp < SEARCH_INDEX_TTL) {
          allClubs         = data;
          allCoursesLoaded = true;
          console.log(`Search index: ${allClubs.length} clubs from cache`);
          return;
        }
      }
    } catch (e) {}

    try {
      const first = await API.Clubs.list({ per_page: 50, page: 1 });
      const pages = first.total_pages;
      let index   = first.clubs.map(c => API.normalise(c));

      for (let page = 2; page <= pages; page++) {
        await new Promise(r => setTimeout(r, 1500));
        try {
          const data = await API.Clubs.list({ per_page: 50, page });
          index = index.concat(data.clubs.map(c => API.normalise(c)));
          console.log(`Search index: ${index.length} clubs (${page}/${pages})`);
        } catch (e) {
          if (e.message && e.message.includes('429')) {
            await new Promise(r => setTimeout(r, 5000));
            page--;
          }
        }
      }

      index.sort((a, b) => a.name.localeCompare(b.name));
      allClubs         = index;
      allCoursesLoaded = true;
      console.log(`Search index complete: ${allClubs.length} clubs`);

      localStorage.setItem(SEARCH_INDEX_KEY, JSON.stringify({
        data: allClubs, timestamp: Date.now(),
      }));

      if (isSearching && searchQuery) doSearch(searchQuery);

    } catch (e) {
      console.error('Search index error:', e);
    }
  }

  // ─── NEARBY ─────────────────────────────────────────────
  function tryNearby() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords;
        const data  = await API.Clubs.nearby(latitude, longitude, { per_page: 5 });
        const clubs = (data.clubs || data).slice(0, 5).map(c => API.normalise(c));
        if (!clubs.length) return;
        nearbyList.innerHTML = clubs.map(c => courseItemHTML(c)).join('');
        nearbySection.classList.remove('hidden');
      } catch (e) {}
    }, () => {});
  }

  // ─── RENDER ─────────────────────────────────────────────
  function render() {
    // Always hide both first — no exceptions
    if (allSection) allSection.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (alphaGroups) alphaGroups.innerHTML = '';

    const playedIds    = DB.Rounds.getPlayedCourseIds();
    const wishlistIds  = DB.Wishlist.getAll();
    const favouriteIds = DB.Favourites.getAll();

    // Apply filter
    let pool;
    if (currentFilter === 'played') {
      pool = loadedClubs.filter(c => playedIds.includes(c.id));
    } else if (currentFilter === 'wishlist') {
      pool = loadedClubs.filter(c => wishlistIds.includes(c.id));
    } else if (currentFilter === 'favourite') {
      pool = loadedClubs.filter(c => favouriteIds.includes(c.id));
    } else {
      pool = loadedClubs.slice();
    }

    // Hide section header and nearby on filter tabs
    const sectionHeader = allSection.querySelector('.section-header');
    if (sectionHeader) sectionHeader.style.display = currentFilter === 'all' ? '' : 'none';
    if (nearbySection) nearbySection.style.display = currentFilter === 'all' ? '' : 'none';

    // Empty state
    if (pool.length === 0) {
      emptyState.classList.remove('hidden');
      const messages = {
        played:    "You haven't logged any rounds yet.",
        wishlist:  "Your wishlist is empty.",
        favourite: "You haven't favourited any courses yet.",
        all:       "No courses found.",
      };
      emptyMessage.textContent = messages[currentFilter] || "No courses found.";
      return;
    }

    // Show results
    allSection.classList.remove('hidden');
    if (currentFilter === 'all') {
      allTitle.textContent    = 'All Courses';
      courseCount.textContent = `${loadedClubs.length} of 2,666`;
      allTitle.style.display  = '';
      courseCount.style.display = '';
    } else {
      allTitle.style.display    = 'none';
      courseCount.style.display = 'none';
    }

    // Alphabetical groups for all, flat list for filters
    if (currentFilter === 'all') {
      const groups = {};
      pool.forEach(c => {
        const letter = c.name[0].toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(c);
      });
      alphaGroups.innerHTML = Object.keys(groups).sort().map(letter => `
        <div class="alpha-group">
          <span class="alpha-label">${letter}</span>
          <div class="course-list">
            ${groups[letter].map(c => courseItemHTML(c)).join('')}
          </div>
        </div>
      `).join('');
    } else {
      alphaGroups.innerHTML = `
        <div class="course-list">
          ${pool.map(c => courseItemHTML(c)).join('')}
        </div>
      `;
    }
  }

  // ─── SEARCH ─────────────────────────────────────────────
  function doSearch(query) {
    if (!query) {
      isSearching = false;
      loadMoreWrap.classList.toggle('hidden', currentPage >= totalPages);
      render();
      return;
    }

    isSearching = true;
    loadMoreWrap.classList.add('hidden');
    allSection.classList.add('hidden');
    emptyState.classList.add('hidden');

    const source = allCoursesLoaded ? allClubs : loadedClubs;
    const q      = query.toLowerCase();
    const results = source.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.county.toLowerCase().includes(q)
    );

    if (!results.length) {
      emptyState.classList.remove('hidden');
      emptyMessage.textContent = allCoursesLoaded
        ? `No courses found for "${query}"`
        : `Still loading search index — try again shortly`;
      return;
    }

    allSection.classList.remove('hidden');
    allTitle.textContent    = 'Results';
    courseCount.textContent = `${results.length} course${results.length !== 1 ? 's' : ''}`;
    alphaGroups.innerHTML   = `
      <div class="course-list">
        ${results.map(c => courseItemHTML(c)).join('')}
      </div>
    `;
  }

  // ─── COURSE ITEM HTML ────────────────────────────────────
  function courseItemHTML(club) {
    const played     = DB.Rounds.hasPlayed(club.id);
    const wishlisted = DB.Wishlist.has(club.id);

    const statusIcon = played
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
           <polyline points="20 6 9 17 4 12"/>
         </svg>`
      : wishlisted
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
         </svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
         </svg>`;

    const statusClass = played ? 'played' : wishlisted ? 'wishlisted' : 'unplayed';
    const typeLabel   = club.courseType
      ? `<span class="course-type">${club.courseType}</span>`
      : '';

    return `
      <a href="course.html?id=${club.id}" class="course-item">
        <div class="course-img-placeholder"></div>
        <div class="course-info">
          <span class="course-name">${club.name}</span>
          <span class="course-location">${[club.city, club.county].filter(Boolean).join(', ')}</span>
          ${typeLabel}
        </div>
        <div class="course-status ${statusClass}">
          ${statusIcon}
        </div>
      </a>
    `;
  }

  // ─── EVENTS ─────────────────────────────────────────────
  function bindEvents() {
    let searchTimeout;

    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      searchClear.classList.toggle('hidden', !searchQuery);
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => doSearch(searchQuery), 300);
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery       = '';
      isSearching       = false;
      searchClear.classList.add('hidden');
      loadMoreWrap.classList.toggle('hidden', currentPage >= totalPages);
      render();
    });

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.dataset.filter === currentFilter) return;
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        render();
      });
    });

    retryBtn.addEventListener('click', () => {
      showError(false);
      loadPage(1);
    });

    loadMoreBtn.addEventListener('click', () => {
      if (currentPage < totalPages) loadPage(currentPage + 1);
    });
  }

  // ─── PUBLIC ─────────────────────────────────────────────
  function setFilter(filter) {
    currentFilter = filter;
    loadMoreWrap.classList.toggle('hidden', currentFilter !== 'all' || currentPage >= totalPages);
    render();
  }

  // ─── HELPERS ────────────────────────────────────────────
  function showLoading(show) {
    if (loadingState) loadingState.classList.toggle('hidden', !show);
  }

  function showError(show) {
    errorState.classList.toggle('hidden', !show);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { setFilter };

})();

function GreenCourses() {}
GreenCourses.setFilter = function(filter) {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
  CoursesPage.setFilter(filter);
};