document.addEventListener('DOMContentLoaded', function() {
    const reminderForm = document.getElementById('add-reminder');
    const remindersList = document.getElementById('reminders-list');
    const notificationElement = document.getElementById('notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');
    
    // Check if browser supports notifications
    let notificationsSupported = 'Notification' in window;
    
    // Request notification permission on page load
    if (notificationsSupported) {
        requestNotificationPermission();
    }
    
    // Function to request notification permission
    async function requestNotificationPermission() {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            await Notification.requestPermission();
        }
    }
    
    // Register service worker for push notifications
    async function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered with scope:', registration.scope);
                return registration;
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
                return null;
            }
        }
        return null;
    }
    
    // Subscribe to push notifications
    async function subscribeToPushNotifications() {
        try {
            const registration = await registerServiceWorker();
            if (!registration) return;
            
            // Check for existing subscription and unsubscribe if present to avoid stale subscriptions
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('Found existing stale subscription, unsubscribing...');
                await existingSubscription.unsubscribe();
                // Also notify the server to remove the old subscription from the database
                await fetch('/unsubscribe', { method: 'POST' });
                console.log('Old subscription removed from browser and server.');
            }
            
            const response = await fetch('/api/vapid-public-key');
            const publicKey = await response.text();
            
            console.log('Subscribing with new key...');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
            
            // Send the new subscription object to the server
            await fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });
            
            console.log('Push notification subscription successful');
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
        }
    }
    
    // Utility function to convert base64 to Uint8Array for VAPID key
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
            
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    // Load all reminders from the server
    async function loadReminders() {
        try {
            const response = await fetch('/api/scheduled-notifications');
            if (response.ok) {
                const reminders = await response.json();
                displayReminders(reminders);
            } else {
                showNotification('Error', 'Failed to load reminders');
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
            showNotification('Error', 'Failed to load reminders');
        }
    }
    
    // Display reminders in the UI
    function displayReminders(reminders) {
        remindersList.innerHTML = '';
        
        if (reminders.length === 0) {
            remindersList.innerHTML = '<p>No reminders scheduled.</p>';
            return;
        }
        
        reminders.forEach(reminder => {
            const reminderItem = document.createElement('div');
            reminderItem.className = 'reminder-item';
            
            const reminderDate = new Date(reminder.time);
            const formattedDateTime = formatDateTime(reminderDate);
            
            reminderItem.innerHTML = `
                <div class="reminder-info">
                    <h3>${reminder.title}</h3>
                    <p>${reminder.message}</p>
                    <p class="reminder-time">${formattedDateTime}</p>
                </div>
                <div class="reminder-actions">
                    <button class="toggle-btn ${reminder.active ? 'active' : ''}" data-id="${reminder._id}">
                        <i class="fas ${reminder.active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                    </button>
                    <button class="edit-btn" data-id="${reminder._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${reminder._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            remindersList.appendChild(reminderItem);
        });
        
        // Add event listeners to toggle, edit and delete buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', handleToggleReminder);
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditReminder);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteReminder);
        });
    }
    
    // Format date and time for display
    function formatDateTime(date) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Handle adding a new reminder
    async function handleAddReminder(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('reminder-title');
        const messageInput = document.getElementById('reminder-message');
        const timeInput = document.getElementById('reminder-time');
        
        const title = titleInput.value.trim();
        const message = messageInput.value.trim();
        const time = timeInput.value;
        
        if (!title || !message || !time) {
            showNotification('Error', 'Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch('/api/schedule-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    message,
                    time: new Date(time).toISOString()
                })
            });
            
            if (response.ok) {
                showNotification('Success', 'Reminder scheduled successfully');
                titleInput.value = '';
                messageInput.value = '';
                timeInput.value = '';
                loadReminders();
                
                // Subscribe to push notifications if supported
                if (notificationsSupported) {
                    subscribeToPushNotifications();
                }
            } else {
                const errorData = await response.json();
                showNotification('Error', errorData.message || 'Failed to schedule reminder');
            }
        } catch (error) {
            console.error('Error scheduling reminder:', error);
            showNotification('Error', 'Failed to schedule reminder');
        }
    }
    
    // Handle toggling a reminder's active status
    async function handleToggleReminder(e) {
        const reminderId = e.currentTarget.getAttribute('data-id');
        
        try {
            const response = await fetch(`/api/schedule-notification/${reminderId}/toggle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                loadReminders();
                showNotification('Success', 'Reminder status updated');
            } else {
                showNotification('Error', 'Failed to update reminder status');
            }
        } catch (error) {
            console.error('Error toggling reminder:', error);
            showNotification('Error', 'Failed to update reminder status');
        }
    }
    
    // Handle editing a reminder
    async function handleEditReminder(e) {
        const reminderId = e.currentTarget.getAttribute('data-id');
        const reminderItem = e.currentTarget.closest('.reminder-item');
        const title = reminderItem.querySelector('h3').textContent;
        const message = reminderItem.querySelector('p').textContent;
        
        // Populate the form with the reminder's data
        document.getElementById('reminder-title').value = title;
        document.getElementById('reminder-message').value = message;
        
        // Convert the edit button to an update button
        reminderForm.textContent = 'Update Reminder';
        reminderForm.setAttribute('data-editing', 'true');
        reminderForm.setAttribute('data-reminder-id', reminderId);
        
        // Scroll to the form
        document.querySelector('.notification-form').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Handle updating a reminder
    async function handleUpdateReminder(reminderId) {
        const titleInput = document.getElementById('reminder-title');
        const messageInput = document.getElementById('reminder-message');
        const timeInput = document.getElementById('reminder-time');
        
        const title = titleInput.value.trim();
        const message = messageInput.value.trim();
        const time = timeInput.value;
        
        if (!title || !message || !time) {
            showNotification('Error', 'Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch(`/api/schedule-notification/${reminderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    message,
                    time: new Date(time).toISOString()
                })
            });
            
            if (response.ok) {
                showNotification('Success', 'Reminder updated successfully');
                titleInput.value = '';
                messageInput.value = '';
                timeInput.value = '';
                
                // Reset the form
                reminderForm.textContent = 'Add Reminder';
                reminderForm.removeAttribute('data-editing');
                reminderForm.removeAttribute('data-reminder-id');
                
                loadReminders();
            } else {
                const errorData = await response.json();
                showNotification('Error', errorData.message || 'Failed to update reminder');
            }
        } catch (error) {
            console.error('Error updating reminder:', error);
            showNotification('Error', 'Failed to update reminder');
        }
    }
    
    // Handle deleting a reminder
    async function handleDeleteReminder(e) {
        const reminderId = e.currentTarget.getAttribute('data-id');
        
        if (confirm('Are you sure you want to delete this reminder?')) {
            try {
                const response = await fetch(`/api/cancel-notification/${reminderId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showNotification('Success', 'Reminder deleted successfully');
                    loadReminders();
                } else {
                    showNotification('Error', 'Failed to delete reminder');
                }
            } catch (error) {
                console.error('Error deleting reminder:', error);
                showNotification('Error', 'Failed to delete reminder');
            }
        }
    }
    
    // Show in-app notification
    function showNotification(title, message) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notificationElement.classList.remove('hidden');
        notificationElement.classList.add('show');
        
        setTimeout(() => {
            notificationElement.classList.remove('show');
            setTimeout(() => {
                notificationElement.classList.add('hidden');
            }, 300);
        }, 3000);
    }
    
    // Event listeners
    if (reminderForm) {
        reminderForm.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.hasAttribute('data-editing')) {
                const reminderId = this.getAttribute('data-reminder-id');
                handleUpdateReminder(reminderId);
            } else {
                handleAddReminder(e);
            }
        });
    }
    
    if (notificationClose) {
        notificationClose.addEventListener('click', function() {
            notificationElement.classList.remove('show');
            setTimeout(() => {
                notificationElement.classList.add('hidden');
            }, 300);
        });
    }
    
    // Initialize the page
    loadReminders();
    
    // If notifications are supported, try to subscribe
    if (notificationsSupported) {
        subscribeToPushNotifications();
    }
});