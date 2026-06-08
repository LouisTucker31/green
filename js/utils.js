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