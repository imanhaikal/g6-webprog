document.addEventListener('DOMContentLoaded', () => {
            // Load default page (dashboard)
            loadPage('dashboard');

            // Handle navigation clicks
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const navLink = e.target.closest('.nav-link');
                    const page = navLink.dataset.page;
                    const section = navLink.dataset.section;
                    
                    // Update active states
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    navLink.classList.add('active');
                    
                    // If clicking on a parent menu (not submenu item), also activate parent
                    if (!navLink.classList.contains('sub-nav-link')) {
                        // When clicking a parent menu item that has a submenu, 
                        // also activate its first submenu item if available
                        const firstSubmenu = navLink.closest('.nav-item').querySelector('.sub-nav-link');
                        if (firstSubmenu) {
                            firstSubmenu.classList.add('active');
                        }
                    } else {
                        // If clicking on a submenu item, also activate its parent
                        const parentItem = navLink.closest('ul').previousElementSibling;
                        if (parentItem && parentItem.classList.contains('nav-link')) {
                            parentItem.classList.add('active');
                        }
                    }
                    
                    // Update submenu visibility
                    updateSubmenuVisibility();
                    
                    // Load the page
                    loadPage(page, section);
                });
            });
            
            // Initial update for submenu visibility - with a slight delay to ensure DOM is fully rendered
            setTimeout(() => {
                updateSubmenuVisibility();
            }, 100);
            
            // Add event delegation for buttons with data-page attributes that might be added dynamically
            document.addEventListener('click', (e) => {
                // Check if the clicked element or its parent is a button with data-page attribute
                const button = e.target.closest('button[data-page]');
                if (button) {
                    const page = button.dataset.page;
                    const section = button.dataset.section;
                    loadPage(page, section);
                }
            });
        });

        function loadPage(page, section = null) {
            // Update page title
            const pageTitle = document.getElementById('pageTitle');
            const navLink = document.querySelector(`.nav-link[data-page="${page}"]:not(.sub-nav-link)`);
            if (pageTitle && navLink) {
                pageTitle.textContent = navLink.textContent.trim();
                
                // Set active state on the nav link
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                navLink.classList.add('active');
                
                // If this is a parent item and we have a section, activate the submenu item
                if (section) {
                    const submenuItem = document.querySelector(`.sub-nav-link[data-page="${page}"][data-section="${section}"]`);
                    if (submenuItem) {
                        submenuItem.classList.add('active');
                    }
                } else {
                    // If no section specified and this nav item has submenus, activate first submenu
                    const firstSubmenu = navLink.closest('.nav-item').querySelector('.sub-nav-link');
                    if (firstSubmenu) {
                        firstSubmenu.classList.add('active');
                    }
                }
                
                // Update submenu visibility
                updateSubmenuVisibility();
            }

            // Load the page content
            fetch(`${page}.html`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const content = doc.querySelector('.page-content');
                    
                    if (content) {
                        const mainContent = document.getElementById('mainContent');
                        mainContent.innerHTML = content.innerHTML;
                        
                        // If there's a section to scroll to
                        if (section) {
                            const sectionElement = document.getElementById(section);
                            if (sectionElement) {
                                sectionElement.scrollIntoView({ behavior: 'smooth' });
                            }
                        }

                        // Reinitialize any Bootstrap components in the new content
                        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                        tooltipTriggerList.map(function (tooltipTriggerEl) {
                            return new bootstrap.Tooltip(tooltipTriggerEl);
                        });
                        
                        // Initialize charts if we're on the progress page
                        if (page === 'progress') {
                            initializeCharts();
                        }

                        // Initialize weekly activity chart if we're on the dashboard page
                        if (page === 'dashboard') {
                            initializeDashboardCharts();
                        }

                        // Initialize fitness tracker if on fitness page
                        if (page === 'fitness') {
                            initializeFitnessTracker();
                        }

                        // Initialize all activities page
                        if (page === 'activities') {
                            displayAllActivities();
                        }
                    } else {
                        throw new Error('Content element not found in the loaded page');
                    }
                })
                .catch(error => {
                    console.error('Error loading page:', error);
                    document.getElementById('mainContent').innerHTML = `
                        <div class="alert alert-danger m-3">
                            <h4 class="alert-heading">Error Loading Content</h4>
                            <p>There was an error loading the page content. Please try again later.</p>
                            <hr>
                            <p class="mb-0">Error details: ${error.message}</p>
                        </div>`;
                });
        }

        // Function to initialize dashboard charts
        function initializeDashboardCharts() {
            console.log('Initializing dashboard charts...');
            
            // Check if the weekly activity chart exists
            const weeklyChartCanvas = document.getElementById('weeklyActivityChart');
            if (!weeklyChartCanvas) {
                console.error('Weekly activity chart canvas not found');
                return;
            }
            
            console.log('Weekly activity chart canvas found, initializing...');
            
            // Chart data
            const chartData = {
                steps: {
                    label: 'Steps',
                    data: [8421, 10254, 7592, 9873, 6420, 8532, 12045],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                },
                calories: {
                    label: 'Calories Burned',
                    data: [1850, 2102, 1745, 2231, 1654, 1932, 2345],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                },
                workouts: {
                    label: 'Workout Minutes',
                    data: [45, 60, 30, 75, 0, 45, 90],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                }
            };
            
            // Initialize the chart
            try {
                const ctx = weeklyChartCanvas.getContext('2d');
                
                // Create the chart
                const weeklyActivityChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                        datasets: [{
                            label: 'Steps',
                            data: chartData.steps.data,
                            backgroundColor: chartData.steps.backgroundColor,
                            borderColor: chartData.steps.borderColor,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    display: true,
                                    color: 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: '#666',
                                    font: {
                                        size: 12
                                    },
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: '#666',
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        label += context.parsed.y.toLocaleString();
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
                
                console.log('Weekly activity chart initialized');
                
                // Add event listeners to the metric buttons
                document.querySelectorAll('.btn-group[role="group"] .btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const metric = this.getAttribute('data-metric');
                        console.log('Metric button clicked:', metric);
                        
                        // Remove active class from all buttons
                        document.querySelectorAll('.btn-group[role="group"] .btn').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        
                        // Add active class to clicked button
                        this.classList.add('active');
                        
                        // Update chart based on selected metric
                        updateWeeklyChart(weeklyActivityChart, metric, chartData);
                    });
                });
            } catch (error) {
                console.error('Error creating weekly activity chart:', error);
            }
        }

        // Function to update the weekly chart based on selected metric
        function updateWeeklyChart(chart, metric, chartData) {
            console.log('Updating chart to metric:', metric);
            
            if (!chart) {
                console.error('Chart instance not available');
                return;
            }
            
            try {
                // Update dataset with new data
                chart.data.datasets[0].label = chartData[metric].label;
                chart.data.datasets[0].data = chartData[metric].data;
                chart.data.datasets[0].backgroundColor = chartData[metric].backgroundColor;
                chart.data.datasets[0].borderColor = chartData[metric].borderColor;
                
                // Update y-axis formatting based on metric
                if (metric === 'steps') {
                    chart.options.scales.y.ticks.callback = function(value) {
                        return value.toLocaleString();
                    };
                } else if (metric === 'calories') {
                    chart.options.scales.y.ticks.callback = function(value) {
                        return value.toLocaleString() + ' kcal';
                    };
                } else if (metric === 'workouts') {
                    chart.options.scales.y.ticks.callback = function(value) {
                        return value + ' min';
                    };
                }
                
                // Update the chart
                chart.update();
                console.log('Chart updated successfully');
            } catch (error) {
                console.error('Error updating chart:', error);
            }
        }

        // Function to initialize charts
        function initializeCharts() {
            // Goal Progress
            if (document.getElementById('goalChart')) {
                new Chart(document.getElementById('goalChart'), {
                    type: 'doughnut',
                    data: {
                      labels: ['Completed', 'Remaining'],
                      datasets: [{
                        data: [75, 25],
                        backgroundColor: ['#28a745', '#ddd']
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        }
                      }
                    }
                });
            }
            
            // Weekly Comparison
            if (document.getElementById('weeklyChart')) {
                new Chart(document.getElementById('weeklyChart'), {
                    type: 'bar',
                    data: {
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      datasets: [{
                        label: 'This Week',
                        backgroundColor: '#007bff',
                        data: [3000, 5000, 4000, 6500, 7000, 8000, 7500]
                      }, {
                        label: 'Last Week',
                        backgroundColor: '#6c757d',
                        data: [2500, 4200, 3900, 6000, 6700, 7000, 7200]
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { 
                          beginAtZero: true,
                          grid: {
                            display: true
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          align: 'center'
                        }
                      }
                    }
                });
            }
            
            // Weight Tracker
            if (document.getElementById('weightChart')) {
                new Chart(document.getElementById('weightChart'), {
                    type: 'line',
                    data: {
                      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                      datasets: [{
                        label: 'Weight (kg)',
                        borderColor: '#dc3545',
                        data: [70, 69.5, 69, 68.7],
                        fill: false,
                        tension: 0.2,
                        pointBackgroundColor: '#dc3545'
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: false,
                          grid: {
                            display: true
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      }
                    }
                });
            }
        }

        // Function to initialize fitness tracker-specific logic
        function initializeFitnessTracker() {
            const logActivityForm = document.getElementById('logActivityForm');
            
            if (logActivityForm) {
                logActivityForm.addEventListener('submit', function(event) {
                    event.preventDefault(); // Prevent default form submission

                    const formData = new FormData(logActivityForm);
                    const data = Object.fromEntries(formData.entries());

                    fetch('/log-activity', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    })
                    .then(response => {
                        if (response.ok) {
                            // alert('Activity logged successfully!');
                            //Instead of reloading, just refresh the activities list
                    displayRecentActivities();
                    logActivityForm.reset();
                    } else {
                           return response.text().then(text => { throw new Error(text) });
                        }
                    })
                    .catch(error => {
                        console.error('Error logging activity:', error);
                        alert('Failed to log activity: ' + error.message);
                            });
                        });
                    }
                    
            displayRecentActivities();
        }

        // Simple form validation function for fitness forms
        function validateFitnessForm(form) {
            let isValid = true;
            
            // Check required fields
            form.querySelectorAll('input:not([type="checkbox"]), select').forEach(input => {
                if (input.hasAttribute('id') && 
                    !input.id.includes('Notes') && 
                    !input.id.includes('Calories') && 
                    input.type !== 'file' &&
                    !input.value) {
                    input.classList.add('is-invalid');
                    isValid = false;
                } else {
                    input.classList.remove('is-invalid');
                }
            });
            
            return isValid;
        }

        // Display recent activities in the UI
        async function displayRecentActivities() {
            const activitiesContainer = document.querySelector('#recent-activities-list');
            if (!activitiesContainer) {
                // This might happen if the fitness page is not loaded, so we just return.
                return;
            }

            try {
                const response = await fetch('/get-activities');
                if (!response.ok) {
                    throw new Error('Failed to fetch activities');
                }
                const activities = await response.json();

                activitiesContainer.innerHTML = ''; // Clear existing list

                if (activities.length === 0) {
                    activitiesContainer.innerHTML = '<div class="list-group-item text-center text-muted">No activities logged yet.</div>';
                    return;
                }

                let activitiesHTML = '';
                activities.forEach(activity => {
                    const formattedDate = new Date(activity.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    activitiesHTML += `
                        <div class="list-group-item" data-activity-id="${activity._id}">
                            <div class="d-flex w-100 justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">${activity.activityType}</h6>
                                    <p class="mb-1 small">Duration: ${activity.duration} mins | Intensity: ${activity.intensity}</p>
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                    <small class="text-muted mb-2">${formattedDate}</small>
                                    <div>
                                        <button class="btn btn-outline-primary btn-sm me-1 edit-btn" data-bs-toggle="modal" data-bs-target="#editActivityModal">
                                            <i class="bi bi-pencil-square"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm delete-btn">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                activitiesContainer.innerHTML = activitiesHTML;

            } catch (error) {
                console.error('Error displaying recent activities:', error);
                activitiesContainer.innerHTML = '<div class="list-group-item text-center text-danger">Could not load activities.</div>';
            }
        }

        // Display all activities in the UI
        async function displayAllActivities() {
            const activitiesContainer = document.querySelector('#all-activities-list');
            if (!activitiesContainer) {
                console.error('All activities container not found');
                        return;
                    }
                    
            try {
                const response = await fetch('/get-all-activities');
                if (!response.ok) {
                    throw new Error('Failed to fetch all activities');
                }
                const activities = await response.json();

                activitiesContainer.innerHTML = ''; // Clear existing list

                if (activities.length === 0) {
                    activitiesContainer.innerHTML = '<div class="list-group-item text-center text-muted">No activities have been logged yet.</div>';
                    return;
                }
                
                let activitiesHTML = '';
                activities.forEach(activity => {
                    const formattedDate = new Date(activity.date).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    activitiesHTML += `
                        <div class="list-group-item" data-activity-id="${activity._id}">
                             <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <h6 class="mb-1">${activity.activityType} (${activity.category})</h6>
                                    <p class="mb-1">
                                        Duration: <strong>${activity.duration} minutes</strong> | Intensity: <strong>${activity.intensity}</strong>
                                    </p>
                                    ${activity.notes ? `<p class="mb-0 text-muted fst-italic">Notes: ${activity.notes}</p>` : ''}
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                     <small class="text-muted mb-2">${formattedDate}</small>
                                    <div>
                                        <button class="btn btn-outline-primary btn-sm me-2 edit-btn" data-bs-toggle="modal" data-bs-target="#editActivityModal">
                                            <i class="bi bi-pencil-square"></i> Edit
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm delete-btn">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                activitiesContainer.innerHTML = activitiesHTML;

            } catch (error) {
                console.error('Error displaying all activities:', error);
                activitiesContainer.innerHTML = '<div class="list-group-item text-center text-danger">Could not load activities.</div>';
            }
        }

        document.addEventListener('click', function(event) {
            if (event.target.closest('.delete-btn')) {
                const activityElement = event.target.closest('.list-group-item');
                
                if (!activityElement) {
                    console.error('Delete button was clicked, but could not find the parent .list-group-item element.');
                    return;
                }

                const activityId = activityElement.dataset.activityId;
                
                if (!activityId) {
                    console.error('Could not delete activity because the data-activity-id attribute is missing or empty.', activityElement);
                    alert('A client-side error occurred: Activity ID is missing.');
                    return;
                }

                if (confirm('Are you sure you want to delete this activity?')) {
                    deleteActivity(activityId, activityElement);
                }
            }
        });

        const editActivityModal = document.getElementById('editActivityModal');
        if (editActivityModal) {
            editActivityModal.addEventListener('show.bs.modal', async function(event) {
                const button = event.relatedTarget;
                const activityElement = button.closest('.list-group-item');
                const activityId = activityElement.dataset.activityId;

                try {
                    const response = await fetch(`/get-activity/${activityId}`);
                    if (!response.ok) {
                        throw new Error('Could not fetch activity details.');
                    }
                    const activity = await response.json();

                    const activityDate = new Date(activity.date);
                    const dateString = activityDate.toISOString().split('T')[0];
                    const timeString = activityDate.toTimeString().split(' ')[0].substring(0, 5);

                    document.getElementById('editActivityId').value = activity._id;
                    document.getElementById('editActivityName').value = activity.activityType;
                    document.getElementById('editActivityCategory').value = activity.category;
                    document.getElementById('editActivityIntensity').value = activity.intensity;
                    document.getElementById('editActivityDuration').value = activity.duration;
                    document.getElementById('editActivityCalories').value = activity.calories || '';
                    document.getElementById('editActivityNotes').value = activity.notes || '';
                    document.getElementById('editActivityDate').value = dateString;
                    document.getElementById('editActivityTime').value = timeString;

                } catch (error) {
                    console.error('Error populating edit form:', error);
                    const modal = bootstrap.Modal.getInstance(editActivityModal);
                    modal.hide();
                    alert('Could not load activity details for editing.');
                }
            });
        }
        
        const editActivityForm = document.getElementById('editActivityForm');
        if (editActivityForm) {
            editActivityForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const activityId = document.getElementById('editActivityId').value;
                const updatedActivity = {
                    activityName: document.getElementById('editActivityName').value,
                    category: document.getElementById('editActivityCategory').value,
                    intensity: document.getElementById('editActivityIntensity').value,
                    duration: document.getElementById('editActivityDuration').value,
                    date: document.getElementById('editActivityDate').value,
                    time: document.getElementById('editActivityTime').value,
                    calories: document.getElementById('editActivityCalories').value,
                    notes: document.getElementById('editActivityNotes').value,
                };
                updateActivity(activityId, updatedActivity);
            });
        }
        
        async function deleteActivity(activityId, elementToRemove) {
            try {
                const response = await fetch(`/delete-activity/${activityId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    elementToRemove.remove();
                    
                    // Refresh recent activities if the deleted item was in that list
                    if (document.querySelector('#recent-activities-list')) {
                        displayRecentActivities();
                    }

                     // Check if all activities list is empty
                    const container = document.querySelector('#all-activities-list');
                    if(container && container.children.length === 0){
                        container.innerHTML = '<div class="list-group-item text-center text-muted">No activities have been logged yet.</div>';
                    }
            } else {
                    const error = await response.text();
                    alert(`Error deleting activity: ${error}`);
                }
            } catch (err) {
                console.error('Failed to delete activity:', err);
                alert('An error occurred while trying to delete the activity.');
            }
        }

        async function updateActivity(activityId, data) {
             try {
                const response = await fetch(`/update-activity/${activityId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editActivityModal'));
                    modal.hide();
                    displayAllActivities(); // Refresh the list
                    displayRecentActivities(); // Also refresh the recent activities list
                } else {
                     const error = await response.text();
                    alert(`Error updating activity: ${error}`);
                }
            } catch (err) {
                console.error('Failed to update activity:', err);
                alert('An error occurred while trying to update the activity.');
            }
        }

        // Display recent workouts in the UI
        function displayRecentWorkouts() {
            const workoutsContainer = document.querySelector('#fitness-log-workout')?.closest('.card').querySelector('.list-group');
            if (!workoutsContainer) return;

            // This function's content seems to be based on localStorage and is not aligned with the database implementation.
            // It should be refactored to fetch workout data from the server if that functionality is desired.
            // For now, we'll ensure it doesn't break.
            
            workoutsContainer.innerHTML = '<div class="list-group-item text-center text-muted">Workout logging not implemented.</div>';
        }

        // Function to update submenu visibility based on active parent menus
        function updateSubmenuVisibility() {
            // First hide all submenus
            document.querySelectorAll('.nav-pills .nav-item ul.nav').forEach(submenu => {
                submenu.style.maxHeight = '0';
                submenu.classList.remove('show');
            });
            
            // Show submenus for active parent items
            document.querySelectorAll('.nav-pills .nav-item > .nav-link.active').forEach(activeParent => {
                const submenu = activeParent.nextElementSibling;
                if (submenu && submenu.tagName === 'UL') {
                    // Calculate the height of all child elements
                    const totalHeight = Array.from(submenu.children)
                        .reduce((height, child) => height + child.offsetHeight, 0);
                    
                    // Add some padding to ensure all content is visible
                    submenu.style.maxHeight = `${totalHeight + 20}px`;
                    submenu.classList.add('show');
                }
            });
        }