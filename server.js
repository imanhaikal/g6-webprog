const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const path = require('path');
const fs = require('fs'); // Require the file system module
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const webPush = require('web-push');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const multer = require('multer'); // Require multer
const axios = require('axios'); // For making HTTP requests to external APIs

const app = express();
const port = 3000;

// Use the environment variable for the connection string
const uri = process.env.MONGO_URI;

// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = 'profile_pics';

    // Check if this is a meal picture upload
    if (file.fieldname === 'mealPicture') {
      uploadDir = 'meal_pics';
    }

    const uploadPath = path.join(__dirname, `uploads/${uploadDir}`);
    // Create the directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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

// VAPID keys should be stored in environment variables
if (!'BB1ps-PnF3YWgbDclyhlX7T-IszmPZGMTYfydgEF6iOuuY3Ke7hf2YNqbzikNOR_Yg9DUzEGtRhcoX49tSCrqeE' || !'f35MWxp6k-vvW5jkGMv5Sb85qUySerb0NYQtnxd-BxI') {
    console.log("You must set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env file. You can use the `npm run vapi` command to generate them.");
    process.exit(1);
}

const vapidKeys = {
    publicKey: 'BB1ps-PnF3YWgbDclyhlX7T-IszmPZGMTYfydgEF6iOuuY3Ke7hf2YNqbzikNOR_Yg9DUzEGtRhcoX49tSCrqeE',
    privateKey: 'f35MWxp6k-vvW5jkGMv5Sb85qUySerb0NYQtnxd-BxI'
};

webPush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'healthtrackerg6@gmail.com',
        pass: 'ramrepsbdovdkypm'
    }
});

async function sendWelcomeEmail(email, name) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Health and Fitness Tracker!',
        html: `<h1>Welcome, ${name}!</h1>
               <p>Thank you for registering. We are excited to have you on board.</p>
               <p>Start tracking your fitness journey now!</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to', email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
}

async function sendReminderEmail(email, name, reminder) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Reminder: ${reminder.title}`,
        html: `<h1>Hi ${name},</h1>
               <p>This is a reminder for you:</p>
               <p><b>${reminder.message}</b></p>
               <p>Have a great day!</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder email sent to ${email}`);
    } catch (error) {
        console.error('Error sending reminder email:', error);
    }
}

const presetTemplates = [
    {
        name: "Full Body Strength",
        exercises: [
            { name: "Squats", sets: 3, reps: 10 },
            { name: "Push-ups", sets: 3, reps: 15 },
            { name: "Rows", sets: 3, reps: 12 },
            { name: "Overhead Press", sets: 3, reps: 10 },
        ],
    },
    {
        name: "Cardio Blast",
        exercises: [
            { name: "Jumping Jacks", duration: 60 }, // duration in seconds
            { name: "High Knees", duration: 60 },
            { name: "Burpees", duration: 60 },
        ],
    },
    {
        name: "Core Focus",
        exercises: [
            { name: "Plank", duration: 60 },
            { name: "Crunches", sets: 3, reps: 20 },
            { name: "Leg Raises", sets: 3, reps: 15 },
        ],
    },
];

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

// --- Web Push Notification Routes ---

// Subscribe route
app.post('/subscribe', authMiddleware, async (req, res) => {
    const subscription = req.body;
    const userId = req.session.user.id;

    const db = client.db('webprog');
    const subscriptionsCollection = db.collection('subscriptions');

    try {
        // Optional: remove old subscription for the same user
        await subscriptionsCollection.deleteMany({ userId: new ObjectId(userId) });
        
        await subscriptionsCollection.insertOne({
            userId: new ObjectId(userId),
            subscription: subscription
        });
        
        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).send('Failed to save subscription.');
    }
});

// Unsubscribe route
app.post('/unsubscribe', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const subscriptionsCollection = db.collection('subscriptions');

    try {
        await subscriptionsCollection.deleteMany({ userId: new ObjectId(userId) });
        res.status(200).json({ message: 'Unsubscribed successfully.' });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).send('Failed to unsubscribe.');
    }
});

// Send notification route (for testing)
app.post('/send-notification', authMiddleware, async (req, res) => {
    const { title, message } = req.body;
    const userId = req.session.user.id;
    
    const db = client.db('webprog');
    const subscriptionsCollection = db.collection('subscriptions');

    try {
        const userSubscriptions = await subscriptionsCollection.find({ userId: new ObjectId(userId) }).toArray();

        const notificationPayload = JSON.stringify({ title, body: message });

        const promises = userSubscriptions.map(sub => webPush.sendNotification(sub.subscription, notificationPayload));
        
        await Promise.all(promises);

        res.status(200).json({ message: 'Notification sent.' });

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Failed to send notification.');
    }
});

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

app.get('/workouts.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'workouts.html'));
});

