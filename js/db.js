// Green PWA | DB — localStorage abstraction layer

const DB = (() => {

  // ─── KEYS ───────────────────────────────────────────────
  const KEYS = {
    ROUNDS:       'green_rounds',
    WISHLIST:     'green_wishlist',
    FAVOURITES:   'green_favourites',
    PROFILE:      'green_profile',
    SETTINGS:     'green_settings',
    PLAYED:       'green_played',
    POSTS:        'green_posts',
    FOLLOWING:    'green_following',
    LIKES:        'green_likes',
    COMMENTS:     'green_comments',
    ACHIEVEMENTS: 'green_achievements_notified',
    LOCATION:     'green_location_pref',
    SESSION:      'green_session',
  };

  // ─── HELPERS ────────────────────────────────────────────
  function read(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      console.error('DB read error', key, e);
      return null;
    }
  }

  function write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('DB write error', key, e);
      return false;
    }
  }

  // ─── ROUNDS ─────────────────────────────────────────────
  // A round is the minimum unit — one visit to one course.
  // Multiple rounds can exist for the same courseId.
  //
  // Round shape:
  // {
  //   id:        'round_1719836400000',   // unique — timestamp based
  //   courseId:  'course_123',            // from API
  //   courseName:'Royal Birkdale',        // denormalised for speed
  //   date:      '2024-05-16',            // ISO date string
  //   score:     83,                      // optional, null if not entered
  //   notes:     '',                      // optional free text
  //   createdAt: 1719836400000            // unix timestamp
  // }

  const Rounds = {

    getAll() {
      return read(KEYS.ROUNDS) || [];
    },

    getForCourse(courseId) {
      return Rounds.getAll().filter(r => r.courseId === courseId);
    },

    // Returns unique courseIds that have been played (for map/list)
    getPlayedCourseIds() {
      const rounds = Rounds.getAll();
      return [...new Set(rounds.map(r => r.courseId))];
    },

    // Returns true if course has been played at least once
    hasPlayed(courseId) {
      return Rounds.getAll().some(r => r.courseId === courseId);
    },

    // Returns most recent round for a course
    getLatestForCourse(courseId) {
      const rounds = Rounds.getForCourse(courseId);
      if (!rounds.length) return null;
      return rounds.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    },

    // Returns all rounds sorted newest first
    getAllSorted() {
      return Rounds.getAll().sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    add({ courseId, courseName, date, score = null, notes = '' }) {
      const rounds = Rounds.getAll();
      const round = {
        id:         `round_${Date.now()}`,
        courseId,
        courseName,
        date,
        score,
        notes,
        createdAt:  Date.now(),
      };
      rounds.push(round);
      write(KEYS.ROUNDS, rounds);
      return round;
    },

    remove(roundId) {
      const rounds = Rounds.getAll().filter(r => r.id !== roundId);
      write(KEYS.ROUNDS, rounds);
    },

    update(roundId, changes) {
      const rounds = Rounds.getAll().map(r =>
        r.id === roundId ? { ...r, ...changes } : r
      );
      write(KEYS.ROUNDS, rounds);
    },

  };

// ─── PLAYED ──────────────────────────────────────────────────────────────
  const Played = {
    getAll() { return read(KEYS.PLAYED) || []; },
    has(courseId) { return Played.getAll().includes(courseId); },
    add(courseId) {
      const list = Played.getAll();
      if (!list.includes(courseId)) { list.push(courseId); write(KEYS.PLAYED, list); }
    },
    remove(courseId) { write(KEYS.PLAYED, Played.getAll().filter(id => id !== courseId)); },
    toggle(courseId) {
      Played.has(courseId) ? Played.remove(courseId) : Played.add(courseId);
      return Played.has(courseId);
    },
  };

  // ─── WISHLIST ────────────────────────────────────────────
  // Stored as a Set of courseIds
  //
  // Wishlist shape:
  // ['course_123', 'course_456', ...]

  const Wishlist = {

    getAll() {
      return read(KEYS.WISHLIST) || [];
    },

    has(courseId) {
      return Wishlist.getAll().includes(courseId);
    },

    add(courseId) {
      const list = Wishlist.getAll();
      if (!list.includes(courseId)) {
        list.push(courseId);
        write(KEYS.WISHLIST, list);
      }
    },

    remove(courseId) {
      const list = Wishlist.getAll().filter(id => id !== courseId);
      write(KEYS.WISHLIST, list);
    },

    toggle(courseId) {
      Wishlist.has(courseId)
        ? Wishlist.remove(courseId)
        : Wishlist.add(courseId);
      return Wishlist.has(courseId);
    },

  };

  // ─── FAVOURITES ──────────────────────────────────────────
  // Same pattern as wishlist

  const Favourites = {

    getAll() {
      return read(KEYS.FAVOURITES) || [];
    },

    has(courseId) {
      return Favourites.getAll().includes(courseId);
    },

    add(courseId) {
      const list = Favourites.getAll();
      if (!list.includes(courseId)) {
        list.push(courseId);
        write(KEYS.FAVOURITES, list);
      }
    },

    remove(courseId) {
      const list = Favourites.getAll().filter(id => id !== courseId);
      write(KEYS.FAVOURITES, list);
    },

    toggle(courseId) {
      Favourites.has(courseId)
        ? Favourites.remove(courseId)
        : Favourites.add(courseId);
      return Favourites.has(courseId);
    },

  };

  // ─── PROFILE ─────────────────────────────────────────────
  // Single object, merged on save
  //
  // Profile shape:
  // {
  //   name:        'James Wilson',
  //   handle:      '@jameswilson',
  //   homeCourse:  { id: 'course_123', name: 'The Shire London' },
  //   handicap:    8.3,
  //   avatar:      null,   // base64 or url, future use
  // }

  const Profile = {

    _defaults() {
      return { name: '', handle: '', homeCourse: null, handicap: null, avatar: null };
    },

    // Sync read from localStorage cache — safe to call anywhere without await.
    // Always up-to-date because get() and save() both keep the cache warm.
    getCached() {
      return read(KEYS.PROFILE) || Profile._defaults();
    },

    async get() {
      const cached = Profile.getCached();

      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}
      if (!session) return cached;

      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('handle, display_name, avatar_url, bio')
          .eq('id', session.user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Row missing — insert default and return cached
          await supabaseClient.from('profiles').insert({
            id:           session.user.id,
            handle:       cached.handle || '',
            display_name: cached.name   || '',
          });
          return cached;
        }

        if (error) throw error;

        const merged = {
          ...cached,
          name:   data.display_name || cached.name,
          handle: data.handle       || cached.handle,
          avatar: data.avatar_url   || cached.avatar,
        };
        write(KEYS.PROFILE, merged);
        return merged;

      } catch (e) {
        console.warn('DB.Profile.get fell back to cache', e);
        return cached;
      }
    },

    async save(changes) {
      const current = Profile.getCached();
      const next    = { ...current, ...changes };
      write(KEYS.PROFILE, next);

      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}
      if (!session) { console.log('[Profile.save] no session, skipping remote save'); return; }

      const payload = {
        id:           session.user.id,
        handle:       next.handle ? next.handle.replace('@', '') : '',
        display_name: next.name   || '',
        avatar_url:   next.avatar || null,
      };
      console.log('[Profile.save] upserting to profiles:', payload);

      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .upsert(payload, { onConflict: 'id' });
        if (error) {
          console.error('[Profile.save] upsert error:', error);
        } else {
          console.log('[Profile.save] upsert success:', data);
        }
      } catch (e) {
        console.error('[Profile.save] upsert threw:', e);
      }
    },

  };

  // ─── STATS ───────────────────────────────────────────────
  // Derived — never stored, always computed from rounds

  const Stats = {

    totalCoursesPlayed() {
      return Rounds.getPlayedCourseIds().length;
    },

    totalRounds() {
      return Rounds.getAll().length;
    },

    bestScore() {
      const scores = Rounds.getAll()
        .map(r => r.score)
        .filter(s => s !== null);
      return scores.length ? Math.min(...scores) : null;
    },

    roundsThisYear() {
      const year = new Date().getFullYear();
      return Rounds.getAll().filter(r =>
        new Date(r.date).getFullYear() === year
      ).length;
    },

    newCoursesThisYear() {
      const year = new Date().getFullYear();
      const thisYear = Rounds.getAll().filter(r =>
        new Date(r.date).getFullYear() === year
      );
      return [...new Set(thisYear.map(r => r.courseId))].length;
    },

  };

  // ─── SETTINGS ────────────────────────────────────────────

  const Settings = {

    get() {
      return read(KEYS.SETTINGS) || {
        units: 'yards',
        notifications_rounds: false,
        notifications_followers: false,
        notifications_comments: false,
        notifications_weekly: false,
        privacy_private: false,
        privacy_show_handicap: true,
        privacy_show_scores: true,
        privacy_passport: true,
        social_allow_follow: true,
        social_leaderboards: true,
        social_nearby: true,
      };
    },

    save(changes) {
      const current = Settings.get();
      write(KEYS.SETTINGS, { ...current, ...changes });
    },

  };

  // ─── POSTS ───────────────────────────────────────────────────────────────
  // A post is a deliberately shared round. Separate from the round itself.
  //
  // Post shape:
  // {
  //   id:        'post_1719836400000',
  //   roundId:   'round_1719836400000',
  //   courseId:  'course_123',
  //   courseName:'Royal Birkdale',
  //   date:      '2024-05-16',
  //   caption:   'Great day out',
  //   photos:    [],          // array of base64 strings
  //   createdAt: 1719836400000
  // }

  const Posts = {

    _cache: null,

    _fromRow(row) {
      let photos = [];
      if (Array.isArray(row.photos)) {
        photos = row.photos; // already parsed (from localStorage cache)
      } else {
        try { photos = JSON.parse(row.photos || '[]'); } catch (_) {}
      }
      const likeCount    = Array.isArray(row.likes)    ? (row.likes[0]?.count    ?? 0) : 0;
      const commentCount = Array.isArray(row.comments) ? (row.comments[0]?.count ?? 0) : 0;
      return {
        id:           row.id,
        roundId:      row.round_id   || null,
        courseId:     row.course_id  || '',
        courseName:   row.course_name || '',
        date:         row.date       || '',
        caption:      row.caption    || '',
        score:        row.score      ?? null,
        photos,
        likeCount,
        commentCount,
        createdAt:    new Date(row.created_at).getTime(),
      };
    },

    // Sync — returns in-memory cache. Always populated after getAll() resolves.
    getCached() {
      return Posts._cache || read(KEYS.POSTS) || [];
    },

    getCachedSorted() {
      return Posts.getCached().slice().sort((a, b) => b.createdAt - a.createdAt);
    },

    getCachedById(postId) {
      return Posts.getCached().find(p => p.id === postId) || null;
    },

    // Stays local-only — roundId is not stored in Supabase this phase
    getByRoundId(roundId) {
      return Posts.getCached().find(p => p.roundId === roundId) || null;
    },

    async getAll() {
      if (Posts._cache) return Posts._cache;

      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}

      if (!session) {
        Posts._cache = read(KEYS.POSTS) || [];
        return Posts._cache;
      }

      try {
        const { data, error } = await supabaseClient
          .from('posts')
          .select('*, likes(count), comments(count)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Replace localStorage with clean Supabase data, evicting any pre-migration posts
        Posts._cache = data.map(Posts._fromRow);
        write(KEYS.POSTS, Posts._cache);
        return Posts._cache;
      } catch (e) {
        console.warn('DB.Posts.getAll fell back to cache', e);
        Posts._cache = read(KEYS.POSTS) || [];
        return Posts._cache;
      }
    },

    async getAllSorted() {
      const all = await Posts.getAll();
      return all.slice().sort((a, b) => b.createdAt - a.createdAt);
    },

    // Fetches all posts from all users for the discover tab.
    // Does a single batch profiles lookup to attach display_name + handle.
    async getAllDiscover() {
      try {
        const { data: rows, error } = await supabaseClient
          .from('posts')
          .select('*, likes(count), comments(count)')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Collect unique user_ids and fetch their profiles in one query
        const userIds = [...new Set(rows.map(r => r.user_id))];
        let profileMap = {};
        if (userIds.length) {
          const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, handle, display_name')
            .in('id', userIds);
          (profiles || []).forEach(p => { profileMap[p.id] = p; });
        }

        return rows.map(row => {
          const prof = profileMap[row.user_id] || {};
          return {
            ...Posts._fromRow(row),
            authorName:   prof.display_name || prof.handle || 'Unknown',
            authorHandle: prof.handle ? '@' + prof.handle : '',
          };
        });
      } catch (e) {
        console.warn('DB.Posts.getAllDiscover fell back to cache', e);
        return Posts.getCachedSorted();
      }
    },

    async getById(postId) {
      const all = await Posts.getAll();
      return all.find(p => p.id === postId) || null;
    },

    async add({ roundId, courseId, courseName, date, caption, photos, score }) {
      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}

      if (!session) throw new Error('You must be signed in to create a post.');

      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          user_id:     session.user.id,
          course_id:   courseId   || '',
          course_name: courseName || '',
          date:        date       || '',
          caption:     caption    || '',
          score:       score      ?? null,
          photos:      JSON.stringify(photos || []),
        })
        .select('*')
        .single();

      if (error) throw error;

      const post = Posts._fromRow({ ...data, round_id: roundId });

      if (Posts._cache) Posts._cache.unshift(post);
      const stored = read(KEYS.POSTS) || [];
      stored.unshift(post);
      write(KEYS.POSTS, stored);
      return post;
    },

    update(postId, changes) {
      if (Posts._cache) {
        Posts._cache = Posts._cache.map(p => p.id === postId ? { ...p, ...changes } : p);
      }
      const posts = (read(KEYS.POSTS) || []).map(p => p.id === postId ? { ...p, ...changes } : p);
      write(KEYS.POSTS, posts);
    },

    async remove(postId) {
      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}

      if (!session) throw new Error('You must be signed in to delete a post.');

      const { error } = await supabaseClient
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      if (Posts._cache) Posts._cache = Posts._cache.filter(p => p.id !== postId);
      write(KEYS.POSTS, (read(KEYS.POSTS) || []).filter(p => p.id !== postId));
    },

  };

  // ─── FOLLOWING ───────────────────────────────────────────────────────────
  // Stored as array of handles the user follows e.g. ['@jameswilson', '@louis']

  const Following = {

    getAll() {
      return read(KEYS.FOLLOWING) || [];
    },

    has(handle) {
      return Following.getAll().includes(handle);
    },

    add(handle) {
      const list = Following.getAll();
      if (!list.includes(handle)) {
        list.push(handle);
        write(KEYS.FOLLOWING, list);
      }
    },

    remove(handle) {
      write(KEYS.FOLLOWING, Following.getAll().filter(h => h !== handle));
    },

    toggle(handle) {
      Following.has(handle) ? Following.remove(handle) : Following.add(handle);
      return Following.has(handle);
    },

  };

  // ─── LIKES ───────────────────────────────────────────────────────────────

  const Likes = {

    _cache: null, // Set of liked post IDs for the current user

    // Fetch all liked post IDs for the current user upfront.
    // Call once on page load; has() stays sync thereafter.
    async loadCache() {
      if (Likes._cache) return;

      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}

      if (!session) { Likes._cache = new Set(); return; }

      try {
        const { data, error } = await supabaseClient
          .from('likes')
          .select('post_id')
          .eq('user_id', session.user.id);

        if (error) throw error;
        Likes._cache = new Set((data || []).map(r => r.post_id));
      } catch (e) {
        console.warn('DB.Likes.loadCache failed', e);
        Likes._cache = new Set();
      }
    },

    has(postId) {
      return Likes._cache ? Likes._cache.has(postId) : false;
    },

    async toggle(postId) {
      const wasLiked = Likes.has(postId);

      // Optimistic update
      if (wasLiked) { Likes._cache.delete(postId); } else { Likes._cache.add(postId); }
      const isNowLiked = !wasLiked;

      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}

      if (!session) return isNowLiked;

      try {
        if (wasLiked) {
          const { error } = await supabaseClient
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', session.user.id);
          if (error) throw error;
        } else {
          const { error } = await supabaseClient
            .from('likes')
            .insert({ post_id: postId, user_id: session.user.id });
          if (error) throw error;
        }
      } catch (e) {
        // Roll back optimistic update
        console.warn('DB.Likes.toggle failed, rolling back', e);
        if (wasLiked) { Likes._cache.add(postId); } else { Likes._cache.delete(postId); }
        return wasLiked;
      }

      return isNowLiked;
    },

  };

  // ─── COMMENTS ────────────────────────────────────────────────────────────

  const Comments = {

    _cache: {}, // { [postId]: comment[] }

    // Fetch all comments for a post and cache them.
    async loadForPost(postId) {
      try {
        const { data, error } = await supabaseClient
          .from('comments')
          .select('id, post_id, user_id, handle, text, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        Comments._cache[postId] = (data || []).map(Comments._fromRow);
      } catch (e) {
        console.warn('DB.Comments.loadForPost failed', e);
        if (!Comments._cache[postId]) Comments._cache[postId] = [];
      }
    },

    _fromRow(row) {
      return {
        id:        row.id,
        postId:    row.post_id,
        userId:    row.user_id,
        handle:    row.handle || '',
        text:      row.text   || '',
        createdAt: new Date(row.created_at).getTime(),
      };
    },

    getForPost(postId) {
      return Comments._cache[postId] || [];
    },

    countForPost(postId) {
      return Comments.getForPost(postId).length;
    },

    async add({ postId, text }) {
      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}

      if (!session) throw new Error('You must be signed in to comment.');

      const profile = DB.Profile.getCached();
      const handle  = profile.handle || '';

      const { data, error } = await supabaseClient
        .from('comments')
        .insert({ post_id: postId, user_id: session.user.id, handle, text })
        .select()
        .single();

      if (error) throw error;

      const comment = Comments._fromRow(data);
      if (!Comments._cache[postId]) Comments._cache[postId] = [];
      Comments._cache[postId].push(comment);
      return comment;
    },

    async remove(commentId, postId) {
      let session = null;
      try { ({ data: { session } } = await supabaseClient.auth.getSession()); } catch (_) {}

      if (!session) return;

      const { error } = await supabaseClient
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      if (Comments._cache[postId]) {
        Comments._cache[postId] = Comments._cache[postId].filter(c => c.id !== commentId);
      }
    },

  };

  // ─── AUTH ────────────────────────────────────────────────────────────────

  const Auth = {

    getSession() {
      return read(KEYS.SESSION) || null;
    },

    isLoggedIn() {
      const session = Auth.getSession();
      return !!(session && session.loggedIn);
    },

    login({ handle, name }) {
      write(KEYS.SESSION, { handle, name, loggedIn: true });
    },

    logout() {
      try { localStorage.removeItem(KEYS.SESSION); } catch (e) {}
    },

  };

  // ─── DEBUG ───────────────────────────────────────────────────────────────
  // Call DB.debug() in browser console to inspect all stored data

  function debug() {
    console.group('Green DB');
    console.log('Rounds:',     Rounds.getAll());
    console.log('Wishlist:',   Wishlist.getAll());
    console.log('Favourites:', Favourites.getAll());
    console.log('Profile:',    Profile.getCached());
    console.log('Settings:',   Settings.get());
    console.log('Comments:',   Comments.getAll());
    console.log('Stats:',      {
      totalCoursesPlayed: Stats.totalCoursesPlayed(),
      totalRounds:        Stats.totalRounds(),
      bestScore:          Stats.bestScore(),
      roundsThisYear:     Stats.roundsThisYear(),
      newCoursesThisYear: Stats.newCoursesThisYear(),
    });
    console.groupEnd();
  }

  // ─── PUBLIC API ──────────────────────────────────────────
  return { Rounds, Played, Wishlist, Favourites, Profile, Stats, Settings, Likes, Posts, Following, Comments, Auth, debug };

})();