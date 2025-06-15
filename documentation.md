# Project Documentation

## Table of Contents

1.  [Introduction](#introduction)
2.  [Project Structure](#project-structure)
3.  [Backend (Node.js & Express)](#backend-nodejs--express)
    - [Server Setup](#server-setup)
    - [Database Connection](#database-connection)
    - [API Endpoints](#api-endpoints)
4.  [Frontend (HTML, CSS, JS)](#frontend-html-css-js)
    - [HTML Structure](#html-structure)
    - [CSS Styling](#css-styling)
    - [Client-Side JavaScript](#client-side-javascript)
5.  [Key Dependencies](#key-dependencies)
6.  [Environment Variables](#environment-variables)

---

## Introduction

This document provides a comprehensive overview of the Health & Fitness Tracker web application. It covers the project's architecture, setup, API endpoints, and key functionalities, serving as a guide for developers.

## Project Structure

The project follows a standard web application structure, separating frontend and backend concerns.

```
/
|-- css/                  # Custom CSS stylesheets
|-- js/                   # Client-side JavaScript files
|-- node_modules/         # Node.js dependencies (managed by npm)
|-- .env                  # Environment variables (local, not versioned)
|-- .env.example          # Example environment variables
|-- .gitignore            # Files and directories ignored by Git
|-- server.js             # Main backend server file (Express)
|-- package.json          # Project metadata and dependencies
|-- readme.md             # Quick start and user guide
|-- documentation.md      # Detailed technical documentation
|-- index.html            # Main SPA container and dashboard
|-- login.html            # Login page
|-- register.html         # Registration page
|-- fitness.html          # Fitness tracking page
|-- profile.html          # User profile management page
|-- history.html          # Pages for viewing all activities
...and other content pages.
```

## Backend (Node.js & Express)

### Server Setup
The backend is powered by a Node.js server using the Express.js framework. The main server logic in `server.js` handles:
- **Serving Static Files**: Delivers HTML, CSS, and JS files from the root and sub-directories.
- **API Routing**: Manages all API endpoints for data operations.
- **Middleware**: Uses middleware for parsing JSON bodies, handling URL-encoded data, and managing user sessions.

### Database Connection
The application connects to a **MongoDB Atlas** cluster via the `mongodb` driver.
- The connection string is securely managed using a `.env` file and the `dotenv` package.
- The connection is established once when the server starts.

### API Endpoints
The server exposes a RESTful API to handle data interactions with the frontend.

| Method | Endpoint                    | Description                                                                 |
|--------|-----------------------------|-----------------------------------------------------------------------------|
| POST   | `/register`                 | Registers a new user with name, age, weight, and height.                    |
| POST   | `/login`                    | Authenticates a user and starts a session.                                  |
| GET    | `/logout`                   | Logs the user out and clears the session.                                   |
| GET    | `/api/profile`              | Fetches the profile data for the currently logged-in user.                  |
| PUT    | `/api/profile`              | Updates the profile data for the logged-in user.                            |
| GET    | `/api/workouts`             | Retrieves all workout entries for the user.                                 |
| POST   | `/api/workouts`             | Adds a new workout entry.                                                   |
| GET    | `/api/workouts/:id`         | Retrieves a single workout entry by its ID.                                 |
| PUT    | `/api/workouts/:id`         | Updates an existing workout entry.                                          |
| DELETE | `/api/workouts/:id`         | Deletes a workout entry.                                                    |
| GET    | `/api/steps`                | Retrieves all step entries for the user.                                    |
| POST   | `/api/steps`                | Adds a new step entry.                                                      |
| PUT    | `/api/steps/:id`            | Updates an existing step entry.                                             |
| DELETE | `/api/steps/:id`            | Deletes a step entry.                                                       |
| GET    | `/api/mapbox-token`         | Securely provides the Mapbox access token to the client.                    |

## Frontend (HTML, CSS, JS)

### HTML Structure
The application uses a Single Page Application (SPA) model, where `index.html` acts as the main container.
- **Content Loading**: `js/index.js` dynamically loads content from other HTML files (`dashboard.html`, `fitness.html`, etc.) into the main content area of `index.html`. This avoids full page reloads and improves user experience.
- **Modals**: Bootstrap modals are used for forms like editing activities, workouts, and steps, keeping the UI clean.

### CSS Styling
- **Bootstrap 5**: The primary framework for responsive design, layout (grid system), and pre-styled components.
- **Custom Styles**: Located in `css/`, these files define the application's unique look and feel, including the color scheme and responsive adjustments for the collapsible sidebar.

### Client-Side JavaScript (`js/index.js`)
This is the core of the frontend logic, responsible for:
- **Dynamic Page Loading**: Fetches and injects HTML content.
- **API Communication**: Uses `fetch()` to make requests to the backend API for all data operations (CRUD).
- **Event Handling**: Manages all user interactions, such as form submissions, button clicks, and navigation.
- **Mapbox Integration**:
    - Initializes the map for the "Nearby Routes" feature.
    - Fetches the Mapbox token from the backend.
    - Calls the Mapbox Directions API to get route data based on user input (location, type, round trip).
    - Renders routes on the map and makes them interactive.
- **Step Calculation**: Implements the client-side logic to estimate steps based on user's height, distance, and duration.
- **DOM Manipulation**: Updates the UI dynamically with new data, such as displaying lists of workouts, activities, or routes.

## Key Dependencies
- **`express`**: Web framework for Node.js.
- **`mongodb`**: Official MongoDB driver.
- **`bcrypt`**: For hashing passwords securely.
- **`express-session`**: For managing user sessions.
- **`body-parser`**: Middleware for parsing request bodies.
- **`dotenv`**: Loads environment variables from a `.env` file.
- **Bootstrap 5**: Frontend component library.
- **Mapbox GL JS**: For interactive maps and routing.

## Environment Variables
To run the application, you need to create a `.env` file in the project root with the following variables:
```
# MongoDB Atlas connection string
MONGO_URI="mongodb+srv://<username>:<password>@your-cluster-url"

# Public access token from your Mapbox account
MAPBOX_ACCESS_TOKEN="pk.your-mapbox-access-token"
```
This ensures that sensitive credentials are kept out of version control. 