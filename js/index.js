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

            // Initialize sidebar collapse for mobile
            initializeSidebarCollapse();
            
            // Check if user is logged in
            checkLoginStatus();

        });

        async function checkLoginStatus() {
            try {
                const response = await fetch('/api/session-status');
                if (response.status === 401) {
                    // Not logged in, redirect
                    window.location.href = '/login.html';
                } else if (!response.ok) {
                    // Other server-side error
                    console.error('Error checking session status');
                } else {
                    // User is logged in, load their profile info
                    await loadUserProfileInfo();
                }
            } catch (error) {
                console.error('Failed to fetch session status:', error);
            }
        }

        async function loadUserProfileInfo() {
            try {
                const response = await fetch('/api/profile');
                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }

                const user = await response.json();

                // Update user name in the header
                const userDisplayName = document.getElementById('userDisplayName');
                if (userDisplayName) {
                    userDisplayName.textContent = user.name || user.username;
                }

                // Update user profile picture in the header
                const userProfilePicture = document.getElementById('userProfilePicture');
                if (userProfilePicture) {
                    if (user.profilePictureUrl) {
                        userProfilePicture.src = user.profilePictureUrl;
                    } else {
                        // Use default profile picture with username to get consistent avatar
                        userProfilePicture.src = `https://i.pravatar.cc/40?u=${user.username}`;
                    }
                }
            } catch (error) {
                console.error('Error loading user profile for header:', error);
                // Don't show an alert, just log it, as this is a non-critical part of the UI
            }
        }

        function initializeSidebarCollapse() {
            const sidebar = document.getElementById('sidebar');
            const sidebarLinks = sidebar.querySelectorAll('.nav-link');
            let backdrop;
            
            // Create backdrop element
            function createBackdrop() {
                backdrop = document.createElement('div');
                backdrop.className = 'sidebar-backdrop';
                backdrop.style.position = 'fixed';
                backdrop.style.top = '0';
                backdrop.style.left = '0';
                backdrop.style.width = '100%';
                backdrop.style.height = '100%';
                backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
                backdrop.style.zIndex = '1040';
                backdrop.style.display = 'none';
                document.body.appendChild(backdrop);
                
                backdrop.addEventListener('click', () => {
                    if (sidebar.classList.contains('show')) {
                        const bsCollapse = new bootstrap.Collapse(sidebar);
                        bsCollapse.hide();
                    }
                });
            }
            
            // Show/hide backdrop when sidebar is toggled
            createBackdrop();
            
            sidebar.addEventListener('show.bs.collapse', () => {
                if (window.innerWidth < 768) {
                    backdrop.style.display = 'block';
                    document.body.style.overflow = 'hidden'; // Prevent scrolling
                }
            });
            
            sidebar.addEventListener('hide.bs.collapse', () => {
                backdrop.style.display = 'none';
                document.body.style.overflow = ''; // Restore scrolling
            });
            
            // Close sidebar when clicking on a link (mobile only)
            sidebarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 768 && sidebar.classList.contains('show')) {
                        const bsCollapse = new bootstrap.Collapse(sidebar);
                        bsCollapse.hide();
                    }
                });
            });
        }

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
                            initializeProgressPage();
                        }

                        // Initialize weekly activity chart if we're on the dashboard page
                        if (page === 'dashboard') {
                            // Dynamically load the chart script, then initialize the page
                            const scriptId = 'dashboard-charts-script';
                            document.getElementById(scriptId)?.remove(); // Remove to ensure it reloads if needed

                            const script = document.createElement('script');
                            script.id = scriptId;
                            script.src = 'js/dashboard-charts.js';
                            script.onload = () => {
                                console.log('Dashboard charts script loaded successfully.');
                                initializeDashboardPage();
                            };
                            script.onerror = () => {
                                console.error('Error loading the dashboard charts script.');
                                const chartContainer = document.getElementById('weeklyActivityChart')?.parentElement;
                                if (chartContainer) {
                                    chartContainer.innerHTML = '<div class="text-center text-danger">A script required for charts failed to load.</div>';
                                }
                            };
                            document.body.appendChild(script);
                        }

                        // Initialize fitness tracker if on fitness page
                        if (page === 'fitness') {
                            initializeFitnessTracker();
                        }

                        // Initialize all activities page
                        if (page === 'activities') {
                            initializeAllActivities();
                        }

                        // Initialize all workouts page
                        if (page === 'workouts') {
                            initializeAllWorkouts();
                        }

                        // Initialize all steps page
                        if (page === 'steps') {
                            initializeAllSteps();
                        }

                        // Initialize sessions page
                        if (page === 'sessions') {
                            initializeSessionsPage();
                        }

                        // Initialize nutrition page
                        if (page === 'nutrition') {
                            initializeNutritionPage();
                        }

                        // Initialize profile page
                        if (page === 'profile') {
                            initializeProfilePage();
                            initializeAccountDeletion();
                            handlePasswordUpdate();
                            handleSession();
                        }

                        // Initialize notifications page
                        if (page === 'notifications') {
                            initializeNotificationsPage();
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

        // Function to initialize all components on the dashboard page
        async function initializeDashboardPage() {
            // Fetch all dashboard data in parallel
            await Promise.all([
                fetchTodaySteps(),
                fetchTodayCalories(),
                fetchUpcomingWorkout(),
                fetchWeeklyActivity() // This function will now handle its own chart rendering
            ]);
            
            // Add event listeners for the metric buttons to update the chart
            const metricButtons = document.querySelectorAll('.btn-group[role="group"] .btn[data-metric]');
            if (metricButtons.length > 0) {
                metricButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        // Update active styles
                        metricButtons.forEach(btn => {
                            btn.classList.remove('active', 'btn-primary');
                            btn.classList.add('btn-outline-primary');
                        });
                        this.classList.add('active', 'btn-primary');
                        this.classList.remove('btn-outline-primary');
                        
                        // Update the chart view
                        updateChart(this.getAttribute('data-metric'));
                    });
                });
            }
        }

        async function fetchTodayCalories() {
            try {
                const response = await fetch('/today-calories');
                if (!response.ok) {
                    throw new Error('Failed to fetch today\'s calories');
                }
                const data = await response.json();
                const totalCalories = data.totalCalories;
                const goal = 2200; // Assuming a static goal for now
                const percentage = Math.min((totalCalories / goal) * 100, 100);

                const caloriesCountElement = document.getElementById('today-calories-count');
                if (caloriesCountElement) {
                    caloriesCountElement.firstChild.textContent = totalCalories.toLocaleString() + ' ';
                }

                const progressBarElement = document.getElementById('calories-progress-bar');
                if (progressBarElement) {
                    progressBarElement.style.width = `${percentage}%`;
                    progressBarElement.setAttribute('aria-valuenow', percentage);
                }
            } catch (error) {
                console.error("Error fetching today's calories:", error);
            }
        }

        async function fetchTodaySteps() {
            try {
                const response = await fetch('/today-steps');
                if (!response.ok) {
                    throw new Error('Failed to fetch today\'s steps');
                }
                const data = await response.json();
                const totalSteps = data.totalSteps;
                const goal = 10000;
                const percentage = Math.min((totalSteps / goal) * 100, 100);

                const stepsCountElement = document.getElementById('today-steps-count');
                if (stepsCountElement) {
                    stepsCountElement.textContent = totalSteps.toLocaleString();
                }

                const circleElement = document.getElementById('steps-circle');
                if (circleElement) {
                    circleElement.style.background = `conic-gradient(var(--primary-color) ${percentage}%, #e9ecef ${percentage}%)`;
                }
            } catch (error) {
                console.error('Error fetching today\'s steps:', error);
            }
        }

        function updateWeeklyChart(chart, metric, chartData) {
            // Hide all datasets first
            chart.data.datasets.forEach(dataset => {
                dataset.hidden = true;
            });
            
            // Show the selected dataset
            chart.data.datasets.forEach(dataset => {
                if (dataset.label === metric) {
                    dataset.hidden = false;
                }
            });
                
                // Update the chart
                chart.update();
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

            // Initialize steps functionality
            const logStepsForm = document.getElementById('logStepsForm');
            if (logStepsForm) {
                logStepsForm.addEventListener('submit', handleStepsSubmit);
            }
            displayRecentSteps();
            initializeRouteFinder();
            
            const calculateStepsBtn = document.getElementById('calculateStepsBtn');
            if (calculateStepsBtn) {
                calculateStepsBtn.addEventListener('click', calculateSteps);
            }
        }

        function initializeAllActivities() {
            displayAllActivities();
        }

        function initializeAllWorkouts() {
            displayAllWorkouts();
        }

        function initializeAllSteps() {
            displayAllSteps();
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
                calories: formData.get('calories') || 0, // Set to 0 if empty or undefined
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
            // Handle steps deletion
            else if (event.target.closest('.delete-steps-btn')) {
                const stepsElement = event.target.closest('[data-steps-id]');
                if (stepsElement) {
                    const stepsId = stepsElement.dataset.stepsId;
                    if (confirm('Are you sure you want to delete this entry?')) {
                        deleteSteps(stepsId);
                    }
                }
            }
            // Handle calorie entry deletion
            else if (event.target.closest('.delete-calorie-btn')) {
                const calorieElement = event.target.closest('[data-calorie-id]');
                if (calorieElement) {
                    const calorieId = calorieElement.dataset.calorieId;
                    deleteCalorieEntry(calorieId);
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

        const editStepsModal = document.getElementById('editStepsModal');
        if (editStepsModal) {
            editStepsModal.addEventListener('show.bs.modal', async function(event) {
                const button = event.relatedTarget;
                const stepsElement = button.closest('[data-steps-id]');
                const stepsId = stepsElement.dataset.stepsId;
                try {
                    const response = await fetch(`/api/steps/${stepsId}`);
                    if (!response.ok) throw new Error('Could not fetch entry details.');
                    const entry = await response.json();
                    
                    const entryDate = new Date(entry.date);
                    document.getElementById('editStepsId').value = entry._id;
                    document.getElementById('editStepsCount').value = entry.steps;
                    document.getElementById('editStepsDuration').value = entry.duration;
                    document.getElementById('editStepsDistance').value = entry.distance;
                    document.getElementById('editDistanceUnit').value = entry.distanceUnit;
                    document.getElementById('editStepsDate').value = entryDate.toISOString().split('T')[0];
                    document.getElementById('editStepsTime').value = entryDate.toTimeString().split(' ')[0].substring(0, 5);
                } catch (error) {
                    console.error('Error populating steps edit form:', error);
                    alert('Could not load entry details for editing.');
                }
            });
        }

        const editStepsForm = document.getElementById('editStepsForm');
        if (editStepsForm) {
            editStepsForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const stepsId = document.getElementById('editStepsId').value;
                const updatedSteps = {
                    steps: document.getElementById('editStepsCount').value,
                    duration: document.getElementById('editStepsDuration').value,
                    distance: document.getElementById('editStepsDistance').value,
                    distanceUnit: document.getElementById('editDistanceUnit').value,
                    date: document.getElementById('editStepsDate').value,
                    time: document.getElementById('editStepsTime').value,
                };
                updateSteps(stepsId, updatedSteps);
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

        async function deleteSteps(stepsId) {
            try {
                const response = await fetch(`/api/steps/${stepsId}`, { method: 'DELETE' });
                if (response.ok) {
                    if (document.getElementById('all-steps-list')) displayAllSteps();
                    if (document.getElementById('recent-steps-list')) displayRecentSteps();
                } else {
                    alert(`Error deleting entry: ${await response.text()}`);
                }
            } catch (err) {
                console.error('Failed to delete steps entry:', err);
                alert('An error occurred while trying to delete the entry.');
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

        async function updateSteps(stepsId, data) {
            try {
                const response = await fetch(`/api/steps/${stepsId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (response.ok) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editStepsModal'));
                    modal.hide();
                    if (document.getElementById('all-steps-list')) displayAllSteps();
                    if (document.getElementById('recent-steps-list')) displayRecentSteps();
                } else {
                    alert(`Error updating entry: ${await response.text()}`);
                }
            } catch (err) {
                console.error('Failed to update steps entry:', err);
                alert('An error occurred while trying to update the entry.');
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

        async function displayRecentSteps() {
            const container = document.getElementById('recent-steps-list');
            if (!container) return;
            container.innerHTML = '';
            try {
                const response = await fetch('/api/steps');
                if (!response.ok) throw new Error('Failed to fetch steps');
                const steps = await response.json();

                if (steps.length === 0) {
                    container.innerHTML = '<div class="list-group-item text-center text-muted">No steps logged yet.</div>';
                    return;
                }

                let stepsHTML = '';
                steps.forEach(s => {
                    const formattedDate = new Date(s.date).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    stepsHTML += `
                        <div class="list-group-item" data-steps-id="${s._id}">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <h6 class="mb-1">${(s.steps || 0).toLocaleString()} steps</h6>
                                    <p class="mb-1 small">${s.distance} ${s.distanceUnit} | ${s.duration} min</p>
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                    <small class="text-muted mb-2">${formattedDate}</small>
                                    <div>
                                        <button class="btn btn-outline-primary btn-sm me-2 edit-steps-btn" data-bs-toggle="modal" data-bs-target="#editStepsModal">
                                            <i class="bi bi-pencil-square"></i> Edit
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm delete-steps-btn">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });
                container.innerHTML = stepsHTML;
            } catch (error) {
                console.error('Error displaying recent steps:', error);
                container.innerHTML = '<div class="list-group-item text-center text-danger">Could not load steps.</div>';
            }
        }

        async function displayAllSteps() {
            const container = document.getElementById('all-steps-list');
            if (!container) return;
            container.innerHTML = '<div class="text-center">Loading...</div>';
            try {
                const response = await fetch('/api/steps/all');
                if (!response.ok) throw new Error('Failed to fetch all steps');
                const steps = await response.json();

                if (steps.length === 0) {
                    container.innerHTML = '<div class="list-group-item text-center text-muted">No steps logged yet.</div>';
                    return;
                }

                let stepsHTML = '';
                steps.forEach(s => {
                    const formattedDate = new Date(s.date).toLocaleString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    stepsHTML += `
                        <div class="list-group-item" data-steps-id="${s._id}">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <h6 class="mb-1">${(s.steps || 0).toLocaleString()} steps</h6>
                                    <p class="mb-1">${s.distance} ${s.distanceUnit} | ${s.duration} minutes</p>
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                    <small class="text-muted mb-2">${formattedDate}</small>
                                    <div>
                                        <button class="btn btn-outline-primary btn-sm me-2 edit-steps-btn" data-bs-toggle="modal" data-bs-target="#editStepsModal">
                                            <i class="bi bi-pencil-square"></i> Edit
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm delete-steps-btn">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });
                container.innerHTML = stepsHTML;
            } catch (error) {
                console.error('Error displaying all steps:', error);
                container.innerHTML = '<div class="list-group-item text-center text-danger">Could not load steps.</div>';
            }
        }

        async function handleStepsSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/steps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
                form.reset();
                displayRecentSteps();
            } catch (error) {
                console.error('Error logging steps:', error);
                alert(`Failed to log steps: ${error.message}`);
            }
        }

        async function initializeRouteFinder() {
            const findRoutesBtn = document.getElementById('findRoutesBtn');
            if (findRoutesBtn) {
                findRoutesBtn.addEventListener('click', findNearbyRoutes);
            }
        }
        
        async function findNearbyRoutes() {
            const routesContainer = document.getElementById('routesContainer');
            const mapContainer = document.getElementById('map');
            routesContainer.innerHTML = '<div class="text-center text-muted">Getting your location...</div>';
            
            if (!navigator.geolocation) {
                routesContainer.innerHTML = '<div class="text-danger">Geolocation is not supported by your browser.</div>';
                return;
            }

            try {
                // Fetch Mapbox token
                const tokenResponse = await fetch('/api/mapbox-token');
                if (!tokenResponse.ok) throw new Error('Could not retrieve Mapbox token.');
                const { token } = await tokenResponse.json();
                mapboxgl.accessToken = token;

                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { longitude, latitude } = position.coords;
                    
                    mapContainer.style.display = 'block';
                    const map = new mapboxgl.Map({
                        container: 'map',
                        style: 'mapbox://styles/mapbox/streets-v11',
                        center: [longitude, latitude],
                        zoom: 13
                    });

                    // Add marker for user's location
                    new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);

                    const selectedProfile = document.querySelector('input[name="routeType"]:checked').value || 'walking';
                    routesContainer.innerHTML = `<div class="text-center text-muted">Searching for nearby ${selectedProfile} routes...</div>`;

                    // Always fetch cycling routes for more interesting paths, but keep track of the user's selected profile.
                    const apiProfile = 'cycling';

                    // Generate three destinations in different directions to get varied routes.
                    const destinations = [
                        { lon: longitude + 0.01, lat: latitude + 0.01 }, // NE
                        { lon: longitude + 0.01, lat: latitude - 0.01 }, // SE
                        { lon: longitude - 0.01, lat: latitude + 0.005 } // NW
                    ];
                    
                    const isRoundTrip = document.getElementById('makeRoundTrip').checked;

                    const routePromises = destinations.map(dest => {
                        let coordinates = `${longitude},${latitude};${dest.lon},${dest.lat}`;
                        if (isRoundTrip) {
                            coordinates += `;${longitude},${latitude}`;
                        }
                        const url = `https://api.mapbox.com/directions/v5/mapbox/${apiProfile}/${coordinates}?alternatives=true&geometries=geojson&steps=true&access_token=${token}`;
                        return fetch(url).then(res => res.json());
                    });
                    
                    const results = await Promise.all(routePromises);

                    const allRoutes = results.flatMap(result => (result.routes && result.routes.length > 0) ? result.routes : []);

                    if (allRoutes.length > 0) {
                        displayRoutes(allRoutes, map, selectedProfile);
                    } else {
                        routesContainer.innerHTML = `<div class="text-center text-muted">No ${selectedProfile} routes found nearby.</div>`;
                    }
                }, (error) => {
                    console.error('Geolocation error:', error);
                    routesContainer.innerHTML = `<div class="text-danger">Could not get your location: ${error.message}</div>`;
                });

            } catch (error) {
                console.error('Error in findNearbyRoutes:', error);
                routesContainer.innerHTML = `<div class="text-danger">An error occurred: ${error.message}</div>`;
            }
        }

        function displayRoutes(routes, map, profile) {
            const container = document.getElementById('routesContainer');
            container.innerHTML = ''; // Clear loading message
            
            // Function to clear highlights
            const clearHighlights = () => {
                map.getStyle().layers.forEach(layer => {
                    if (layer.id.startsWith('route-')) {
                        map.setPaintProperty(layer.id, 'line-width', 6);
                        map.setPaintProperty(layer.id, 'line-color', '#A9A9A9');
                    }
                });
                document.querySelectorAll('.list-group-item[data-route-id]').forEach(el => {
                    el.classList.remove('active');
                });
            };

            routes.forEach((route, index) => {
                const id = `route-${index}`;
                
                // Draw route on map
                map.addSource(id, {
                    type: 'geojson',
                    data: { type: 'Feature', properties: {}, geometry: route.geometry }
                });
                map.addLayer({
                    id: id,
                    type: 'line',
                    source: id,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#A9A9A9', 'line-width': 6, 'line-opacity': 0.75 }
                });
                
                // Add label to the middle of the route
                const centerPoint = route.geometry.coordinates[Math.floor(route.geometry.coordinates.length / 2)];
                map.addLayer({
                    id: `label-${id}`,
                    type: 'symbol',
                    source: {
                        type: 'geojson',
                        data: { type: 'Feature', properties: { title: `Route ${index + 1}` }, geometry: { type: 'Point', coordinates: centerPoint } }
                    },
                    layout: { 'text-field': '{title}', 'text-size': 14, 'text-offset': [0, -1.5] },
                    paint: { 'text-color': '#000', 'text-halo-color': '#fff', 'text-halo-width': 2 }
                });

                // Display route details in a list
                const distanceKm = (route.distance / 1000).toFixed(2);
                
                // Recalculate duration for walking if needed
                let durationMin = Math.round(route.duration / 60);
                if (profile === 'walking') {
                    // Estimate walking time is ~5.5x cycling time
                    durationMin = Math.round((route.duration * 5.5) / 60); 
                } else if (profile === 'running') {
                    // Estimate running time is ~2.5x cycling time
                    durationMin = Math.round((route.duration * 2.5) / 60);
                }

                const routeEl = document.createElement('div');
                routeEl.className = 'list-group-item list-group-item-action';
                routeEl.setAttribute('data-route-id', id);
                const profileName = profile.charAt(0).toUpperCase() + profile.slice(1);
                routeEl.innerHTML = `
                    <h6>${profileName} Route ${index + 1}</h6>
                    <p class="mb-1">Distance: <strong>${distanceKm} km</strong> | Approx. Duration: <strong>${durationMin} min</strong></p>
                    <button class="btn btn-sm btn-outline-primary select-route-btn mt-2">Use This Route</button>
                `;

                const highlightRoute = () => {
                    clearHighlights();
                    map.setPaintProperty(id, 'line-width', 8);
                    map.setPaintProperty(id, 'line-color', '#3887be');
                    routeEl.classList.add('active');
                };

                // Add click events
                map.on('click', id, highlightRoute);
                routeEl.addEventListener('click', highlightRoute);

                routeEl.querySelector('.select-route-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.getElementById('stepsDistance').value = distanceKm;
                    document.getElementById('stepsDuration').value = durationMin;
                    document.getElementById('distanceUnit').value = 'km';
                    const formCard = document.getElementById('logStepsForm').closest('.card');
                    if (formCard) {
                        formCard.scrollIntoView({ behavior: 'smooth' });
                    }
                    alert('Route details have been added to the form.');
                });
                container.appendChild(routeEl);
            });
            
            // Highlight the first route by default
            if (routes.length > 0) {
                 document.querySelector('.list-group-item[data-route-id="route-0"]').click();
            }
        }

        // --- Profile Management ---
        async function initializeProfilePage() {
            const profileForm = document.getElementById('updateProfileForm');
            const changePasswordForm = document.getElementById('changePasswordForm');
            
            try {
                const response = await fetch('/api/profile');
                if (!response.ok) throw new Error('Could not fetch profile data.');
                
                const user = await response.json();
                
                // Populate the form
                document.getElementById('profileName').value = user.name || '';
                document.getElementById('profileEmail').value = user.email || '';
                document.getElementById('profileAge').value = user.age || '';
                document.getElementById('profileWeight').value = user.weight || '';
                document.getElementById('profileHeight').value = user.height || '';
                document.getElementById('profileGender').value = user.gender || '';

                // Set the profile picture preview
                const preview = document.getElementById('profilePicturePreview');
                if (user.profilePictureUrl) {
                    preview.src = user.profilePictureUrl;
                } else {
                    preview.src = 'https://placehold.co/150'; // Default placeholder
                }

                // --- BMI-based Goal Setting ---
                const setFitnessGoal = () => {
                    const weightInput = document.getElementById('profileWeight');
                    const heightInput = document.getElementById('profileHeight');
                    const goalsSelect = document.getElementById('profileGoals');

                    if (!weightInput || !heightInput || !goalsSelect) return;

                    const weight = parseFloat(weightInput.value);
                    const height = parseFloat(heightInput.value);

                    if (weight > 0 && height > 0) {
                        const heightInMeters = height / 100;
                        const bmi = weight / (heightInMeters * heightInMeters);

                        if (bmi < 18.5) {
                            goalsSelect.value = 'gain_weight';
                        } else if (bmi >= 18.5 && bmi < 25) {
                            goalsSelect.value = 'maintain_weight';
                        } else {
                            goalsSelect.value = 'lose_weight';
                        }
                    }
                };
                
                // Set initial goal based on the loaded weight and height
                setFitnessGoal();
                
                // Add event listeners for real-time updates
                document.getElementById('profileWeight').addEventListener('input', setFitnessGoal);
                document.getElementById('profileHeight').addEventListener('input', setFitnessGoal);

            } catch (error) {
                console.error('Error loading profile:', error);
                alert('Could not load profile data. Please try refreshing.');
            }
            
            if (profileForm) {
                profileForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData();
                    formData.append('name', document.getElementById('profileName').value);
                    formData.append('age', document.getElementById('profileAge').value);
                    formData.append('weight', document.getElementById('profileWeight').value);
                    formData.append('height', document.getElementById('profileHeight').value);
                    formData.append('goals', document.getElementById('profileGoals').value);
                    formData.append('gender', document.getElementById('profileGender').value);

                    const pictureFile = document.getElementById('profilePicture').files[0];
                    if (pictureFile) {
                        formData.append('profilePicture', pictureFile);
                    }

                    try {
                        const updateResponse = await fetch('/api/profile', {
                            method: 'PUT',
                            body: formData // No 'Content-Type' header needed, browser sets it for FormData
                        });

                        if (!updateResponse.ok) {
                            const errorText = await updateResponse.text();
                            throw new Error(errorText || 'Failed to update profile.');
                        }

                        const result = await updateResponse.json();
                        alert('Profile updated successfully!');

                        // Update the profile picture preview if a new one was uploaded
                        if (result.newImageUrl) {
                            document.getElementById('profilePicturePreview').src = result.newImageUrl;
                        }

                    } catch (error) {
                        console.error('Error updating profile:', error);
                        alert(`Error: ${error.message}`);
                    }
                });
            }
        }

        async function calculateSteps() {
            try {
                // 1. Fetch user's height
                const profileResponse = await fetch('/api/profile');
                if (!profileResponse.ok) throw new Error('Could not fetch user profile to get height.');
                const user = await profileResponse.json();
                
                if (!user.height || user.height <= 0) {
                    alert('Please set your height in your profile to use this feature.');
                    return;
                }
                const heightCm = user.height;

                // 2. Get distance and duration from the form
                const distance = parseFloat(document.getElementById('stepsDistance').value);
                const distanceUnit = document.getElementById('distanceUnit').value;
                const durationMin = parseFloat(document.getElementById('stepsDuration').value);

                if (isNaN(distance) || isNaN(durationMin) || distance <= 0 || durationMin <= 0) {
                    alert('Please enter a valid distance and duration to calculate steps.');
                    return;
                }
                
                // 3. Determine if walking or running
                const distanceKm = distanceUnit === 'miles' ? distance * 1.60934 : distance;
                const durationHours = durationMin / 60;
                const speedKmh = distanceKm / durationHours;

                // Use different stride length factors for walking vs running
                const strideFactor = speedKmh > 8 ? 0.75 : 0.413; // 8 km/h is a brisk walk / slow jog
                
                // 4. Calculate steps
                const strideLengthCm = heightCm * strideFactor;
                const distanceCm = distanceKm * 100000;
                const estimatedSteps = Math.round(distanceCm / strideLengthCm);
                
                // 5. Populate the field
                document.getElementById('stepsCount').value = estimatedSteps;
                alert(`Estimated steps: ${estimatedSteps.toLocaleString()}`);

            } catch (error) {
                console.error('Error calculating steps:', error);
                alert(`An error occurred: ${error.message}`);
            }
        }

        async function fetchWeeklyActivity() {
            try {
                const response = await fetch('/api/weekly-activity');
                if (!response.ok) {
                    throw new Error('Failed to fetch weekly activity data');
                }
                const data = await response.json();
                
                // Initialize the chart with the fetched data
                initWeeklyActivityChart(); // This function is in dashboard-charts.js
                
                const weeklyChart = window.weeklyActivityChart;
                if (weeklyChart) {
                    weeklyChart.data.labels = data.labels;
                    window.chartData.steps.data = data.steps;
                    window.chartData.calories.data = data.calories;
                    window.chartData.workouts.data = data.workouts;

                    // Get the currently active metric to display first
                    const activeMetric = document.querySelector('.btn-group[role="group"] .btn.active')?.dataset.metric || 'steps';
                    updateChart(activeMetric);
                }

            } catch (error) {
                console.error("Error fetching weekly activity:", error);
                // Optionally display an error message in the chart's container
                const chartContainer = document.getElementById('weeklyActivityChart')?.parentElement;
                if (chartContainer) {
                    chartContainer.innerHTML = '<div class="text-center text-danger">Could not load weekly activity.</div>';
                }
            }
        }

        async function initializeNotificationsPage() {
            console.log('Initializing Notifications Page...');

            // --- Element selectors ---
            const webPushSwitch = document.getElementById('webPushSwitch');
            const inAppReminderSwitch = document.getElementById('inAppReminderSwitch');
            const emailNotificationSwitch = document.getElementById('emailNotificationSwitch');
            const reminderForm = document.getElementById('dailyReminderForm');
            const customReminderForm = document.getElementById('customReminderForm');
            const remindersList = document.getElementById('remindersList');
            const editReminderForm = document.getElementById('editReminderForm');

            // --- State variables ---
            let reminders = [];

            // --- Functions ---
            const VAPID_PUBLIC_KEY = 'BB1ps-PnF3YWgbDclyhlX7T-IszmPZGMTYfydgEF6iOuuY3Ke7hf2YNqbzikNOR_Yg9DUzEGtRhcoX49tSCrqeE';

            function urlBase64ToUint8Array(base64String) {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            }

            async function subscribeUser() {
                try {
                    const registration = await navigator.serviceWorker.ready;

                    // Check for existing subscription and unsubscribe if present
                    const existingSubscription = await registration.pushManager.getSubscription();
                    if (existingSubscription) {
                        console.log('Found existing subscription in index.js, unsubscribing...');
                        await existingSubscription.unsubscribe();
                        await fetch('/unsubscribe', { method: 'POST' });
                        console.log('Old subscription removed.');
                    }

                    const response = await fetch('/api/vapid-public-key');
                    const vapidPublicKey = await response.text();
                    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                    console.log('Subscribing with new key from index.js...');
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey,
                    });
                    
                    await fetch('/subscribe', {
                        method: 'POST',
                        body: JSON.stringify(subscription),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    // Update UI
                    document.getElementById('subscribe-btn').style.display = 'none';
                    document.getElementById('unsubscribe-btn').style.display = 'inline-block';
                    document.getElementById('notification-status').textContent = 'You are subscribed to push notifications.';
                    
                } catch (err) {
                    console.error('Failed to subscribe the user: ', err);
                    document.getElementById('notification-status').textContent = 'Subscription failed. Please enable notifications in your browser settings.';
                }
            }
            
            async function unsubscribeUser() {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        await subscription.unsubscribe();
                    }
                    await fetch('/unsubscribe', { method: 'POST' });
                    alert('Unsubscribed from push notifications.');
                } catch (error) {
                    console.error('Error unsubscribing:', error);
                    webPushSwitch.checked = true; // Revert switch on failure
                }
            }

            function saveReminders() {
                const customReminders = reminders.filter(r => r.type !== 'daily');
                localStorage.setItem('reminders', JSON.stringify(customReminders));
            }

            function renderReminders() {
                if (!remindersList) return;
                remindersList.innerHTML = '';
                reminders.sort((a, b) => {
                    const timeA = a.schedule.type === 'daily' ? a.schedule.value : new Date(a.schedule.value);
                    const timeB = b.schedule.type === 'daily' ? b.schedule.value : new Date(b.schedule.value);
                    
                    // Basic sort for now, can be improved
                    if (timeA < timeB) return -1;
                    if (timeA > timeB) return 1;
                    return 0;
                });

                reminders.forEach((reminder) => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    listItem.dataset.id = reminder._id;
                    const isEnabled = typeof reminder.isEnabled === 'boolean' ? reminder.isEnabled : true;
                    
                    let displayTime = '';
                    if (reminder.schedule.type === 'daily') {
                        displayTime = `${reminder.schedule.value} (Daily)`;
                    } else {
                        displayTime = new Date(reminder.schedule.value).toLocaleString();
                    }

                    listItem.innerHTML = `
                        <div class="reminder-info">
                            <strong>${reminder.title}</strong> - ${displayTime}
                            <div class="text-muted small">${reminder.message || ''}</div>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="form-check form-switch me-3">
                                <input class="form-check-input reminder-toggle-switch" type="checkbox" role="switch" ${isEnabled ? 'checked' : ''}>
                            </div>
                            <button class="btn btn-info btn-sm me-2 edit-notification-btn">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm delete-notification-btn">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    remindersList.appendChild(listItem);
                });
            }

            function scheduleReminders() {
                for (let i = 1; i < 99999; i++) { window.clearTimeout(i); }
                reminders.forEach(reminder => {
                    if (reminder.type === 'custom') {
                        const now = new Date();
                        const reminderTime = new Date(reminder.time);
                        if (reminderTime > now) {
                            const timeout = reminderTime.getTime() - now.getTime();
                            setTimeout(() => {
                                if (localStorage.getItem('inAppRemindersEnabled') === 'true') {
                                    alert(`Reminder: ${reminder.text}`);
                                }
                                reminders = reminders.filter(r => r.time !== reminder.time);
                                saveReminders();
                                renderReminders();
                            }, timeout);
                        }
                    }
                });
            }

            async function loadInitialState() {
                try {
                    const response = await fetch('/api/profile');
                    const profile = response.ok ? await response.json() : {};
                    if (profile.settings) {
                        emailNotificationSwitch.checked = profile.settings.emailNotifications;
                    }
                } catch (e) { console.error('Error fetching profile settings:', e); }

                const registration = await navigator.serviceWorker.ready;
                webPushSwitch.checked = !!(await registration.pushManager.getSubscription());
                inAppReminderSwitch.checked = localStorage.getItem('inAppRemindersEnabled') !== 'false'; // Default to true

                try {
                    const response = await fetch('/api/scheduled-notifications');
                    reminders = response.ok ? await response.json() : [];
                } catch (e) {
                    console.error('Error fetching server reminders:', e);
                    reminders = [];
                }
                renderReminders();
            }

            // --- Event Listeners ---
            
            // Listen for messages from the Service Worker
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'show-in-app-alert') {
                    // Check if in-app reminders are enabled before showing alert
                    if (localStorage.getItem('inAppRemindersEnabled') !== 'false') {
                        alert(`Reminder: ${event.data.payload.title}\n\n${event.data.payload.body}`);
                    }
                }
            });

            webPushSwitch.addEventListener('change', () => webPushSwitch.checked ? subscribeUser() : unsubscribeUser());
            inAppReminderSwitch.addEventListener('change', () => localStorage.setItem('inAppRemindersEnabled', inAppReminderSwitch.checked));
            emailNotificationSwitch.addEventListener('change', async () => {
                try {
                    await fetch('/api/profile/settings', {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emailNotifications: emailNotificationSwitch.checked })
                    });
                } catch (e) {
                    console.error('Error updating email settings:', e);
                    emailNotificationSwitch.checked = !emailNotificationSwitch.checked;
                }
            });

            reminderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = reminderForm.querySelector('#reminderText').value || "Daily Reminder";
                const message = reminderForm.querySelector('#reminderText').value;
                const time = reminderForm.querySelector('#reminderTime').value;
                if (!message || !time) return;
                const payload = {
                    title,
                    message,
                    schedule: { type: 'daily', value: time }
                };
                try {
                    const response = await fetch('/api/schedule-notification', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        const newNotification = await response.json();
                        reminders.push(newNotification);
                        renderReminders();
                        reminderForm.reset();
                    } else { alert('Failed to schedule notification.'); }
                } catch (error) { console.error(error); }
            });

            customReminderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const message = customReminderForm.querySelector('#customReminderText').value;
                const dateTime = customReminderForm.querySelector('#customReminderTime').value;
                if (!message || !dateTime) return;
                const payload = {
                    title: message, // Use message as title for one-time alerts
                    message,
                    schedule: { type: 'one-time', value: new Date(dateTime).toISOString() }
                };
                try {
                    const response = await fetch('/api/schedule-notification', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        const newNotification = await response.json();
                        reminders.push(newNotification);
                        renderReminders();
                        customReminderForm.reset();
                    } else { alert('Failed to schedule one-time reminder.'); }
                } catch (error) { console.error(error); }
            });

            remindersList.addEventListener('click', async (event) => {
                const deleteNotificationBtn = event.target.closest('.delete-notification-btn');
                const editNotificationBtn = event.target.closest('.edit-notification-btn');

                if (editNotificationBtn) {
                    const listItem = editNotificationBtn.closest('li[data-id]');
                    const notificationId = listItem.dataset.id;
                    const reminder = reminders.find(r => r._id === notificationId);

                    if (reminder) {
                        // For simplicity, we use the same modal and just show/hide date/time fields
                        // A more robust solution might use two modals or dynamic form generation
                        document.getElementById('editReminderId').value = reminder._id;
                        document.getElementById('editReminderText').value = reminder.message;
                        
                        // For now, we only support editing daily reminders' time in this modal
                        // A future improvement would be a more adaptive modal
                        document.getElementById('editReminderTime').value = reminder.schedule.type === 'daily' ? reminder.schedule.value : '';

                        const modal = new bootstrap.Modal(document.getElementById('editReminderModal'));
                        modal.show();
                    }
                } else if (deleteNotificationBtn) {
                    const listItem = deleteNotificationBtn.closest('li[data-id]');
                    const notificationId = listItem.dataset.id;
                    if (confirm('Are you sure you want to delete this scheduled reminder?')) {
                        try {
                            await fetch(`/api/cancel-notification/${notificationId}`, { method: 'DELETE' });
                            reminders = reminders.filter(r => r._id !== notificationId);
                            renderReminders();
                        } catch (error) { console.error('Error deleting notification:', error); }
                    }
                }
            });

            if(editReminderForm) {
                editReminderForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const id = document.getElementById('editReminderId').value;
                    const message = document.getElementById('editReminderText').value;
                    const time = document.getElementById('editReminderTime').value;
                    const reminder = reminders.find(r => r._id === id);
                    
                    if (!reminder) return alert('Could not find original reminder to update.');

                    const payload = {
                        title: message, // Update title to match message
                        message,
                        schedule: { ...reminder.schedule } // Copy original schedule
                    };

                    // Only update time for daily reminders in this modal
                    if (payload.schedule.type === 'daily') {
                        payload.schedule.value = time;
                    }

                    try {
                        const response = await fetch(`/api/schedule-notification/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            // Update local state
                            const updatedReminder = await response.json(); // Assuming server returns updated doc
                            const index = reminders.findIndex(r => r._id === id);
                            if (index !== -1) {
                                 reminders[index] = { ...reminders[index], ...payload };
                            }
                            renderReminders();
                            const modal = bootstrap.Modal.getInstance(document.getElementById('editReminderModal'));
                            modal.hide();
                        } else {
                            alert('Failed to update the reminder. Please try again.');
                        }
                    } catch (error) {
                        console.error('Error updating reminder:', error);
                        alert('An error occurred while updating the reminder.');
                    }
                });
            }

            loadInitialState();
        }

        async function fetchUpcomingWorkout() {
            try {
                const response = await fetch('/upcoming-workout');
                if (!response.ok) {
                    throw new Error('Server responded with an error');
                }
                const data = await response.json();

                const timeEl = document.getElementById('upcoming-workout-time');
                const titleEl = document.getElementById('upcoming-workout-title');

                if (data.found) {
                    timeEl.innerHTML = `<i class="bi bi-calendar-event"></i> ${data.day}, ${data.time}`;
                    titleEl.textContent = data.title;
                } else {
                    timeEl.innerHTML = `<i class="bi bi-calendar-event"></i> No workouts scheduled`;
                    titleEl.textContent = "Enjoy your rest day!";
                }
            } catch (error) {
                console.error('Error fetching upcoming workout:', error);
            }
        }
        async function initializeAccountDeletion() {
    const isProfilePage = document.getElementById('updateProfileForm') !== null;
    if (!isProfilePage) return;

    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (!deleteAccountBtn) {
        console.error('Delete account button not found');
        return;
    }

    deleteAccountBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Simple confirmation dialog
        if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
            return;
        }

        try {
            // Show loading state
            const originalText = deleteAccountBtn.innerHTML;
            deleteAccountBtn.disabled = true;
            deleteAccountBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                Deleting Account...
            `;

            const response = await fetch('/api/account', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
    }
});

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: 'Account deletion failed' };
                }
                throw new Error(errorData.message || 'Account deletion failed');
            }

            // Simple success message since showAlert isn't defined
            alert('Account deleted successfully. Redirecting...');

            // Clear any client-side storage
            localStorage.clear();
            sessionStorage.clear();

            // Redirect to login
            window.location.href = '/login.html';

        } catch (error) {
            console.error('Deletion error:', error);
            alert(error.message); // Simple alert instead of showAlert
        } finally {
            // Reset button state
            if (deleteAccountBtn) {
                deleteAccountBtn.disabled = false;
                deleteAccountBtn.innerHTML = originalText;
            }
        }
    });
}

// --- Nutrition Page ---
let currentMealSuggestion = null; // Variable to hold meal data for the modal

function initializeNutritionPage() {
    // Calorie Calculator
    const calorieForm = document.getElementById('calorieForm');
    if (calorieForm) {
        calorieForm.addEventListener('submit', handleCalorieFormSubmit);
    }
    loadCalorieEntries();
    updateCalorieSuggestion();

    // Meal Search
    const mealSearchForm = document.getElementById('mealSearchForm');
    if (mealSearchForm) {
        mealSearchForm.addEventListener('submit', handleMealSearch);
    }

    // Custom Meal Form
    const addCustomMealForm = document.getElementById('addCustomMealForm');
    if (addCustomMealForm) {
        addCustomMealForm.addEventListener('submit', handleAddCustomMeal);
    }

    // Save to Favorites Button in Modal
    const saveToFavoritesBtn = document.getElementById('saveToFavoritesBtn');
    if(saveToFavoritesBtn) {
        saveToFavoritesBtn.addEventListener('click', saveCurrentSuggestionToFavorites);
    }

    // We're now manually showing the modal and calling populateMealDetailModal

    // Load saved meal plans
    loadSavedMealPlans();

    // Add global event delegation for buttons
    document.addEventListener('click', function(event) {
        // Delete meal plan button
        if (event.target.closest('.delete-meal-plan-btn')) {
            const mealPlanCard = event.target.closest('[data-meal-plan-id]');
            if (mealPlanCard) {
                const mealPlanId = mealPlanCard.dataset.mealPlanId;
                deleteMealPlan(mealPlanId);
            }
        }

        // Read more button
        if (event.target.classList.contains('read-more-btn')) {
            const textContainer = event.target.closest('.text-container');
            if (textContainer) {
                textContainer.classList.toggle('expanded');
                event.target.textContent = textContainer.classList.contains('expanded') ? 'Read Less' : 'Read More';
            }
        }
    });
}

async function handleCalorieFormSubmit(e) {
    e.preventDefault();
    const foodItem = document.getElementById('foodItem').value;
    const caloriesIntake = document.getElementById('caloriesIntake').value;
    const mealDate = document.getElementById('mealDate').value;
    if (!foodItem || !caloriesIntake || !mealDate) {
        return alert('Please fill out all fields.');
    }
    try {
        const response = await fetch('/api/calories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foodItem, caloriesIntake, mealDate }),
        });
        if (!response.ok) throw new Error(await response.text() || 'Failed to log calorie intake.');
        alert('Calorie intake logged successfully!');
        e.target.reset();
        loadCalorieEntries();
    } catch (error) {
        console.error('Error logging calorie intake:', error);
        alert(`An error occurred: ${error.message}`);
    }
}

async function updateCalorieSuggestion() {
    const suggestionEl = document.getElementById('calorie-suggestion-panel');
    if (!suggestionEl) return;

    try {
        const response = await fetch('/api/calorie-suggestion');
        const data = await response.json();

        if (!response.ok) {
            suggestionEl.innerHTML = `<strong>Note:</strong> ${data.message || 'Could not calculate suggestion.'}`;
            suggestionEl.classList.replace('alert-success', 'alert-warning');
            return;
        }

        suggestionEl.innerHTML = `
            <strong>Suggested Daily Calorie Intake:</strong> ${data.suggestedCalories} kcal
            <br>
            <small>${data.message}</small>
        `;
        suggestionEl.classList.replace('alert-warning', 'alert-success');

    } catch (error) {
        console.error('Error fetching calorie suggestion:', error);
        suggestionEl.innerHTML = '<strong>Note:</strong> Could not retrieve calorie suggestion.';
        suggestionEl.classList.replace('alert-success', 'alert-warning');
    }
}

async function handleMealSearch(e) {
    e.preventDefault();
    const query = document.getElementById('mealSearchInput').value;
    if (!query) return;

    const container = document.getElementById('mealSuggestionsContainer');
    container.innerHTML = '<p class="text-muted">Searching...</p>';

    try {
        const response = await fetch(`/api/meal-suggestions?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch meal suggestions.');
        const suggestions = await response.json();
        displayMealSuggestions(suggestions);
    } catch (error) {
        console.error('Error searching meals:', error);
        container.innerHTML = '<p class="text-danger">Error searching for meals.</p>';
    }
}

