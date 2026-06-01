// Green PWA | API — UK Golf Course Data API via RapidAPI

const API = (() => {

  // ─── CONFIG ─────────────────────────────────────────────
  const BASE_URL = 'https://uk-golf-course-data-api.p.rapidapi.com';
  const API_KEY  = '6f96899fddmsh9b22ce571e8e726p12fccajsnb64f1850317b'; // replace with your RapidAPI key

  const HEADERS = {
    'Content-Type':   'application/json',
    'x-rapidapi-host':'uk-golf-course-data-api.p.rapidapi.com',
    'x-rapidapi-key': API_KEY,
  };

  // ─── CACHE ──────────────────────────────────────────────
  // All API responses are cached in localStorage to protect
  // the 200 requests/month limit on the free plan.
  // Cache expires after 7 days.

  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const CACHE_PREFIX = 'green_api_';

  const Cache = {

    key(endpoint) {
      return CACHE_PREFIX + endpoint.replace(/\//g, '_');
    },

    get(endpoint) {
      try {
        const raw = localStorage.getItem(Cache.key(endpoint));
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp > CACHE_TTL) {
          localStorage.removeItem(Cache.key(endpoint));
          return null;
        }
        return data;
      } catch (e) {
        return null;
      }
    },

    set(endpoint, data) {
      try {
        localStorage.setItem(Cache.key(endpoint), JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('API cache write failed', e);
      }
    },

    clear() {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    },

  };

  // ─── FETCH HELPER ────────────────────────────────────────
  async function request(path, params = {}, useCache = true) {
    const query = new URLSearchParams(params).toString();
    const endpoint = path + (query ? '?' + query : '');

    if (useCache) {
      const cached = Cache.get(endpoint);
      if (cached) {
        console.log('API cache hit:', endpoint);
        return cached;
      }
    }

    console.log('API request:', endpoint);

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method:  'GET',
      headers: HEADERS,
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${path}`);
    }

    const data = await res.json();
    if (useCache) Cache.set(endpoint, data);
    return data;
  }

  // ─── CLUBS ──────────────────────────────────────────────
  // A "club" from the API maps to what we call a "course" in the UI.
  // Some clubs have multiple courses — we'll handle that later via
  // get_club_courses when building the course detail page.

  const Clubs = {

    // List clubs with optional filters
    // params: { page, per_page, county, country_code, course_type }
    async list(params = {}) {
      const defaults = { per_page: 20, page: 1, country_code: 'ENG' };
      return request('/clubs', { ...defaults, ...params });
    },

    // Get a single club by UUID
    async get(clubId) {
      return request(`/clubs/${clubId}`);
    },

    // Get courses for a club
    async getCourses(clubId) {
      return request(`/clubs/${clubId}/courses`);
    },

    // Nearby clubs — requires lat/lng
    async nearby(lat, lng, params = {}) {
      return request('/clubs/nearby', { latitude: lat, longitude: lng, ...params });
    },

    // Search clubs by name — filters client-side from cached list
    // to avoid burning API requests on every keystroke
    async search(query, page = 1) {
      const data = await Clubs.list({ page, per_page: 50 });
      if (!query) return data;
      const q = query.toLowerCase();
      return {
        ...data,
        clubs: data.clubs.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.county?.toLowerCase().includes(q)
        ),
      };
    },

  };

  // ─── REGIONS ────────────────────────────────────────────
  const Regions = {

    async list() {
      return request('/regions');
    },

    async get(regionId) {
      return request(`/regions/${regionId}`);
    },

    async getClubs(regionId, params = {}) {
      return request(`/regions/${regionId}/clubs`, params);
    },

  };

  // ─── COURSES ────────────────────────────────────────────
  const Courses = {

    async get(courseId) {
      return request(`/courses/${courseId}`);
    },

    async getScorecard(courseId) {
      return request(`/courses/${courseId}/scorecard`);
    },

  };

  // ─── NORMALISE ───────────────────────────────────────────
  // Convert API club shape into a consistent internal shape
  // used throughout the app. Call this on every club from the API.
  //
  // Internal course shape:
  // {
  //   id:          'a1b2c3d4-...',
  //   name:        'Sunningdale Golf Club',
  //   city:        'Sunningdale',
  //   county:      'Surrey',
  //   postcode:    'SL5 9RR',
  //   countryCode: 'ENG',
  //   lat:         51.3894,
  //   lng:         -0.6356,
  //   rating:      4.7,
  //   clubType:    'private',
  //   courseType:  'heathland',
  // }

  function normalise(club) {
    return {
      id:          club.id,
      name:        club.name,
      city:        club.city        || '',
      county:      club.county      || '',
      postcode:    club.postcode    || '',
      countryCode: club.country_code|| 'ENG',
      lat:         club.latitude    || null,
      lng:         club.longitude   || null,
      rating:      club.google_rating || null,
      clubType:    club.club_type   || '',
      courseType:  club.course_type || '',
    };
  }

  // ─── DEBUG ───────────────────────────────────────────────
  function debug() {
    const cacheKeys = Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX));
    console.group('Green API Cache');
    console.log(`${cacheKeys.length} cached endpoints:`);
    cacheKeys.forEach(k => console.log(' ', k));
    console.groupEnd();
  }

  // ─── PUBLIC API ──────────────────────────────────────────
  return { Clubs, Regions, Courses, normalise, Cache, debug };

})();