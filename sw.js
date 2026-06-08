// Green PWA | Service Worker — caching and offline support

const CACHE_NAME = 'green-v9';

const STATIC_ASSETS = [
  '.',
  'index.html',
  'offline.html',
  'create-account.html',
  'login.html',
  'courses.html',
  'course.html',
  'passport.html',
  'profile.html',
  'achievements.html',
  'settings.html',
  'feed.html',
  'post.html',
  'player.html',
  'manifest.json',
  'ukLow.svg',
  'css/base.css',
  'css/pages/auth.css',
  'css/layout.css',
  'css/pages/course.css',
  'css/pages/courses.css',
  'css/pages/feed.css',
  'css/pages/home.css',
  'css/pages/passport.css',
  'css/pages/post.css',
  'css/pages/profile.css',
  'css/pages/achievements.css',
  'css/pages/settings.css',
  'js/db.js',
  'js/components/map.js',
  'js/components/nav.js',
  'js/components/sheets.js',
  'js/components/toast.js',
  'js/data/courses-data.js',
  'js/pages/course.js',
  'js/pages/courses.js',
  'js/pages/feed.js',
  'js/pages/home.js',
  'js/pages/passport.js',
  'js/pages/post.js',
  'js/pages/profile.js',
  'js/pages/achievements.js',
  'js/pages/settings.js',
];

// Install — cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first, fall back to network, offline.html for failed navigations
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('offline.html');
        }
      })
  );
});