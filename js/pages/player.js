// Green PWA | Page — player profile (other user)

const PlayerPage = (() => {

  function init() {
    const params = new URLSearchParams(window.location.search);
    const handle = params.get('handle');

    if (!handle) {
      window.location.href = 'feed.html';
      return;
    }

    // For now, the only "player" in local storage is yourself
    // When backend arrives this fetches from API
    const myProfile = DB.Profile.get();
    const isMe      = myProfile.handle === handle;

    if (isMe) {
      window.location.href = 'profile.html';
      return;
    }

    // Render with whatever we know about this handle
    // (locally we only have our own data; backend will provide others)
    renderPlayer(handle, myProfile);
    bindFollow(handle);
  }

  function renderPlayer(handle, profile) {
    document.title = `Green – ${handle}`;

    // Avatar
    const avatarEl = document.getElementById('player-avatar');
    if (profile.avatar) {
      avatarEl.innerHTML = `<img src="${profile.avatar}" alt="Avatar"
        style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid white;box-shadow:var(--shadow-md);" />`;
    }

    const name = profile.name || handle;
    document.getElementById('player-name').textContent        = name;
    document.getElementById('player-header-name').textContent = name;
    document.getElementById('player-handle').textContent      = handle;
    document.getElementById('player-handicap').textContent    =
      profile.handicap ? `Handicap ${profile.handicap}` : '';

    // Stats — use local data as placeholder
    const playedIds     = DB.Played.getAll();
    const posts         = DB.Posts.getAll();
    const playedCourses = COURSES_DATA.data.filter(c => playedIds.includes(c.id));
    const counties      = new Set(playedCourses.map(c => c.county).filter(Boolean));

    document.getElementById('player-stat-courses').textContent  = playedIds.length;
    document.getElementById('player-stat-posts').textContent    = posts.length;
    document.getElementById('player-stat-following').textContent = DB.Following.getAll().length;

    // Posts grid
    renderGrid(posts);

    // Follow button state
    const following = DB.Following.has(handle);
    const btn = document.getElementById('player-follow-btn');
    btn.textContent = following ? 'Following' : 'Follow';
    btn.classList.toggle('following', following);
  }

  function renderGrid(posts) {
    const grid  = document.getElementById('player-posts-grid');
    const empty = document.getElementById('player-posts-empty');

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

  function bindFollow(handle) {
    const btn = document.getElementById('player-follow-btn');
    btn.addEventListener('click', () => {
      const following = DB.Following.toggle(handle);
      btn.textContent = following ? 'Following' : 'Follow';
      btn.classList.toggle('following', following);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();