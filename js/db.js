// Green PWA | DB — localStorage abstraction layer

const DB = (() => {

  // ─── KEYS ───────────────────────────────────────────────
  const KEYS = {
    ROUNDS:    'green_rounds',
    WISHLIST:  'green_wishlist',
    FAVOURITES:'green_favourites',
    PROFILE:   'green_profile',
    SETTINGS:  'green_settings',
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
    getAll() { return read('green_played') || []; },
    has(courseId) { return Played.getAll().includes(courseId); },
    add(courseId) {
      const list = Played.getAll();
      if (!list.includes(courseId)) { list.push(courseId); write('green_played', list); }
    },
    remove(courseId) { write('green_played', Played.getAll().filter(id => id !== courseId)); },
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

    get() {
      return read(KEYS.PROFILE) || {
        name:       '',
        handle:     '',
        homeCourse: null,
        handicap:   null,
        avatar:     null,
      };
    },

    save(changes) {
      const current = Profile.get();
      write(KEYS.PROFILE, { ...current, ...changes });
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

    getAll() {
      return read('green_posts') || [];
    },

    getAllSorted() {
      return Posts.getAll().sort((a, b) => b.createdAt - a.createdAt);
    },

    getById(postId) {
      return Posts.getAll().find(p => p.id === postId) || null;
    },

    getByRoundId(roundId) {
      return Posts.getAll().find(p => p.roundId === roundId) || null;
    },

    add({ roundId, courseId, courseName, date, caption, photos }) {
      const posts = Posts.getAll();
      const post  = {
        id:         `post_${Date.now()}`,
        roundId,
        courseId,
        courseName,
        date,
        caption:    caption || '',
        photos:     photos  || [],
        createdAt:  Date.now(),
      };
      posts.push(post);
      write('green_posts', posts);
      return post;
    },

    update(postId, changes) {
      const posts = Posts.getAll().map(p =>
        p.id === postId ? { ...p, ...changes } : p
      );
      write('green_posts', posts);
    },

    remove(postId) {
      write('green_posts', Posts.getAll().filter(p => p.id !== postId));
    },

  };

  // ─── FOLLOWING ───────────────────────────────────────────────────────────
  // Stored as array of handles the user follows e.g. ['@jameswilson', '@louis']

  const Following = {

    getAll() {
      return read('green_following') || [];
    },

    has(handle) {
      return Following.getAll().includes(handle);
    },

    add(handle) {
      const list = Following.getAll();
      if (!list.includes(handle)) {
        list.push(handle);
        write('green_following', list);
      }
    },

    remove(handle) {
      write('green_following', Following.getAll().filter(h => h !== handle));
    },

    toggle(handle) {
      Following.has(handle) ? Following.remove(handle) : Following.add(handle);
      return Following.has(handle);
    },

  };

  // ─── LIKES ───────────────────────────────────────────────────────────────
  // Stored as array of round IDs the user has liked

  const Likes = {

    getAll() {
      return read('green_likes') || [];
    },

    has(roundId) {
      return Likes.getAll().includes(roundId);
    },

    add(roundId) {
      const list = Likes.getAll();
      if (!list.includes(roundId)) {
        list.push(roundId);
        write('green_likes', list);
      }
    },

    remove(roundId) {
      write('green_likes', Likes.getAll().filter(id => id !== roundId));
    },

    toggle(roundId) {
      Likes.has(roundId) ? Likes.remove(roundId) : Likes.add(roundId);
      return Likes.has(roundId);
    },

  };

  // ─── DEBUG ───────────────────────────────────────────────────────────────
  // Call DB.debug() in browser console to inspect all stored data

  function debug() {
    console.group('Green DB');
    console.log('Rounds:',     Rounds.getAll());
    console.log('Wishlist:',   Wishlist.getAll());
    console.log('Favourites:', Favourites.getAll());
    console.log('Profile:',    Profile.get());
    console.log('Settings:',   Settings.get());
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
  return { Rounds, Played, Wishlist, Favourites, Profile, Stats, Settings, Likes, Posts, Following, debug };

})();