//validate form
function validateForm(event) {
    const form = event.target;
  
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
  
    return true;
  }

// Set max date for DOB as today 
    const dobInput = document.getElementById('dob');
    if (dobInput) {
      const today = new Date().toISOString().split('T')[0];
      dobInput.setAttribute('max', today);
    }