// Register route
app.post('/register', async (req, res) => {
    const { username, email, password, name, age, weight, height } = req.body;
    const db = client.db('webprog');
    const usersCollection = db.collection('users');
    const templatesCollection = db.collection('workout_templates');

    try {
        const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send('User with this username or email already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserResult = await usersCollection.insertOne({
            username,
            email,
            password: hashedPassword,
            name: name,
            age: parseInt(age, 10),
            weight: weight ? parseFloat(weight) : null,
            height: height ? parseInt(height, 10) : null,
            createdAt: new Date(),
            settings: {
                emailNotifications: true // Default to true
            }
        });

        // Add preset templates for the new user
        const userId = newUserResult.insertedId;
        const userPresetTemplates = presetTemplates.map(template => ({
            ...template,
            userId: userId,
            isPreset: true, // Flag to identify preset templates
            createdAt: new Date(),
        }));
        
        await templatesCollection.insertMany(userPresetTemplates);

        // Send welcome email
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });
        
        if (user && user.settings && user.settings.emailNotifications === false) {
            console.log(`Email notifications are disabled for ${email}. Skipping welcome email.`);
            return;
        }

        await sendWelcomeEmail(email, name);

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

// Session status endpoint
app.get('/api/session-status', (req, res) => {
    if (req.session.user && req.session.user.id) {
        res.status(200).json({ isLoggedIn: true });
    } else {
        res.status(401).json({ isLoggedIn: false });
    }
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

app.get('/today-steps', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const stepsCollection = db.collection('steps');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const aggregation = [
            {
                $match: {
                    userId: new ObjectId(userId),
                    date: {
                        $gte: today,
                        $lt: tomorrow
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSteps: { $sum: "$steps" }
                }
            }
        ];

        const result = await stepsCollection.aggregate(aggregation).toArray();
        const totalSteps = result.length > 0 ? result[0].totalSteps : 0;

        res.json({ totalSteps });
    } catch (error) {
        console.error('Error fetching today\'s steps:', error);
        res.status(500).send('Failed to fetch today\'s steps.');
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

// --- Workout and Template Routes ---

// Get all workout templates for the user
app.get('/api/workout-templates', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    const templatesCollection = db.collection('workout_templates');
    try {
        const templates = await templatesCollection.find({ userId: new ObjectId(req.session.user.id) }).toArray();
        res.json(templates);
    } catch (error) {
        console.error('Error fetching workout templates:', error);
        res.status(500).send('Failed to fetch workout templates.');
    }
});

// Create a new workout template
app.post('/api/workout-templates', authMiddleware, async (req, res) => {
    const { templateName, exercises } = req.body;
    const db = client.db('webprog');
    const templatesCollection = db.collection('workout_templates');
    try {
        const newTemplate = {
            userId: new ObjectId(req.session.user.id),
            name: templateName,
            exercises, // [{ name, sets, reps }]
            createdAt: new Date()
        };
        const result = await templatesCollection.insertOne(newTemplate);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating workout template:', error);
        res.status(500).send('Failed to create workout template.');
    }
});

// Log a new workout
app.post('/api/workouts', authMiddleware, async (req, res) => {
    const { templateId, duration, date, time, notes, exercises } = req.body;
    const db = client.db('webprog');
    const workoutsCollection = db.collection('workouts');

    try {
        const newWorkout = {
            userId: new ObjectId(req.session.user.id),
            duration: parseInt(duration, 10),
            date: new Date(`${date}T${time}`),
            notes,
            createdAt: new Date()
        };

        if (templateId) {
            newWorkout.templateId = new ObjectId(templateId);
            newWorkout.workoutType = 'template';
        } else if (exercises && exercises.length > 0) {
            newWorkout.exercises = exercises; // Storing the exercises directly
            newWorkout.workoutType = 'single';
        } else {
            return res.status(400).send('Workout must have either a templateId or a list of exercises.');
        }

        const result = await workoutsCollection.insertOne(newWorkout);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error logging workout:', error);
        res.status(500).send('Failed to log workout.');
    }
});

// Get recent workouts
app.get('/api/workouts', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    const workoutsCollection = db.collection('workouts');
    try {
        const recentWorkouts = await workoutsCollection
            .find({ userId: new ObjectId(req.session.user.id) })
            .sort({ date: -1 })
            .limit(5)
            .toArray();
        res.json(recentWorkouts);
    } catch (error) {
        console.error('Error fetching recent workouts:', error);
        res.status(500).send('Failed to fetch recent workouts.');
    }
});

// Get workout streak
app.get('/api/workout-streak', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    const workoutsCollection = db.collection('workouts');
    try {
        const workouts = await workoutsCollection
            .find(
                { userId: new ObjectId(req.session.user.id) },
                { projection: { date: 1 } }
            )
            .sort({ date: -1 })
            .toArray();

        if (workouts.length === 0) {
            return res.json({ streak: 0 });
        }

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if there is a workout today or yesterday to start the streak count
        const mostRecentWorkoutDate = new Date(workouts[0].date);
        mostRecentWorkoutDate.setHours(0, 0, 0, 0);

        const diffTime = today - mostRecentWorkoutDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            return res.json({ streak: 0 }); // No workout today or yesterday
        }
        
        streak = 1;
        let lastWorkoutDate = mostRecentWorkoutDate;

        for (let i = 1; i < workouts.length; i++) {
            const currentWorkoutDate = new Date(workouts[i].date);
            currentWorkoutDate.setHours(0, 0, 0, 0);
            
            const daysBetween = (lastWorkoutDate - currentWorkoutDate) / (1000 * 60 * 60 * 24);

            if (daysBetween === 1) {
                streak++;
            } else if (daysBetween > 1) {
                break; // Streak is broken
            }
            // If daysBetween is 0, it's the same day, so we continue without incrementing streak
            
            lastWorkoutDate = currentWorkoutDate;
        }

        res.json({ streak });
    } catch (error) {
        console.error('Error calculating workout streak:', error);
        res.status(500).send('Failed to calculate streak.');
    }
});

