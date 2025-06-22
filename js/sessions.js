function initializeSessionsPage() {
    const sessionsList = document.getElementById('sessions-list');

    if (!sessionsList) return; // Exit if the container is not on the page

    function parseUserAgent(userAgent) {
        // This is a simple parser. A more robust library could be used for more detail.
        let browser = 'Unknown Browser';
        let os = 'Unknown OS';

        // Basic Browser Detection
        if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';
        else if (userAgent.includes('Edge')) browser = 'Edge';

        // Basic OS Detection
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Macintosh')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('like Mac OS X')) os = 'iOS';

        return { browser, os };
    }

    async function loadSessions() {
        try {
            const response = await fetch('/api/sessions');
            if (!response.ok) {
                throw new Error('Failed to load sessions.');
            }
            const sessions = await response.json();

            if (sessions.length === 0) {
                sessionsList.innerHTML = `
                    <div class="alert alert-info">
                        <p>No active sessions found.</p>
                        <button id="refresh-sessions" class="btn btn-primary mt-2">Refresh Sessions</button>
                    </div>`;
                
                document.getElementById('refresh-sessions')?.addEventListener('click', loadSessions);
                return;
            }

            const table = document.createElement('table');
            table.className = 'table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Device</th>
                        <th>Location (IP)</th>
                        <th>Last Login</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
            const tbody = table.querySelector('tbody');

            sessions.forEach(session => {
                const deviceInfo = parseUserAgent(session.userAgent || 'Unknown');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="device-info">
                            <strong>${deviceInfo.browser}</strong> on <strong>${deviceInfo.os}</strong>
                            ${session.isCurrent ? '<span class="badge bg-success">Current Session</span>' : ''}
                        </div>
                    </td>
                    <td>${session.ip || 'Unknown'}</td>
                    <td>${new Date(session.loginTime).toLocaleString()}</td>
                    <td>
                        ${!session.isCurrent ? `<button class="btn btn-danger btn-sm logout-btn" data-id="${session.id}">Log out</button>` : ''}
                    </td>
                `;
                tbody.appendChild(tr);
            });

            sessionsList.innerHTML = `
                <div class="mb-3">
                    <button id="refresh-sessions" class="btn btn-outline-primary btn-sm">Refresh Sessions</button>
                </div>
            `;
            sessionsList.appendChild(table);

            // Add event listeners to logout buttons
            document.querySelectorAll('.logout-btn').forEach(button => {
                button.addEventListener('click', handleLogout);
            });
            
            // Add event listener to refresh button
            document.getElementById('refresh-sessions').addEventListener('click', loadSessions);

        } catch (error) {
            console.error('Error loading sessions:', error);
            sessionsList.innerHTML = `
                <div class="alert alert-danger">
                    <p>Could not load session information.</p>
                    <p>Error: ${error.message}</p>
                    <button id="refresh-sessions" class="btn btn-primary mt-2">Try Again</button>
                </div>`;
            
            document.getElementById('refresh-sessions')?.addEventListener('click', loadSessions);
        }
    }

    async function handleLogout(event) {
        const sessionId = event.target.dataset.id;
        if (!confirm('Are you sure you want to log out this session?')) {
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Reload sessions to show the updated list
                loadSessions();
            } else {
                const errorData = await response.text();
                alert(`Failed to log out session: ${errorData}`);
            }
        } catch (error) {
            console.error('Error logging out session:', error);
            alert('An error occurred while trying to log out the session.');
        }
    }

    loadSessions();
} 