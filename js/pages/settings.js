// Green PWA | Page — settings

const SettingsPage = (() => {

  function init() {
    const s = DB.Settings.get();

    // ─── UNITS ───────────────────────────────────────────────
    const yardsBtn  = document.getElementById('units-yards');
    const metresBtn = document.getElementById('units-metres');

    function setUnits(unit) {
      DB.Settings.save({ units: unit });
      yardsBtn.classList.toggle('active', unit === 'yards');
      metresBtn.classList.toggle('active', unit === 'metres');
    }

    setUnits(s.units);
    yardsBtn.addEventListener('click', () => setUnits('yards'));
    metresBtn.addEventListener('click', () => setUnits('metres'));

    // ─── TOGGLES ─────────────────────────────────────────────
    const toggles = [
      { id: 'notif-rounds',       key: 'notifications_rounds' },
      { id: 'notif-followers',    key: 'notifications_followers' },
      { id: 'notif-comments',     key: 'notifications_comments' },
      { id: 'notif-weekly',       key: 'notifications_weekly' },
      { id: 'privacy-private',    key: 'privacy_private' },
      { id: 'privacy-handicap',   key: 'privacy_show_handicap' },
      { id: 'privacy-scores',     key: 'privacy_show_scores' },
      { id: 'social-follow',      key: 'social_allow_follow' },
      { id: 'social-leaderboards',key: 'social_leaderboards' },
      { id: 'social-nearby',      key: 'social_nearby' },
    ];

    toggles.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = !!s[key];
      el.addEventListener('change', () => {
        DB.Settings.save({ [key]: el.checked });
      });
    });

    // ─── CLEAR DATA ──────────────────────────────────────────
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      if (confirm('This will delete all your rounds, played courses, wishlist and profile data. This cannot be undone.')) {
        localStorage.clear();
        window.location.href = 'index.html';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();