// Get all workouts for a user, populating template data
app.get('/api/all-workouts', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    const workoutsCollection = db.collection('workouts');
    try {
        const allWorkouts = await workoutsCollection.aggregate([
            { $match: { userId: new ObjectId(req.session.user.id) } },
            { $sort: { date: -1 } },
            {
                $lookup: {
                    from: 'workout_templates',
                    localField: 'templateId',
                    foreignField: '_id',
                    as: 'templateDetails'
                }
            },
            {
                $unwind: {
                    path: '$templateDetails',
                    preserveNullAndEmptyArrays: true // Keep workouts even if template is deleted
                }
            }
        ]).toArray();
        res.json(allWorkouts);
    } catch (error) {
        console.error('Error fetching all workouts:', error);
        res.status(500).send('Failed to fetch all workouts.');
    }
});

// Get a single workout
app.get('/api/workouts/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid workout ID.');
    
    const db = client.db('webprog');
    const workout = await db.collection('workouts').findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(req.session.user.id)
    });

    if (!workout) return res.status(404).send('Workout not found.');
    res.json(workout);
});

// Update a workout
app.put('/api/workouts/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid workout ID.');

    const { duration, date, time, notes } = req.body;
    const db = client.db('webprog');

    try {
        const result = await db.collection('workouts').updateOne(
            { _id: new ObjectId(id), userId: new ObjectId(req.session.user.id) },
            { $set: {
                duration: parseInt(duration, 10),
                date: new Date(`${date}T${time}`),
                notes
            }}
        );
        if (result.matchedCount === 0) return res.status(404).send('Workout not found.');
        res.json({ message: 'Workout updated successfully.' });
    } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).send('Failed to update workout.');
    }
});

// Delete a workout
app.delete('/api/workouts/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid workout ID.');
    const db = client.db('webprog');
    
    try {
        const result = await db.collection('workouts').deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(req.session.user.id)
        });
        if (result.deletedCount === 0) return res.status(404).send('Workout not found.');
        res.status(200).json({ message: 'Workout deleted successfully.' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).send('Failed to delete workout.');
    }
});

// --- Steps ---
// POST /api/steps - Log a new steps entry
app.post('/api/steps', authMiddleware, async (req, res) => {
    const { steps, distance, distanceUnit, duration, date, time } = req.body;
    const db = client.db('webprog');
    try {
        await db.collection('steps').insertOne({
            userId: new ObjectId(req.session.user.id),
            steps: parseInt(steps, 10),
            distance: parseFloat(distance),
            distanceUnit,
            duration: parseInt(duration, 10),
            date: new Date(`${date}T${time}`),
            source: 'manual',
            createdAt: new Date()
        });
        res.status(201).json({ message: 'Steps logged successfully.' });
    } catch (error) {
        console.error('Error logging steps:', error);
        res.status(500).send('Failed to log steps.');
    }
});

// GET /api/steps - Get recent step entries
app.get('/api/steps', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    try {
        const steps = await db.collection('steps')
            .find({ userId: new ObjectId(req.session.user.id) })
            .sort({ date: -1 })
            .limit(5)
            .toArray();
        res.json(steps);
    } catch (error) {
        console.error('Error fetching recent steps:', error);
        res.status(500).send('Failed to fetch recent steps.');
    }
});

// GET /api/steps/all - Get all step entries
app.get('/api/steps/all', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    try {
        const allSteps = await db.collection('steps')
            .find({ userId: new ObjectId(req.session.user.id) })
            .sort({ date: -1 })
            .toArray();
        res.json(allSteps);
    } catch (error) {
        console.error('Error fetching all steps:', error);
        res.status(500).send('Failed to fetch all steps.');
    }
});

