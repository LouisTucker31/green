// Green PWA | Page — home dashboard

const HomePage = (() => {

  function init() {
    renderStats();
    renderMap();
    renderRecentRounds();
    renderLocalModeBanner('home-main');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); initPullToRefresh(init); });
  } else {
    init();
    initPullToRefresh(init);
  }

  window.addEventListener('pageshow', e => {
    if (e.persisted) init();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') init();
  });

})();