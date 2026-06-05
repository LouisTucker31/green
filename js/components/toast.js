// Green PWA | Component — toast notification display

const Toast = (() => {

  // ─── INJECT STYLES ───────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .achievement-toast {
      position: fixed;
      top: -120px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 32px);
      max-width: 400px;
      background: var(--green-800);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      transition: top 0.4s cubic-bezier(0.32, 0.72, 0, 1);
      cursor: pointer;
    }

    .achievement-toast.visible {
      top: 16px;
    }

    .achievement-toast-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--green-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .achievement-toast-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .achievement-toast-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--green-400);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .achievement-toast-title {
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
    }

    .achievement-toast-close {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.7);
      flex-shrink: 0;
      border: none;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  let toastQueue = [];
  let isShowing  = false;

  // ─── SHOW A SINGLE TOAST ─────────────────────────────────────────────────
  function showNext() {
    if (isShowing || !toastQueue.length) return;
    isShowing = true;

    const { icon, title } = toastQueue.shift();

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-toast-icon">${icon}</div>
      <div class="achievement-toast-body">
        <span class="achievement-toast-label">Achievement Unlocked</span>
        <span class="achievement-toast-title">${title}</span>
      </div>
      <button class="achievement-toast-close" aria-label="Dismiss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    document.body.appendChild(toast);

    // Tap toast → go to achievements
    toast.addEventListener('click', (e) => {
      if (!e.target.closest('.achievement-toast-close')) {
        window.location.href = 'achievements.html';
      }
    });

    // Close button
    toast.querySelector('.achievement-toast-close').addEventListener('click', () => {
      dismiss(toast);
    });

    // Slide in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('visible'));
    });

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => dismiss(toast), 4000);
    toast._timer = timer;

    function dismiss(t) {
      clearTimeout(t._timer);
      t.classList.remove('visible');
      setTimeout(() => {
        t.remove();
        isShowing = false;
        showNext();
      }, 400);
    }
  }

  // ─── PUBLIC: SHOW ACHIEVEMENT ─────────────────────────────────────────────
  function achievement(icon, title) {
    toastQueue.push({ icon, title });
    showNext();
  }

  return { achievement };

})();

// ─── ACHIEVEMENT CHECKER ──────────────────────────────────────────────────
// Call this after any action that could unlock an achievement (e.g. saving a round)
function checkAchievements() {
  const ACHIEVEMENT_DEFS = [
    { id: 'first_course',      icon: '⛳',  title: 'First Step',        check: (s) => s.played >= 1 },
    { id: 'ten_courses',       icon: '🗺️',  title: 'Explorer',          check: (s) => s.played >= 10 },
    { id: 'twentyfive_courses',icon: '🧭',  title: 'Adventurer',        check: (s) => s.played >= 25 },
    { id: 'hundred_courses',   icon: '💯',  title: 'Century',           check: (s) => s.played >= 100 },
    { id: 'twofifty_courses',  icon: '🏆',  title: 'Elite',             check: (s) => s.played >= 250 },
    { id: 'all_courses',       icon: '👑',  title: 'Legend',            check: (s) => s.played >= 2666 },
    { id: 'first_county',      icon: '📍',  title: 'Local Hero',        check: (s) => s.counties >= 1 },
    { id: 'five_counties',     icon: '🚗',  title: 'County Hopper',     check: (s) => s.counties >= 5 },
    { id: 'twenty_counties',   icon: '🇬🇧',  title: 'National Explorer', check: (s) => s.counties >= 20 },
    { id: 'all_counties',      icon: '🌍',  title: 'Grand Tour',        check: (s) => s.counties >= s.totalCounties },
    { id: 'first_score',       icon: '📝',  title: 'First Score',       check: (s) => s.bestScore !== null },
    { id: 'sub_100',           icon: '🎯',  title: 'Below 100',         check: (s) => s.bestScore !== null && s.bestScore < 100 },
    { id: 'sub_90',            icon: '🔥',  title: 'Below 90',          check: (s) => s.bestScore !== null && s.bestScore < 90 },
    { id: 'sub_80',            icon: '⚡',  title: 'Below 80',          check: (s) => s.bestScore !== null && s.bestScore < 80 },
    { id: 'scratch',           icon: '💎',  title: 'Scratch',           check: (s) => s.bestScore !== null && s.bestScore < 72 },
    { id: 'five_rounds',       icon: '📅',  title: 'Keen Golfer',       check: (s) => s.rounds >= 5 },
    { id: 'twentyfive_rounds', icon: '📆',  title: 'Regular',           check: (s) => s.rounds >= 25 },
    { id: 'hundred_rounds',    icon: '🏅',  title: 'Dedicated',         check: (s) => s.rounds >= 100 },
    { id: 'links',             icon: '🌊',  title: 'Links Lover',       check: (s) => s.types.has('links') },
    { id: 'woodland',          icon: '🌲',  title: 'Into the Woods',    check: (s) => s.types.has('woodland') },
    { id: 'heathland',         icon: '🌿',  title: 'High Ground',       check: (s) => s.types.has('heathland') },
    { id: 'clifftop',          icon: '🏔️',  title: 'On the Edge',       check: (s) => s.types.has('clifftop') },
    { id: 'all_types',         icon: '🗺️',  title: 'All Terrain',       check: (s) => s.types.size >= 8 },
  ];

  // Compute current stats
  const playedIds     = DB.Played.getAll();
  const rounds        = DB.Rounds.getAll();
  const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
  const counties      = new Set(playedCourses.map(c => c.county).filter(Boolean));
  const types         = new Set(playedCourses.map(c => c.courseType).filter(Boolean));
  const scores        = rounds.map(r => r.score).filter(s => s !== null);
  const totalCounties = new Set(COURSES_DATA.data.map(c => c.county).filter(Boolean)).size;

  const stats = {
    played: playedIds.length,
    rounds: rounds.length,
    counties: counties.size,
    totalCounties,
    types,
    bestScore: scores.length ? Math.min(...scores) : null,
  };

  // Load already-notified achievements
  const notified = JSON.parse(localStorage.getItem('green_achievements_notified') || '[]');
  const newlyUnlocked = [];

  ACHIEVEMENT_DEFS.forEach(a => {
    if (!notified.includes(a.id) && a.check(stats)) {
      newlyUnlocked.push(a);
      notified.push(a.id);
    }
  });

  // Save updated notified list
  if (newlyUnlocked.length) {
    localStorage.setItem('green_achievements_notified', JSON.stringify(notified));
    newlyUnlocked.forEach(a => Toast.achievement(a.icon, a.title));
  }
}