// GET /api/steps/:id - Get a single step entry
app.get('/api/steps/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid steps ID.');
    const db = client.db('webprog');
    const entry = await db.collection('steps').findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(req.session.user.id)
    });
    if (!entry) return res.status(404).send('Entry not found.');
    res.json(entry);
});

// PUT /api/steps/:id - Update a step entry
app.put('/api/steps/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid steps ID.');
    const { steps, distance, distanceUnit, duration, date, time } = req.body;
    const db = client.db('webprog');
    try {
        const result = await db.collection('steps').updateOne(
            { _id: new ObjectId(id), userId: new ObjectId(req.session.user.id) },
            { $set: {
                steps: parseInt(steps, 10),
                distance: parseFloat(distance),
                distanceUnit,
                duration: parseInt(duration, 10),
                date: new Date(`${date}T${time}`)
            }}
        );
        if (result.matchedCount === 0) return res.status(404).send('Entry not found.');
        res.json({ message: 'Steps entry updated successfully.' });
    } catch (error) {
        console.error('Error updating steps entry:', error);
        res.status(500).send('Failed to update entry.');
    }
});

// DELETE /api/steps/:id - Delete a step entry
app.delete('/api/steps/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid steps ID.');
    const db = client.db('webprog');
    try {
        const result = await db.collection('steps').deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(req.session.user.id)
        });
        if (result.deletedCount === 0) return res.status(404).send('Entry not found.');
        res.json({ message: 'Steps entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting steps entry:', error);
        res.status(500).send('Failed to delete entry.');
    }
});

// --- Config ---
// Endpoint to provide the Mapbox token to the client
app.get('/api/mapbox-token', authMiddleware, (req, res) => {
    res.json({ token: "pk.eyJ1IjoiaW1hbmhhaWthbDA0IiwiYSI6ImNtYndzcDR4dDE0bW8ycnB0a3B0bzYwODAifQ.sYAJFD1CEceNAKrlerr-lg" });
});

// --- Profile Management ---
// GET /api/profile - Fetch user profile data
app.get('/api/profile', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.session.user.id) },
            { projection: { password: 0 } } // Exclude password from the result
        );
        if (!user) {
            return res.status(404).send('User not found.');
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Failed to fetch profile.');
    }
});

// PUT /api/profile - Update user profile data
app.put('/api/profile', authMiddleware, upload.single('profilePicture'), async (req, res) => {
    const { name, age, weight, height, goals, gender } = req.body;
    const db = client.db('webprog');

    let updateData = {
                    name: name,
                    age: parseInt(age, 10),
                    weight: parseFloat(weight),
                    height: parseInt(height, 10),
        goals: goals,
        gender: gender
    };

    // If a new file was uploaded, add its path to the update data
    if (req.file) {
        // We store a web-accessible path, not the full system path
        updateData.profilePictureUrl = `/uploads/profile_pics/${req.file.filename}`;
    }

    try {
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.session.user.id) },
            { $set: updateData }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send('User not found.');
        }
        res.json({ message: 'Profile updated successfully.', newImageUrl: updateData.profilePictureUrl });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Failed to update profile.');
    }
});

// Get user profile route
app.get('/profile', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } } // Exclude password from the result
        );
        if (!user) {
            return res.status(404).send('User not found.');
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Failed to fetch profile.');
    }
});

app.get('/today-calories', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const activitiesCollection = db.collection('activities');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const aggregation = [
            {
                $match: {
                    userId: new ObjectId(userId),
                    date: {
                        $gte: today,
                        $lt: tomorrow
                    },
                    calories: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCalories: { $sum: "$calories" }
                }
            }
        ];

        const result = await activitiesCollection.aggregate(aggregation).toArray();
        const totalCalories = result.length > 0 ? result[0].totalCalories : 0;

        res.json({ totalCalories });
    } catch (error) {
        console.error('Error fetching today\'s calories:', error);
        res.status(500).send('Failed to fetch today\'s calories.');
    }
});

