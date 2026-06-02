// Green PWA | Page — profile

const ProfilePage = (() => {

  const PROFILE_KEY = 'green_profile';

  function loadProfile() {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  function saveProfile(data) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  }

  function render() {
    const profile       = loadProfile();
    const playedIds     = DB.Played.getAll();
    const rounds        = DB.Rounds.getAll();
    const scores        = rounds.map(r => r.score).filter(s => s !== null);
    const best          = scores.length ? Math.min(...scores) : null;
    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties      = new Set(playedCourses.map(c => c.county).filter(Boolean));

    document.getElementById('profile-name').textContent      = profile.name       || 'Your Name';
    document.getElementById('profile-handle').textContent    = profile.handle     || '';
    document.getElementById('stat-courses').textContent      = playedIds.length;
    document.getElementById('stat-counties').textContent     = counties.size;
    document.getElementById('detail-home-course').textContent = profile.homeCourse || '—';
    document.getElementById('detail-handicap').textContent    = profile.handicap   ?? '—';
    document.getElementById('detail-best-score').textContent  = best               ?? '—';
  }

  // ─── HANDLE VALIDATION ───────────────────────────────────────────────────
  function sanitiseHandle(raw) {
    return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
  }

  function validateHandle(handle) {
    if (!handle) return 'Handle is required';
    if (handle.length < 3) return 'Handle must be at least 3 characters';
    if (!/^[a-z0-9_]+$/.test(handle)) return 'Only letters, numbers and underscores';
    return null;
  }

  // ─── HOME COURSE SEARCH ──────────────────────────────────────────────────
  let selectedHomeCourse = '';

  function bindCourseSearch() {
    const input   = document.getElementById('input-home-course');
    const results = document.getElementById('home-course-results');

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      selectedHomeCourse = '';
      if (q.length < 2) {
        results.classList.add('hidden');
        results.innerHTML = '';
        return;
      }
      const matches = COURSES_DATA.data
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 6);

      if (!matches.length) {
        results.classList.add('hidden');
        return;
      }
      results.innerHTML = matches.map(c => `
        <div class="course-result-item" data-name="${c.name}">
          <span class="course-result-name">${c.name}</span>
          <span class="course-result-location">${c.city || ''}${c.city && c.county ? ', ' : ''}${c.county || ''}</span>
        </div>
      `).join('');
      results.classList.remove('hidden');

      results.querySelectorAll('.course-result-item').forEach(item => {
        item.addEventListener('click', () => {
          selectedHomeCourse = item.dataset.name;
          input.value = selectedHomeCourse;
          results.classList.add('hidden');
          results.innerHTML = '';
        });
      });
    });
  }

  // ─── MODAL ───────────────────────────────────────────────────────────────
  function openModal() {
    const profile = loadProfile();
    const handleInput = document.getElementById('input-handle');
    document.getElementById('input-name').value        = profile.name       || '';
    handleInput.value                                  = profile.handle ? profile.handle.replace('@', '') : '';
    document.getElementById('input-home-course').value = profile.homeCourse || '';
    document.getElementById('input-handicap').value    = profile.handicap   ?? '';
    selectedHomeCourse = profile.homeCourse || '';

    // clear any previous error
    const err = document.getElementById('handle-error');
    if (err) err.textContent = '';

    document.getElementById('edit-modal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('home-course-results').classList.add('hidden');
  }

  function saveModal() {
    const rawHandle = document.getElementById('input-handle').value.trim();
    const handle    = sanitiseHandle(rawHandle);
    const error     = validateHandle(handle);
    const errEl     = document.getElementById('handle-error');

    if (error) {
      errEl.textContent = error;
      return;
    }
    errEl.textContent = '';

    const homeCourse = selectedHomeCourse || document.getElementById('input-home-course').value.trim();

    const data = {
      name:       document.getElementById('input-name').value.trim(),
      handle:     '@' + handle,
      homeCourse,
      handicap:   document.getElementById('input-handicap').value.trim(),
    };
    saveProfile(data);
    closeModal();
    render();
  }

  function init() {
    render();
    bindCourseSearch();
    document.getElementById('edit-profile-btn').addEventListener('click', openModal);
    document.getElementById('edit-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('edit-save-btn').addEventListener('click', saveModal);
    document.getElementById('edit-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('edit-modal')) closeModal();
    });

    // sanitise handle as user types
    document.getElementById('input-handle').addEventListener('input', e => {
      const pos = e.target.selectionStart;
      e.target.value = sanitiseHandle(e.target.value);
      e.target.setSelectionRange(pos, pos);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();