// Green PWA | Service Worker — caching and offline support

const CACHE_NAME = 'green-v1';

const STATIC_ASSETS = [
  '.',
  'index.html',
  'courses.html',
  'course.html',
  'passport.html',
  'profile.html',
  'achievements.html',
  'settings.html',
  'manifest.json',
  'ukLow.svg',
  'css/base.css',
  'css/layout.css',
  'css/components/badges.css',
  'css/components/buttons.css',
  'css/components/cards.css',
  'css/components/forms.css',
  'css/components/map.css',
  'css/components/modals.css',
  'css/components/progress.css',
  'css/pages/course.css',
  'css/pages/courses.css',
  'css/pages/home.css',
  'css/pages/passport.css',
  'css/pages/profile.css',
  'js/app.js',
  'js/db.js',
  'js/components/map.js',
  'js/components/modal.js',
  'js/components/nav.js',
  'js/components/toast.js',
  'js/data/courses-data.js',
  'js/pages/course.js',
  'js/pages/courses.js',
  'js/pages/home.js',
  'js/pages/passport.js',
  'js/pages/profile.js',
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

// Fetch — cache first, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});