function displayMealSuggestions(suggestions) {
    const container = document.getElementById('mealSuggestionsContainer');
    container.innerHTML = '';
    if (suggestions.length === 0) {
        container.innerHTML = '<p class="text-muted">No suggestions found.</p>';
        return;
    }

    // Create a row for Bootstrap grid
    const row = document.createElement('div');
    row.className = 'row';

    suggestions.forEach(meal => {
        // Sanitize and format data
        const calories = Math.round(parseFloat(meal.calories)) || 'N/A';
        const imageUrl = meal.imageUrl || 'https://placehold.co/300x200?text=No+Image';

        // Format ingredients and recipe text with read more functionality
        const ingredients = meal.ingredients || 'Ingredients not available.';
        const recipe = meal.recipe || 'Recipe instructions not available.';

        // Create a column for each meal card
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';
        
        // Create the card with complete details
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${imageUrl}" class="card-img-top" alt="${meal.name}" style="height: 180px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${meal.name}</h5>
                    <p class="mb-2"><strong>Calories:</strong> ${calories} kcal</p>

                    <div class="mb-3">
                        <h6 class="text-primary mb-2">Ingredients:</h6>
                        <div class="text-container">
                            <p class="small text-content">${ingredients}</p>
                            ${ingredients.length > 100 ?
                                `<button class="btn btn-link btn-sm p-0 read-more-btn">Read More</button>` : ''}
                        </div>
                    </div>

                    <div>
                        <h6 class="text-primary mb-2">Recipe:</h6>
                        <div class="text-container">
                            <p class="small text-content">${recipe}</p>
                            ${recipe.length > 100 ?
                                `<button class="btn btn-link btn-sm p-0 read-more-btn">Read More</button>` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0 text-center">
                    <button class="btn btn-success btn-sm save-meal-btn w-75">Save to My Meals</button>
                </div>
            </div>
        `;

        row.appendChild(col);

        // Store all meal data as properties
        const mealData = {
            id: meal.id,
            name: meal.name,
            calories: calories,
            imageurl: meal.imageUrl,
            ingredients: meal.ingredients,
            recipe: meal.recipe
        };

        // Add event listener to save button
        const saveMealBtn = col.querySelector('.save-meal-btn');
        saveMealBtn.addEventListener('click', () => {
            // Set current meal suggestion
            currentMealSuggestion = mealData;

            // Save the meal directly
            saveCurrentSuggestionToFavorites();
        });
    });

    container.appendChild(row);
}

async function loadSavedMealPlans() {
    const container = document.getElementById('savedMealPlansContainer');
    container.innerHTML = '<p class="text-muted">Loading saved meals...</p>';
    try {
        const response = await fetch('/api/meal-plans');
        if (!response.ok) throw new Error('Failed to fetch saved meal plans.');
        const mealPlans = await response.json();

        container.innerHTML = ''; // Clear loading message
        if (mealPlans.length === 0) {
            container.innerHTML = '<p class="text-muted col-12">No meals saved yet.</p>';
            return;
        }

        // Create a row for Bootstrap grid
        const row = document.createElement('div');
        row.className = 'row';

        mealPlans.forEach(meal => {
            const mealCard = document.createElement('div');
            mealCard.className = 'col-md-6 col-lg-4 mb-3';

            // Format ingredients and recipe text with read more functionality
            const ingredients = meal.ingredients || 'Ingredients not available.';
            const recipe = meal.recipe || 'Recipe instructions not available.';

            mealCard.innerHTML = `
                <div class="card h-100 shadow-sm" data-meal-plan-id="${meal._id}">
                    <img src="${meal.imageUrl || 'https://placehold.co/300x200?text=No+Image'}" class="card-img-top" alt="${meal.name}" style="height: 180px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${meal.name}</h5>
                        <p class="mb-2"><strong>Calories:</strong> ${meal.calories} kcal</p>

                        <div class="mb-3">
                            <h6 class="text-primary mb-2">Ingredients:</h6>
                            <div class="text-container">
                                <p class="small text-content">${ingredients}</p>
                                ${ingredients.length > 100 ?
                                    `<button class="btn btn-link btn-sm p-0 read-more-btn">Read More</button>` : ''}
                            </div>
                        </div>

                        <div>
                            <h6 class="text-primary mb-2">Recipe:</h6>
                            <div class="text-container">
                                <p class="small text-content">${recipe}</p>
                                ${recipe.length > 100 ?
                                    `<button class="btn btn-link btn-sm p-0 read-more-btn">Read More</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0 text-center">
                        <button class="btn btn-outline-danger delete-meal-plan-btn w-100">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;

            row.appendChild(mealCard);

            // No view recipe button anymore - all details are shown directly on the card
        });

        container.appendChild(row);

    } catch (error) {
        console.error('Error loading saved meals:', error);
        container.innerHTML = '<p class="text-danger col-12">Could not load saved meals.</p>';
    }
}

function populateMealDetailModal() {
    // No need to extract from event - currentMealSuggestion is already set

    // Set meal name in both places
    document.getElementById('mealDetailName').textContent = currentMealSuggestion.name;
    document.getElementById('mealDetailNameBanner').textContent = currentMealSuggestion.name;

    // Set meal image
    const imageUrl = currentMealSuggestion.imageurl || 'https://placehold.co/800x400?text=No+Image+Available';
    document.getElementById('mealDetailImage').src = imageUrl;

    // Set calories in both places
    const calories = currentMealSuggestion.calories || 'N/A';
    document.getElementById('mealDetailCaloriesValue').textContent = calories;
    document.getElementById('mealDetailCalories').innerHTML = `
        <strong>Calories:</strong> ${calories} kcal
        ${currentMealSuggestion.carbs ? `<br><small>Carbs: ${currentMealSuggestion.carbs}g</small>` : ''}
        ${currentMealSuggestion.protein ? `<br><small>Protein: ${currentMealSuggestion.protein}g</small>` : ''}
        ${currentMealSuggestion.fat ? `<br><small>Fat: ${currentMealSuggestion.fat}g</small>` : ''}
    `;

    // Set ingredients and recipe with fallback text
    const ingredients = currentMealSuggestion.ingredients || 'No ingredients information available.';
    document.getElementById('mealDetailIngredients').textContent = ingredients;

    const recipe = currentMealSuggestion.recipe || 'No preparation instructions available.';
    document.getElementById('mealDetailRecipe').textContent = recipe;
}

async function saveCurrentSuggestionToFavorites() {
    if (!currentMealSuggestion) return;
    try {
        const response = await fetch('/api/meal-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: currentMealSuggestion.name,
                calories: currentMealSuggestion.calories,
                ingredients: currentMealSuggestion.ingredients,
                recipe: currentMealSuggestion.recipe,
                imageUrl: currentMealSuggestion.imageurl,
                isCustom: false
            })
        });
        if (!response.ok) throw new Error('Failed to save meal plan.');
        alert('Meal saved to your favorites!');

        // Reload saved meal plans
        await loadSavedMealPlans();

        // Scroll to the saved meals section
        const savedMealsSection = document.getElementById('savedMealPlansContainer');
        if (savedMealsSection) {
            savedMealsSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error saving meal plan:', error);
        alert('Error: ' + error.message);
    }
}

async function handleAddCustomMeal(e) {
    e.preventDefault();
    const form = e.target;

    // Get form values
    const mealPicture = document.getElementById('customMealPicture').files[0];
    const name = document.getElementById('customMealName').value;
    const calories = document.getElementById('customMealCalories').value;
    const ingredients = document.getElementById('customMealIngredients').value || 'No ingredients specified';
    const recipe = document.getElementById('customMealRecipe').value || 'No recipe specified';

    // Validate required fields
    if (!mealPicture || !name || !calories) {
        alert('Please fill in all required fields (picture, name, and calories)');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    const formData = new FormData();
    formData.append('mealPicture', mealPicture);
    formData.append('name', name);
    formData.append('calories', calories);
    formData.append('ingredients', ingredients);
    formData.append('recipe', recipe);
    formData.append('isCustom', true);

    try {
        const response = await fetch('/api/meal-plans', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to save custom meal.');

        // Success message
        alert('Custom meal saved successfully!');
        form.reset();

        // Load saved meal plans and scroll to them
        await loadSavedMealPlans();

        // Scroll to the saved meals section
        const savedMealsSection = document.getElementById('savedMealPlansContainer');
        if (savedMealsSection) {
            savedMealsSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch(error) {
        console.error('Error saving custom meal:', error);
        alert('Error: ' + error.message);
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function deleteCalorieEntry(entryId) {
    if (confirm('Are you sure you want to delete this entry?')) {
        try {
            const response = await fetch(`/api/calories/${entryId}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(await response.text() || 'Failed to delete entry.');
            }
            // Remove from UI
            document.querySelector(`[data-calorie-id="${entryId}"]`).remove();
            alert('Entry deleted successfully!');
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert(`Error: ${error.message}`);
        }
    }
}

async function deleteMealPlan(mealPlanId) {
    if (confirm('Are you sure you want to delete this saved meal?')) {
        // Find the card and show loading state
        const mealCard = document.querySelector(`[data-meal-plan-id="${mealPlanId}"]`);
        if (!mealCard) return;

        // Save original content and replace with loading indicator
        const originalContent = mealCard.innerHTML;
        mealCard.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100 p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Deleting...</span>
                </div>
                <span class="ms-3">Deleting...</span>
            </div>
        `;

        try {
            const response = await fetch(`/api/meal-plans/${mealPlanId}`, { method: 'DELETE' });

            if (!response.ok) {
                // If error, restore original content
                mealCard.innerHTML = originalContent;
                throw new Error('Failed to delete meal plan.');
            }

            // On success, fade out the card and then reload all meal plans
            mealCard.style.transition = 'opacity 0.5s ease';
            mealCard.style.opacity = '0';

            // Wait for fade animation to complete
            setTimeout(async () => {
                // Reload all meal plans
                await loadSavedMealPlans();
            }, 500);

        } catch(error) {
            console.error('Error deleting meal plan:', error);
            alert('Error: ' + error.message);
        }
    }
}

async function loadCalorieEntries() {
    try {
        const response = await fetch('/api/calories');
        if (!response.ok) throw new Error('Failed to fetch calorie entries.');
        const entries = await response.json();
        const listElement = document.getElementById('loggedMealsList');
        if (!listElement) return;
        listElement.innerHTML = ''; // Clear current list
        if (entries.length === 0) {
            listElement.innerHTML = '<li class="list-group-item">No meals logged yet.</li>';
            return;
        }
        entries.forEach(entry => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.setAttribute('data-calorie-id', entry._id); // Use specific data attribute
            const mealDate = new Date(entry.date).toLocaleString();
            listItem.innerHTML = `
                <div>
                    <strong>${entry.foodItem}</strong> - ${entry.calories} kcal
                    <br>
                    <small class="text-muted">${mealDate}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger delete-calorie-btn">Delete</button>
            `;
            listElement.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading calorie entries:', error);
        const listElement = document.getElementById('loggedMealsList');
        if (listElement) {
            listElement.innerHTML = '<li class="list-group-item text-danger">Could not load meals.</li>';
        }
    }
}

async function handlePasswordUpdate() {
    try {
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (!changePasswordForm) return;

        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form elements
            const currentPassword = document.getElementById('currentPassword');
            const newPassword = document.getElementById('newPassword');
            const confirmPassword = document.getElementById('confirmNewPassword');
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            // Store original button text
            const originalBtnText = submitBtn.innerHTML;
            
            try {
                // Validate inputs
                if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
                    showSimpleAlert('All fields are required', 'danger');
                    return;
                }
                
                if (newPassword.value !== confirmPassword.value) {
                    showSimpleAlert('New passwords do not match', 'danger');
                    return;
                }
                
                if (newPassword.value.length < 8) {
                    showSimpleAlert('Password must be at least 8 characters', 'danger');
                    return;
                }

                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    Updating...
                `;

                // Send request to server
                const response = await fetch('/api/update-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword: currentPassword.value,
                        newPassword: newPassword.value
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update password');
                }

                // Success - reset form and show message
                changePasswordForm.reset();
                showSimpleAlert('Password updated successfully!', 'success');
                
            } catch (error) {
                console.error('Password update error:', error);
                showSimpleAlert(error.message, 'danger');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });

        // Simple alert function replacement
        function showSimpleAlert(message, type) {
            // Remove any existing alerts
            const existingAlert = document.querySelector('.password-alert');
            if (existingAlert) existingAlert.remove();
            
            // Create alert element
            const alertDiv = document.createElement('div');
            alertDiv.className = `password-alert alert alert-${type} mt-3`;
            alertDiv.textContent = message;
            
            // Insert after the form
            changePasswordForm.parentNode.insertBefore(alertDiv, changePasswordForm.nextSibling);
            
            // Auto-dismiss after 5 seconds
            if (type !== 'danger') {
                setTimeout(() => {
                    alertDiv.remove();
                }, 5000);
            }
        }

    } catch (error) {
        console.error('Error initializing password update:', error);
    }
}

