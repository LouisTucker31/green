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
      { id: 'privacy-passport',   key: 'privacy_passport' },
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
    // ─── SIGN OUT ────────────────────────────────────────────
    const signOutRow = document.getElementById('sign-out-row');
    const signOutDivider = document.getElementById('sign-out-divider');
    if (DB.Auth.isLoggedIn()) {
      document.getElementById('sign-out-btn').textContent = 'Log out';
      document.getElementById('sign-out-btn').addEventListener('click', () => {
        if (confirm('Log out of your account?')) {
          DB.Auth.logout();
          window.location.href = 'login.html';
        }
      });
    } else {
      document.getElementById('sign-out-btn').outerHTML = `<a href="login.html" style="color:var(--grey-900);font-size:15px;font-weight:500;text-decoration:none;">Log in</a>`;
    }

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