app.get('/weekly-activity', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    try {
        const stepsData = await db.collection('steps').aggregate([
            { $match: { userId: new ObjectId(userId), date: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$steps" } } },
            { $sort: { _id: 1 } }
        ]).toArray();

        const caloriesData = await db.collection('activities').aggregate([
            { $match: { userId: new ObjectId(userId), date: { $gte: sevenDaysAgo }, calories: { $exists: true } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$calories" } } },
            { $sort: { _id: 1 } }
        ]).toArray();

        const workoutsData = await db.collection('workouts').aggregate([
            { $match: { userId: new ObjectId(userId), date: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$duration" } } },
            { $sort: { _id: 1 } }
        ]).toArray();

        // Helper to format data
        const formatData = (data, days) => {
            const dataMap = new Map(data.map(d => [d._id, d.total]));
            return days.map(day => dataMap.get(day) || 0);
        };

        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            labels.push(d.toISOString().split('T')[0]);
        }
        
        const dayLabels = labels.map(label => new Date(label).toLocaleDateString('en-US', { weekday: 'short' }));

        res.json({
            labels: dayLabels,
            steps: formatData(stepsData, labels),
            calories: formatData(caloriesData, labels),
            workouts: formatData(workoutsData, labels)
        });

    } catch (error) {
        console.error('Error fetching weekly activity data:', error);
        res.status(500).send('Failed to fetch weekly activity data');
        }
});
// PUT /api/profile/settings - Update user notification settings
app.put('/api/profile/settings', authMiddleware, async (req, res) => {
    const { emailNotifications } = req.body;
    const db = client.db('webprog');

    try {
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.session.user.id) },
            { 
                $set: {
                    'settings.emailNotifications': emailNotifications
                }
            }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send('User not found.');
        }
        res.json({ message: 'Settings updated successfully.' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).send('Failed to update settings.');
    }
});

// --- Scheduled Notification Routes ---

app.get('/api/scheduled-notifications', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const scheduledNotificationsCollection = db.collection('scheduled_notifications');

    try {
        const notifications = await scheduledNotificationsCollection
            .find({ userId: new ObjectId(userId) })
            .sort({ time: 1 })
            .toArray();
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching scheduled notifications:', error);
        res.status(500).send('Failed to fetch scheduled notifications.');
    }
});

app.post('/api/schedule-notification', authMiddleware, async (req, res) => {
    const { title, message, schedule } = req.body;
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const scheduledNotificationsCollection = db.collection('scheduled_notifications');

    if (!title || !message || !schedule || !schedule.type || !schedule.value) {
        return res.status(400).send('Invalid request body. Requires title, message, and a schedule object with type and value.');
    }

    try {
        const newNotification = {
            userId: new ObjectId(userId),
            title,
            message,
            schedule: {
                type: schedule.type, // 'daily' or 'one-time'
                // For one-time, convert ISO string back to Date object for MongoDB
                value: schedule.type === 'one-time' ? new Date(schedule.value) : schedule.value
            },
            isEnabled: true,
            lastSentDate: null
        };
        const result = await scheduledNotificationsCollection.insertOne(newNotification);
        console.log('[DB] Inserted notification:', newNotification);
        
        res.status(201).json({ ...newNotification, _id: result.insertedId });
    } catch (error) {
        console.error('Error scheduling notification:', error);
        res.status(500).send('Failed to schedule notification.');
    }
});

app.put('/api/schedule-notification/:id/toggle', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { isEnabled } = req.body;
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const scheduledNotificationsCollection = db.collection('scheduled_notifications');

    if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid notification ID.');
    }

    if (typeof isEnabled !== 'boolean') {
        return res.status(400).send('Invalid isEnabled value.');
    }

    try {
        const result = await scheduledNotificationsCollection.updateOne(
            { _id: new ObjectId(id), userId: new ObjectId(userId) },
            { $set: { isEnabled: isEnabled } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('Scheduled notification not found or user not authorized.');
        }

        res.status(200).json({ message: `Notification ${isEnabled ? 'enabled' : 'disabled'} successfully.` });
    } catch (error) {
        console.error('Error toggling notification:', error);
        res.status(500).send('Failed to toggle notification.');
    }
});

app.put('/api/schedule-notification/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, message, schedule } = req.body;
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const scheduledNotificationsCollection = db.collection('scheduled_notifications');

    console.log(`[EDIT] Received update for ID: ${id}. New data:`, { title, message, schedule }); // Enhanced logging

    if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid notification ID.');
    }

    if (!title || !message || !schedule || !schedule.type || !schedule.value) {
        return res.status(400).send('Missing required fields: title, message, schedule.');
    }

    try {
        const result = await scheduledNotificationsCollection.updateOne(
            { _id: new ObjectId(id), userId: new ObjectId(userId) },
            { $set: { 
                title, 
                message, 
                schedule: {
                    type: schedule.type,
                    value: schedule.type === 'one-time' ? new Date(schedule.value) : schedule.value
                },
                lastSentDate: null // Reset lastSentDate on any edit
            } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('Scheduled notification not found or user not authorized.');
        }

        res.status(200).json({ message: 'Notification updated successfully.' });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).send('Failed to update notification.');
    }
});

app.delete('/api/cancel-notification/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const scheduledNotificationsCollection = db.collection('scheduled_notifications');

    if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid notification ID.');
    }

    try {
        console.log(`Attempting to delete notification with ID: ${id} for user: ${userId}`);
        const result = await scheduledNotificationsCollection.deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(userId) // Ensure users can only delete their own notifications
        });

        if (result.deletedCount === 0) {
            console.log(`Deletion failed: No notification found with ID: ${id} for user: ${userId}`);
            return res.status(404).send('Scheduled notification not found or user not authorized.');
        }

        console.log(`Successfully deleted notification with ID: ${id}`);
        res.status(200).json({ message: 'Notification canceled successfully.' });
    } catch (error) {
        console.error('Error canceling notification:', error);
        res.status(500).send('Failed to cancel notification.');
    }
});

