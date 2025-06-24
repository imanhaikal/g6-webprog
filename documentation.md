# Project Documentation

## Table of Contents

1.  [Introduction](#introduction)
2.  [Project Structure](#project-structure)
3.  [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
4.  [Backend Architecture (Node.js & Express)](#backend-architecture-nodejs--express)
    - [Server Setup](#server-setup)
    - [Database Connection](#database-connection)
    - [Middleware](#middleware)
    - [Authentication Flow](#authentication-flow)
5.  [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [User Profile](#user-profile)
    - [Activities](#activities)
    - [Workouts](#workouts)
    - [Steps](#steps)
    - [Weight Tracking](#weight-tracking)
    - [Nutrition](#nutrition)
    - [Web Push Notifications](#web-push-notifications)
    - [Scheduled Notifications](#scheduled-notifications)
    - [Configuration](#configuration)
6.  [Frontend Architecture (HTML, CSS, JS)](#frontend-architecture-html-css-js)
    - [HTML Structure](#html-structure)
    - [CSS Styling](#css-styling)
    - [Client-Side JavaScript](#client-side-javascript)
7.  [Key Features In-Depth](#key-features-in-depth)
    - [Notifications System](#notifications-system)
    - [File Uploads](#file-uploads)
    - [Mapbox Integration](#mapbox-integration)
    - [Workout Streak Tracking](#workout-streak-tracking)
    - [Progress Visualization](#progress-visualization)
8.  [Key Dependencies](#key-dependencies)
9.  [Performance Optimization](#performance-optimization)
10. [Deployment](#deployment)
11. [Security Considerations](#security-considerations)

---

## Introduction

This document provides a comprehensive technical overview of the Health & Fitness Tracker web application. It covers the project's architecture, setup, API endpoints, and key functionalities, serving as a reference guide for developers working on or extending the application.

The Health & Fitness Tracker is designed as a comprehensive platform for users to monitor various aspects of their health and fitness journey, including workouts, nutrition, steps, and progress metrics. It features a responsive design suitable for both desktop and mobile devices.

## Project Structure

The project follows a standard web application structure, separating frontend and backend concerns.

```
/
|-- css/                  # Custom CSS stylesheets
|   |-- colors.css        # Color variables and theme definitions
|   |-- index.css         # Main dashboard styles
|   |-- fitness.css       # Fitness tracking page styles
|   |-- landing.css       # Landing page styles
|   |-- login.css         # Authentication page styles
|   |-- style.css         # Global styles and utilities
|   |-- ...               # Other component-specific styles
|-- js/                   # Client-side JavaScript files
|   |-- index.js          # Core SPA functionality and routing
|   |-- dashboard-charts.js # Data visualization for dashboard
|   |-- fitness.js        # Fitness tracking functionality
|   |-- login.js          # Authentication logic
|   |-- script.js         # Global utilities
|   |-- ...               # Other feature-specific scripts
|-- img/                  # Static images and icons
|   |-- icons/            # UI icons and symbols
|-- uploads/              # Directory for user-uploaded files
|   |-- meal_pics/        # Uploaded pictures of meals
|   |-- profile_pics/     # Uploaded user profile pictures
|-- models/               # Data models (if used)
|-- node_modules/         # Node.js dependencies (managed by npm)
|-- .env                  # Environment variables (local, not versioned)
|-- .gitignore            # Files and directories ignored by Git
|-- server.js             # Main backend server file (Express)
|-- package.json          # Project metadata and dependencies
|-- readme.md             # Quick start and user guide
|-- documentation.md      # Detailed technical documentation
|-- sw.js                 # Service Worker for PWA functionality
|-- index.html            # Main SPA container and dashboard
|-- login.html            # Login page
|-- register.html         # Registration page
|-- fitness.html          # Fitness tracking page
|-- nutrition.html        # Nutrition tracking page
|-- notifications.html    # Notification management page
|-- profile.html          # User profile management page
|-- progress.html         # Progress visualization page
|-- ...                   # Other content pages
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account for the database
- [Mapbox Account](https://www.mapbox.com/) for the route finder functionality
- Gmail account (for sending email notifications)

### Installation
1.  **Clone the repository:**
    ```sh
    git clone https://github.com/imanhaikal/g6-webprog.git
    cd g6-webprog
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Set up environment variables** by creating a `.env` file (see below).
4.  **Run the application:**
    - For development with auto-reloading: `npm run dev`
    - For production: `npm start`
    The server will be accessible at `http://localhost:3000`.

### Environment Variables
Create a `.env` file in the project root and add the following variables:

```
# MongoDB Atlas connection string
MONGO_URI="mongodb+srv://<username>:<password>@your-cluster-url"

# Secret key for signing session cookies
SESSION_SECRET="your_strong_session_secret"

# VAPID keys for Web Push Notifications (generate with `npm run vapi`)
VAPID_PUBLIC_KEY="your_public_vapid_key"
VAPID_PRIVATE_KEY="your_private_vapid_key"

# Gmail credentials for sending email notifications
GMAIL_USER="your_gmail_address@gmail.com"
GMAIL_APP_PASS="your_gmail_app_password"

# Mapbox access token for route finder functionality
MAPBOX_TOKEN="your_mapbox_access_token"
```

To generate VAPID keys for web push notifications, run:
```sh
npm run vapi
```

---

## Backend Architecture (Node.js & Express)

### Server Setup
The backend is powered by Node.js and Express.js. The main server logic in `server.js` handles:
- Serving static files (HTML, CSS, JS).
- API routing for all data operations.
- Middleware for session management, authentication, and data parsing.
- Background tasks for scheduled notifications.

### Database Connection
The application connects to a MongoDB Atlas cluster. The connection is managed by the official `mongodb` driver and established when the server starts. The MongoDB database stores all user data, including:
- User accounts and profiles
- Workout and activity logs
- Nutrition and meal entries
- Weight tracking data
- Steps and route information
- Notification preferences

### Middleware
- **`express.json()` & `express.urlencoded()`**: For parsing JSON and URL-encoded request bodies.
- **`express-session` with `connect-mongo`**: Manages user sessions, persisting them in the MongoDB database.
- **`authMiddleware`**: A custom middleware that protects routes by checking if a user is logged in. It redirects to the login page if the session is invalid.
- **`multer`**: Handles `multipart/form-data` for file uploads (profile pictures, meal images).

### Authentication Flow
1.  A user registers via `POST /register`. The password is encrypted using `bcrypt`.
2.  The user logs in via `POST /login`. `bcrypt` compares the provided password with the stored hash.
3.  Upon successful login, a session is created and the user's ID is stored in `req.session.user`.
4.  The `authMiddleware` checks for `req.session.user` on all protected routes.
5.  `GET /logout` destroys the session.

---

## API Endpoints

All endpoints are prefixed by the base URL (e.g., `http://localhost:3000`). Protected routes require an active user session.

### Authentication
| Method | Endpoint             | Description                                          | Protected |
|--------|----------------------|------------------------------------------------------|-----------|
| POST   | `/register`          | Registers a new user.                                | No        |
| POST   | `/login`             | Authenticates a user and starts a session.           | No        |
| GET    | `/logout`            | Logs the user out and clears the session.            | Yes       |
| GET    | `/api/session-status`| Checks if a user is currently logged in.             | No        |

### User Profile
| Method | Endpoint                | Description                                          | Protected |
|--------|-------------------------|------------------------------------------------------|-----------|
| GET    | `/api/profile`          | Fetches all profile data for the logged-in user.     | Yes       |
| PUT    | `/api/profile`          | Updates user details (name, age, etc.). Handles profile picture upload. | Yes       |
| PUT    | `/api/profile/settings` | Updates user's notification preferences.             | Yes       |

### Activities
| Method | Endpoint              | Description                                          | Protected |
|--------|-----------------------|------------------------------------------------------|-----------|
| POST   | `/log-activity`       | Logs a new physical activity.                        | Yes       |
| GET    | `/get-all-activities` | Retrieves all activity entries for the user.         | Yes       |
| GET    | `/get-activity/:id`   | Retrieves a single activity by its ID.               | Yes       |
| PUT    | `/update-activity/:id`| Updates an existing activity entry.                  | Yes       |
| DELETE | `/delete-activity/:id`| Deletes an activity entry.                           | Yes       |

### Workouts
| Method | Endpoint                  | Description                                          | Protected |
|--------|---------------------------|------------------------------------------------------|-----------|
| GET    | `/api/workout-templates`  | Retrieves all workout templates for the user.        | Yes       |
| POST   | `/api/workout-templates`  | Creates a new custom workout template.               | Yes       |
| POST   | `/api/workouts`           | Logs a new workout session.                          | Yes       |
| GET    | `/api/all-workouts`       | Retrieves all workout sessions for the user.         | Yes       |
| GET    | `/api/workout-streak`     | Calculates the user's current workout streak.        | Yes       |
| GET    | `/api/workouts/:id`       | Retrieves a single workout by its ID.                | Yes       |
| PUT    | `/api/workouts/:id`       | Updates a workout session.                           | Yes       |
| DELETE | `/api/workouts/:id`       | Deletes a workout session.                           | Yes       |

### Steps
| Method | Endpoint                | Description                                        | Protected |
|--------|-----------------------|----------------------------------------------------|-----------|
| POST   | `/api/steps`          | Logs a new steps entry.                            | Yes       |
| GET    | `/api/steps/all`      | Retrieves all step entries for the user.           | Yes       |
| GET    | `/api/steps/summary`  | Gets step count summary statistics.                | Yes       |
| GET    | `/api/steps/:id`      | Retrieves a single step entry by ID.               | Yes       |
| PUT    | `/api/steps/:id`      | Updates a step entry.                              | Yes       |
| DELETE | `/api/steps/:id`      | Deletes a step entry.                              | Yes       |
| GET    | `/api/routes/nearby`  | Finds walking/running routes near user location.   | Yes       |

### Weight Tracking
| Method | Endpoint              | Description                                 | Protected |
|--------|------------------------|---------------------------------------------|-----------|
| POST   | `/api/weight`          | Logs a new weight entry.                    | Yes       |
| GET    | `/api/weight`          | Retrieves all weight logs for the user.     | Yes       |
| GET    | `/api/weight/trend`    | Gets weight trend analysis for user.        | Yes       |

### Nutrition
| Method | Endpoint                      | Description                                | Protected |
|--------|-------------------------------|--------------------------------------------|-----------|
| POST   | `/api/nutrition/meals`        | Logs a new meal, including a photo upload. | Yes       |
| GET    | `/api/nutrition/meals`        | Retrieves all meal entries for the user.   | Yes       |
| GET    | `/api/nutrition/meals/summary`| Gets a daily summary of calorie intake.    | Yes       |
| GET    | `/api/nutrition/trends`       | Gets nutrition trends over time.           | Yes       |
| DELETE | `/api/nutrition/meals/:id`    | Deletes a meal entry.                      | Yes       |

### Web Push Notifications
| Method | Endpoint          | Description                                          | Protected |
|--------|-------------------|------------------------------------------------------|-----------|
| POST   | `/subscribe`      | Saves a new push subscription for the user.          | Yes       |
| POST   | `/unsubscribe`    | Removes the user's push subscription.                | Yes       |

### Scheduled Notifications
| Method | Endpoint                           | Description                               | Protected |
|--------|------------------------------------|-------------------------------------------|-----------|
| GET    | `/api/scheduled-notifications`     | Retrieves all scheduled notifications.    | Yes       |
| POST   | `/api/schedule-notification`       | Creates a new scheduled notification.     | Yes       |
| PUT    | `/api/schedule-notification/:id`   | Updates an existing notification.         | Yes       |
| PUT    | `/api/schedule-notification/:id/toggle` | Enables or disables a notification. | Yes       |
| DELETE | `/api/cancel-notification/:id`     | Deletes a scheduled notification.         | Yes       |

### Configuration
| Method | Endpoint          | Description                                   | Protected |
|--------|-------------------|-----------------------------------------------|-----------|
| GET    | `/api/session-user` | Returns the current user's ID.                | Yes       |
| GET    | `/api/mapbox-token` | Securely provides the Mapbox access token.    | Yes       |

---

## Frontend Architecture (HTML, CSS, JS)

### HTML Structure
The application uses a Single Page Application (SPA) model, where `index.html` acts as the main container. Content from other HTML files (`dashboard.html`, `fitness.html`, etc.) is dynamically loaded into the main content area of `index.html` using JavaScript.

The application includes the following main pages:
- **Dashboard**: Overview of recent activities, stats, and quick access to features
- **Fitness**: Tracking workouts and physical activities
- **Nutrition**: Logging meals and monitoring calorie intake
- **Steps**: Recording daily steps and finding nearby routes
- **Progress**: Visualizing trends and achievements over time
- **Profile**: Managing user information and settings
- **Notifications**: Setting up and managing reminders

### CSS Styling
- **Bootstrap 5**: Used for the responsive grid system and pre-styled components.
- **Custom Styles**: Located in the `css/` directory, these files define the application's unique look and feel, including the color scheme and component-specific styles.
- **Color Scheme**: A carefully selected palette conveys health, vitality, and wellness through teal, coral, and emerald green colors.
- **Responsive Design**: The application is fully responsive and works on devices of all sizes.

### Client-Side JavaScript
The `js/` directory contains the logic for each feature page.
- **`js/index.js`**: Core script that handles dynamic page loading, navigation, and initialization.
- **API Communication**: The `fetch()` API is used for all communication with the backend.
- **DOM Manipulation**: Dynamically updates the UI with data received from the server.
- **Chart.js**: Used to render progress charts on the dashboard and progress pages.
- **Service Worker**: Implemented in `sw.js` to provide offline capabilities and enable push notifications.

---

## Key Features In-Depth

### Notifications System
The application features a dual notification system:
1.  **Web Push Notifications**: Uses the Web Push API to send real-time notifications to the user's browser/device. This is handled by the `web-push` library.
2.  **Scheduled Notifications**: Users can schedule reminders (e.g., "Log your workout" daily at 5 PM). A `node-cron` job runs every minute on the server to check for due notifications. When a notification is due, it is sent via both Web Push and email (using `nodemailer` with Gmail).

The notification system has these key components:
- **Subscription Management**: Users can subscribe/unsubscribe from push notifications.
- **Custom Schedules**: Users can set up notifications for specific times and recurrences.
- **Email Fallback**: If Web Push fails or is unavailable, the system sends an email instead.
- **User Preferences**: Users can customize which types of notifications they receive.

### File Uploads
File uploads are managed by `multer`. When a user uploads a profile picture or a meal photo, `multer` processes the `multipart/form-data`, saves the file to the appropriate `uploads/` subdirectory with a unique name, and makes the file path available to the route handler to be saved in the database.

Key aspects of the file upload system:
- **Image Processing**: Files are validated for type and size.
- **Unique Naming**: Files are renamed using timestamps and random numbers to prevent conflicts.
- **Organized Storage**: Different file types are stored in separate subdirectories.

### Mapbox Integration
The application integrates with Mapbox to provide route finding functionality for walking, running, or cycling:

1. **Nearby Route Discovery**: 
   - Users can find routes near their current location.
   - Options for different activities (walking, running, cycling).
   - Route distance filtering.

2. **Interactive Maps**:
   - Visual representation of routes on a map.
   - Route details including distance, estimated time, and elevation.
   - Turn-by-turn directions.

3. **Implementation**:
   - Uses the Mapbox Directions API.
   - Client-side integration with Mapbox GL JS for map rendering.
   - Server-side proxy for secure API token handling.

### Workout Streak Tracking
The application includes a streak tracking system to help users maintain consistent workout habits:

1. **Streak Calculation**:
   - Tracks consecutive days with logged workouts.
   - Handles timezone differences.
   - Allows for "grace periods" (missing a single day doesn't break the streak).

2. **Motivational Elements**:
   - Visual indicators of current streak.
   - Milestone celebrations at specific streak lengths.
   - Historical streak data visualization.

### Progress Visualization
The application uses Chart.js to create interactive visualizations of user progress:

1. **Customizable Charts**:
   - Line charts for trends over time (weight, steps, calories).
   - Bar charts for comparing performance across time periods.
   - Pie charts for nutrition breakdowns.

2. **Time Period Selection**:
   - Users can view data for different time ranges (week, month, year).
   - Custom date range selection.

3. **Comparative Analysis**:
   - Compare current performance to past periods.
   - Goal achievement visualization.

---

## Key Dependencies

| Dependency         | Role                                                         | Version   |
| ------------------ | ------------------------------------------------------------ | --------- |
| **`express`**      | Core framework for building the web server and API.          | ^5.1.0    |
| **`mongodb`**      | Official MongoDB driver for database interactions.           | ^6.17.0   |
| **`connect-mongo`**| MongoDB session store for `express-session`.                 | ^5.1.0    |
| **`express-session`**| Middleware for managing user sessions and authentication.  | ^1.18.1   |
| **`bcrypt`**       | Library for hashing and comparing passwords securely.        | ^6.0.0    |
| **`multer`**       | Middleware for handling `multipart/form-data` (file uploads).| ^2.0.1    |
| **`web-push`**     | Library for sending Web Push Protocol notifications.         | ^3.6.7    |
| **`node-cron`**    | Task scheduler for running background jobs (e.g., scheduled notifications). | ^4.1.0 |
| **`nodemailer`**   | Module for sending emails (used for email notifications).    | ^7.0.3    |
| **`dotenv`**       | Loads environment variables from a `.env` file.              | ^16.5.0   |
| **`axios`**        | Promise-based HTTP client for making requests to external APIs. | ^1.10.0  |
| **`nodemon`**      | *(Development)* Utility that automatically restarts the server on file changes. | ^3.1.10 |

---

## Performance Optimization

To ensure optimal performance, the application implements several optimization strategies:

1. **Efficient Database Queries**:
   - Indexes on frequently queried fields.
   - Projection to retrieve only needed fields.
   - Pagination for large result sets.

2. **Frontend Optimizations**:
   - Minified CSS and JavaScript in production.
   - Lazy loading of images.
   - Deferred loading of non-critical resources.

3. **Caching Strategies**:
   - Browser caching for static assets.
   - Service worker for offline capability.
   - In-memory caching for frequent API requests.

## Deployment

While this project is run locally for development, it can be deployed to any service that supports Node.js applications.

### Deployment Options

- **Heroku**: A popular choice for Node.js apps. Requires a `Procfile` (`web: npm start`).
- **DigitalOcean / AWS / Google Cloud**: Provides more control via virtual machines or container services (like Docker).
- **Vercel / Netlify**: For frontend deployment with serverless functions.

### Deployment Checklist

1. **Environment Configuration**:
   - Set all environment variables in the production environment's configuration, not in a version-controlled `.env` file.
   - Use production MongoDB connection string.
   - Generate new session secret for production.

2. **Database Setup**:
   - Ensure proper MongoDB Atlas cluster configuration.
   - Set up database backups.
   - Configure appropriate access controls.

3. **Security Measures**:
   - Enable HTTPS.
   - Set appropriate security headers.
   - Implement rate limiting for API endpoints.

4. **Monitoring**:
   - Set up logging and error tracking.
   - Configure performance monitoring.
   - Set up alerts for critical issues.

## Security Considerations

The application implements several security measures to protect user data:

1. **Authentication Security**:
   - Passwords are hashed using bcrypt.
   - Session management with secure cookies.
   - Protection against session fixation attacks.

2. **Data Protection**:
   - Input validation on all user inputs.
   - Protection against XSS attacks.
   - CSRF protection on sensitive operations.

3. **API Security**:
   - Authentication required for sensitive endpoints.
   - Rate limiting to prevent abuse.
   - Validation of all incoming data.

4. **Environmental Security**:
   - Sensitive information stored in environment variables.
   - Production database credentials segregated from development.
   - HTTPS enforcement in production. 