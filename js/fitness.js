document.addEventListener('DOMContentLoaded', function() {
    // Check login status and initialize page
    checkLoginStatus().then(isLoggedIn => {
        if (isLoggedIn) {
            initializeFitnessPage();
        } else {
            // Redirect to login if not authenticated
            window.location.href = '/login.html';
        }
    });
});

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/session-status');
        if (response.ok) {
            const data = await response.json();
            return data.isLoggedIn;
        }
        return false;
    } catch (error) {
        console.error('Error checking session status:', error);
        return false;
    }
}

function initializeFitnessPage() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Load initial data from the backend
    loadAndDisplayActivities();
    loadAndDisplayWorkoutTemplates();
    loadAndDisplayRecentWorkouts();
    loadWorkoutStreak();
    loadAndDisplayRecentSteps();
    // Future refactoring:
    // loadAndDisplaySteps();

    // Set default date for input fields to today
    const today = new Date().toISOString().split('T')[0];
    const activityDate = document.getElementById('activityDate');
    if (activityDate) activityDate.value = today;
    // Do the same for other date inputs
    const workoutDate = document.getElementById('workoutDate');
    if (workoutDate) workoutDate.value = today;
    const stepsDate = document.getElementById('stepsDate');
    if (stepsDate) stepsDate.value = today;


    // --- Event Listeners ---
    
    // Handle activity form submission
    const logActivityForm = document.getElementById('logActivityForm');
    if (logActivityForm) {
        logActivityForm.addEventListener('submit', handleLogActivity);
    }

    // Handle workout form submission
    const logWorkoutForm = document.getElementById('logWorkoutForm');
    if (logWorkoutForm) {
        logWorkoutForm.addEventListener('submit', handleLogWorkout);
    }

    // Handle workout type selection (template vs single)
    const workoutTypeRadios = document.querySelectorAll('input[name="workoutType"]');
    workoutTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleWorkoutType);
    });

    // Handle template selection
    const workoutTemplateSelect = document.getElementById('workoutTemplate');
    if (workoutTemplateSelect) {
        workoutTemplateSelect.addEventListener('change', handleTemplateSelection);
    }

    // Handle "Add Exercise" buttons
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', () => addExerciseField('exerciseFields'));
    }
    const addSingleExerciseBtn = document.getElementById('addSingleExerciseBtn');
    if (addSingleExerciseBtn) {
        addSingleExerciseBtn.addEventListener('click', () => addExerciseField('singleWorkoutExerciseFields'));
    }

    // Handle steps form submission
    const logStepsForm = document.getElementById('logStepsForm');
    if (logStepsForm) {
        logStepsForm.addEventListener('submit', handleLogSteps);
    }

    const findRoutesBtn = document.getElementById('findRoutesBtn');
    if (findRoutesBtn) {
        findRoutesBtn.addEventListener('click', initializeMap);
    }

    // Other event listeners for steps, etc. will be refactored here
}

async function handleLogActivity(e) {
    e.preventDefault();
    const form = e.target;
    
    // Simple frontend validation
    if (!form.checkValidity()) {
        showAlert('Please fill out all required fields.', 'warning');
        return;
    }
    
    const formData = new FormData(form);
    
    // The backend expects specific names, let's ensure they are correct
    const activityData = {
        activityName: formData.get('activityName'),
        activityCategory: formData.get('activityCategory'),
        activityIntensity: formData.get('activityIntensity'),
        activityDuration: formData.get('activityDuration'),
        activityDate: formData.get('activityDate'),
        activityTime: formData.get('activityTime'),
        activityCalories: formData.get('activityCalories'),
        activityNotes: formData.get('activityNotes')
    };

    try {
        const response = await fetch('/log-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityData)
        });

        if (response.ok) {
            showAlert('Activity logged successfully!', 'success');
            form.reset();
            document.getElementById('activityDate').value = new Date().toISOString().split('T')[0]; // Reset date to today
            loadAndDisplayActivities(); // Refresh the list
        } else {
            const errorData = await response.json();
            showAlert(`Error: ${errorData.message || 'Failed to log activity'}`, 'danger');
        }
    } catch (error) {
        console.error('Error logging activity:', error);
        showAlert('An error occurred while logging the activity.', 'danger');
    }
}