// Cron job to send scheduled notifications
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    console.log(`[CRON] Running check at ${currentTime}...`); // Enhanced logging
    
    // Set the start of the minute for one-time check
    const startOfMinute = new Date(now);
    startOfMinute.setSeconds(0, 0);
    const endOfMinute = new Date(startOfMinute.getTime() + 60000);

    console.log(`[CRON] Querying for one-time between ${startOfMinute.toISOString()} and ${endOfMinute.toISOString()}`); // Enhanced logging

    const db = client.db('webprog');
    const scheduledNotificationsCollection = db.collection('scheduled_notifications');
    const subscriptionsCollection = db.collection('subscriptions');
    const usersCollection = db.collection('users');
    
    try {
        const dueNotifications = await scheduledNotificationsCollection.find({
            isEnabled: true,
            $or: [
                // Find due daily notifications
                { 
                    'schedule.type': 'daily', 
                    'schedule.value': currentTime, 
                    $or: [ { lastSentDate: null }, { lastSentDate: { $ne: today } } ] 
                },
                // Find due one-time notifications (scheduled for the current minute)
                {
                    'schedule.type': 'one-time',
                    'schedule.value': { $gte: startOfMinute, $lt: endOfMinute }
                }
            ]
        }).toArray();

        if (dueNotifications.length > 0) {
            console.log(`[CRON] Found ${dueNotifications.length} due notifications.`, dueNotifications); // Enhanced logging
        }

        for (const notification of dueNotifications) {
            // Fetch user for email settings
            const user = await usersCollection.findOne({ _id: notification.userId });

            // --- Send Push Notification ---
            const userSubscriptions = await subscriptionsCollection.find({ userId: notification.userId }).toArray();
            
            if (userSubscriptions.length > 0) {
                const payload = JSON.stringify({ title: notification.title, body: notification.message });
                
                const sendPromises = userSubscriptions.map(sub => 
                    webPush.sendNotification(sub.subscription, payload)
                );

                await Promise.all(sendPromises);
                console.log(`Sent scheduled push notification to user ${notification.userId}`);
            }

            // --- Send Email Notification ---
            if (user && user.settings && user.settings.emailNotifications) {
                await sendReminderEmail(user.email, user.name, notification);
            }

            // --- Update Notification Status ---
            if (notification.schedule.type === 'one-time') {
                // Delete one-time notifications after they're sent
                await scheduledNotificationsCollection.deleteOne({ _id: notification._id });
                console.log(`[CRON] Deleted one-time notification ${notification._id}`);
            } else {
                // Update the last sent date for daily notifications
                await scheduledNotificationsCollection.updateOne(
                    { _id: notification._id },
                    { $set: { lastSentDate: today } }
                );
            }
        }
    } catch (error) {
        console.error('Error in cron job:', error);
    }
});

app.get('/upcoming-workout', authMiddleware, async (req, res) => {
    const userId = req.session.user.id;
    const db = client.db('webprog');
    const notificationsCollection = db.collection('scheduled_notifications');

    try {
        const now = new Date();
        // Get all enabled notifications for the user
        const allNotifications = await notificationsCollection.find({
            userId: new ObjectId(userId),
            isEnabled: { $ne: false } // Consider true or undefined as enabled
        }).toArray();

        let nextWorkout = null;

        for (const notification of allNotifications) {
            if (!notification.schedule || !notification.schedule.type || !notification.schedule.value) continue;

            let nextOccurrence = null;
            if (notification.schedule.type === 'one-time') {
                const oneTimeDate = new Date(notification.schedule.value);
                if (oneTimeDate > now) {
                    nextOccurrence = oneTimeDate;
                }
            } else if (notification.schedule.type === 'daily') {
                const [hours, minutes] = notification.schedule.value.split(':');
                let todayOccurrence = new Date();
                todayOccurrence.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

                if (todayOccurrence > now) {
                    nextOccurrence = todayOccurrence;
                } else {
                    // If it's passed for today, check for tomorrow
                    let tomorrowOccurrence = new Date();
                    tomorrowOccurrence.setDate(tomorrowOccurrence.getDate() + 1);
                    tomorrowOccurrence.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                    nextOccurrence = tomorrowOccurrence;
                }
            }

            if (nextOccurrence) {
                // Check if this is the soonest workout found so far
                if (!nextWorkout || nextOccurrence < nextWorkout.date) {
                    nextWorkout = {
                        date: nextOccurrence,
                        title: notification.title,
                    };
                }
            }
        }

        if (nextWorkout) {
            res.json({
                found: true,
                title: nextWorkout.title,
                day: nextWorkout.date.toLocaleDateString('en-US', { weekday: 'long' }),
                time: nextWorkout.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
        } else {
            res.json({ found: false });
        }

    } catch (error) {
        console.error('Error fetching upcoming workout:', error);
        res.status(500).send('Failed to fetch upcoming workout.');
            }
});
// PUT /api/update-password - Update user password
app.put('/api/update-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;
        const db = client.db('webprog');

        // Basic validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both passwords are required' });
        }

        // Get user
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { password: hashedPassword } }
        );

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Server error during password update' });
    }
});

