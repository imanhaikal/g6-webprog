const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Allow frontend requests
const User = require('./models/User'); // Import the User model

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse incoming JSON

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://AliffAmmar:AliffAmmar@cluster0.uvzdzfb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  dbName: 'webprog'
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));


// Register route
app.post('/api/register', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);

    if (err.name === 'ValidationError') {
      // Handle validation errors
      const errors = Object.values(err.errors).map(e => ({ msg: e.message }));
      return res.status(400).json({ errors });
    } else if (err.code === 11000) {
      // Duplicate key (username/email already exists)
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
