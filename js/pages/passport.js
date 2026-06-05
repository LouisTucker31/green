// Green PWA | Page — passport

const PassportPage = (() => {

  function init() {
    bindTabs();
    renderTimeline();
    renderMap();
    renderStats();
  }

  // ─── TABS ─────────────────────────────────────────────────────────────────
  function bindTabs() {
    const tabs   = document.querySelectorAll('.passport-tab');
    const panels = document.querySelectorAll('.passport-main');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.remove('hidden');
      });
    });
  }

  // ─── TIMELINE ────────────────────────────────────────────────────────────
  function renderTimeline() {
    const rounds  = DB.Rounds.getAll().sort((a, b) => new Date(b.date) - new Date(a.date));
    const content = document.getElementById('timeline-content');

    if (!rounds.length) {
      content.innerHTML = '<p style="color:var(--grey-400);font-size:14px;padding:16px 0;">No rounds logged yet. Head to a course to log your first round.</p>';
      return;
    }

    // Group by year
    const byYear = {};
    rounds.forEach(r => {
      const year = new Date(r.date + 'T12:00:00').getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(r);
    });

    content.innerHTML = Object.keys(byYear).sort((a, b) => b - a).map(year => `
      <div class="year-group">
        <h2 class="year-label">${year}</h2>
        <div class="timeline">
          ${byYear[year].map(r => {
            const d     = new Date(r.date + 'T12:00:00');
            const date  = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const score = r.score !== null
              ? `<div class="timeline-score"><span class="score-num">${r.score}</span></div>`
              : '';
            return `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <a href="course.html?id=${r.courseId}" class="timeline-card">
                  <div class="timeline-info">
                    <span class="timeline-course">${r.courseName}</span>
                    <span class="timeline-date">${date}</span>
                  </div>
                  ${score}
                </a>
              </div>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  // ─── MAP ─────────────────────────────────────────────────────────────────
  function renderMap() {
    const playedIds = DB.Played.getAll();
    const dots      = document.getElementById('passport-course-dots');
    if (!dots) return;
    dots.innerHTML  = '';

    renderMapDots('passport-course-dots', playedIds);

    // Map stats
    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties = new Set(playedCourses.map(c => c.county).filter(Boolean));
    const pct = playedIds.length === 0 ? '0' : ((playedIds.length / COURSES_DATA.data.length) * 100).toFixed(1);

    document.getElementById('map-stat-played').textContent  = playedIds.length;
    document.getElementById('map-stat-counties').textContent = counties.size;
    document.getElementById('map-stat-pct').textContent     = `${pct}%`;
  }

  // ─── STATS ───────────────────────────────────────────────────────────────
  function renderStats() {
    const playedIds = DB.Played.getAll();
    const rounds    = DB.Rounds.getAll();
    const thisYear  = new Date().getFullYear();

    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties      = new Set(playedCourses.map(c => c.county).filter(Boolean));
    const roundsYear    = rounds.filter(r => new Date(r.date + 'T12:00:00').getFullYear() === thisYear);
    const scores        = rounds.map(r => r.score).filter(s => s !== null);
    const best          = scores.length ? Math.min(...scores) : null;
    const avg           = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    document.getElementById('stat-courses').textContent     = playedIds.length;
    document.getElementById('stat-rounds-year').textContent = roundsYear.length;
    document.getElementById('stat-counties').textContent    = counties.size;
    document.getElementById('stat-best').textContent        = best ?? '—';
    document.getElementById('stat-avg').textContent         = avg ?? '—';

    // Top counties
    const countyMap = {};
    playedCourses.forEach(c => {
      if (!c.county) return;
      countyMap[c.county] = (countyMap[c.county] || 0) + 1;
    });

    // Total courses per county from full dataset
    const countyTotals = {};
    COURSES_DATA.data.forEach(c => {
      if (!c.county) return;
      countyTotals[c.county] = (countyTotals[c.county] || 0) + 1;
    });

    const sorted = Object.entries(countyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const countyList = document.getElementById('county-list');
    if (!sorted.length) {
      countyList.innerHTML = '<p style="color:var(--grey-400);font-size:14px;padding:16px 0;">No counties yet</p>';
      return;
    }

    countyList.innerHTML = sorted.map(([name, count]) => {
      const total = countyTotals[name] || 1;
      const pct   = Math.round((count / total) * 100);
      return `
        <div class="county-item" data-county="${name}" style="cursor:pointer;">
          <div class="county-badge">${count}</div>
          <div class="county-info">
            <div class="county-name-row">
              <span class="county-name">${name}</span>
              <span class="county-pct">${pct}%</span>
            </div>
            <div class="county-bar-track">
              <div class="county-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--grey-400);flex-shrink:0;">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>`;
    }).join('');

    countyList.querySelectorAll('.county-item').forEach(item => {
      item.addEventListener('click', () => openCountySheet(item.dataset.county));
    });
  }

  // ─── COUNTY SHEET ─────────────────────────────────────────────────────────
  function openCountySheet(countyName) {
    const overlay  = document.getElementById('county-overlay');
    const sheet    = document.getElementById('county-sheet');
    const title    = document.getElementById('county-sheet-title');
    const statsCtn = document.getElementById('county-sheet-stats');
    const list     = document.getElementById('county-sheet-list');

    const playedIds     = DB.Played.getAll();
    const allInCounty   = COURSES_DATA.data.filter(c => c.county === countyName);
    const playedInCounty = allInCounty.filter(c => playedIds.includes(c.id));
    const pct = allInCounty.length ? Math.round((playedInCounty.length / allInCounty.length) * 100) : 0;

    title.textContent = countyName;

    statsCtn.innerHTML = `
      <div class="county-sheet-stat">
        <span class="county-sheet-stat-num">${playedInCounty.length}</span>
        <span class="county-sheet-stat-label">Played</span>
      </div>
      <div class="county-sheet-stat">
        <span class="county-sheet-stat-num">${allInCounty.length}</span>
        <span class="county-sheet-stat-label">Total</span>
      </div>
      <div class="county-sheet-stat">
        <span class="county-sheet-stat-num">${pct}%</span>
        <span class="county-sheet-stat-label">Complete</span>
      </div>
    `;

    const sorted = [...allInCounty].sort((a, b) => {
      const ap = playedIds.includes(a.id) ? 0 : 1;
      const bp = playedIds.includes(b.id) ? 0 : 1;
      return ap - bp || a.name.localeCompare(b.name);
    });

    list.innerHTML = sorted.map(c => {
      const played = playedIds.includes(c.id);
      const tick   = played
        ? `<svg class="county-course-tick" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
             <polyline points="20 6 9 17 4 12"/>
           </svg>`
        : '';
      return `
        <a href="course.html?id=${c.id}" class="county-course-item ${played ? 'played' : ''}">
          <div class="county-course-info">
            <span class="county-course-name">${c.name}</span>
            ${c.courseType ? `<span class="county-course-type">${c.courseType}</span>` : ''}
          </div>
          ${tick}
        </a>`;
    }).join('');

    const countySheetCtrl = new Sheet('county-sheet', 'county-overlay');
    countySheetCtrl.open();

    function closeSheet() {
      countySheetCtrl.close();
    }

    document.getElementById('county-sheet-close').onclick = closeSheet;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pageshow', e => {
    if (e.persisted) init();
  });

})();