// Green PWA | Page — player profile (other user)

const PlayerPage = (() => {

  function init() {
    const params = new URLSearchParams(window.location.search);
    const handle = params.get('handle');

    if (!handle) {
      window.location.href = 'feed.html';
      return;
    }

    const myProfile = DB.Profile.get();
    const isMe      = myProfile.handle === handle;

    if (isMe) {
      window.location.href = 'profile.html';
      return;
    }

    renderUnavailable(handle);
    bindFollow(handle);
  }

  function renderUnavailable(handle) {
    document.title = `Green – ${handle}`;

    document.getElementById('player-header-name').textContent = handle;
    document.getElementById('player-name').textContent        = handle;
    document.getElementById('player-handle').textContent      = handle;
    document.getElementById('player-handicap').textContent    = '';

    document.getElementById('player-stat-courses').textContent  = '—';
    document.getElementById('player-stat-posts').textContent    = '—';
    document.getElementById('player-stat-following').textContent = '—';

    const grid  = document.getElementById('player-posts-grid');
    const empty = document.getElementById('player-posts-empty');
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    empty.querySelector('.profile-empty-text').textContent = 'Profile not available yet. Full profiles coming soon.';

    const followBtn = document.getElementById('player-follow-btn');
    const following = DB.Following.has(handle);
    followBtn.textContent = following ? 'Following' : 'Follow';
    followBtn.classList.toggle('following', following);
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