// Make sure this matches your frontend call
app.delete('/api/account', authMiddleware, async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user.id;
    const db = client.db('webprog');
    
    if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }

    try {
        const session = client.startSession();
        
        try {
            session.startTransaction();
            
            // Your existing deletion operations...
            await Promise.all([
                db.collection('users').deleteOne({ _id: new ObjectId(userId) }, { session }),
                db.collection('activities').deleteMany({ userId: new ObjectId(userId) }, { session }),
                // ... other collections
            ]);

            await session.commitTransaction();
            
            // Clear session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                    return res.status(500).json({ error: 'Failed to destroy session' });
                }
                
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({ 
                    success: true,
                    message: 'Account and all data deleted successfully' 
                });
            });
            
        } catch (transactionError) {
            await session.abortTransaction();
            console.error('Transaction error:', transactionError);
            throw transactionError;
        } finally {
            await session.endSession();
        }
        
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ 
            error: 'Account deletion failed',
            details: error.message 
        });
    }
});

// --- Nutrition ---
// POST /api/calories - Log a new calorie entry
app.post('/api/calories', authMiddleware, async (req, res) => {
    const { foodItem, caloriesIntake, mealDate } = req.body;
    const db = client.db('webprog');

    if (!foodItem || !caloriesIntake || !mealDate) {
        return res.status(400).send('Missing required fields.');
    }

    try {
        await db.collection('calories').insertOne({
            userId: new ObjectId(req.session.user.id),
            foodItem: foodItem,
            calories: parseInt(caloriesIntake, 10),
            date: new Date(mealDate),
            createdAt: new Date()
        });
        res.status(201).json({ message: 'Calorie intake logged successfully.' });
    } catch (error) {
        console.error('Error logging calorie intake:', error);
        res.status(500).send('Failed to log calorie intake.');
    }
});

// GET /api/calories - Get all calorie entries for the user
app.get('/api/calories', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    try {
        const entries = await db.collection('calories')
            .find({ userId: new ObjectId(req.session.user.id) })
            .sort({ date: -1 })
            .toArray();
        res.json(entries);
    } catch (error) {
        console.error('Error fetching calorie entries:', error);
        res.status(500).send('Failed to fetch calorie entries.');
    }
});

// DELETE /api/calories/:id - Delete a calorie entry
app.delete('/api/calories/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid entry ID.');
    }
    const db = client.db('webprog');
    try {
        const result = await db.collection('calories').deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(req.session.user.id)
        });
        if (result.deletedCount === 0) {
            return res.status(404).send('Entry not found or user not authorized.');
        }
        res.status(200).json({ message: 'Entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting calorie entry:', error);
        res.status(500).send('Failed to delete entry.');
    }
});

// GET /api/calorie-suggestion - Calculate and return suggested daily calories
app.get('/api/calorie-suggestion', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user.id) });

        if (!user || !user.age || !user.gender || !user.weight || !user.height) {
            return res.status(400).json({ message: "Please complete your profile (age, gender, weight, and height) to get a calorie suggestion." });
        }

        // 1. Calculate BMR using Mifflin-St Jeor equation
        let bmr;
        if (user.gender.toLowerCase() === 'male') {
            bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
        } else { // female
            bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
        }

        // 2. Determine activity level
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentActivities = await db.collection('activities').find({
            userId: new ObjectId(req.session.user.id),
            date: { $gte: oneWeekAgo }
        }).toArray();

        let activityFactor = 1.2; // Default to sedentary
        let message = "Calorie Intake calculated! Please update your activities in the Fitness section for more accurate results";

        if (recentActivities.length > 0) {
            const activeDays = new Set(recentActivities.map(a => new Date(a.date).toDateString())).size;

            if (activeDays >= 6) {
                activityFactor = 1.725; // Very active
            } else if (activeDays >= 3) {
                activityFactor = 1.55; // Moderately active
            } else if (activeDays >= 1) {
                activityFactor = 1.375; // Lightly active
            }
            message = "Suggestion based on your profile and recent activity.";
        }

        // 3. Calculate TDEE (Total Daily Energy Expenditure)
        const tdee = Math.round(bmr * activityFactor);

        res.json({ suggestedCalories: tdee, message: message });

    } catch (error) {
        console.error('Error calculating calorie suggestion:', error);
        res.status(500).send('Failed to calculate calorie suggestion.');
    }
});