async function loadAndDisplayActivities() {
    try {
        const response = await fetch('/get-all-activities');
        if (!response.ok) {
            throw new Error(`Failed to fetch activities: ${response.statusText}`);
        }
        const activities = await response.json();
        displayActivities(activities);
    } catch (error) {
        console.error('Error loading activities:', error);
        const listContainer = document.getElementById('recent-activities-list');
        if (listContainer) {
            listContainer.innerHTML = '<div class="list-group-item text-danger">Could not load activities.</div>';
        }
    }
}

function displayActivities(activities) {
    const listContainer = document.getElementById('recent-activities-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Clear existing list

    if (activities.length === 0) {
        listContainer.innerHTML = '<div class="list-group-item text-muted">No activities logged yet.</div>';
        return;
    }

    // Display only the 5 most recent activities as per the UI context
    activities.slice(0, 5).forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'list-group-item list-group-item-action flex-column align-items-start';
        
        const formattedDate = new Date(activity.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Basic capitalization for category and intensity
        const category = activity.category.charAt(0).toUpperCase() + activity.category.slice(1);
        const intensity = activity.intensity.charAt(0).toUpperCase() + activity.intensity.slice(1);

        activityElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1 fw-bold">${activity.activityType}</h6>
                <small class="text-muted">${formattedDate}</small>
            </div>
            <div class="mb-1">
                <span><i class="bi bi-clock"></i> ${activity.duration} mins</span> | 
                <span><i class="bi bi-fire"></i> ${activity.calories || 'N/A'} kcal</span>
            </div>
            <div class="mb-1">
                <span class="badge bg-primary bg-opacity-75">${category}</span>
                <span class="badge bg-info text-dark bg-opacity-75">${intensity}</span>
            </div>
            ${activity.notes ? `<small class="text-muted fst-italic">Note: ${activity.notes}</small>` : ''}
        `;
        listContainer.appendChild(activityElement);
    });
}

function showAlert(message, type) {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    if (!alertPlaceholder) {
        console.error("Alert placeholder not found!");
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');

    alertPlaceholder.append(wrapper);

    // Auto-dismiss the alert
    setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(wrapper.firstChild);
        if(alert) {
            alert.close();
        }
    }, 5000);
}

// ... other functions like displayRecentWorkouts, updateStepDisplay etc. still exist below
// but are using localStorage and would need refactoring.
// For now, focusing on activities.

// ... (keep the old functions for now to avoid breaking other parts of the page if they are called)
// The old functions will be removed or refactored later.

// Dummy functions to avoid errors if they are called from other scripts
function displayRecentWorkouts() {}
function updateStepDisplay() {}
function updateStreakDisplay() {}
// ... existing code ...
function displayRecentActivities() {
    const activities = JSON.parse(localStorage.getItem('fitnessActivities')) || [];
    const recentActivitiesList = document.getElementById('recent-activities-list');
    
    if (recentActivitiesList) {
        recentActivitiesList.innerHTML = '';
        
        if (activities.length === 0) {
            recentActivitiesList.innerHTML = '<a href="#" class="list-group-item list-group-item-action">No activities logged yet.</a>';
        } else {
            // Display up to 5 recent activities
            activities.slice(0, 5).forEach(activity => {
                const item = document.createElement('a');
                item.href = "#";
                item.classList.add('list-group-item', 'list-group-item-action');
                item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${activity.name}</h6>
                        <small>${formatDate(activity.date)}</small>
                    </div>
                    <p class="mb-1">${activity.duration} mins - ${activity.calories} calories</p>
                    <small>Category: ${activity.category}, Intensity: ${activity.intensity}</small>
                `;
                recentActivitiesList.appendChild(item);
            });
        }
    }
}
// ... existing code ...

// Initialize data structures in localStorage if they don't exist
if (!localStorage.getItem('fitnessActivities')) {
    localStorage.setItem('fitnessActivities', JSON.stringify([]));
}
if (!localStorage.getItem('fitnessWorkouts')) {
    localStorage.setItem('fitnessWorkouts', JSON.stringify([]));
}
if (!localStorage.getItem('fitnessSteps')) {
    localStorage.setItem('fitnessSteps', JSON.stringify([]));
}
if (!localStorage.getItem('workoutStreak')) {
    localStorage.setItem('workoutStreak', '0');
}
if (!localStorage.getItem('dailyStepGoal')) {
    localStorage.setItem('dailyStepGoal', '10000');
}
if (!localStorage.getItem('todaySteps')) {
    localStorage.setItem('todaySteps', '0');
}

