document.getElementById("register-form").addEventListener("submit", async function(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    age: parseInt(document.getElementById("age").value),
    weight: parseFloat(document.getElementById("weight").value) || null,
    height: parseFloat(document.getElementById("height").value) || null,
    password: document.getElementById("password").value
  };

  try {
  const response = await fetch("http://localhost:3000/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (response.ok) {
    alert("Registered successfully!");
    window.location.href = "login.html";
  } else {
    const text = await response.text(); // Get the response as text
    let err;
    try {
      err = JSON.parse(text); // Try to parse it as JSON
    } catch {
      err = { error: 'Unexpected error occurred' }; // Fallback error message
    }
    alert("Registration failed: " + (err.errors ? err.errors.map(e => e.msg).join(", ") : err.error));
  }
} catch (error) {
  console.error("Error details:", error);
  alert("Error submitting form: " + error.message);
}
});
