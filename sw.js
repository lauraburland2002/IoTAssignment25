// Service Worker for AirVote application
// Handles push notifications and notification clicks

const APP_NAME = 'AirVote';
const DEFAULT_URL = '/index.html';
const DEFAULT_ICON = `${APP_NAME}.png`;

// Handle incoming push events
self.addEventListener('push', function(event) {
    // Try to parse the data as JSON, fall back to text if not valid JSON
    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = {
            title: `${APP_NAME} - It's Time To Vote!`,
            body: event.data.text(),
            url: DEFAULT_URL
        };
    }

    // Set up notification options
    const options = {
        body: payload.body,
        icon: payload.icon || DEFAULT_ICON,
        badge: payload.badge || DEFAULT_ICON,
        data: {
            url: payload.url || DEFAULT_URL
        }
    };

    // Show the notification
    event.waitUntil(
        self.registration.showNotification(payload.title || `${APP_NAME} - Notification`, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    // Close the notification
    event.notification.close();

    // Get the URL to open (from data or use default)
    const urlToOpen = event.notification.data?.url || DEFAULT_URL;

    // This looks to see if the current is already open and focuses it
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then(function(clientList) {
            // Check if there's already a window/tab open with the target URL
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // If no matching window found, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Optional: Cache static assets for offline use
const CACHE_NAME = 'airvote-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/faq.js',
    '/AirVote.png',
    // Add other assets as needed
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});