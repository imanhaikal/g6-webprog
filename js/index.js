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

                        // Initialize all workouts page
                        if (page === 'workouts') {
                            displayAllWorkouts();
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
                    event.preventDefault();
                    const formData = new FormData(logActivityForm);
                    const data = Object.fromEntries(formData.entries());

                    fetch('/log-activity', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    })
                    .then(response => {
                        if (response.ok) {
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
            
            // Initialize workout functionality
            initializeWorkoutLogger();
        }

        // --- Workout Logger Functions ---

        let allTemplates = []; // Cache for storing templates

        function initializeWorkoutLogger() {
            const logWorkoutForm = document.getElementById('logWorkoutForm');
            const workoutTemplateSelect = document.getElementById('workoutTemplate');
            const customTemplateFields = document.getElementById('customTemplateFields');
            const addExerciseBtn = document.getElementById('addExerciseBtn');
            const logWorkoutTypeRadios = document.querySelectorAll('input[name="workoutType"]');
            const addSingleExerciseBtn = document.getElementById('addSingleExerciseBtn');

            if (!logWorkoutForm) return;

            // Load initial data
            loadWorkoutTemplates();
            displayRecentWorkouts();
            updateWorkoutStreak();

            // Event Listeners
            logWorkoutTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const type = e.target.value;
                    const templateContainer = document.getElementById('logFromTemplateContainer');
                    const singleContainer = document.getElementById('logSingleWorkoutContainer');

                    if (type === 'template') {
                        templateContainer.classList.remove('d-none');
                        singleContainer.classList.add('d-none');
                    } else { // type === 'single'
                        templateContainer.classList.add('d-none');
                        singleContainer.classList.remove('d-none');
                    }
                });
            });

            workoutTemplateSelect.addEventListener('change', () => {
                const selectedValue = workoutTemplateSelect.value;
                if (selectedValue === 'custom') {
                        customTemplateFields.classList.remove('d-none');
                    document.getElementById('templateExerciseList').innerHTML = ''; // Clear exercise list
                } else if (selectedValue) {
                    customTemplateFields.classList.add('d-none');
                    displayTemplateExercises(selectedValue);
                    } else {
                        customTemplateFields.classList.add('d-none');
                    document.getElementById('templateExerciseList').innerHTML = '';
                }
            });

            addExerciseBtn.addEventListener('click', () => addExerciseField('exerciseFields', 'templateExercises'));
            addSingleExerciseBtn.addEventListener('click', () => addExerciseField('singleWorkoutExerciseFields', 'singleExercises'));

            logWorkoutForm.addEventListener('submit', handleWorkoutSubmit);
        }

        async function loadWorkoutTemplates() {
            const select = document.getElementById('workoutTemplate');
            try {
                const response = await fetch('/api/workout-templates');
                allTemplates = await response.json(); // Cache templates
                
                // Clear existing options except for the first and last
                const preservedOptions = [select.options[0], select.options[select.options.length - 1]];
                select.innerHTML = '';
                preservedOptions.forEach(opt => select.appendChild(opt));

                allTemplates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template._id;
                    option.textContent = template.name;
                    select.insertBefore(option, select.options[select.options.length - 1]);
                });
            } catch (error) {
                console.error('Failed to load workout templates:', error);
            }
        }

        function displayTemplateExercises(templateId) {
            const container = document.getElementById('templateExerciseList');
            container.innerHTML = '';
            const selectedTemplate = allTemplates.find(t => t._id === templateId);

            if (!selectedTemplate || !selectedTemplate.exercises || selectedTemplate.exercises.length === 0) {
                return;
            }

            const list = document.createElement('ul');
            list.className = 'list-group';
            
            selectedTemplate.exercises.forEach(ex => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                let exerciseDetails = `<strong>${ex.name}</strong>`;
                if (ex.sets && ex.reps) {
                    exerciseDetails += `: ${ex.sets} sets of ${ex.reps} reps`;
                } else if (ex.duration) {
                     exerciseDetails += `: ${ex.duration} seconds`;
                }
                listItem.innerHTML = exerciseDetails;
                list.appendChild(listItem);
            });

            container.appendChild(list);
        }

        function addExerciseField(containerId) {
            const container = document.getElementById(containerId);
            const newField = document.createElement('div');
            newField.className = 'row g-2 mb-2 align-items-center';
            newField.innerHTML = `
                <div class="col-sm-5">
                    <input type="text" class="form-control form-control-sm" placeholder="Exercise Name" required>
                </div>
                <div class="col-sm-3">
                    <input type="number" class="form-control form-control-sm" placeholder="Sets" min="1">
                </div>
                <div class="col-sm-3">
                    <input type="number" class="form-control form-control-sm" placeholder="Reps" min="1">
                </div>
                <div class="col-sm-1">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.parentElement.remove()">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(newField);
        }
        
        async function handleWorkoutSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const logType = formData.get('workoutType');
            
            let workoutPayload = {
                duration: formData.get('duration'),
                date: formData.get('date'),
                time: formData.get('time'),
                notes: formData.get('notes'),
            };

            if (logType === 'template') {
                let templateId = formData.get('templateId');

                if (!templateId) {
                    alert('Please select a workout template.');
                    return;
                }

                if (templateId === 'custom') {
                    try {
                        const newTemplateId = await createCustomTemplate();
                        if (!newTemplateId) return; // Stop if template creation failed
                        templateId = newTemplateId;
                    } catch (error) {
                        console.error('Failed to create custom template:', error);
                        alert(`Error creating custom template: ${error.message}`);
                        return;
                    }
                }
                workoutPayload.templateId = templateId;
                    
            } else { // logType is 'single'
                    const exercises = [];
                const exerciseRows = document.querySelectorAll('#singleWorkoutExerciseFields .row');
                exerciseRows.forEach(row => {
                    const inputs = row.querySelectorAll('input');
                    const nameInput = inputs[0];
                    const setsInput = inputs[1];
                    const repsInput = inputs[2];
                    
                    if (nameInput && nameInput.value) {
                            exercises.push({
                            name: nameInput.value,
                            sets: setsInput.value ? parseInt(setsInput.value) : null,
                            reps: repsInput.value ? parseInt(repsInput.value) : null
                        });
                    }
                });

                if (exercises.length === 0) {
                    alert('Please add at least one exercise to the workout.');
                    return;
                }
                workoutPayload.exercises = exercises;
            }

            // Now log the workout
            try {
                const response = await fetch('/api/workouts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(workoutPayload)
                });

                 if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error while logging workout: ${errorText}`);
                }
                
                // Reset form and update UI
                form.reset();
                 // Manually reset the radio button to its default state
                document.getElementById('logFromTemplate').checked = true;
                document.getElementById('logSingleWorkout').checked = false;
                document.getElementById('logFromTemplateContainer').classList.remove('d-none');
                document.getElementById('logSingleWorkoutContainer').classList.add('d-none');
                document.getElementById('customTemplateFields').classList.add('d-none');
                document.getElementById('exerciseFields').innerHTML = '';
                document.getElementById('singleWorkoutExerciseFields').innerHTML = '';
                document.getElementById('templateExerciseList').innerHTML = '';
                loadWorkoutTemplates();
                displayRecentWorkouts();
                    updateWorkoutStreak();
                alert('Workout logged successfully!');

            } catch (error) {
                console.error('Failed to log workout:', error);
                alert(`Error logging workout: ${error.message}`);
            }
        }

        async function createCustomTemplate() {
            const templateName = document.getElementById('customTemplateName').value;
            if (!templateName) {
                alert('Please provide a name for your custom template.');
                return null;
            }

            const exercises = [];
            const exerciseRows = document.querySelectorAll('#exerciseFields .row');
             exerciseRows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                const nameInput = inputs[0];
                const setsInput = inputs[1];
                const repsInput = inputs[2];

                if (nameInput && nameInput.value) {
                    exercises.push({
                        name: nameInput.value,
                        sets: setsInput.value ? parseInt(setsInput.value) : null,
                        reps: repsInput.value ? parseInt(repsInput.value) : null
                    });
                }
            });

            if (exercises.length === 0) {
                alert('Please add at least one exercise to the custom template.');
                return null;
            }

            const response = await fetch('/api/workout-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateName, exercises })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${errorText}`);
            }

            const newTemplate = await response.json();
            return newTemplate.insertedId;
        }

        async function displayRecentWorkouts() {
            const container = document.getElementById('recent-workouts-list');
            if (!container) return;
            container.innerHTML = '';
            try {
                const response = await fetch('/api/workouts');
                const workouts = await response.json();

                if (workouts.length === 0) {
                    container.innerHTML = '<div class="list-group-item text-center text-muted">No workouts logged yet.</div>';
                    return;
                }
                
                const templatesRes = await fetch('/api/workout-templates');
                const templates = await templatesRes.json();
                const templateMap = new Map(templates.map(t => [t._id, t.name]));

                let workoutsHTML = '';
                workouts.forEach(workout => {
                    const formattedDate = new Date(workout.date).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    let workoutTitle = 'Single Workout';
                    if (workout.workoutType === 'template' && workout.templateId) {
                        workoutTitle = templateMap.get(workout.templateId.toString()) || 'Unnamed Template';
                    } else if (workout.exercises && workout.exercises.length > 0) {
                        workoutTitle = `Single: ${workout.exercises[0].name}`;
                    }

                    workoutsHTML += `
                        <div class="list-group-item" data-workout-id="${workout._id}">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <h6 class="mb-1">${workoutTitle}</h6>
                                    <p class="mb-1 small">Duration: ${workout.duration} minutes</p>
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                    <small class="text-muted mb-2">${formattedDate}</small>
                                    <div>
                                        <button class="btn btn-outline-primary btn-sm me-2 edit-workout-btn" data-bs-toggle="modal" data-bs-target="#editWorkoutModal">
                                            <i class="bi bi-pencil-square"></i> Edit
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm delete-workout-btn">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = workoutsHTML;
            } catch (error) {
                console.error('Failed to display recent workouts:', error);
                container.innerHTML = '<div class="list-group-item text-center text-danger">Could not load recent workouts.</div>';
            }
        }

        async function updateWorkoutStreak() {
            const streakEl = document.getElementById('workoutStreak');
            if (!streakEl) return;
            try {
                const response = await fetch('/api/workout-streak');
                const data = await response.json();
                streakEl.textContent = data.streak;
            } catch (error) {
                console.error('Failed to update workout streak:', error);
            }
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
            // Handle activity deletion
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
            // Handle workout deletion
            else if (event.target.closest('.delete-workout-btn')) {
                const workoutElement = event.target.closest('[data-workout-id]');
                if (workoutElement) {
                    const workoutId = workoutElement.dataset.workoutId;
                    if (confirm('Are you sure you want to delete this workout?')) {
                        deleteWorkout(workoutId);
                    }
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
        
        const editWorkoutModal = document.getElementById('editWorkoutModal');
        if (editWorkoutModal) {
            editWorkoutModal.addEventListener('show.bs.modal', async function (event) {
                const button = event.relatedTarget;
                const workoutElement = button.closest('[data-workout-id]');
                
                if (!workoutElement) {
                    console.error("Could not find workout element for editing.");
                    return;
                }
                const workoutId = workoutElement.dataset.workoutId;

                try {
                    const response = await fetch(`/api/workouts/${workoutId}`);
                    if (!response.ok) throw new Error('Could not fetch workout details.');
                    const workout = await response.json();

                    const workoutDate = new Date(workout.date);
                    document.getElementById('editWorkoutId').value = workout._id;
                    document.getElementById('editWorkoutDuration').value = workout.duration;
                    document.getElementById('editWorkoutDate').value = workoutDate.toISOString().split('T')[0];
                    document.getElementById('editWorkoutTime').value = workoutDate.toTimeString().split(' ')[0].substring(0, 5);
                    document.getElementById('editWorkoutNotes').value = workout.notes || '';
                } catch (error) {
                    console.error('Error populating workout edit form:', error);
                    alert('Could not load workout details for editing.');
                }
            });
        }
        
        const editWorkoutForm = document.getElementById('editWorkoutForm');
        if (editWorkoutForm) {
            editWorkoutForm.addEventListener('submit', function (event) {
                event.preventDefault();
                const workoutId = document.getElementById('editWorkoutId').value;
                const updatedWorkout = {
                    duration: document.getElementById('editWorkoutDuration').value,
                    date: document.getElementById('editWorkoutDate').value,
                    time: document.getElementById('editWorkoutTime').value,
                    notes: document.getElementById('editWorkoutNotes').value,
                };
                updateWorkout(workoutId, updatedWorkout);
            });
        }

        async function deleteActivity(activityId, elementToRemove) {
            try {
                const response = await fetch(`/delete-activity/${activityId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    elementToRemove.remove();
                    
                    if (document.querySelector('#recent-activities-list')) {
                        displayRecentActivities();
                    }

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

        async function deleteWorkout(workoutId) {
            try {
                const response = await fetch(`/api/workouts/${workoutId}`, { method: 'DELETE' });
                if (response.ok) {
                    if (document.getElementById('all-workouts-list')) displayAllWorkouts();
                    if (document.getElementById('recent-workouts-list')) displayRecentWorkouts();
                    updateWorkoutStreak();
                } else {
                    alert(`Error deleting workout: ${await response.text()}`);
                }
            } catch (err) {
                console.error('Failed to delete workout:', err);
                alert('An error occurred while trying to delete the workout.');
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
                    displayAllActivities();
                    displayRecentActivities();
                } else {
                     const error = await response.text();
                    alert(`Error updating activity: ${error}`);
                }
            } catch (err) {
                console.error('Failed to update activity:', err);
                alert('An error occurred while trying to update the activity.');
            }
        }

        async function updateWorkout(workoutId, data) {
            try {
                const response = await fetch(`/api/workouts/${workoutId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkoutModal'));
                    modal.hide();
                    if (document.getElementById('all-workouts-list')) displayAllWorkouts();
                    if (document.getElementById('recent-workouts-list')) displayRecentWorkouts();
                    updateWorkoutStreak();
                } else {
                    alert(`Error updating workout: ${await response.text()}`);
                }
            } catch (err) {
                console.error('Failed to update workout:', err);
                alert('An error occurred while trying to update the workout.');
            }
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

        async function displayAllWorkouts() {
            const container = document.getElementById('all-workouts-list');
            if (!container) return;
            container.innerHTML = '<div class="text-center text-muted">Loading workouts...</div>';

            try {
                const response = await fetch('/api/all-workouts');
                if (!response.ok) throw new Error('Failed to fetch workouts');
                const workouts = await response.json();

                if (workouts.length === 0) {
                    container.innerHTML = '<div class="text-center text-muted">No workouts have been logged yet.</div>';
                    return;
                }

                let workoutsHTML = '';
                workouts.forEach((workout, index) => {
                    const workoutDate = new Date(workout.date).toLocaleString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    let workoutTitle = 'Single Workout';
                    let exercises = workout.exercises || [];
                    if (workout.workoutType === 'template' && workout.templateDetails) {
                        workoutTitle = workout.templateDetails.name;
                        exercises = workout.templateDetails.exercises || [];
                    }

                    let exerciseListHTML = '<ul class="list-group list-group-flush">';
                    if (exercises.length > 0) {
                        exercises.forEach(ex => {
                            let details = ex.sets && ex.reps ? `${ex.sets} sets of ${ex.reps} reps` : `${ex.duration} seconds`;
                            exerciseListHTML += `<li class="list-group-item">${ex.name}: ${details}</li>`;
                        });
                    } else {
                        exerciseListHTML += '<li class="list-group-item">No exercises listed for this workout.</li>';
                    }
                    exerciseListHTML += '</ul>';

                    workoutsHTML += `
                        <div class="accordion-item" data-workout-id="${workout._id}">
                            <h2 class="accordion-header" id="heading-${index}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
                                    <strong>${workoutTitle}</strong>&nbsp;-&nbsp;<span class="text-muted">${workoutDate}</span>
                                </button>
                            </h2>
                            <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="heading-${index}" data-bs-parent="#all-workouts-list">
                                <div class="accordion-body">
                                    <div class="d-flex justify-content-end mb-3">
                                        <button class="btn btn-outline-primary btn-sm me-2 edit-workout-btn" data-bs-toggle="modal" data-bs-target="#editWorkoutModal">
                                            <i class="bi bi-pencil-square"></i> Edit
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm delete-workout-btn">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                    <p><strong>Duration:</strong> ${workout.duration} minutes</p>
                                    ${workout.notes ? `<p><strong>Notes:</strong> ${workout.notes}</p>` : ''}
                                    <h6 class="mt-3">Exercises:</h6>
                                    ${exerciseListHTML}
                                </div>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = workoutsHTML;
            } catch (error) {
                console.error('Error displaying all workouts:', error);
                container.innerHTML = '<div class="text-center text-danger">Could not load workouts.</div>';
            }
        }