document.addEventListener('DOMContentLoaded', function() {
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

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Display existing data
    displayRecentActivities();
    displayRecentWorkouts();
    updateStepDisplay();
    updateStreakDisplay();

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
    const logActivityForm = document.getElementById('logActivityForm');
    const logWorkoutForm = document.getElementById('logWorkoutForm');
    const logStepsForm = document.getElementById('logStepsForm');
    
    // Handle activity form submission
    if (logActivityForm) {
        logActivityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(logActivityForm)) {
                showAlert('Please fill in all required fields', 'danger');
                return;
            }
            
            // Collect form data
            const activity = {
                id: Date.now(), // Use timestamp as unique ID
                name: document.getElementById('activityName').value,
                category: document.getElementById('activityCategory').value,
                intensity: document.getElementById('activityIntensity').value,
                duration: document.getElementById('activityDuration').value,
                calories: document.getElementById('activityCalories').value || 'N/A',
                date: document.getElementById('activityDate').value,
                time: document.getElementById('activityTime').value,
                notes: document.getElementById('activityNotes').value,
                timestamp: Date.now()
            };
            
            // Save to localStorage
            const activities = JSON.parse(localStorage.getItem('fitnessActivities'));
            activities.unshift(activity); // Add to beginning of array
            localStorage.setItem('fitnessActivities', JSON.stringify(activities));
            
            // Update the display
            displayRecentActivities();
            
            // Show success message
            showAlert('Activity logged successfully!', 'success');
            
            // Reset form
            logActivityForm.reset();
            
            // Set today's date as default
            document.getElementById('activityDate').value = new Date().toISOString().split('T')[0];
        });
    }
    
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
    
    // Display recent activities in the UI
    function displayRecentActivities() {
        const activitiesContainer = document.querySelector('.col-lg-5 .list-group');
        if (!activitiesContainer) return;
        
        const activities = JSON.parse(localStorage.getItem('fitnessActivities'));
        if (!activities || activities.length === 0) {
            activitiesContainer.innerHTML = '<div class="list-group-item text-center text-muted">No activities logged yet</div>';
            return;
        }
        
        // Display the 3 most recent activities
        activitiesContainer.innerHTML = '';
        const displayActivities = activities.slice(0, 3);
        
        displayActivities.forEach(activity => {
            const date = new Date(activity.timestamp);
            const formattedDate = formatDate(date);
            
            activitiesContainer.innerHTML += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${activity.name}</h6>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    <p class="mb-1">${activity.category} • ${activity.intensity} • ${activity.duration} min</p>
                    <small class="text-muted">${activity.calories !== 'N/A' ? activity.calories + ' calories burned' : 'No calories recorded'}</small>
                </div>
            `;
        });
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
    
    // Show alert message
    function showAlert(message, type) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4 shadow z-3`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add to page
        document.body.appendChild(alertDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                alertDiv.remove();
            }, 150);
        }, 3000);
    }
    
    // Set the current date as default for date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.value = today;
    });
}); 