async function handleSession() {
    try {
        // Handle logout of specific session
        const logoutOtherBtn = document.getElementById('logout-other');
        if (logoutOtherBtn) {
            logoutOtherBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const sessionItem = document.getElementById('delete-class');
                
                try {
                    if (sessionItem) {
                        sessionItem.remove();
                        alert('Session logged out successfully');
                    }
                } catch (error) {
                    console.error('Failed to log out session:', error);
                    alert('Failed to log out session. Please try again.');
                }
            });
        }

        // Handle logout of all other sessions
        const logoutAllBtn = document.getElementById('log-out-all-other');
        if (logoutAllBtn) {
            logoutAllBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const sessionItem = document.getElementById('delete-class');
                
                try {
                    if (sessionItem) {
                        sessionItem.remove();
                        alert('All other sessions logged out successfully');
                    }
                } catch (error) {
                    console.error('Failed to log out sessions:', error);
                    alert('Failed to log out sessions. Please try again.');
                }
            });
        }
    } catch (error) {
        console.error('Error setting up session logout handlers:', error);
    }
}

// Function to initialize the progress page charts and forms
async function initializeProgressPage() {
    let goalChartInstance = null;
    let weightChartInstance = null;
    let weeklyComparisonChartInstance = null;

    async function updateGoalChart() {
        try {
            const response = await fetch('/api/goal-progress');
            if (!response.ok) throw new Error('Could not fetch goal progress.');
            const data = await response.json();

            const { startWeight, currentWeight, goalWeight } = data;
            let percentageComplete = 0;

            if (startWeight != null && goalWeight != null && startWeight !== goalWeight) {
                const totalWeightChange = Math.abs(startWeight - goalWeight);
                const weightChanged = startWeight - currentWeight;
                percentageComplete = Math.max(0, Math.min(100, (weightChanged / (startWeight - goalWeight)) * 100));
            }
            
            const ctx = document.getElementById('goalChart')?.getContext('2d');
            if (!ctx) return;

            if (goalChartInstance) {
                goalChartInstance.data.datasets[0].data = [percentageComplete, 100 - percentageComplete];
                goalChartInstance.update();
            } else {
                goalChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Completed', 'Remaining'],
                        datasets: [{
                            data: [percentageComplete, 100 - percentageComplete],
                            backgroundColor: ['#28a745', '#e9ecef'],
                            borderColor: ['#fff', '#fff'],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${context.raw.toFixed(1)}%`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error updating goal chart:', error);
        }
    }

    async function updateWeightTrackerChart() {
        try {
            const response = await fetch('/api/weight-history');
            if (!response.ok) throw new Error('Could not fetch weight history.');
            const history = await response.json();

            const labels = history.map(entry => new Date(entry.date).toLocaleDateString());
            const data = history.map(entry => entry.weight);

            const ctx = document.getElementById('weightChart')?.getContext('2d');
            if (!ctx) return;

            if (weightChartInstance) {
                weightChartInstance.data.labels = labels;
                weightChartInstance.data.datasets[0].data = data;
                weightChartInstance.update();
            } else {
                weightChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Weight (kg)',
                            data: data,
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            fill: true,
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: false }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error updating weight chart:', error);
        }
    }
    
    async function updateWeeklyComparisonChart() {
        try {
            const response = await fetch('/api/weekly-comparison');
            if (!response.ok) throw new Error('Could not fetch weekly comparison data.');
            const data = await response.json();

            const ctx = document.getElementById('weeklyChart')?.getContext('2d');
            if (!ctx) return;

            if (weeklyComparisonChartInstance) {
                weeklyComparisonChartInstance.data.datasets[0].data = data.thisWeek;
                weeklyComparisonChartInstance.data.datasets[1].data = data.lastWeek;
                weeklyComparisonChartInstance.update();
            } else {
                weeklyComparisonChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'This Week',
                            data: data.thisWeek,
                            backgroundColor: '#007bff',
                            borderColor: '#007bff',
                        }, {
                            label: 'Last Week',
                            data: data.lastWeek,
                            backgroundColor: '#6c757d',
                            borderColor: '#6c757d',
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error updating weekly comparison chart:', error);
        }
    }

    // --- Event Listeners ---
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const goalWeightInput = document.getElementById('goalWeightInput');
            const goalWeight = goalWeightInput.value;
            if (!goalWeight) return;

            try {
                const response = await fetch('/api/profile/goal', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goalWeight: parseFloat(goalWeight) })
                });

                if (response.ok) {
                    alert('Goal updated successfully!');
                    goalForm.reset();
                    await updateGoalChart();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to update goal.');
                }
            } catch (error) {
                console.error('Error setting goal:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    const weightLogForm = document.getElementById('weightLogForm');
    if (weightLogForm) {
        weightLogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const weightInput = document.getElementById('weightInput');
            const weight = weightInput.value;
            if (!weight) return;

            try {
                const response = await fetch('/api/weight-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weight: parseFloat(weight) })
                });

                if (response.ok) {
                    weightLogForm.reset();
                    await updateWeightTrackerChart();
                    await updateGoalChart();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to log weight.');
                }
            } catch (error) {
                console.error('Error logging weight:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // Initial chart loads
    updateGoalChart();
    updateWeightTrackerChart();
    updateWeeklyComparisonChart();
}

// Function to update the chart based on selected metric
function updateChart(metric) {
    if (!window.weeklyActivityChart) {
        initWeeklyActivityChart();
    }
    // ... existing code ...
}
