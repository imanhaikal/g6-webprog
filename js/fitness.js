document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

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
                return;
            }
            
            // Here you would collect the form data and send it to your backend
            alert('Activity logged successfully!');
            
            // Reset form
            logActivityForm.reset();
        });
    }
    
    // Handle workout form submission
    if (logWorkoutForm) {
        logWorkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(logWorkoutForm)) {
                return;
            }
            
            // Here you would collect the form data and send it to your backend
            alert('Workout logged successfully!');
            
            // Reset form
            logWorkoutForm.reset();
            if (customTemplateFields) {
                customTemplateFields.classList.add('d-none');
            }
            if (exerciseFields) {
                exerciseFields.innerHTML = '';
            }
        });
    }
    
    // Handle steps form submission
    if (logStepsForm) {
        logStepsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(logStepsForm)) {
                return;
            }
            
            // Here you would collect the form data and send it to your backend
            alert('Steps logged successfully!');
            
            // Reset form
            logStepsForm.reset();
            if (mapContainer) {
                mapContainer.classList.add('d-none');
            }
            if (useGeotrackingCheckbox) {
                useGeotrackingCheckbox.checked = false;
            }
        });
    }
    
    // Simple form validation function
    function validateForm(form) {
        let isValid = true;
        
        // Check required fields
        const requiredInputs = form.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], select');
        requiredInputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });
        
        // Add more specific validation as needed
        
        return isValid;
    }
    
    // Set the current date as default for date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.value = today;
    });
}); 