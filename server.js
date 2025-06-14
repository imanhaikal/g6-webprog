const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const port = 3000;

// Use the environment variable for the connection string
const uri = process.env.MONGO_URI;

// Middleware for parsing form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware setup
app.use(session({
    secret: 'a secret key to sign the cookie',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: uri })
}));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// Authentication middleware
const authMiddleware = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
};

// --- Application Routes ---

// Root route
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/index.html');
    } else {
        res.sendFile(path.join(__dirname, 'landing.html'));
    }
});

// Protected routes
app.get('/index.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Register route
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const db = client.db('webprog');
    const usersCollection = db.collection('users');

    try {
        const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send('User with this username or email already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await usersCollection.insertOne({
            username,
            email,
            password: hashedPassword,
        });

        res.redirect('/login.html');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during registration.');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = client.db('webprog');
    const usersCollection = db.collection('users');

    try {
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid username or password.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid username or password.');
        }

        req.session.user = { id: user._id, username: user.username };
        res.redirect('/index.html');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during login.');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out.');
        }
        res.redirect('/landing.html');
    });
});

// --- Static Files ---
// This must come AFTER the routes
app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
}); 