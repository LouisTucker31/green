// Green PWA | Page — feed

const FeedPage = (() => {

  const MAX_PHOTOS      = 10;
  const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB total across all posts
  let selectedRound  = null;
  let pendingPhotos  = [];
  let activeTab      = 'following';
  let searchActive   = false;

  function init() {
    bindTabs();
    bindNewPost();
    bindEmptyLinks();
    bindDiscover();

    // Handle incoming hashtag from post page caption tap
    const params = new URLSearchParams(window.location.search);
    const tab    = params.get('tab');
    const tag    = params.get('tag');
    if (tab === 'discover') {
      switchTab('discover');
    } else if (tag) {
      switchTab('discover');
      const input    = document.getElementById('discover-search-input');
      const clearBtn = document.getElementById('discover-search-clear');
      input.value    = '#' + tag;
      clearBtn.classList.remove('hidden');
      renderPeopleSearch('#' + tag);
    } else {
      renderFollowing();
    }
  }

  // ─── TABS ────────────────────────────────────────────────────────────────

  function bindTabs() {
    document.getElementById('tab-following').addEventListener('click', () => switchTab('following'));
    document.getElementById('tab-discover').addEventListener('click', () => switchTab('discover'));
  }

  function switchTab(tab) {
    activeTab = tab;
    document.getElementById('tab-following').classList.toggle('active', tab === 'following');
    document.getElementById('tab-discover').classList.toggle('active', tab === 'discover');
    document.getElementById('panel-following').classList.toggle('hidden', tab !== 'following');
    document.getElementById('panel-discover').classList.toggle('hidden', tab === 'following');

    if (tab === 'following') {
      renderFollowing();
    } else {
      renderDiscover();
    }
  }

  // ─── FOLLOWING TAB ───────────────────────────────────────────────────────

  function renderFollowing() {
    const allPosts  = DB.Posts.getAllSorted();
    const profile   = DB.Profile.get();
    const list      = document.getElementById('feed-list');
    const empty     = document.getElementById('feed-empty');

    // Show your own posts + posts from people you follow
    // For now all posts are yours locally; when backend exists filter by handle
    const posts = allPosts;

    if (!posts.length) {
      empty.classList.remove('hidden');
      list.innerHTML = '';
      return;
    }

    empty.classList.add('hidden');
    list.innerHTML = posts.map(p => cardHTML(p, profile)).join('');
    bindCardEvents();
  }

  // ─── DISCOVER TAB ────────────────────────────────────────────────────────

  function renderDiscover() {
    const allPosts = DB.Posts.getAllSorted();
    const profile  = DB.Profile.get();
    const list     = document.getElementById('discover-list');
    const empty    = document.getElementById('discover-empty');

    // For now show all posts (when backend exists, filter to non-followed users)
    if (!allPosts.length) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.innerHTML = allPosts.map(p => cardHTML(p, profile)).join('');
    bindCardEvents('discover-list');
  }

  function bindDiscover() {
    const input    = document.getElementById('discover-search-input');
    const clearBtn = document.getElementById('discover-search-clear');

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearBtn.classList.toggle('hidden', !q);
      if (q.length >= 1) {
        searchActive = true;
        renderPeopleSearch(q);
      } else {
        searchActive = false;
        hidePeopleResults();
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.add('hidden');
      searchActive = false;
      hidePeopleResults();
      input.focus();
    });
  }

  function renderPeopleSearch(query) {
    const q        = query.toLowerCase();
    const profile  = DB.Profile.get();
    const people   = document.getElementById('discover-people');
    const discList = document.getElementById('discover-list');
    const empty    = document.getElementById('discover-empty');

    // Hashtag search — show matching posts
    if (q.startsWith('#')) {
      const tag      = q.slice(1);
      const allPosts = DB.Posts.getAllSorted();
      const matches  = allPosts.filter(p =>
        p.caption && p.caption.toLowerCase().includes('#' + tag)
      );
      people.classList.add('hidden');
      if (!matches.length) {
        discList.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');
      discList.classList.remove('hidden');
      discList.innerHTML = matches.map(p => cardHTML(p, profile)).join('');
      bindCardEvents('discover-list');
      return;
    }

    // People search — for now just your own profile
    // When backend exists this hits an API
    const results = [];
    if (
      (profile.name   && profile.name.toLowerCase().includes(q)) ||
      (profile.handle && profile.handle.toLowerCase().includes(q))
    ) {
      results.push(profile);
    }

    discList.classList.add('hidden');

    if (!results.length) {
      people.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    people.classList.remove('hidden');
    people.innerHTML = results.map(p => peopleResultHTML(p)).join('');

    people.querySelectorAll('.follow-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const handle   = btn.dataset.handle;
        const followed = DB.Following.toggle(handle);
        btn.classList.toggle('following', followed);
        btn.textContent = followed ? 'Following' : 'Follow';
      });
    });
  }

  function hidePeopleResults() {
    document.getElementById('discover-people').classList.add('hidden');
    document.getElementById('discover-list').classList.remove('hidden');
    document.getElementById('discover-empty').classList.add('hidden');
    renderDiscover();
  }

  function peopleResultHTML(profile) {
    const handle    = profile.handle || '';
    const name      = profile.name   || 'Unknown';
    const following = DB.Following.has(handle);
    const courses   = DB.Played.getAll().length;
    const avatar    = profile.avatar
      ? `<img src="${profile.avatar}" alt="Avatar" />`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

    return `
      <a class="people-result-item" href="profile.html">
        <div class="people-result-avatar">${avatar}</div>
        <div class="people-result-info">
          <span class="people-result-name">${escapeHTML(name)}</span>
          ${handle ? `<span class="people-result-handle">${escapeHTML(handle)}</span>` : ''}
          <span class="people-result-meta">${courses} course${courses !== 1 ? 's' : ''} played</span>
        </div>
        <button class="follow-btn ${following ? 'following' : ''}" data-handle="${escapeHTML(handle)}">
          ${following ? 'Following' : 'Follow'}
        </button>
      </a>`;
  }

  // ─── CARD HTML ───────────────────────────────────────────────────────────

  function cardHTML(post, profile) {
    const date     = formatDate(post.date);
    const avatar   = avatarHTML(profile);
    const name     = profile.name   || 'You';
    const handle   = profile.handle || '';
    const caption  = post.caption
      ? `<p class="feed-notes">${parseCaption(truncateWords(post.caption, 60))}</p>`
      : '';
    const photo    = post.photos && post.photos.length
      ? `<div class="feed-card-photo"><img src="${post.photos[0]}" alt="Post photo" /></div>`
      : '';
    const liked    = DB.Likes.has(post.id);
    const likes    = likeCount(post.id);
    const comments = getCommentCount(post.id);

    return `
      <a class="feed-card" data-post-id="${post.id}" href="post.html?id=${post.id}">
        <div class="feed-card-header">
          ${avatar}
          <div class="feed-author">
            <span class="feed-author-name">${escapeHTML(name)}</span>
            ${handle ? `<span class="feed-author-handle">${escapeHTML(handle)}</span>` : ''}
          </div>
          <span class="feed-date">${date}</span>
        </div>
        <div class="feed-card-divider"></div>
        <div class="feed-card-body">
          <div class="feed-card-body-inner">
            <div class="feed-card-body-text">
              <div class="feed-course-row">
                <span class="feed-course-name">${escapeHTML(post.courseName)}</span>
              </div>
              ${caption}
            </div>
            ${photo}
          </div>
        </div>
        <div class="feed-card-actions">
          <button class="feed-action-btn feed-like-btn ${liked ? 'liked' : ''}" data-post-id="${post.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${liked ? 'var(--green-700)' : 'none'}" stroke="${liked ? 'var(--green-700)' : 'currentColor'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            ${likes > 0 ? `<span class="feed-like-count">${likes}</span>` : ''}
          </button>
          <button class="feed-action-btn feed-comment-btn" data-post-id="${post.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            ${comments > 0 ? `<span>${comments}</span>` : ''}
          </button>
          <button class="feed-action-btn feed-share-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </a>`;
  }

  // ─── NEW POST FLOW ───────────────────────────────────────────────────────

  function bindNewPost() {
    document.getElementById('feed-new-btn').addEventListener('click', openPicker);
    document.getElementById('picker-close').addEventListener('click', closePicker);
    document.getElementById('compose-cancel').addEventListener('click', closeCompose);
    document.getElementById('compose-post-btn').addEventListener('click', submitPost);
    document.getElementById('compose-add-photo-btn').addEventListener('click', () => {
      document.getElementById('compose-photo-input').click();
    });
    document.getElementById('compose-photo-input').addEventListener('change', onPhotosSelected);
  }

  function bindEmptyLinks() {
    const postLink     = document.getElementById('feed-new-post-empty');
    const discoverLink = document.getElementById('feed-discover-link');
    if (postLink)     postLink.addEventListener('click', openPicker);
    if (discoverLink) discoverLink.addEventListener('click', () => switchTab('discover'));
  }

  // ─── PICKER SHEET ────────────────────────────────────────────────────────

  const pickerSheet = new Sheet('picker-sheet', 'picker-overlay');

  function openPicker() {
    const rounds = DB.Rounds.getAllSorted();
    const list   = document.getElementById('picker-list');

    const unpostedRounds = rounds.filter(r => !DB.Posts.getByRoundId(r.id));

    if (!unpostedRounds.length) {
      list.innerHTML = `<p class="picker-empty">No rounds available to post.<br>Head to a course to log one first.</p>`;
    } else {
      list.innerHTML = unpostedRounds.map(r => pickerItemHTML(r)).join('');
      list.querySelectorAll('.picker-item').forEach(item => {
        item.addEventListener('click', () => {
          const roundId = item.dataset.roundId;
          const round   = unpostedRounds.find(r => r.id === roundId);
          closePicker();
          setTimeout(() => openCompose(round), 370);
        });
      });
    }

    pickerSheet.open();
  }

  function closePicker() {
    pickerSheet.close();
  }

  function pickerItemHTML(round) {
    const date = formatDate(round.date);
    return `
      <div class="picker-item" data-round-id="${round.id}">
        <div>
          <div class="picker-item-course">${escapeHTML(round.courseName)}</div>
          <div class="picker-item-date">${date}</div>
        </div>
      </div>`;
  }

  // ─── COMPOSE SCREEN ──────────────────────────────────────────────────────

  function openCompose(round) {
    selectedRound = round;
    pendingPhotos = [];

    const profile  = DB.Profile.get();
    const screen   = document.getElementById('compose-screen');
    const infoEl   = document.getElementById('compose-round-info');
    const avatarEl = document.getElementById('compose-avatar');
    const caption  = document.getElementById('compose-caption');

    infoEl.innerHTML = `
      <span class="compose-round-name">${escapeHTML(round.courseName)}</span>
      <span class="compose-round-date">${formatDate(round.date)}</span>`;

    avatarEl.innerHTML = avatarHTML(profile);
    caption.value = '';
    renderPhotoGrid();

    screen.classList.remove('hidden');
    caption.focus();
  }

  function closeCompose() {
    document.getElementById('compose-screen').classList.add('hidden');
    selectedRound = null;
    pendingPhotos = [];
  }

  function getTotalPostStorageBytes() {
    try {
      const posts = DB.Posts.getAll();
      const raw   = JSON.stringify(posts);
      return Math.round((raw.length * 3) / 4);
    } catch { return 0; }
  }

  function submitPost() {
    if (!selectedRound) return;
    const caption = document.getElementById('compose-caption').value.trim();

    const pendingBytes  = pendingPhotos.reduce((acc, p) => acc + Math.round((p.length * 3) / 4), 0);
    const existingBytes = getTotalPostStorageBytes();
    const STORAGE_WARN  = 4 * 1024 * 1024; // warn at 4MB total post storage

    if (existingBytes + pendingBytes > STORAGE_WARN) {
      const proceed = confirm('Your post storage is getting large (over 4MB). This may cause issues on some devices. Post anyway?');
      if (!proceed) return;
    }

    DB.Posts.add({
      roundId:    selectedRound.id,
      courseId:   selectedRound.courseId,
      courseName: selectedRound.courseName,
      date:       selectedRound.date,
      caption,
      photos:     pendingPhotos.slice(),
    });

    closeCompose();
    renderFollowing();
  }

  // ─── PHOTOS ──────────────────────────────────────────────────────────────

  function onPhotosSelected(e) {
    const files     = Array.from(e.target.files);
    const remaining = MAX_PHOTOS - pendingPhotos.length;
    const toAdd     = files.slice(0, remaining);
    let loaded      = 0;

    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onerror = () => {
          loaded++;
          if (loaded === toAdd.length) renderPhotoGrid();
        };
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max    = 1200;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            if (w > h) { h = Math.round(h * max / w); w = max; }
            else       { w = Math.round(w * max / h); h = max; }
          }
          canvas.width  = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const sizeBytes = Math.round((dataUrl.length * 3) / 4);
          const existingBytes = pendingPhotos.reduce((acc, p) => acc + Math.round((p.length * 3) / 4), 0);
          if (existingBytes + sizeBytes > MAX_PHOTO_BYTES) {
            alert('This photo would exceed the 3MB limit for this post. Try fewer or smaller images.');
            loaded++;
            if (loaded === toAdd.length) renderPhotoGrid();
            return;
          }
          pendingPhotos.push(dataUrl);
          loaded++;
          if (loaded === toAdd.length) renderPhotoGrid();
        };
        img.src = ev.target.result;
      };
      reader.onerror = () => {
        loaded++;
        if (loaded === toAdd.length) renderPhotoGrid();
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }

  function renderPhotoGrid() {
    const grid   = document.getElementById('compose-photos-grid');
    const addBtn = document.getElementById('compose-add-photo-btn');

    grid.innerHTML = pendingPhotos.map((src, i) => `
      <div class="compose-photo-thumb">
        <img src="${src}" alt="Photo ${i + 1}" />
        <button class="compose-photo-remove" data-index="${i}" aria-label="Remove">×</button>
      </div>`).join('');

    grid.querySelectorAll('.compose-photo-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingPhotos.splice(parseInt(btn.dataset.index), 1);
        renderPhotoGrid();
      });
    });

    addBtn.style.display = pendingPhotos.length >= MAX_PHOTOS ? 'none' : 'flex';
  }

  // ─── CARD EVENTS ─────────────────────────────────────────────────────────

  function bindCardEvents(listId = 'feed-list') {
    const container = document.getElementById(listId);
    if (!container) return;

    container.querySelectorAll('.feed-share-btn').forEach(btn => {
      if (!navigator.share) { btn.style.display = 'none'; return; }
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const postId = btn.closest('.feed-card').dataset.postId;
        const post   = DB.Posts.getById(postId);
        if (post) sharePost(post);
      });
    });

    container.querySelectorAll('.feed-like-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const postId = btn.dataset.postId;
        const liked  = DB.Likes.toggle(postId);
        btn.classList.toggle('liked', liked);
        const svg = btn.querySelector('svg');
        svg.setAttribute('fill',   liked ? 'var(--green-700)' : 'none');
        svg.setAttribute('stroke', liked ? 'var(--green-700)' : 'currentColor');
        let count = btn.querySelector('.feed-like-count');
        if (liked) {
          if (!count) {
            count = document.createElement('span');
            count.className = 'feed-like-count';
            btn.appendChild(count);
          }
          count.textContent = '1';
        } else {
          if (count) count.remove();
        }
      });
    });

    container.querySelectorAll('.feed-comment-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `post.html?id=${btn.dataset.postId}#comment`;
      });
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  function truncateWords(str, maxChars) {
    if (!str || str.length <= maxChars) return str || '';
    const trimmed   = str.slice(0, maxChars);
    const lastSpace = trimmed.lastIndexOf(' ');
    return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
  }

  function likeCount(postId) {
    return DB.Likes.has(postId) ? 1 : 0;
  }

  function getCommentCount(postId) {
    return DB.Comments.countForPost(postId);
  }

  function avatarHTML(profile) {
    if (profile.avatar) {
      return `<div class="feed-avatar"><img src="${profile.avatar}" alt="Avatar" /></div>`;
    }
    return `
      <div class="feed-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pageshow', e => {
    if (e.persisted) renderFollowing();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') renderFollowing();
  });

})();