// Handle workout template selection
const workoutTemplateSelect = document.getElementById('workoutTemplate');
const customTemplateFields = document.getElementById('customTemplateFields');

if (workoutTemplateSelect) {
    workoutTemplateSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customTemplateFields.classList.remove('d-none');
        } else {
            customTemplateFields.classList.add('d-none');
        }
    });
}

// Handle "Add Exercise" button click
const addExerciseBtn = document.getElementById('addExerciseBtn');
const exerciseFields = document.getElementById('exerciseFields');
let exerciseCounter = 0;

if (addExerciseBtn) {
    addExerciseBtn.addEventListener('click', function() {
        exerciseCounter++;
        
        const exerciseDiv = document.createElement('div');
        exerciseDiv.classList.add('border', 'rounded', 'p-3', 'mb-3', 'position-relative', 'exercise-item');
        exerciseDiv.setAttribute('data-exercise-id', exerciseCounter);
        
        exerciseDiv.innerHTML = `
            <button type="button" class="btn-close position-absolute top-0 end-0 m-2 remove-exercise" aria-label="Remove"></button>
            <div class="mb-3">
                <label for="exerciseName${exerciseCounter}" class="form-label">Exercise Name</label>
                <input type="text" class="form-control" id="exerciseName${exerciseCounter}" placeholder="e.g., Squats, Push-ups">
            </div>
            <div class="row mb-3">
                <div class="col-md-4">
                    <label for="exerciseSets${exerciseCounter}" class="form-label">Sets</label>
                    <input type="number" class="form-control" id="exerciseSets${exerciseCounter}" min="1" value="3">
                </div>
                <div class="col-md-4">
                    <label for="exerciseReps${exerciseCounter}" class="form-label">Reps</label>
                    <input type="number" class="form-control" id="exerciseReps${exerciseCounter}" min="1" value="10">
                </div>
                <div class="col-md-4">
                    <label for="exerciseRest${exerciseCounter}" class="form-label">Rest (sec)</label>
                    <input type="number" class="form-control" id="exerciseRest${exerciseCounter}" min="0" value="60">
                </div>
            </div>
            <div class="mb-2">
                <label for="exerciseNotes${exerciseCounter}" class="form-label">Notes</label>
                <textarea class="form-control" id="exerciseNotes${exerciseCounter}" rows="1"></textarea>
            </div>
        `;
        
        exerciseFields.appendChild(exerciseDiv);
        
        // Add event listener for remove button
        const removeBtn = exerciseDiv.querySelector('.remove-exercise');
        removeBtn.addEventListener('click', function() {
            exerciseDiv.remove();
        });
    });
}

// Handle geo-tracking checkbox
const useGeotrackingCheckbox = document.getElementById('useGeotracking');
const mapContainer = document.getElementById('mapContainer');

if (useGeotrackingCheckbox && mapContainer) {
    useGeotrackingCheckbox.addEventListener('change', function() {
        if (this.checked) {
            mapContainer.classList.remove('d-none');
            // Here you would initialize a map using a library like Leaflet or Google Maps
            // For demonstration purposes, we're just showing the container
        } else {
            mapContainer.classList.add('d-none');
        }
    });
}

// Form submissions
const logWorkoutForm = document.getElementById('logWorkoutForm');
const logStepsForm = document.getElementById('logStepsForm');

