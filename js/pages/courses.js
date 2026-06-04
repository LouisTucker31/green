// Green PWA | Page — course browser
// Loads from static js/data/courses.json — no API needed

const CoursesPage = (() => {

  // ─── STATE ──────────────────────────────────────────────────────────────
  let allClubs      = [];   // full list from static JSON
  let currentFilter = 'all';
  let searchQuery   = '';
  let currentPage   = 1;
  const PAGE_SIZE   = 50;

  // ─── ELEMENTS ───────────────────────────────────────────────────────────
  const searchInput   = document.getElementById('search-input');
  const searchClear   = document.getElementById('search-clear');
  const loadingState  = document.getElementById('loading-state');
  const errorState    = document.getElementById('error-state');
  const emptyState    = document.getElementById('empty-state');
  const emptyMessage  = document.getElementById('empty-message');
  const nearbySection = document.getElementById('nearby-section');
  const allSection    = document.getElementById('all-section');
  const allTitle      = document.getElementById('all-section-title');
  const courseCount   = document.getElementById('course-count');
  const alphaGroups   = document.getElementById('alpha-groups');
  const nearbyList    = document.getElementById('nearby-list');
  const retryBtn      = document.getElementById('retry-btn');
  const filterTabs    = document.querySelectorAll('.filter-tab');
  const loadMoreWrap  = document.getElementById('load-more-wrap');
  const loadMoreBtn   = document.getElementById('load-more-btn');

  // ─── INIT ────────────────────────────────────────────────────────────────
  function init() {
    bindEvents();
    loadCourses();
    tryNearby();
  }

  // ─── LOAD FROM STATIC JSON ───────────────────────────────────────────────
  function loadCourses() {
    showLoading(true);
    try {
      allClubs = COURSES_DATA.data.sort((a, b) => a.name.localeCompare(b.name));
      console.log(`Loaded ${allClubs.length} clubs from static data`);
      showLoading(false);
      render();
      updateLoadMore();
    } catch (e) {
      console.error(e);
      showLoading(false);
      showError(true);
    }
  }

  // ─── NEARBY ──────────────────────────────────────────────────────────────
  function tryNearby() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      // Find nearest courses from allClubs using haversine approximation
      const withDist = allClubs
        .filter(c => c.lat && c.lng)
        .map(c => {
          const dlat = c.lat - latitude;
          const dlng = c.lng - longitude;
          return { ...c, dist: dlat * dlat + dlng * dlng };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

      if (!withDist.length) return;
      nearbyList.innerHTML = withDist.map(c => courseItemHTML(c)).join('');
      if (currentFilter === 'all') nearbySection.classList.remove('hidden');
    }, () => {});
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  function render() {
    allSection.classList.add('hidden');
    emptyState.classList.add('hidden');
    nearbySection.classList.add('hidden');
    loadMoreWrap.classList.add('hidden');

    const playedIds    = DB.Played.getAll();
    const wishlistIds  = DB.Wishlist.getAll();
    const favouriteIds = DB.Favourites.getAll();

    // Filter by tab
    let pool;
    if (currentFilter === 'played') {
      pool = allClubs.filter(c => playedIds.includes(c.id));
    } else if (currentFilter === 'wishlist') {
      pool = allClubs.filter(c => wishlistIds.includes(c.id));
    } else if (currentFilter === 'favourite') {
      pool = allClubs.filter(c => favouriteIds.includes(c.id));
    } else {
      pool = allClubs.slice();
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      pool = pool.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.city  && c.city.toLowerCase().includes(q)) ||
        (c.county && c.county.toLowerCase().includes(q))
      );
    }

    // Empty state
    if (!pool.length) {
      alphaGroups.innerHTML = '';
      allSection.classList.add('hidden');
      nearbySection.classList.add('hidden');
      loadMoreWrap.classList.add('hidden');
      emptyState.classList.remove('hidden');
      if (searchQuery) {
        emptyMessage.textContent = `No courses found for "${searchQuery}"`;
      } else {
        const messages = {
          played:    "You haven't logged any rounds yet.",
          wishlist:  "Your wishlist is empty.",
          favourite: "You haven't favourited any courses yet.",
          all:       "No courses found.",
        };
        emptyMessage.textContent = messages[currentFilter] || 'No courses found.';
      }
      return;
    }

    allSection.classList.remove('hidden');

    // Title + count
    if (searchQuery) {
      allTitle.textContent    = 'Results';
      courseCount.textContent = `${pool.length} course${pool.length !== 1 ? 's' : ''}`;
    } else if (currentFilter !== 'all') {
      allTitle.textContent    = currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1);
      courseCount.textContent = `${pool.length} course${pool.length !== 1 ? 's' : ''}`;
    } else {
      allTitle.textContent    = 'All Courses';
      courseCount.textContent = `${allClubs.length} courses`;
    }

    // Paginate for 'all' view (not for search/filters — show all)
    const showPaginated = !searchQuery && currentFilter === 'all';
    const display = showPaginated ? pool.slice(0, currentPage * PAGE_SIZE) : pool;

    // Alphabetical groups for all/paginated, flat list for search/filter
    if (currentFilter === 'all' && !searchQuery) {
      const groups = {};
      display.forEach(c => {
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
          ${display.map(c => courseItemHTML(c)).join('')}
        </div>
      `;
    }

    updateLoadMore(pool.length);
  }

  // ─── COURSE ITEM HTML ────────────────────────────────────────────────────
  function courseItemHTML(club) {
    const played     = DB.Played.has(club.id);
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
    const location = [club.city, club.county].filter(Boolean).join(', ');

    return `
      <a href="course.html?id=${club.id}" class="course-item">
        <div class="course-img-placeholder"></div>
        <div class="course-info">
          <span class="course-name">${club.name}</span>
          <span class="course-location">${location}</span>
          ${typeLabel}
        </div>
        <div class="course-status ${statusClass}">
          ${statusIcon}
        </div>
      </a>
    `;
  }

  // ─── LOAD MORE ────────────────────────────────────────────────────────────
  function updateLoadMore(poolSize) {
    // Only show load more when browsing all courses (not searching/filtering)
    if (searchQuery || currentFilter !== 'all') {
      loadMoreWrap.classList.add('hidden');
      return;
    }
    const shown = currentPage * PAGE_SIZE;
    loadMoreWrap.classList.toggle('hidden', shown >= allClubs.length);
  }

  // ─── EVENTS ──────────────────────────────────────────────────────────────
  function bindEvents() {
    let searchTimeout;

    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      searchClear.classList.toggle('hidden', !searchQuery);
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(render, 200);
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery       = '';
      searchClear.classList.add('hidden');
      render();
    });

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        console.log('tab clicked:', tab.dataset.filter, 'current:', currentFilter);
        if (tab.dataset.filter === currentFilter) return;
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        render();
      });
    });

    retryBtn.addEventListener('click', () => {
      showError(false);
      loadCourses();
    });

    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      render();
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  function showLoading(show) {
    loadingState.classList.toggle('hidden', !show);
    if (show) {
      allSection.classList.add('hidden');
      emptyState.classList.add('hidden');
    }
  }

  function showError(show) {
    errorState.classList.toggle('hidden', !show);
  }

  // ─── START ────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();