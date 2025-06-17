const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const webPush = require('web-push');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

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
app.put('/api/profile', authMiddleware, async (req, res) => {
    const { name, age, weight, height, goals } = req.body;
    const db = client.db('webprog');

    try {
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.session.user.id) },
            { 
                $set: {
                    name: name,
                    age: parseInt(age, 10),
                    weight: parseFloat(weight),
                    height: parseInt(height, 10),
                    goals: goals
                }
            }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send('User not found.');
        }
        res.json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Failed to update profile.');
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

// --- Static Files ---
// This must come AFTER the routes
app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
}); 