// Handle workout form submission
if (logWorkoutForm) {
    logWorkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm(logWorkoutForm)) {
            showAlert('Please fill in all required fields', 'danger');
            return;
        }
        
        // Get exercises if it's a custom template
        const exercises = [];
        if (document.getElementById('workoutTemplate').value === 'custom') {
            const exerciseItems = document.querySelectorAll('.exercise-item');
            exerciseItems.forEach(item => {
                const id = item.getAttribute('data-exercise-id');
                exercises.push({
                    name: document.getElementById(`exerciseName${id}`).value,
                    sets: document.getElementById(`exerciseSets${id}`).value,
                    reps: document.getElementById(`exerciseReps${id}`).value,
                    rest: document.getElementById(`exerciseRest${id}`).value,
                    notes: document.getElementById(`exerciseNotes${id}`).value
                });
            });
        }
        
        // Collect form data
        const workout = {
            id: Date.now(), // Use timestamp as unique ID
            template: document.getElementById('workoutTemplate').value,
            templateName: document.getElementById('workoutTemplate').value === 'custom' ? 
                         document.getElementById('customTemplateName').value : 
                         document.getElementById('workoutTemplate').options[document.getElementById('workoutTemplate').selectedIndex].text,
            exercises: exercises,
            duration: document.getElementById('workoutDuration').value,
            calories: document.getElementById('workoutCalories').value || 'N/A',
            date: document.getElementById('workoutDate').value,
            time: document.getElementById('workoutTime').value,
            notes: document.getElementById('workoutNotes').value,
            timestamp: Date.now()
        };
        
        // Save to localStorage
        const workouts = JSON.parse(localStorage.getItem('fitnessWorkouts'));
        workouts.unshift(workout); // Add to beginning of array
        localStorage.setItem('fitnessWorkouts', JSON.stringify(workouts));
        
        // Update workout streak
        updateWorkoutStreak();
        
        // Update the display
        displayRecentWorkouts();
        updateStreakDisplay();
        
        // Show success message
        showAlert('Workout logged successfully!', 'success');
        
        // Reset form
        logWorkoutForm.reset();
        customTemplateFields.classList.add('d-none');
        exerciseFields.innerHTML = '';
        exerciseCounter = 0;
        
        // Set today's date as default
        document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
    });
}

// Handle steps form submission
if (logStepsForm) {
    logStepsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm(logStepsForm)) {
            showAlert('Please fill in all required fields', 'danger');
            return;
        }
        
        // Collect form data
        const steps = {
            id: Date.now(), // Use timestamp as unique ID
            count: document.getElementById('stepsCount').value,
            distance: document.getElementById('stepsDistance').value,
            date: document.getElementById('stepsDate').value,
            duration: document.getElementById('stepsDuration').value,
            routeType: document.getElementById('routeType').value,
            useGeotracking: document.getElementById('useGeotracking').checked,
            timestamp: Date.now()
        };
        
        // Save to localStorage
        const stepsLog = JSON.parse(localStorage.getItem('fitnessSteps'));
        stepsLog.unshift(steps); // Add to beginning of array
        localStorage.setItem('fitnessSteps', JSON.stringify(stepsLog));
        
        // Update today's steps if the date is today
        const today = new Date().toISOString().split('T')[0];
        if (steps.date === today) {
            const currentSteps = parseInt(localStorage.getItem('todaySteps') || '0');
            const newSteps = currentSteps + parseInt(steps.count);
            localStorage.setItem('todaySteps', newSteps.toString());
            updateStepDisplay();
        }
        
        // Show success message
        showAlert('Steps logged successfully!', 'success');
        
        // Reset form
        logStepsForm.reset();
        mapContainer.classList.add('d-none');
        
        // Set today's date as default
        document.getElementById('stepsDate').value = new Date().toISOString().split('T')[0];
    });
}

// Simple form validation function
function validateForm(form) {
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

// Display recent workouts in the UI
function displayRecentWorkouts() {
    const workoutsContainer = document.querySelector('.col-lg-5 .list-group:nth-of-type(2)');
    if (!workoutsContainer) return;
    
    const workouts = JSON.parse(localStorage.getItem('fitnessWorkouts'));
    if (!workouts || workouts.length === 0) {
        workoutsContainer.innerHTML = '<div class="list-group-item text-center text-muted">No workouts logged yet</div>';
        return;
    }
    
    // Display the 2 most recent workouts
    workoutsContainer.innerHTML = '';
    const displayWorkouts = workouts.slice(0, 2);
    
    displayWorkouts.forEach(workout => {
        const date = new Date(workout.timestamp);
        const formattedDate = formatDate(date);
        
        workoutsContainer.innerHTML += `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${workout.templateName}</h6>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <p class="mb-1">${workout.duration} min • ${workout.calories !== 'N/A' ? workout.calories + ' calories' : 'No calories recorded'}</p>
            </div>
        `;
    });
}

// Update the workout streak
function updateWorkoutStreak() {
    // Get current streak
    let streak = parseInt(localStorage.getItem('workoutStreak') || '0');
    
    // Check if a workout was already logged today
    const workouts = JSON.parse(localStorage.getItem('fitnessWorkouts'));
    const today = new Date().toISOString().split('T')[0];
    
    const workoutToday = workouts.some(workout => {
        return workout.date === today;
    });
    
    // Check if a workout was logged yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const workoutYesterday = workouts.some(workout => {
        return workout.date === yesterdayString;
    });
    
    // Update streak logic
    if (workoutToday && !workoutYesterday && streak === 0) {
        // First day of streak
        streak = 1;
    } else if (workoutToday && workoutYesterday) {
        // Continuing streak
        streak += 1;
    } else if (!workoutYesterday && !workoutToday) {
        // Streak broken
        streak = 0;
    }
    
    // Save updated streak
    localStorage.setItem('workoutStreak', streak.toString());
}

