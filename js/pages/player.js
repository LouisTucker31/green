// Green PWA | Page — player profile (other user)

const PlayerPage = (() => {

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const rawHandle = params.get('handle') || '';
    const handle    = rawHandle.replace('@', '');

    if (!handle) {
      window.location.href = 'feed.html';
      return;
    }

    // Redirect to own profile if this is the current user
    const myProfile = DB.Profile.getCached();
    const myHandle  = (myProfile.handle || '').replace('@', '');
    if (myHandle && myHandle === handle) {
      window.location.href = 'profile.html';
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('handle, display_name, avatar_url, bio')
        .eq('handle', handle)
        .single();

      if (error || !data) {
        renderNotFound(handle);
      } else {
        renderProfile(data);
      }
    } catch (e) {
      renderNotFound(handle);
    }
  }

  function renderProfile(data) {
    const displayHandle = '@' + data.handle;

    document.title = `Green – ${displayHandle}`;
    document.getElementById('player-name').textContent        = data.display_name || '—';
    document.getElementById('player-handle').textContent      = displayHandle;

    const bioEl = document.getElementById('player-bio');
    bioEl.textContent = data.bio || '';
    bioEl.style.display = data.bio ? '' : 'none';

    const avatarEl = document.getElementById('player-avatar');
    if (data.avatar_url) {
      avatarEl.innerHTML = `<img src="${data.avatar_url}" alt="${data.display_name || ''}" />`;
    }

    // Stats not available yet — leave as 0
    document.getElementById('player-stat-courses').textContent  = '0';
    document.getElementById('player-stat-posts').textContent    = '0';
    document.getElementById('player-stat-following').textContent = '0';

    document.getElementById('player-posts-grid').innerHTML = '';
    document.getElementById('player-posts-empty').classList.remove('hidden');
  }

  function renderNotFound(handle) {
    document.title = `Green – Not found`;
    document.getElementById('player-name').textContent          = 'User not found';
    document.getElementById('player-handle').textContent        = '@' + handle;
    document.getElementById('player-bio').style.display         = 'none';
    document.getElementById('player-stat-courses').textContent  = '—';
    document.getElementById('player-stat-posts').textContent    = '—';
    document.getElementById('player-stat-following').textContent = '—';
    document.getElementById('player-posts-grid').innerHTML      = '';
    const empty = document.getElementById('player-posts-empty');
    empty.classList.remove('hidden');
    empty.querySelector('.profile-empty-text').textContent = 'No account found for this handle.';
    document.getElementById('player-follow-btn').style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();