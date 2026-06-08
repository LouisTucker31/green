// Green PWA | Page — profile

const ProfilePage = (() => {

  // ─── AVATAR ──────────────────────────────────────────────────────────────

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
    const input     = document.getElementById('avatar-input');
    const changeBtn = document.getElementById('avatar-change-btn');
    const removeBtn = document.getElementById('avatar-remove-btn');

    const avatarSheetCtrl = new Sheet('avatar-sheet', 'avatar-overlay');

    document.getElementById('avatar-wrap').addEventListener('click', () => avatarSheetCtrl.open());

    changeBtn.addEventListener('click', () => {
      avatarSheetCtrl.close();
      setTimeout(() => input.click(), 370);
    });

    removeBtn.addEventListener('click', () => {
      avatarSheetCtrl.close();
      DB.Profile.save({ avatar: null });
      renderAvatar(DB.Profile.get());
    });

    input.addEventListener('change', () => {
      if (input.files[0]) {
        processFile(input.files[0], () => {
          setTimeout(() => avatarSheetCtrl.close(), 100);
        });
      }
      input.value = '';
    });
  }

  // ─── CROP ────────────────────────────────────────────────────────────────

  let _cropImg    = null;
  let _cropX      = 0;
  let _cropY      = 0;
  let _cropScale  = 1;
  let _cropCanvas = null;
  let _cropCtx    = null;
  let _stageW     = 0;
  let _stageH     = 0;
  const CROP_SIZE = 280;

  function processFile(file, onComplete) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => openCrop(img, onComplete);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function openCrop(img, onComplete) {
    _cropImg    = img;
    _cropCanvas = document.getElementById('crop-canvas');
    _cropCtx    = _cropCanvas.getContext('2d');

    document.getElementById('crop-overlay').classList.remove('hidden');

    requestAnimationFrame(() => {
      const stage = document.getElementById('crop-stage');
      _stageW     = stage.offsetWidth;
      _stageH     = stage.offsetHeight;

      _cropCanvas.width  = _stageW;
      _cropCanvas.height = _stageH;

      const minSide = Math.min(img.width, img.height);
      _cropScale    = CROP_SIZE / minSide;

      _cropX = (_stageW - img.width  * _cropScale) / 2;
      _cropY = (_stageH - img.height * _cropScale) / 2;

      clampCrop();
      drawCrop();
      bindCropEvents();
    });
  }

  function drawCrop() {
    _cropCtx.clearRect(0, 0, _cropCanvas.width, _cropCanvas.height);
    _cropCtx.drawImage(_cropImg, _cropX, _cropY,
      _cropImg.width * _cropScale, _cropImg.height * _cropScale);
  }

  function clampCrop() {
    const iw    = _cropImg.width  * _cropScale;
    const ih    = _cropImg.height * _cropScale;
    const frameL = (_stageW - CROP_SIZE) / 2;
    const frameT = (_stageH - CROP_SIZE) / 2;
    if (_cropX > frameL)                _cropX = frameL;
    if (_cropY > frameT)                _cropY = frameT;
    if (_cropX + iw < frameL + CROP_SIZE) _cropX = frameL + CROP_SIZE - iw;
    if (_cropY + ih < frameT + CROP_SIZE) _cropY = frameT + CROP_SIZE - ih;
  }

  function bindCropEvents() {
    const canvas = _cropCanvas;

    // Mouse drag
    let dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      _cropX += e.clientX - lastX; _cropY += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      clampCrop(); drawCrop();
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    // Touch drag + pinch
    let lastTouches = [];
    canvas.addEventListener('touchstart', e => { e.preventDefault(); lastTouches = Array.from(e.touches); }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const touches = Array.from(e.touches);
      if (touches.length === 1 && lastTouches.length === 1) {
        _cropX += touches[0].clientX - lastTouches[0].clientX;
        _cropY += touches[0].clientY - lastTouches[0].clientY;
      } else if (touches.length === 2 && lastTouches.length >= 1) {
        const prevDist = Math.hypot(
          lastTouches[0].clientX - (lastTouches[1]?.clientX ?? lastTouches[0].clientX),
          lastTouches[0].clientY - (lastTouches[1]?.clientY ?? lastTouches[0].clientY)
        );
        const newDist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
        if (prevDist > 0) {
          const ratio    = newDist / prevDist;
          const midX     = (touches[0].clientX + touches[1].clientX) / 2;
          const midY     = (touches[0].clientY + touches[1].clientY) / 2;
          const newScale = Math.max(CROP_SIZE / Math.min(_cropImg.width, _cropImg.height), Math.min(_cropScale * ratio, 4));
          _cropX = midX - (midX - _cropX) * (newScale / _cropScale);
          _cropY = midY - (midY - _cropY) * (newScale / _cropScale);
          _cropScale = newScale;
        }
      }
      lastTouches = touches;
      clampCrop(); drawCrop();
    }, { passive: false });
    canvas.addEventListener('touchend', e => { lastTouches = Array.from(e.touches); });

    document.getElementById('crop-cancel-btn').onclick = closeCrop;
    document.getElementById('crop-use-btn').onclick    = () => { commitCrop(); if (onComplete) onComplete(); };
  }

  function closeCrop() {
    document.getElementById('crop-overlay').classList.add('hidden');
    _cropImg = null;
  }

  function commitCrop() {
    const frameL  = (_stageW - CROP_SIZE) / 2;
    const frameT  = (_stageH - CROP_SIZE) / 2;
    const output  = document.createElement('canvas');
    output.width  = 200;
    output.height = 200;
    const ctx = output.getContext('2d');
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(_cropCanvas, frameL, frameT, CROP_SIZE, CROP_SIZE, 0, 0, 200, 200);
    DB.Profile.save({ avatar: output.toDataURL('image/jpeg', 0.85) });
    renderAvatar(DB.Profile.get());
    closeCrop();
    avatarSheetCtrl.close();
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  function render() {
    const profile       = DB.Profile.get();
    const playedIds     = DB.Played.getAll();
    const rounds        = DB.Rounds.getAll();
    const posts         = DB.Posts.getAll();
    const scores        = rounds.map(r => r.score).filter(s => s !== null);
    const best          = scores.length ? Math.min(...scores) : null;
    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties      = new Set(playedCourses.map(c => c.county).filter(Boolean));

    renderAvatar(profile);

    const name = profile.name || 'Your Name';
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-handle').textContent       = profile.handle || '';
    document.getElementById('profile-handicap-display').textContent =
      profile.handicap ? `Handicap ${profile.handicap}` : '';

    document.getElementById('stat-courses').textContent   = playedIds.length;
    document.getElementById('stat-posts').textContent     = posts.length;
    document.getElementById('stat-following').textContent = DB.Following.getAll().length;

    document.getElementById('detail-home-course').textContent = profile.homeCourse || '—';
    document.getElementById('detail-handicap').textContent    = profile.handicap   ?? '—';
    document.getElementById('detail-best-score').textContent  = best               ?? '—';

    renderPostsGrid(posts);
  }

  function renderPostsGrid(posts) {
    const grid  = document.getElementById('profile-posts-grid');
    const empty = document.getElementById('profile-posts-empty');

    if (!posts.length) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    const sorted = [...posts].sort((a, b) => b.createdAt - a.createdAt);
    grid.innerHTML = sorted.map(p => {
      const thumb = p.photos && p.photos.length
        ? `<img src="${p.photos[0]}" alt="${p.courseName}" />`
        : `<div class="profile-post-thumb-placeholder">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
               <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
               <line x1="4" y1="22" x2="4" y2="15"/>
             </svg>
           </div>`;
      return `<a class="profile-post-thumb" href="post.html?id=${p.id}">${thumb}</a>`;
    }).join('');
  }

  // ─── TABS ────────────────────────────────────────────────────────────────

  function bindFollowing() {
    const sheetCtrl = new Sheet('following-sheet', 'following-overlay');

    document.getElementById('stat-following-item').addEventListener('click', () => {
      renderFollowingList();
      sheetCtrl.open();
    });

    document.getElementById('following-close').addEventListener('click', () => sheetCtrl.close());
  }

  function renderFollowingList() {
    const handles = DB.Following.getAll();
    const list    = document.getElementById('following-list');

    if (!handles.length) {
      list.innerHTML = `
        <div class="following-empty">
          <p>You're not following anyone yet.</p>
          <a href="feed.html?tab=discover" class="btn-primary" style="display:inline-block;margin-top:16px;padding:10px 24px;background:var(--green-700);color:white;border-radius:var(--radius-xl);font-size:14px;font-weight:500;">Find people</a>
        </div>`;
      return;
    }

    list.innerHTML = handles.map(handle => `
      <div class="following-item">
        <div class="following-item-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="following-item-info">
          <span class="following-item-handle">${escapeHTML(handle)}</span>
        </div>
        <button class="unfollow-btn" data-handle="${escapeHTML(handle)}">Unfollow</button>
      </div>`).join('');

    list.querySelectorAll('.unfollow-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        DB.Following.remove(btn.dataset.handle);
        document.getElementById('stat-following').textContent = DB.Following.getAll().length;
        renderFollowingList();
      });
    });
  }

  let _passportRendered = false;

  function bindTabs() {
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const which = tab.dataset.tab;

        document.getElementById('profile-posts-grid').classList.toggle('hidden', which !== 'posts');
        document.getElementById('profile-posts-empty').classList.toggle('hidden', true);
        document.getElementById('profile-info-panel').classList.toggle('hidden', which !== 'info');
        document.getElementById('profile-passport-panel').classList.toggle('hidden', which !== 'passport');

        if (which === 'posts') {
          const posts = DB.Posts.getAll();
          if (!posts.length) document.getElementById('profile-posts-empty').classList.remove('hidden');
        }

        if (which === 'passport' && !_passportRendered) {
          _passportRendered = true;
          PassportPage.renderAll({ prefix: 'pp-' });
        }
      });
    });
  }

  // ─── EDIT MODAL ──────────────────────────────────────────────────────────

  let selectedHomeCourse = '';

  const editSheetCtrl = new Sheet('edit-modal', 'edit-modal-overlay');

  function openModal() {
    const profile = DB.Profile.get();
    document.getElementById('input-name').value        = profile.name       || '';
    document.getElementById('input-handle').value      = profile.handle ? profile.handle.replace('@', '') : '';
    document.getElementById('input-home-course').value = profile.homeCourse || '';
    document.getElementById('input-handicap').value    = profile.handicap   ?? '';
    selectedHomeCourse = profile.homeCourse || '';
    const err = document.getElementById('handle-error');
    if (err) err.textContent = '';
    editSheetCtrl.open();
  }

  function closeModal() {
    editSheetCtrl.close();
    setTimeout(() => document.getElementById('home-course-results').classList.add('hidden'), 350);
  }

  function saveModal() {
    const rawHandle = document.getElementById('input-handle').value.trim();
    const handle    = sanitiseHandle(rawHandle);
    const error     = validateHandle(handle);
    const errEl     = document.getElementById('handle-error');
    if (error) { errEl.textContent = error; return; }
    errEl.textContent = '';

    const homeCourse = selectedHomeCourse || document.getElementById('input-home-course').value.trim();
    DB.Profile.save({
      name:       document.getElementById('input-name').value.trim(),
      handle:     '@' + handle,
      homeCourse,
      handicap:   document.getElementById('input-handicap').value.trim(),
    });
    closeModal();
    render();
  }

  function bindCourseSearch() {
    const input   = document.getElementById('input-home-course');
    const results = document.getElementById('home-course-results');

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      selectedHomeCourse = '';
      if (q.length < 2) { results.classList.add('hidden'); results.innerHTML = ''; return; }
      const matches = COURSES_DATA.data.filter(c => c.name.toLowerCase().includes(q)).slice(0, 6);
      if (!matches.length) { results.classList.add('hidden'); return; }
      results.innerHTML = matches.map(c => `
        <div class="course-result-item" data-name="${c.name}">
          <span class="course-result-name">${c.name}</span>
          <span class="course-result-location">${c.city || ''}${c.city && c.county ? ', ' : ''}${c.county || ''}</span>
        </div>`).join('');
      results.classList.remove('hidden');
      results.querySelectorAll('.course-result-item').forEach(item => {
        item.addEventListener('click', () => {
          selectedHomeCourse = item.dataset.name;
          input.value = selectedHomeCourse;
          results.classList.add('hidden');
        });
      });
    });
  }

  function sanitiseHandle(raw) { return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30); }
  function validateHandle(handle) {
    if (!handle) return 'Handle is required';
    if (handle.length < 3) return 'Handle must be at least 3 characters';
    if (!/^[a-z0-9_]+$/.test(handle)) return 'Only letters, numbers and underscores';
    return null;
  }

  // ─── INIT ────────────────────────────────────────────────────────────────

  function init() {
    render();
    bindAvatar();
    bindTabs();
    bindCourseSearch();
    bindFollowing();
    document.getElementById('edit-profile-btn').addEventListener('click', openModal);
    document.getElementById('edit-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('edit-save-btn').addEventListener('click', saveModal);
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

  window.addEventListener('pageshow', e => {
    if (e.persisted) render();
  });

})();