// Update streak display
function updateStreakDisplay() {
    const streakNumber = document.querySelector('.streak-number');
    if (!streakNumber) return;
    
    const streak = parseInt(localStorage.getItem('workoutStreak') || '0');
    streakNumber.textContent = streak;
}

// Update step display
function updateStepDisplay() {
    const stepCounter = document.querySelector('.step-counter .display-1');
    const progressBar = document.querySelector('.progress-bar');
    
    if (!stepCounter || !progressBar) return;
    
    const todaySteps = parseInt(localStorage.getItem('todaySteps') || '0');
    const goalSteps = parseInt(localStorage.getItem('dailyStepGoal') || '10000');
    
    // Update step count
    stepCounter.textContent = todaySteps.toLocaleString();
    
    // Update progress bar
    const percentage = Math.min(Math.round((todaySteps / goalSteps) * 100), 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
}

// Format date for display
function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateOnly.getTime() === today.getTime()) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dateOnly.getTime() === yesterday.getTime()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
}

// Set the current date as default for date inputs
const dateInputs = document.querySelectorAll('input[type="date"]');
const today = new Date().toISOString().split('T')[0];
dateInputs.forEach(input => {
    input.value = today;
});

// --- WORKOUTS ---

let exerciseCounter = 0;

async function loadAndDisplayWorkoutTemplates() {
    const selectElement = document.getElementById('workoutTemplate');
    if (!selectElement) return;

    try {
        const response = await fetch('/api/workout-templates');
        if (!response.ok) throw new Error('Failed to fetch templates');
        const templates = await response.json();

        // Clear existing options except for the placeholder and "Create New"
        while (selectElement.options.length > 2) {
            selectElement.remove(1);
        }

        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template._id;
            option.textContent = template.name;
            // Insert before the "Create Custom" option
            selectElement.insertBefore(option, selectElement.options[selectElement.options.length - 1]);
        });
    } catch (error) {
        console.error('Error loading workout templates:', error);
    }
}

async function handleLogWorkout(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
        showAlert('Please fill out all required workout fields.', 'warning');
        return;
    }

    const formData = new FormData(form);
    const workoutType = formData.get('workoutType');
    
    let workoutData = {
        duration: formData.get('duration'),
        calories: formData.get('calories'),
        date: formData.get('date'),
        time: formData.get('time'),
        notes: formData.get('notes'),
    };

    try {
        if (workoutType === 'template') {
            const templateId = formData.get('templateId');
            if (!templateId || templateId === 'custom') {
                // If custom, create the template first
                const newTemplateData = getTemplateDataFromForm();
                if (newTemplateData.exercises.length === 0) {
                    showAlert('Please add at least one exercise to the new template.', 'warning');
                    return;
                }
                const newTemplate = await createWorkoutTemplate(newTemplateData);
                workoutData.templateId = newTemplate.insertedId;
            } else {
                workoutData.templateId = templateId;
            }
        } else { // 'single' workout
            workoutData.exercises = getExercisesFromForm('singleWorkoutExerciseFields');
            if (workoutData.exercises.length === 0) {
                showAlert('Please add at least one exercise to the workout.', 'warning');
                return;
            }
        }

        const response = await fetch('/api/workouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workoutData)
        });

        if (response.ok) {
            showAlert('Workout logged successfully!', 'success');
            form.reset();
            // Reset UI state
            document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('customTemplateFields').classList.add('d-none');
            document.getElementById('exerciseFields').innerHTML = '';
            document.getElementById('logSingleWorkoutContainer').classList.add('d-none');
            document.getElementById('singleWorkoutExerciseFields').innerHTML = '';
            
            // Reload data
            loadAndDisplayRecentWorkouts();
            loadWorkoutStreak();
            loadAndDisplayWorkoutTemplates();

        } else {
            const errorData = await response.json();
            showAlert(`Error: ${errorData.message || 'Failed to log workout'}`, 'danger');
        }

    } catch (error) {
        console.error('Error logging workout:', error);
        showAlert('An error occurred while logging the workout.', 'danger');
    }
}

