const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    if (req.session.user && req.session.user.id && ObjectId.isValid(req.session.user.id)) {
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

app.get('/activities.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'activities.html'));
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

// Log activity route
app.post('/log-activity', authMiddleware, async (req, res) => {
    const {
        activityName,
        activityCategory,
        activityIntensity,
        activityDuration,
        activityDate,
        activityTime,
        activityCalories,
        activityNotes
    } = req.body;
    const userId = req.session.user.id;

    const db = client.db('webprog');
    const activitiesCollection = db.collection('activities');

    try {
        const result = await activitiesCollection.insertOne({
            userId: new ObjectId(userId),
            activityType: activityName,
            category: activityCategory,
            intensity: activityIntensity,
            duration: parseInt(activityDuration, 10),
            date: new Date(`${activityDate}T${activityTime}`),
            calories: activityCalories ? parseInt(activityCalories, 10) : null,
            notes: activityNotes
        });
        res.status(201).json({ message: 'Activity logged successfully', insertedId: result.insertedId });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).send('Failed to log activity.');
    }
});

// Get recent activities route
app.get('/get-activities', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const activitiesCollection = db.collection('activities');

    try {
        const activities = await activitiesCollection
            .find({ userId: new ObjectId(userId) })
            .sort({ date: -1 })
            .limit(5)
            .toArray();
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).send('Failed to fetch activities.');
    }
});

// Get all activities route
app.get('/get-all-activities', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const activitiesCollection = db.collection('activities');

    try {
        const activities = await activitiesCollection
            .find({ userId: new ObjectId(userId) })
            .sort({ date: -1 })
            .toArray();
        res.json(activities);
    } catch (error) {
        console.error('Error fetching all activities:', error);
        res.status(500).send('Failed to fetch all activities.');
    }
});

// Get single activity route (for editing)
app.get('/get-activity/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { user } = req.session;

    if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid activity ID format.');
    }

    const db = client.db('webprog');
    const activitiesCollection = db.collection('activities');

    try {
        const activity = await activitiesCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.id)
        });

        if (!activity) {
            return res.status(404).send('Activity not found or user not authorized.');
        }

        res.json(activity);
    } catch (error) {
        console.error('Error fetching single activity:', error);
        res.status(500).send('Failed to fetch activity.');
    }
});

// Update activity route
app.put('/update-activity/:id', authMiddleware, async (req, res) => {
    const activityId = req.params.id;
    if (!ObjectId.isValid(activityId)) {
        return res.status(400).send('Invalid activity ID format.');
    }
    const {
        activityName,
        category,
        intensity,
        duration,
        date,
        time,
        calories,
        notes
    } = req.body;
    const userId = req.session.user.id;

    const db = client.db('webprog');
    const activitiesCollection = db.collection('activities');

    try {
        const result = await activitiesCollection.updateOne(
            { _id: new ObjectId(activityId), userId: new ObjectId(userId) },
            {
                $set: {
                    activityType: activityName,
                    category,
                    intensity,
                    duration: parseInt(duration, 10),
                    date: new Date(`${date}T${time}`),
                    calories: calories ? parseInt(calories, 10) : null,
                    notes
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('Activity not found or user not authorized.');
        }

        res.json({ message: 'Activity updated successfully' });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).send('Failed to update activity.');
    }
});

// Delete activity route
app.delete('/delete-activity/:id', authMiddleware, async (req, res) => {
    const activityId = req.params.id;
    if (!ObjectId.isValid(activityId)) {
        return res.status(400).send('Invalid activity ID format.');
    }
    const userId = req.session.user.id;

    const db = client.db('webprog');
    const activitiesCollection = db.collection('activities');

    try {
        const result = await activitiesCollection.deleteOne({
            _id: new ObjectId(activityId),
            userId: new ObjectId(userId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).send('Activity not found or user not authorized.');
        }

        res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).send('Failed to delete activity.');
    }
});

// --- Static Files ---
// This must come AFTER the routes
app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
}); 