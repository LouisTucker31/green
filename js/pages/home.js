// Green PWA | Page — home dashboard

const HomePage = (() => {

  function init() {
    renderStats();
    renderMap();
    renderRecentRounds();
  }

  function renderStats() {
    const playedIds = DB.Played.getAll();
    const rounds    = DB.Rounds.getAll();

    // Courses played count
    document.getElementById('stat-played').textContent = playedIds.length;

    // Rounds logged
    document.getElementById('stat-rounds').textContent = rounds.length;

    // Unique counties from played courses
    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties = new Set(playedCourses.map(c => c.county).filter(Boolean));
    document.getElementById('stat-counties').textContent = counties.size;

    // Map label percentage
    const pct = playedIds.length === 0 ? '0' : ((playedIds.length / COURSES_DATA.data.length) * 100).toFixed(1);
    document.getElementById('map-label').textContent = `${pct}% of UK courses played`;
  }

function renderMap() {
    const playedIds = DB.Played.getAll();
    const svg = document.getElementById('uk-dots-svg');
    if (!svg) return;

    const dots = document.getElementById('course-dots');
    if (!dots) return;
    dots.innerHTML = '';

    renderMapDots('course-dots', playedIds);
  }

  function renderRecentRounds() {
    const list   = document.getElementById('recent-rounds-list');
    const rounds = DB.Rounds.getAll()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (!rounds.length) {
      list.innerHTML = `
        <div class="round-item">
          <span class="round-course" style="color:var(--grey-400);font-size:14px;padding:8px 0;">No rounds logged yet</span>
        </div>`;
      renderEmptyState();
      return;
    }

    list.innerHTML = rounds.map(r => {
      const d    = new Date(r.date + 'T12:00:00');
      const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const score = r.score !== null
        ? `<div class="round-score"><span class="score-num">${r.score}</span></div>`
        : '';
      return `
        <a href="course.html?id=${r.courseId}" class="round-item">
          <div class="round-img-placeholder"></div>
          <div class="round-info">
            <span class="round-course">${r.courseName}</span>
            <span class="round-date">${date}</span>
          </div>
          ${score}
        </a>`;
    }).join('');
  }

  function renderEmptyState() {
    const playedIds = DB.Played.getAll();
    if (playedIds.length) return;

    const existing = document.getElementById('home-empty-state');
    if (existing) return;

    const empty = document.createElement('div');
    empty.id    = 'home-empty-state';
    empty.style.cssText = `
      margin: 16px 0 24px;
      background: var(--white);
      border-radius: var(--radius-lg);
      padding: 28px 24px;
      text-align: center;
      box-shadow: var(--shadow-sm);
    `;
    empty.innerHTML = `
      <div style="width:56px;height:56px;background:var(--green-50);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" stroke-width="1.5">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </div>
      <p style="font-family:var(--font-display);font-size:20px;color:var(--green-800);margin-bottom:8px;">Welcome to Green</p>
      <p style="font-size:14px;color:var(--grey-400);line-height:1.6;margin-bottom:20px;">Your UK golf passport. Find a course, log your first round, and start building your map.</p>
      <a href="courses.html" style="display:inline-block;padding:11px 24px;background:var(--green-700);color:white;border-radius:var(--radius-xl);font-size:14px;font-weight:500;">Find a course</a>
    `;

    const main = document.querySelector('.home-main');
    if (main) main.insertBefore(empty, main.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pageshow', e => {
    if (e.persisted) init();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') init();
  });

})();