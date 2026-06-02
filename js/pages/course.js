// Green PWA | Page — individual course detail

const CoursePage = (() => {

  // ─── STATE ───────────────────────────────────────────────────────────────
  let course = null;
  let editingRoundId = null;

  // ─── ELEMENTS ────────────────────────────────────────────────────────────
  const notFound     = document.getElementById('course-not-found');
  const content      = document.getElementById('course-content');
  const courseName   = document.getElementById('course-name');
  const courseLocation = document.getElementById('course-location');
  const courseBadges = document.getElementById('course-badges');
  const infoCard     = document.getElementById('course-info-card');
  const roundsList   = document.getElementById('rounds-list');
  const roundsEmpty  = document.getElementById('rounds-empty');
  const roundCount   = document.getElementById('round-count');

  const btnPlayed    = document.getElementById('btn-played');
  const btnWishlist  = document.getElementById('btn-wishlist');
  const btnFavourite = document.getElementById('btn-favourite');
  const logRoundBtn  = document.getElementById('log-round-btn');

  const sheetOverlay = document.getElementById('sheet-overlay');
  const logSheet     = document.getElementById('log-sheet');
  const sheetClose   = document.getElementById('sheet-close');
  const inputDate    = document.getElementById('input-date');
  const inputScore   = document.getElementById('input-score');
  const inputNotes   = document.getElementById('input-notes');
  const saveRoundBtn = document.getElementById('save-round-btn');

  // ─── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    const params   = new URLSearchParams(window.location.search);
    const id       = params.get('id');
    const allData  = COURSES_DATA.data;
    course         = allData.find(c => c.id === id) || null;

    if (!course) {
      notFound.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }

    renderCourse();
    renderToggles();
    renderRounds();
    bindEvents();

    // Set today as default date
    inputDate.value = new Date().toISOString().split('T')[0];
  }

  // ─── RENDER COURSE INFO ──────────────────────────────────────────────────
  function renderCourse() {
    document.title = `Green – ${course.name}`;

    courseName.textContent = course.name;
    const location = [course.city, course.county].filter(Boolean).join(', ');
    courseLocation.textContent = location || 'United Kingdom';

    // Badges
    const badges = [];
    if (course.courseType) badges.push(`<span class="course-badge">${course.courseType}</span>`);
    if (course.clubType)   badges.push(`<span class="course-badge">${course.clubType}</span>`);
    if (course.rating)     badges.push(`<span class="course-badge rating">★ ${course.rating}</span>`);
    courseBadges.innerHTML = badges.join('');

    // Info card rows
    const rows = [];
    if (course.postcode)   rows.push(row('Postcode', course.postcode));
    if (course.courseType) rows.push(row('Course type', course.courseType));
    if (course.clubType)   rows.push(row('Club type', course.clubType));
    if (course.rating)     rows.push(row('Rating', `★ ${course.rating}`));
    if (course.countryCode) rows.push(row('Country', countryName(course.countryCode)));

    infoCard.innerHTML = rows.length
      ? rows.join('')
      : '<div class="info-row"><span class="info-label">No details available</span></div>';
  }

  function row(label, value) {
    return `
      <div class="info-row">
        <span class="info-label">${label}</span>
        <span class="info-value">${value}</span>
      </div>`;
  }

  function countryName(code) {
    const map = { ENG: 'England', SCO: 'Scotland', WAL: 'Wales', NIR: 'Northern Ireland' };
    return map[code] || code;
  }

  // ─── RENDER TOGGLES ──────────────────────────────────────────────────────
  function renderToggles() {
    const played    = DB.Played.has(course.id);
    const wishlisted = DB.Wishlist.has(course.id);
    const favourited = DB.Favourites.has(course.id);

    btnPlayed.dataset.active    = played;
    btnWishlist.dataset.active  = wishlisted;
    btnFavourite.dataset.active = favourited;
  }

  // ─── RENDER ROUNDS ───────────────────────────────────────────────────────
  function renderRounds() {
    const rounds = DB.Rounds.getForCourse(course.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    roundCount.textContent = rounds.length
      ? `${rounds.length} round${rounds.length !== 1 ? 's' : ''}`
      : '';

    if (!rounds.length) {
      roundsList.innerHTML = '<div class="rounds-empty"><p>No rounds logged yet</p></div>';
      return;
    }

    roundsList.innerHTML = rounds.map(r => {
      const d     = new Date(r.date + 'T12:00:00');
      const day   = d.getDate();
      const month = d.toLocaleString('en-GB', { month: 'short' });
      const notes = r.notes ? `<p class="round-card-notes">${r.notes}</p>` : '';
      const score = r.score !== null
        ? `<span class="round-card-score">${r.score}</span>`
        : `<span class="round-card-no-score">No score</span>`;

      return `
        <div class="round-card" data-round-id="${r.id}">
          <div class="round-card-date">
            <span class="round-card-day">${day}</span>
            <span class="round-card-month">${month}</span>
          </div>
          <div class="round-card-info">
            ${score}
            ${notes}
          </div>
          <button class="round-card-edit" data-round-id="${r.id}" aria-label="Edit round">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="round-card-delete" data-round-id="${r.id}" aria-label="Delete round">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>`;
    }).join('');
  }

  // ─── SHEET ───────────────────────────────────────────────────────────────
  function openSheet(round = null) {
    editingRoundId = round ? round.id : null;
    document.getElementById('sheet-title').textContent = round ? 'Edit Round' : 'Log a Round';
    inputDate.value  = round ? round.date : new Date().toISOString().split('T')[0];
    inputScore.value = round && round.score !== null ? round.score : '';
    inputNotes.value = round ? (round.notes || '') : '';

    logSheet.classList.remove('hidden');
    sheetOverlay.classList.remove('hidden');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        logSheet.classList.add('visible');
        sheetOverlay.classList.add('visible');
      });
    });
  }

  function closeSheet() {
    logSheet.classList.remove('visible');
    sheetOverlay.classList.remove('visible');
    setTimeout(() => {
      logSheet.classList.add('hidden');
      sheetOverlay.classList.add('hidden');
    }, 350);
  }

  // ─── EVENTS ──────────────────────────────────────────────────────────────
  function bindEvents() {
    // Toggle: Played
    btnPlayed.addEventListener('click', () => {
      DB.Played.toggle(course.id);
      renderToggles();
    });

    // Toggle: Wishlist
    btnWishlist.addEventListener('click', () => {
      DB.Wishlist.toggle(course.id);
      renderToggles();
    });

    // Toggle: Favourite
    btnFavourite.addEventListener('click', () => {
      DB.Favourites.toggle(course.id);
      renderToggles();
    });

    // Log round
    logRoundBtn.addEventListener('click', openSheet);
    sheetClose.addEventListener('click', closeSheet);
    sheetOverlay.addEventListener('click', closeSheet);

    // Save round
    saveRoundBtn.addEventListener('click', () => {
      const date  = inputDate.value;
      const score = inputScore.value ? parseInt(inputScore.value, 10) : null;
      const notes = inputNotes.value.trim();

      if (!date) {
        inputDate.focus();
        return;
      }

      if (editingRoundId) {
        DB.Rounds.update(editingRoundId, { date, score, notes });
      } else {
        DB.Rounds.add({
          courseId:   course.id,
          courseName: course.name,
          date,
          score,
          notes,
        });
        DB.Played.add(course.id);
      }

      closeSheet();
      renderToggles();
      renderRounds();
    });

    // Edit/Delete round
    roundsList.addEventListener('click', e => {
      const deleteBtn = e.target.closest('.round-card-delete');
      if (deleteBtn) {
        DB.Rounds.remove(deleteBtn.dataset.roundId);
        renderToggles();
        renderRounds();
        return;
      }
      const editBtn = e.target.closest('.round-card-edit');
      if (editBtn) {
        const round = DB.Rounds.getAll().find(r => r.id === editBtn.dataset.roundId);
        if (round) openSheet(round);
      }
    });
  }

  // ─── START ────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();