async function createWorkoutTemplate(templateData) {
    const response = await fetch('/api/workout-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
    });
    if (!response.ok) {
        throw new Error('Failed to create template');
    }
    return response.json();
}

async function loadAndDisplayRecentWorkouts() {
    const listContainer = document.getElementById('recent-workouts-list');
    if (!listContainer) return;
    try {
        const response = await fetch('/api/all-workouts'); // Using all-workouts to get populated template names
        if (!response.ok) throw new Error('Failed to fetch workouts');
        
        const workouts = await response.json();
        listContainer.innerHTML = '';
        if (workouts.length === 0) {
            listContainer.innerHTML = '<div class="list-group-item text-muted">No workouts logged yet.</div>';
            return;
        }

        workouts.slice(0, 5).forEach(workout => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            const date = new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            let title = 'Single Workout';
            if(workout.templateDetails) {
                title = workout.templateDetails.name;
            }
            
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${title}</h6>
                    <small>${date}</small>
                </div>
                <small>${workout.duration} mins | ${workout.calories} kcal</small>
            `;
            listContainer.appendChild(item);
        });

    } catch (error) {
        console.error('Error fetching recent workouts:', error);
        listContainer.innerHTML = '<div class="list-group-item text-danger">Could not load workouts.</div>';
    }
}

async function loadWorkoutStreak() {
    const streakElement = document.getElementById('workoutStreak');
    if (!streakElement) return;
    try {
        const response = await fetch('/api/workout-streak');
        if (!response.ok) throw new Error('Failed to fetch streak');
        const { streak } = await response.json();
        streakElement.textContent = streak;
    } catch (error) {
        console.error('Error fetching workout streak:', error);
        streakElement.textContent = 'X';
    }
}

function toggleWorkoutType(e) {
    const workoutType = e.target.value;
    const templateContainer = document.getElementById('logFromTemplateContainer');
    const singleContainer = document.getElementById('logSingleWorkoutContainer');

    if (workoutType === 'template') {
        templateContainer.classList.remove('d-none');
        singleContainer.classList.add('d-none');
    } else {
        templateContainer.classList.add('d-none');
        singleContainer.classList.remove('d-none');
    }
}

function handleTemplateSelection(e) {
    const customFields = document.getElementById('customTemplateFields');
    if (e.target.value === 'custom') {
        customFields.classList.remove('d-none');
    } else {
        customFields.classList.add('d-none');
    }
}

function addExerciseField(containerId) {
    exerciseCounter++;
    const container = document.getElementById(containerId);
    if (!container) return;

    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'border rounded p-3 mb-3 position-relative exercise-item';
    exerciseDiv.innerHTML = `
        <button type="button" class="btn-close btn-sm position-absolute top-0 end-0 m-2 remove-exercise" aria-label="Remove"></button>
        <div class="mb-2">
            <label class="form-label">Exercise Name</label>
            <input type="text" class="form-control form-control-sm" name="exerciseName" placeholder="e.g., Squats" required>
        </div>
        <div class="row">
            <div class="col-6"><label class="form-label">Sets</label><input type="number" class="form-control form-control-sm" name="sets" min="1" value="3"></div>
            <div class="col-6"><label class="form-label">Reps</label><input type="number" class="form-control form-control-sm" name="reps" min="1" value="10"></div>
        </div>
    `;
    container.appendChild(exerciseDiv);

    exerciseDiv.querySelector('.remove-exercise').addEventListener('click', () => {
        exerciseDiv.remove();
    });
}

function getTemplateDataFromForm() {
    const templateName = document.getElementById('customTemplateName').value;
    const exercises = getExercisesFromForm('exerciseFields');
    return { templateName, exercises };
}

function getExercisesFromForm(containerId) {
    const exercises = [];
    const exerciseItems = document.getElementById(containerId).querySelectorAll('.exercise-item');
    exerciseItems.forEach(item => {
        const name = item.querySelector('input[name="exerciseName"]').value;
        const sets = item.querySelector('input[name="sets"]').value;
        const reps = item.querySelector('input[name="reps"]').value;
        if (name) { // Only add if name is not empty
            exercises.push({ name, sets: parseInt(sets), reps: parseInt(reps) });
        }
    });
    return exercises;
}

// --- STEPS & ROUTE FINDER ---

let map; // Keep map instance in a broader scope
let selectedRoute = null; // Store selected route data

async function handleLogSteps(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
        showAlert('Please fill out all required step fields.', 'warning');
        return;
    }
    
    const formData = new FormData(form);
    const stepsData = {
        steps: formData.get('steps'),
        distance: formData.get('distance'),
        distanceUnit: formData.get('distanceUnit'),
        duration: formData.get('duration'),
        date: formData.get('date'),
        time: formData.get('time'),
        // Include route data if a route was selected
        route: selectedRoute
    };

    try {
        const response = await fetch('/api/steps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stepsData)
        });

        if (response.ok) {
            showAlert('Steps logged successfully!', 'success');
            form.reset();
            document.getElementById('stepsDate').value = new Date().toISOString().split('T')[0];
            selectedRoute = null; // Clear selected route
            loadAndDisplayRecentSteps();
        } else {
            const errorData = await response.json();
            showAlert(`Error: ${errorData.message || 'Failed to log steps'}`, 'danger');
        }
    } catch (error) {
        console.error('Error logging steps:', error);
        showAlert('An error occurred while logging steps.', 'danger');
    }
}

async function loadAndDisplayRecentSteps() {
    const listContainer = document.getElementById('recent-steps-list');
    if (!listContainer) return;
    try {
        const response = await fetch('/api/steps/all');
        if (!response.ok) throw new Error('Failed to fetch step entries');
        
        const steps = await response.json();
        listContainer.innerHTML = '';
        if (steps.length === 0) {
            listContainer.innerHTML = '<div class="list-group-item text-muted">No step entries logged yet.</div>';
            return;
        }

        steps.slice(0, 5).forEach(entry => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            const date = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            let title = `${entry.steps} steps`;
            if (entry.source === 'route' && entry.route) {
                title = `<i class="bi bi-signpost-split"></i> ${entry.route.name}`;
            }

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${title}</h6>
                    <small>${date}</small>
                </div>
                <small>${entry.distance} ${entry.distanceUnit} | ${entry.duration} mins</small>
            `;
            listContainer.appendChild(item);
        });

    } catch (error) {
        console.error('Error fetching recent steps:', error);
        listContainer.innerHTML = '<div class="list-group-item text-danger">Could not load step entries.</div>';
    }
}


