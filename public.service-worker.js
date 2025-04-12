self.addEventListener('push', function(event) {
    let options = {
        body: event.data.text(), // The notification body
        icon: 'icon.png',  // Your app's icon
        badge: 'badge.png' // Your app's badge icon
    };

    event.waitUntil(
        self.registration.showNotification('AirVote - It\'s Time To Vote!', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Redirect to voting page when notification is clicked
    event.waitUntil(
        clients.openWindow('/index.html')  // Adjust to your actual voting page URL
    );
});
