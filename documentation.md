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
8.  [Key Dependencies](#key-dependencies)
9.  [Deployment](#deployment)

---

## Introduction

This document provides a comprehensive technical overview of the Health & Fitness Tracker web application. It covers the project's architecture, setup, API endpoints, and key functionalities, serving as a guide for developers.

## Project Structure

The project follows a standard web application structure, separating frontend and backend concerns.

```
/
|-- css/                  # Custom CSS stylesheets
|-- js/                   # Client-side JavaScript files
|-- uploads/              # Directory for user-uploaded files
|   |-- meal_pics/        # Uploaded pictures of meals
|   |-- profile_pics/     # Uploaded user profile pictures
|-- node_modules/         # Node.js dependencies (managed by npm)
|-- .env                  # Environment variables (local, not versioned)
|-- .gitignore            # Files and directories ignored by Git
|-- server.js             # Main backend server file (Express)
|-- package.json          # Project metadata and dependencies
|-- readme.md             # Quick start and user guide
|-- documentation.md      # Detailed technical documentation
|-- index.html            # Main SPA container and dashboard
|-- login.html            # Login page
|-- register.html         # Registration page
|-- fitness.html          # Fitness tracking page
|-- nutrition.html        # Nutrition tracking page
|-- notifications.html    # Notification management page
|-- profile.html          # User profile management page
...and other content pages.
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account for the database.

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
Create a `.env` file in the project root and add the following variables.

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
```

---

## Backend Architecture (Node.js & Express)

### Server Setup
The backend is powered by Node.js and Express.js. The main server logic in `server.js` handles:
- Serving static files (HTML, CSS, JS).
- API routing for all data operations.
- Middleware for session management, authentication, and data parsing.

### Database Connection
The application connects to a MongoDB Atlas cluster. The connection is managed by the official `mongodb` driver and established when the server starts.

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
| Method | Endpoint          | Description                                | Protected |
|--------|-------------------|--------------------------------------------|-----------|
| POST   | `/api/steps`      | Logs a new steps entry.                    | Yes       |
| GET    | `/api/steps/all`  | Retrieves all step entries for the user.   | Yes       |
| GET    | `/api/steps/:id`  | Retrieves a single step entry by ID.       | Yes       |
| PUT    | `/api/steps/:id`  | Updates a step entry.                      | Yes       |
| DELETE | `/api/steps/:id`  | Deletes a step entry.                      | Yes       |

### Weight Tracking
| Method | Endpoint       | Description                          | Protected |
|--------|----------------|--------------------------------------|-----------|
| POST   | `/api/weight`  | Logs a new weight entry.             | Yes       |
| GET    | `/api/weight`  | Retrieves all weight logs for the user.| Yes       |

### Nutrition
| Method | Endpoint                      | Description                                | Protected |
|--------|-------------------------------|--------------------------------------------|-----------|
| POST   | `/api/nutrition/meals`        | Logs a new meal, including a photo upload. | Yes       |
| GET    | `/api/nutrition/meals`        | Retrieves all meal entries for the user.   | Yes       |
| GET    | `/api/nutrition/meals/summary`| Gets a daily summary of calorie intake.    | Yes       |
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

### CSS Styling
- **Bootstrap 5**: Used for the responsive grid system and pre-styled components.
- **Custom Styles**: Located in the `css/` directory, these files define the application's unique look and feel, including the color scheme and component-specific styles.

### Client-Side JavaScript
The `js/` directory contains the logic for each feature page.
- **`js/index.js`**: Core script that handles dynamic page loading, navigation, and initialization.
- **API Communication**: The `fetch()` API is used for all communication with the backend.
- **DOM Manipulation**: Dynamically updates the UI with data received from the server.
- **Chart.js**: Used to render progress charts on the dashboard and progress pages.

---

## Key Features In-Depth

### Notifications System
The application features a dual notification system:
1.  **Web Push Notifications**: Uses the Web Push API to send real-time notifications to the user's browser/device. This is handled by the `web-push` library.
2.  **Scheduled Notifications**: Users can schedule reminders (e.g., "Log your workout" daily at 5 PM). A `node-cron` job runs every minute on the server to check for due notifications. When a notification is due, it is sent via both Web Push and email (using `nodemailer` with Gmail).

### File Uploads
File uploads are managed by `multer`. When a user uploads a profile picture or a meal photo, `multer` processes the `multipart/form-data`, saves the file to the appropriate `uploads/` subdirectory with a unique name, and makes the file path available to the route handler to be saved in the database.

---

## Key Dependencies

### Backend
- **`express`**: Web framework for Node.js.
- **`mongodb`**: Official MongoDB driver.
- **`bcrypt`**: For hashing passwords securely.
- **`express-session` & `connect-mongo`**: For managing user sessions persisted in MongoDB.
- **`dotenv`**: Loads environment variables from a `.env` file.
- **`multer`**: Middleware for handling file uploads.
- **`web-push`**: For sending Web Push protocol notifications.
- **`nodemailer`**: For sending emails.
- **`node-cron`**: For scheduling background jobs (i.e., sending notifications).

### Frontend
- **Bootstrap 5**: CSS framework.
- **Chart.js**: For data visualization.
- **Mapbox GL JS**: For interactive maps and routing.

---

## Deployment
While this project is run locally for development, it can be deployed to any service that supports Node.js applications.
- **Heroku**: A popular choice for Node.js apps. Requires a `Procfile` (`web: npm start`).
- **DigitalOcean / AWS / Google Cloud**: Provides more control via virtual machines or container services (like Docker).

When deploying, ensure all environment variables are set in the production environment's configuration, not in a version-controlled `.env` file. 