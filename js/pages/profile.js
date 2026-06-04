// Green PWA | Page — profile

const ProfilePage = (() => {

  function renderAvatar(profile) {
    const placeholder = document.getElementById('avatar-placeholder');
    const img         = document.getElementById('avatar-img');
    if (profile.avatar) {
      img.src = profile.avatar;
      img.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      img.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
  }

  function bindAvatar() {
    const wrap      = document.getElementById('avatar-wrap');
    const input     = document.getElementById('avatar-input');
    const overlay   = document.getElementById('avatar-overlay');
    const sheet     = document.getElementById('avatar-sheet');
    const changeBtn = document.getElementById('avatar-change-btn');
    const removeBtn = document.getElementById('avatar-remove-btn');

    function openSheet() {
      overlay.classList.remove('hidden');
      sheet.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.add('visible');
          sheet.classList.add('visible');
        });
      });
    }

    function closeSheet() {
      overlay.classList.remove('visible');
      sheet.classList.remove('visible');
      setTimeout(() => {
        overlay.classList.add('hidden');
        sheet.classList.add('hidden');
      }, 350);
    }

    function processFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size   = 200;
          canvas.width  = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const min = Math.min(img.width, img.height);
          const sx  = (img.width  - min) / 2;
          const sy  = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          DB.Profile.save({ avatar: base64 });
          renderAvatar(DB.Profile.get());
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    wrap.addEventListener('click', () => {
      openSheet();
    });

    overlay.addEventListener('click', closeSheet);

    changeBtn.addEventListener('click', () => {
      closeSheet();
      input.click();
    });

    removeBtn.addEventListener('click', () => {
      closeSheet();
      DB.Profile.save({ avatar: null });
      renderAvatar(DB.Profile.get());
    });

    input.addEventListener('change', () => {
      processFile(input.files[0]);
      input.value = '';
    });
  }

  function render() {
    const profile       = DB.Profile.get();
    const playedIds     = DB.Played.getAll();
    const rounds        = DB.Rounds.getAll();
    const scores        = rounds.map(r => r.score).filter(s => s !== null);
    const best          = scores.length ? Math.min(...scores) : null;
    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties      = new Set(playedCourses.map(c => c.county).filter(Boolean));

    renderAvatar(profile);
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
    const profile = DB.Profile.get();
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
    DB.Profile.save(data);
    closeModal();
    render();
  }

  function init() {
    render();
    bindAvatar();
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