// --- Meal Plans ---

// GET /api/meal-suggestions - Search for meal suggestions from Spoonacular API
app.get('/api/meal-suggestions', authMiddleware, async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.json([]);
    }

    const apiKey = process.env.SPOONACULAR_API_KEY || '5202bfc35b8d4300b0a151c1791061f9';

    const apiUrl = `https://api.spoonacular.com/recipes/complexSearch`;

    try {
        const response = await axios.get(apiUrl, {
            params: {
                query: q,
                apiKey: apiKey,
                number: 5, // Get up to 5 results
                addRecipeInformation: true, // Get detailed info
                fillIngredients: true, // Get ingredient info
                instructionsRequired: true, // Ensure we get cooking instructions
                addRecipeNutrition: true, // Get complete nutrition info
            }
        });

        // Map the response to the format our frontend expects
        const results = response.data.results.map(meal => {
            // Extract calories from nutrition data
            const calories = meal.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 'N/A';

            // Get ingredients list
            const ingredients = meal.extendedIngredients?.map(i => i.original).join(', ') || 'Not available';

            // Get recipe instructions (combining all steps)
            let recipe = 'Not available';
            if (meal.analyzedInstructions && meal.analyzedInstructions.length > 0) {
                const steps = meal.analyzedInstructions[0].steps;
                if (steps && steps.length > 0) {
                    recipe = steps.map(s => `${s.number}. ${s.step}`).join('\n');
                }
            }

            return {
                id: meal.id,
                name: meal.title,
                calories: calories,
                imageUrl: meal.image,
                ingredients: ingredients,
                recipe: recipe
            };
        });

        res.json(results);
    } catch (error) {
        console.error('Error fetching from Spoonacular API:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Failed to fetch meal suggestions.' });
    }
});

// POST /api/meal-plans - Save a meal plan (suggestion or custom)
app.post('/api/meal-plans', authMiddleware, upload.single('mealPicture'), async (req, res) => {
    const db = client.db('webprog');
    const { name, calories, ingredients, recipe, isCustom, imageUrl } = req.body;

    let newMealPlan = {
        userId: new ObjectId(req.session.user.id),
        name,
        calories: parseInt(calories, 10),
        ingredients,
        recipe,
        isCustom: isCustom === 'true',
        createdAt: new Date()
    };

    if (req.file) { // For custom meals uploaded by user
        newMealPlan.imageUrl = `/uploads/meal_pics/${req.file.filename}`;
    } else if (imageUrl) { // For saving a suggestion
        newMealPlan.imageUrl = imageUrl;
    }

    try {
        const result = await db.collection('meal_plans').insertOne(newMealPlan);
        res.status(201).json({ message: 'Meal plan saved successfully!', insertedId: result.insertedId });
    } catch (error) {
        console.error('Error saving meal plan:', error);
        res.status(500).send('Failed to save meal plan.');
    }
});

// GET /api/meal-plans - Get user's saved meal plans
app.get('/api/meal-plans', authMiddleware, async (req, res) => {
    const db = client.db('webprog');
    try {
        const mealPlans = await db.collection('meal_plans').find({ userId: new ObjectId(req.session.user.id) }).sort({ createdAt: -1 }).toArray();
        res.json(mealPlans);
    } catch (error) {
        console.error('Error fetching meal plans:', error);
        res.status(500).send('Failed to fetch meal plans.');
    }
});

// DELETE /api/meal-plans/:id - Delete a saved meal plan
app.delete('/api/meal-plans/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid meal plan ID format.' });
    }

    const db = client.db('webprog');
    try {
        // First check if the meal plan exists and belongs to the user
        const mealPlan = await db.collection('meal_plans').findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(req.session.user.id)
        });

        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found or you do not have permission to delete it.' });
        }

        // If it's a custom meal with an image, we could delete the image file here
        // (Not implementing file deletion for now to avoid complexity)

        // Now delete the meal plan
        const result = await db.collection('meal_plans').deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(req.session.user.id)
        });

        if (result.deletedCount === 0) {
            return res.status(500).json({ message: 'Failed to delete the meal plan. Please try again.' });
        }

        res.status(200).json({
            message: 'Meal plan deleted successfully.',
            deletedId: id
        });
    } catch (error) {
        console.error('Error deleting meal plan:', error);
        res.status(500).json({ message: 'An error occurred while deleting the meal plan.' });
    }
});

// PUT /api/update-password - Update user password
app.put('/api/update-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;
        const db = client.db('webprog');

        // Basic validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both passwords are required' });
        }

        // Get user
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { password: hashedPassword } }
        );

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Server error during password update' });
    }
});

// --- Static Files ---
// This must come AFTER the routes
// Make the 'uploads' directory statically served
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
}); 