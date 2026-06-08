// Green PWA | Page — achievements

const AchievementsPage = (() => {

  // ─── ACHIEVEMENT DEFINITIONS ─────────────────────────────────────────────
  const ACHIEVEMENTS = [
    // COURSES PLAYED
    {
      id: 'first_course', section: 'Courses Played',
      title: 'First Step', desc: 'Play your first course',
      icon: '⛳', check: (s) => s.played >= 1,
      progress: (s) => ({ val: Math.min(s.played, 1), max: 1 }),
    },
    {
      id: 'ten_courses', section: 'Courses Played',
      title: 'Explorer', desc: 'Play 10 courses',
      icon: '🗺️', check: (s) => s.played >= 10,
      progress: (s) => ({ val: Math.min(s.played, 10), max: 10 }),
    },
    {
      id: 'twentyfive_courses', section: 'Courses Played',
      title: 'Adventurer', desc: 'Play 25 courses',
      icon: '🧭', check: (s) => s.played >= 25,
      progress: (s) => ({ val: Math.min(s.played, 25), max: 25 }),
    },
    {
      id: 'hundred_courses', section: 'Courses Played',
      title: 'Century', desc: 'Play 100 courses',
      icon: '💯', check: (s) => s.played >= 100,
      progress: (s) => ({ val: Math.min(s.played, 100), max: 100 }),
    },
    {
      id: 'twofifty_courses', section: 'Courses Played',
      title: 'Elite', desc: 'Play 250 courses',
      icon: '🏆', check: (s) => s.played >= 250,
      progress: (s) => ({ val: Math.min(s.played, 250), max: 250 }),
    },
    {
      id: 'all_courses', section: 'Courses Played',
      title: 'Legend', desc: 'Play all 2,666 UK courses',
      icon: '👑', check: (s) => s.played >= 2666,
      progress: (s) => ({ val: Math.min(s.played, 2666), max: 2666 }),
    },

    // COUNTIES
    {
      id: 'first_county', section: 'Counties',
      title: 'Local Hero', desc: 'Play in your first county',
      icon: '📍', check: (s) => s.counties >= 1,
      progress: (s) => ({ val: Math.min(s.counties, 1), max: 1 }),
    },
    {
      id: 'five_counties', section: 'Counties',
      title: 'County Hopper', desc: 'Play in 5 counties',
      icon: '🚗', check: (s) => s.counties >= 5,
      progress: (s) => ({ val: Math.min(s.counties, 5), max: 5 }),
    },
    {
      id: 'twenty_counties', section: 'Counties',
      title: 'National Explorer', desc: 'Play in 20 counties',
      icon: '🇬🇧', check: (s) => s.counties >= 20,
      progress: (s) => ({ val: Math.min(s.counties, 20), max: 20 }),
    },
    {
      id: 'all_counties', section: 'Counties',
      title: 'Grand Tour', desc: 'Play in every county',
      icon: '🌍', check: (s) => s.counties >= s.totalCounties,
      progress: (s) => ({ val: Math.min(s.counties, s.totalCounties), max: s.totalCounties }),
    },

    // SCORES
    {
      id: 'first_score', section: 'Scores',
      title: 'First Score', desc: 'Log your first score',
      icon: '📝', check: (s) => s.bestScore !== null,
      progress: (s) => ({ val: s.bestScore !== null ? 1 : 0, max: 1 }),
    },
    {
      id: 'sub_100', section: 'Scores',
      title: 'Sub 100', desc: 'Shoot under 100',
      icon: '🎯', check: (s) => s.bestScore !== null && s.bestScore < 100,
      progress: (s) => ({ val: s.bestScore !== null && s.bestScore < 100 ? 1 : 0, max: 1 }),
    },
    {
      id: 'sub_90', section: 'Scores',
      title: 'Sub 90', desc: 'Shoot under 90',
      icon: '🔥', check: (s) => s.bestScore !== null && s.bestScore < 90,
      progress: (s) => ({ val: s.bestScore !== null && s.bestScore < 90 ? 1 : 0, max: 1 }),
    },
    {
      id: 'sub_80', section: 'Scores',
      title: 'Sub 80', desc: 'Shoot under 80',
      icon: '⚡', check: (s) => s.bestScore !== null && s.bestScore < 80,
      progress: (s) => ({ val: s.bestScore !== null && s.bestScore < 80 ? 1 : 0, max: 1 }),
    },
    {
      id: 'scratch', section: 'Scores',
      title: 'Scratch', desc: 'Shoot under 72',
      icon: '💎', check: (s) => s.bestScore !== null && s.bestScore < 72,
      progress: (s) => ({ val: s.bestScore !== null && s.bestScore < 72 ? 1 : 0, max: 1 }),
    },

    // ROUNDS
    {
      id: 'five_rounds', section: 'Rounds',
      title: 'Keen Golfer', desc: 'Log 5 rounds',
      icon: '📅', check: (s) => s.rounds >= 5,
      progress: (s) => ({ val: Math.min(s.rounds, 5), max: 5 }),
    },
    {
      id: 'twentyfive_rounds', section: 'Rounds',
      title: 'Regular', desc: 'Log 25 rounds',
      icon: '📆', check: (s) => s.rounds >= 25,
      progress: (s) => ({ val: Math.min(s.rounds, 25), max: 25 }),
    },
    {
      id: 'hundred_rounds', section: 'Rounds',
      title: 'Dedicated', desc: 'Log 100 rounds',
      icon: '🏅', check: (s) => s.rounds >= 100,
      progress: (s) => ({ val: Math.min(s.rounds, 100), max: 100 }),
    },

    // COURSE TYPES
    {
      id: 'links', section: 'Course Types',
      title: 'Links Lover', desc: 'Play a links course',
      icon: '🌊', check: (s) => s.types.has('links'),
      progress: (s) => ({ val: s.types.has('links') ? 1 : 0, max: 1 }),
    },
    {
      id: 'woodland', section: 'Course Types',
      title: 'Into the Woods', desc: 'Play a woodland course',
      icon: '🌲', check: (s) => s.types.has('woodland'),
      progress: (s) => ({ val: s.types.has('woodland') ? 1 : 0, max: 1 }),
    },
    {
      id: 'heathland', section: 'Course Types',
      title: 'High Ground', desc: 'Play a heathland course',
      icon: '🌿', check: (s) => s.types.has('heathland'),
      progress: (s) => ({ val: s.types.has('heathland') ? 1 : 0, max: 1 }),
    },
    {
      id: 'clifftop', section: 'Course Types',
      title: 'On the Edge', desc: 'Play a clifftop course',
      icon: '🏔️', check: (s) => s.types.has('clifftop'),
      progress: (s) => ({ val: s.types.has('clifftop') ? 1 : 0, max: 1 }),
    },
    {
      id: 'all_types', section: 'Course Types',
      title: 'All Terrain', desc: 'Play all 8 course types',
      icon: '🗺️', check: (s) => s.types.size >= 8,
      progress: (s) => ({ val: Math.min(s.types.size, 8), max: 8 }),
    },

    // SOCIAL
    {
      id: 'first_follower', section: 'Social',
      title: 'First Follower', desc: 'Coming soon',
      icon: '👥', check: () => false, comingSoon: true,
      progress: () => ({ val: 0, max: 1 }),
    },
    {
      id: 'popular', section: 'Social',
      title: 'Popular', desc: 'Coming soon',
      icon: '⭐', check: () => false, comingSoon: true,
      progress: () => ({ val: 0, max: 1 }),
    },
    {
      id: 'influencer', section: 'Social',
      title: 'Influencer', desc: 'Coming soon',
      icon: '📣', check: () => false, comingSoon: true,
      progress: () => ({ val: 0, max: 1 }),
    },
  ];

  // ─── COMPUTE STATS ───────────────────────────────────────────────────────
  function computeStats() {
    const playedIds     = DB.Played.getAll();
    const rounds        = DB.Rounds.getAll();
    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties      = new Set(playedCourses.map(c => c.county).filter(Boolean));
    const types         = new Set(playedCourses.map(c => c.courseType).filter(Boolean));
    const scores        = rounds.map(r => r.score).filter(s => s !== null);
    const bestScore     = scores.length ? Math.min(...scores) : null;
    const totalCounties = new Set(COURSES_DATA.data.map(c => c.county).filter(Boolean)).size;

    return {
      played: playedIds.length,
      rounds: rounds.length,
      counties: counties.size,
      totalCounties,
      types,
      bestScore,
    };
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  function render() {
    const stats = computeStats();

    // ─── RECENTLY EARNED STRIP ───────────────────────────────────────────
    let everEarned = [];
    try { everEarned = JSON.parse(localStorage.getItem('green_achievements_notified') || '[]'); } catch { everEarned = []; }
    const earned = ACHIEVEMENTS.filter(a => !a.comingSoon && (a.check(stats) || everEarned.includes(a.id)));
    const recentEl = document.getElementById('recently-earned');

    if (earned.length) {
      recentEl.classList.remove('hidden');
      recentEl.innerHTML = `
        <div class="recently-earned-title">Earned</div>
        <div class="recently-earned-strip">
          ${earned.map(a => `
            <div class="earned-chip">
              <div class="earned-chip-icon">${a.icon}</div>
              <span class="earned-chip-title">${a.title}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      recentEl.classList.add('hidden');
    }

    // ─── SUMMARY ─────────────────────────────────────────────────────────
    const total = ACHIEVEMENTS.filter(a => !a.comingSoon).length;
    document.getElementById('achievements-summary').textContent = `${earned.length} / ${total}`;

    // ─── SECTIONS ────────────────────────────────────────────────────────
    const sections = {};
    ACHIEVEMENTS.forEach(a => {
      if (!sections[a.section]) sections[a.section] = [];
      sections[a.section].push(a);
    });

    const list = document.getElementById('achievements-list');
    list.innerHTML = Object.entries(sections).map(([sectionName, items]) => {
      const sectionEarned = items.filter(a => !a.comingSoon && (a.check(stats) || everEarned.includes(a.id))).length;
      const sectionTotal  = items.filter(a => !a.comingSoon).length;
      const hasProgress   = items.some(a => {
        if (a.comingSoon || a.check(stats)) return false;
        const p = a.progress(stats);
        return p.val > 0;
      });

      // Auto-expand if section has progress or any earned
      const autoExpand = sectionEarned > 0 || hasProgress;

      // Sort: unlocked first, then in-progress, then locked, then coming soon
      const sorted = [...items].sort((a, b) => {
        const aEarned = !a.comingSoon && (a.check(stats) || everEarned.includes(a.id));
        const bEarned = !b.comingSoon && b.check(stats);
        const aProgress = !a.comingSoon && !aEarned && a.progress(stats).val > 0;
        const bProgress = !b.comingSoon && !bEarned && b.progress(stats).val > 0;
        const aScore = aEarned ? 0 : aProgress ? 1 : a.comingSoon ? 3 : 2;
        const bScore = bEarned ? 0 : bProgress ? 1 : b.comingSoon ? 3 : 2;
        return aScore - bScore;
      });

      const cardsHTML = sorted.map((a, i) => {
        const isEarned   = !a.comingSoon && (a.check(stats) || everEarned.includes(a.id));
        const prog       = a.progress(stats);
        const pct        = prog.max > 0 ? Math.round((prog.val / prog.max) * 100) : 0;
        const stateClass = a.comingSoon ? 'coming-soon' : isEarned ? 'unlocked' : 'locked';
        const showProgress = !isEarned && !a.comingSoon && prog.max > 1;
        const isLast     = i === sorted.length - 1;

        return `
          ${i > 0 ? '<div class="achievement-section-divider"></div>' : ''}
          <div class="achievement-card ${stateClass}">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-info">
              <span class="achievement-title">${a.title}</span>
              <span class="achievement-desc">${a.comingSoon ? 'Coming soon' : a.desc}</span>
              ${showProgress ? `
                <div class="achievement-progress">
                  <div class="achievement-progress-bar">
                    <div class="achievement-progress-fill" style="width:${pct}%"></div>
                  </div>
                  <span class="achievement-progress-label">${prog.val} / ${prog.max}</span>
                </div>` : ''}
            </div>
            <div class="achievement-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isEarned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="achievement-section ${autoExpand ? 'expanded' : ''}">
          <div class="achievement-section-header">
            <div class="achievement-section-left">
              <span class="achievement-section-title">${sectionName}</span>
              <span class="achievement-section-count">${sectionEarned} / ${sectionTotal}</span>
            </div>
            <svg class="achievement-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          <div class="achievement-section-body">
            ${cardsHTML}
          </div>
        </div>`;
    }).join('');

    // ─── COLLAPSE/EXPAND ─────────────────────────────────────────────────
    list.querySelectorAll('.achievement-section-header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.achievement-section').classList.toggle('expanded');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  window.addEventListener('pageshow', e => {
    if (e.persisted) render();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') render();
  });

})();