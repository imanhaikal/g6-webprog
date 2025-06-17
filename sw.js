self.addEventListener('push', event => {
    const data = event.data.json();

    const notificationPromise = self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/img/icons/icon-192x192.png'
    });

    // Send a message to the client (the web page) if it's open
    const messagePromise = self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clientList => {
        if (clientList.length > 0) {
            clientList[0].postMessage({
                type: 'show-in-app-alert',
                payload: data
            });
        }
    });

    event.waitUntil(Promise.all([notificationPromise, messagePromise]));
}); 