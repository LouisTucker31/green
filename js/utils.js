// Green PWA | Utils — shared helper functions

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sharePost(post) {
  if (!navigator.share) return;
  const url  = `https://LouisTucker31.github.io/green/post.html?id=${post.id}`;
  const text = `${post.courseName} · ${new Date(post.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  navigator.share({
    title: 'Green',
    text,
    url,
  }).catch(() => {});
}

function parseCaption(str, clickable = false) {
  if (!str) return '';
  const myHandle = DB.Profile.get().handle || '';
  return escapeHTML(str).replace(
    /(#[a-zA-Z0-9_]+)|(@[a-zA-Z0-9_.]+)/g,
    (match, hash, mention) => {
      if (!clickable) return `<span class="caption-tag">${match}</span>`;
      if (hash) {
        const tag = hash.slice(1);
        return `<a class="caption-tag caption-tag-link" href="feed.html?tag=${encodeURIComponent(tag)}">${match}</a>`;
      }
      if (mention) {
        const url = mention === myHandle ? 'profile.html' : `player.html?handle=${encodeURIComponent(mention)}`;
        return `<a class="caption-tag caption-tag-link" href="${url}">${match}</a>`;
      }
      return match;
    }
  );
}

function initPullToRefresh(onRefresh) {
  let startY     = 0;
  let pulling    = false;
  let indicator  = null;
  const THRESHOLD = 72;

  function createIndicator() {
    if (document.querySelector('.ptr-indicator')) return;
    indicator = document.createElement('div');
    indicator.className = 'ptr-indicator';
    indicator.innerHTML = '<div class="ptr-spinner"></div>';
    document.body.appendChild(indicator);
  }

  document.addEventListener('touchstart', e => {
    if (window.scrollY > 0) return;
    startY  = e.touches[0].clientY;
    pulling = true;
    createIndicator();
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!pulling) return;
    const dist = e.touches[0].clientY - startY;
    if (dist > 10 && window.scrollY === 0) {
      indicator = document.querySelector('.ptr-indicator');
      if (indicator) indicator.classList.add('ptr-visible');
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!pulling) return;
    pulling       = false;
    const dist    = e.changedTouches[0].clientY - startY;
    indicator     = document.querySelector('.ptr-indicator');
    if (dist >= THRESHOLD && window.scrollY === 0) {
      onRefresh();
    }
    if (indicator) {
      indicator.classList.remove('ptr-visible');
      setTimeout(() => { if (indicator) indicator.remove(); }, 200);
    }
  }, { passive: true });
}

function renderLocalModeBanner(containerId) {
  if (sessionStorage.getItem('green_banner_dismissed')) return;
  if (document.querySelector('.local-mode-banner')) return;

  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (session) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const banner = document.createElement('div');
    banner.className = 'local-mode-banner';
    banner.innerHTML = `
      <span>You're in local mode — data is saved on this device only. <a href="create-account.html">Create account</a></span>
      <button class="local-mode-banner-dismiss" aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    banner.querySelector('.local-mode-banner-dismiss').addEventListener('click', () => {
      sessionStorage.setItem('green_banner_dismissed', '1');
      banner.remove();
    });

    container.parentElement.insertBefore(banner, container);
  });
}