// Green PWA | Page — post / round detail

const PostPage = (() => {

  let postId  = null;
  let post    = null;
  let round   = null;
  let course  = null;

  async function init() {
    const params = new URLSearchParams(window.location.search);
    postId = params.get('id');
    const focusComment = window.location.hash === '#comment';

    post  = await DB.Posts.getById(postId) || null;

    if (!post) {
      document.getElementById('post-not-found').classList.remove('hidden');
      return;
    }

    await DB.Likes.loadCache(true);

    round  = DB.Rounds.getAll().find(r => r.id === post.roundId) || null;
    course = COURSES_DATA.data.find(c => c.id === post.courseId) || null;

    await DB.Comments.loadForPost(postId);

    document.getElementById('post-content').classList.remove('hidden');
    document.getElementById('post-comment-bar').classList.remove('hidden');

    renderUser();
    renderCourse();
    renderPhotos();
    renderScore();
    renderCaption();
    renderLike();
    renderLikesCount();
    renderComments();
    bindEvents();
    if (focusComment) {
      setTimeout(() => {
        const bar = document.getElementById('post-comment-bar');
        const input = document.getElementById('post-comment-input');
        if (bar) bar.scrollIntoView({ behavior: 'smooth' });
        if (input) input.focus();
      }, 600);
    }
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  function renderUser() {
    const profile    = DB.Profile.getCached();
    const name       = profile.name   || 'You';
    const handle     = profile.handle || '';
    const date       = formatDate(post.date);
    const myHandle   = profile.handle || '';
    const postHandle = post.authorHandle || myHandle; // authorHandle added by backend later
    const profileURL = (postHandle && postHandle !== myHandle)
      ? `player.html?handle=${encodeURIComponent(postHandle)}`
      : 'profile.html';

    document.getElementById('post-avatar').innerHTML         = avatarHTML(profile, 20);
    document.getElementById('post-comment-avatar').innerHTML = avatarHTML(profile, 14);
    document.getElementById('post-author-name').textContent  = name;
    document.getElementById('post-author-handle').textContent = handle ? '@' + handle : '';
    document.getElementById('post-date').textContent          = date;

    if (!handle) document.getElementById('post-author-handle').style.display = 'none';

    // Make avatar and author name tappable → profile
    const avatarEl = document.getElementById('post-avatar');
    const authorEl = document.querySelector('.post-author');
    [avatarEl, authorEl].forEach(el => {
      if (!el) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { window.location.href = profileURL; });
    });
  }

  function renderCourse() {
    const nameEl     = document.getElementById('post-course-name');
    const locationEl = document.getElementById('post-course-location');
    const metaEl     = document.getElementById('post-course-meta');
    const linkEl     = document.getElementById('post-course-link');

    nameEl.textContent = post.courseName;

    if (course) {
      const loc = [course.city, course.county].filter(Boolean).join(', ');
      locationEl.textContent = loc || 'United Kingdom';
      linkEl.href = `course.html?id=${course.id}`;
      const badges = [];
      if (course.courseType) badges.push(`<span class="post-course-badge">${course.courseType}</span>`);
      if (course.clubType)   badges.push(`<span class="post-course-badge">${course.clubType}</span>`);
      metaEl.innerHTML = badges.join('');
    } else {
      locationEl.textContent = 'United Kingdom';
      linkEl.href = '#';
    }
  }

  function renderPhotos() {
    const photos      = post.photos || [];
    const placeholder = document.getElementById('post-hero-placeholder');
    const thumbsEl    = document.getElementById('post-hero-thumbs');

    if (!photos.length) return;

    // First photo fills the hero placeholder
    placeholder.style.background = 'none';
    placeholder.innerHTML = `<img src="${photos[0]}" alt="Post photo" />`;
    placeholder.addEventListener('click', () => openGallery(0));
    placeholder.style.cursor = 'pointer';

    if (photos.length === 1) return;

    // Remaining photos as a thumb strip below
    const remaining = photos.slice(1, 4);
    const extra     = photos.length - 4;

    thumbsEl.innerHTML = remaining.map((src, i) => {
      const realIndex = i + 1;
      const isLast    = i === remaining.length - 1 && extra > 0;
      return `
        <div class="post-hero-thumb" data-index="${realIndex}">
          <img src="${src}" alt="Photo ${realIndex + 1}" />
          ${isLast ? `<div class="post-hero-thumb-more">+${extra + 1}</div>` : ''}
        </div>`;
    }).join('');

    thumbsEl.classList.remove('hidden');

    thumbsEl.querySelectorAll('.post-hero-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => openGallery(parseInt(thumb.dataset.index)));
    });
  }

  function renderScore() {
    const settings = DB.Settings.get();
    if (!round || !round.score || !settings.privacy_show_scores) return;
    // Inject score into course card as a right-aligned value
    const card = document.getElementById('post-course-link');
    const scoreEl = document.createElement('div');
    scoreEl.className = 'post-course-score';
    scoreEl.innerHTML = `
      <span class="post-course-score-label">Score</span>
      <span class="post-course-score-value">${round.score}</span>`;
    card.querySelector('.post-course-info').appendChild(scoreEl);
  }

  function renderCaption() {
    if (!post.caption) return;
    const el = document.getElementById('post-caption');
    el.innerHTML = parseCaption(post.caption, true);
    el.classList.remove('hidden');
  }

  function renderLike(liked) {
    if (liked === undefined) liked = DB.Likes.has(postId);
    const btn   = document.getElementById('post-like-btn');
    const label = document.getElementById('post-like-label');
    btn.classList.toggle('liked', liked);
    const svg = btn.querySelector('svg');
    svg.setAttribute('fill',   liked ? 'var(--green-700)' : 'none');
    svg.setAttribute('stroke', liked ? 'var(--green-700)' : 'currentColor');
    label.textContent = liked ? 'Liked' : 'Like';
  }

  function renderLikesCount() {
    const count = post ? (post.likeCount || 0) : 0;
    const el    = document.getElementById('post-likes-count');
    if (count > 0) {
      el.textContent = `${count} ${count === 1 ? 'person' : 'people'} liked this`;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function renderComments() {
    const comments = getComments();
    const list     = document.getElementById('post-comments-list');
    const empty    = document.getElementById('post-comments-empty');

    if (!comments.length) {
      empty.classList.remove('hidden');
      list.querySelectorAll('.post-comment-item').forEach(el => el.remove());
      return;
    }

    empty.classList.add('hidden');
    list.innerHTML = `
      <p class="post-comments-empty hidden" id="post-comments-empty">No comments yet. Be the first.</p>
      ${comments.map(c => commentHTML(c)).join('')}`;

    list.querySelectorAll('.post-comment-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteComment(btn.dataset.commentId);
      });
    });
  }

  function commentHTML(c) {
    const profile    = DB.Profile.getCached();
    const isOwn      = c.handle === profile.handle;
    const displayName = c.handle
      ? `<a href="player.html?handle=${encodeURIComponent(c.handle)}" class="post-comment-handle">@${escapeHTML(c.handle)}</a>`
      : '<span>Unknown</span>';
    const deleteBtn  = isOwn
      ? `<button class="post-comment-delete" data-comment-id="${c.id}" aria-label="Delete comment">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <polyline points="3 6 5 6 21 6"/>
             <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
           </svg>
         </button>`
      : '';
    return `
      <div class="post-comment-item" data-comment-id="${c.id}">
        <div class="post-comment-item-avatar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="post-comment-item-body">
          <div class="post-comment-item-header">
            <span class="post-comment-item-name">${displayName}</span>
            ${deleteBtn}
          </div>
          <span class="post-comment-item-text">${escapeHTML(c.text)}</span>
          <span class="post-comment-item-time">${formatDateTime(c.createdAt)}</span>
        </div>
      </div>`;
  }

  // ─── GALLERY ─────────────────────────────────────────────────────────────

  function openGallery(startIndex) {
    const photos  = post.photos || [];
    const overlay = document.getElementById('gallery-overlay');
    const track   = document.getElementById('gallery-track');
    const dots    = document.getElementById('gallery-dots');

    track.innerHTML = photos.map((src, i) => `
      <div class="gallery-slide">
        <img src="${src}" alt="Photo ${i + 1}" />
      </div>`).join('');

    dots.innerHTML = photos.length > 1
      ? photos.map((_, i) => `<div class="gallery-dot${i === startIndex ? ' active' : ''}"></div>`).join('')
      : '';

    overlay.classList.remove('hidden');

    requestAnimationFrame(() => {
      const slide = track.querySelectorAll('.gallery-slide')[startIndex];
      if (slide) slide.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
    });

    track.addEventListener('scroll', onGalleryScroll);
    bindGalleryDragClose(overlay);
  }

  function bindGalleryDragClose(overlay) {
    let startY    = 0;
    let currentY  = 0;
    let dragging  = false;

    overlay.addEventListener('touchstart', e => {
      // Only start drag if single finger (not swiping between photos)
      if (e.touches.length !== 1) return;
      startY   = e.touches[0].clientY;
      currentY = startY;
      dragging = true;
    }, { passive: true });

    overlay.addEventListener('touchmove', e => {
      if (!dragging || e.touches.length !== 1) return;
      currentY      = e.touches[0].clientY;
      const deltaY  = currentY - startY;
      if (deltaY < 0) return; // only allow downward drag
      const opacity = Math.max(0.3, 1 - deltaY / 300);
      overlay.style.background   = `rgba(0,0,0,${opacity})`;
      overlay.style.transform    = `translateY(${deltaY * 0.4}px)`;
    }, { passive: true });

    overlay.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      const deltaY = currentY - startY;
      if (deltaY > 100) {
        closeGallery();
      } else {
        overlay.style.transform = '';
        overlay.style.background = '#000';
      }
    });
  }

  function onGalleryScroll() {
    const track  = document.getElementById('gallery-track');
    const dots   = document.querySelectorAll('.gallery-dot');
    const index  = Math.round(track.scrollLeft / track.offsetWidth);
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  function closeGallery() {
    const overlay = document.getElementById('gallery-overlay');
    const track   = document.getElementById('gallery-track');
    overlay.style.transform  = '';
    overlay.style.background = '#000';
    overlay.classList.add('hidden');
    track.removeEventListener('scroll', onGalleryScroll);
  }

  // ─── EDIT / DELETE ────────────────────────────────────────────────────────

  const moreSheetCtrl = new Sheet('more-sheet', 'more-overlay');

  function openMoreSheet() {
    moreSheetCtrl.open();
  }

  function closeMoreSheet() {
    moreSheetCtrl.close();
  }

  function openCompose() {
    // Build a temporary compose screen over the post page
    const existing = document.getElementById('post-compose-screen');
    if (existing) existing.remove();

    const profile  = DB.Profile.getCached();
    const avatarIn = profile.avatar
      ? `<img src="${profile.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

    // Build existing photo thumbs
    const photos   = post.photos || [];
    const thumbsHTML = photos.map((src, i) => `
      <div class="compose-photo-thumb" data-index="${i}">
        <img src="${src}" alt="Photo ${i+1}" />
        <button class="compose-photo-remove" data-index="${i}" aria-label="Remove">×</button>
      </div>`).join('');

    const screen = document.createElement('div');
    screen.id    = 'post-compose-screen';
    screen.className = 'compose-screen';
    screen.innerHTML = `
      <div class="compose-header">
        <button class="compose-cancel" id="pcs-cancel">Cancel</button>
        <h2 class="compose-title">Edit Post</h2>
        <button class="compose-post-btn" id="pcs-save">Save</button>
      </div>
      <div class="compose-body">
        <div class="compose-round-info">
          <span class="compose-round-name">${escapeHTML(post.courseName)}</span>
          <span class="compose-round-date">${formatDate(post.date)}</span>
        </div>
        <div class="compose-photos-section">
          <div class="compose-photos-grid" id="pcs-photo-grid">${thumbsHTML}</div>
          <button class="compose-add-photo-btn" id="pcs-add-photo-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Add Photos
          </button>
          <input type="file" id="pcs-photo-input" accept="image/*" multiple class="hidden" />
        </div>
        <div class="compose-avatar-row">
          <div class="compose-avatar">${avatarIn}</div>
          <textarea class="compose-caption" id="pcs-caption" rows="4"></textarea>
        </div>
      </div>`;

    const pageEl = document.querySelector('.page') || document.body;
    pageEl.appendChild(screen);

    // Set caption value directly to avoid HTML entity encoding
    document.getElementById('pcs-caption').value = post.caption || '';

    // Bind events
    let editPhotos = photos.slice();

    function renderEditGrid() {
      const grid   = document.getElementById('pcs-photo-grid');
      const addBtn = document.getElementById('pcs-add-photo-btn');
      grid.innerHTML = editPhotos.map((src, i) => `
        <div class="compose-photo-thumb">
          <img src="${src}" alt="Photo ${i+1}" />
          <button class="compose-photo-remove" data-index="${i}" aria-label="Remove">×</button>
        </div>`).join('');
      grid.querySelectorAll('.compose-photo-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          editPhotos.splice(parseInt(btn.dataset.index), 1);
          renderEditGrid();
        });
      });
      addBtn.style.display = editPhotos.length >= 10 ? 'none' : 'flex';
    }

    renderEditGrid();

    document.getElementById('pcs-cancel').addEventListener('click', () => screen.remove());

    document.getElementById('pcs-add-photo-btn').addEventListener('click', () => {
      document.getElementById('pcs-photo-input').click();
    });

    document.getElementById('pcs-photo-input').addEventListener('change', e => {
      const files     = Array.from(e.target.files);
      const remaining = 10 - editPhotos.length;
      let loaded = 0;
      files.slice(0, remaining).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onerror = () => {
            loaded++;
            if (loaded === files.slice(0, remaining).length) renderEditGrid();
          };
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const max = 1200;
            let w = img.width, h = img.height;
            if (w > max || h > max) {
              if (w > h) { h = Math.round(h * max / w); w = max; }
              else       { w = Math.round(w * max / h); h = max; }
            }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            editPhotos.push(canvas.toDataURL('image/jpeg', 0.82));
            loaded++;
            if (loaded === files.slice(0, remaining).length) renderEditGrid();
          };
          img.src = ev.target.result;
        };
        reader.onerror = () => {
          loaded++;
          if (loaded === files.slice(0, remaining).length) renderEditGrid();
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    });

    document.getElementById('pcs-save').addEventListener('click', () => {
      const caption = document.getElementById('pcs-caption').value.trim();
      DB.Posts.update(postId, { caption, photos: editPhotos });
      post = DB.Posts.getCachedById(postId);
      screen.remove();
      // Re-render affected sections
      renderPhotos();
      renderCaption();
    });
  }

  async function deletePost() {
    if (!confirm('Delete this post? Your round will still be saved.')) return;
    try {
      await DB.Posts.remove(postId);
      window.location.href = 'feed.html';
    } catch (e) {
      alert('Failed to delete post: ' + e.message);
    }
  }

  // ─── EVENTS ──────────────────────────────────────────────────────────────

  function bindEvents() {
    const shareBtn = document.getElementById('post-share-btn');
    if (shareBtn) {
      if (navigator.share) {
        shareBtn.addEventListener('click', () => sharePost(post));
      } else {
        shareBtn.style.display = 'none';
      }
    }

    document.getElementById('post-like-btn').addEventListener('click', async () => {
      const wasLiked  = DB.Likes.has(postId);
      const nowLiked  = !wasLiked;
      const prevCount = post.likeCount || 0;

      // Optimistic update
      post.likeCount = nowLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
      renderLike(nowLiked);
      renderLikesCount();

      try {
        await DB.Likes.toggle(postId);
      } catch (_) {
        // Roll back
        post.likeCount = prevCount;
        renderLike(wasLiked);
        renderLikesCount();
      }
    });

    document.getElementById('post-comment-action-btn').addEventListener('click', () => {
      document.getElementById('post-comment-input').focus();
    });

    document.getElementById('post-comment-send').addEventListener('click', submitComment);
    document.getElementById('post-comment-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitComment();
    });

    document.getElementById('gallery-close').addEventListener('click', closeGallery);

    document.getElementById('post-more-btn').addEventListener('click', openMoreSheet);
    document.getElementById('post-edit-btn').addEventListener('click', () => { closeMoreSheet(); setTimeout(openCompose, 370); });
    document.getElementById('post-delete-btn').addEventListener('click', () => { closeMoreSheet(); setTimeout(deletePost, 370); });
  }

  // ─── COMMENTS ────────────────────────────────────────────────────────────

  async function submitComment() {
    const input  = document.getElementById('post-comment-input');
    const sendBtn = document.getElementById('post-comment-send');
    const text   = input.value.trim();
    if (!text) return;

    input.value  = '';
    input.blur();
    sendBtn.disabled = true;

    try {
      const comment = await DB.Comments.add({ postId, text });
      renderComments();
      post.commentCount = (post.commentCount || 0) + 1;
    } catch (e) {
      console.error('[Comment.add]', e);
      alert('Failed to post comment. Please try again.');
      input.value = text;
    } finally {
      sendBtn.disabled = false;
    }
  }

  function getComments() {
    return DB.Comments.getForPost(postId);
  }

  async function deleteComment(commentId) {
    try {
      await DB.Comments.remove(commentId, postId);
      post.commentCount = Math.max(0, (post.commentCount || 1) - 1);
      renderComments();
    } catch (e) {
      alert('Failed to delete comment. Please try again.');
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  function avatarHTML(profile, svgSize) {
    if (profile.avatar) {
      return `<img src="${profile.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    }
    return `
      <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="var(--green-700)" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDateTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();