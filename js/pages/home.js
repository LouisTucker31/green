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

    const played = COURSES_DATA.data.filter(c => playedIds.includes(c.id) && c.lat && c.lng);

    // Match the ukLow.svg viewBox: 447.15 -2.5 712.7 856
    const minLat = 49.19, maxLat = 60.38;
    const minLng = -7.70, maxLng = 1.73;

    // Derived from known point: London (51.5, -0.1) -> SVG ~(820, 680)
    const svgMinX = 650, svgMaxX = 1130;
    const svgMinY = 15,  svgMaxY = 820;

    played.forEach(c => {
      const x = svgMinX + ((c.lng - minLng) / (maxLng - minLng)) * (svgMaxX - svgMinX);
      const y = svgMaxY - ((c.lat - minLat) / (maxLat - minLat)) * (svgMaxY - svgMinY);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toFixed(1));
      circle.setAttribute('cy', y.toFixed(1));
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', 'var(--green-600)');
      circle.setAttribute('opacity', '0.85');
      dots.appendChild(circle);;
    });
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
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();