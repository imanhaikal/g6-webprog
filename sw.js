self.addEventListener('push', event => {
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'New Notification',
            body: event.data.text(),
        };
    }

    const options = {
        body: data.body,
        icon: 'img/icons/icon-192x192.png',
        badge: 'img/icons/icon-96x96.png'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
}); 