async function initializeMap() {
    const mapContainer = document.getElementById('map');
    mapContainer.style.display = 'block';
    showAlert('Finding your location...', 'info');

    try {
        const tokenResponse = await fetch('/api/mapbox-token');
        if (!tokenResponse.ok) throw new Error('Failed to get map token');
        const { token } = await tokenResponse.json();
        mapboxgl.accessToken = token;

        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [longitude, latitude],
                zoom: 13
            });
            
            // Add user location marker
            new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);

            findRoutes([longitude, latitude]);

        }, (error) => {
            console.error('Geolocation error:', error);
            showAlert('Could not get your location. Please allow location access.', 'danger');
            mapContainer.style.display = 'none';
        });

    } catch (error) {
        console.error('Map initialization error:', error);
        showAlert('Could not initialize map.', 'danger');
        mapContainer.style.display = 'none';
    }
}

async function findRoutes(startCoords) {
    const profile = document.querySelector('input[name="routeType"]:checked').value; // walking, running, cycling
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startCoords[0]},${startCoords[1]}?alternatives=true&geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
    // This is a simplified query. A real app would let users pick a destination.
    // For this implementation, we'll just show some routes *from* the current location, which isn't very useful without a destination.
    // A better approach would be to integrate the Mapbox Geocoder to select a destination.
    // Let's just log a message for now and display a placeholder.
    
    const routesContainer = document.getElementById('routesContainer');
    routesContainer.innerHTML = '<div class="list-group-item text-muted">Route finder feature is a work in progress. For now, please enter steps manually.</div>';
    showAlert('Route finder is a demo and does not yet support destination selection.', 'warning');
}