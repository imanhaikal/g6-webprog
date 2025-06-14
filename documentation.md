# Project Documentation

## Table of Contents

1.  [Introduction](#introduction)
2.  [Project Structure](#project-structure)
3.  [Backend Setup](#backend-setup)
    - [Server](#server)
    - [Database Connection](#database-connection)
4.  [Frontend Overview](#frontend-overview)
    - [HTML Files](#html-files)
    - [CSS Styling](#css-styling)
5.  [Running the Project](#running-the-project)
6.  [Key Dependencies](#key-dependencies)

---

## Introduction

This document provides a comprehensive overview of the Health & Fitness Tracker web application. It is intended for developers who want to understand the project's architecture, how to set it up for local development, and the key components that make it work.

## Project Structure

The project follows a standard web application structure, with a clear separation between frontend and backend components.

```
/
|-- css/                  # CSS stylesheets
|-- img/                  # Images and assets
|-- js/                   # JavaScript files
|-- node_modules/         # Node.js dependencies
|-- .gitignore            # Git ignore file
|-- server.js             # Main server file
|-- package.json          # Project metadata and dependencies
|-- readme.md             # Quick start guide
|-- documentation.md      # Detailed project documentation
|-- *.html                # HTML pages
```

- **`css/`**: Contains all custom stylesheets.
- **`js/`**: Holds client-side JavaScript for interactivity.
- **`server.js`**: The entry point for the Node.js backend, responsible for serving pages and connecting to the database.
- **`*.html`**: Individual pages of the application.

## Backend Setup

### Server

The backend is built with **Node.js** and **Express.js**. The main server logic resides in `server.js`, which handles:

- **Serving Static Files**: Express serves the HTML, CSS, and JavaScript files to the client.
- **API Endpoints**: (Future implementation) RESTful endpoints for handling data from the frontend (e.g., user registration, fitness data).

### Database Connection

The application connects to a **MongoDB Atlas** database using the `mongodb` driver.

- **Connection Logic**: The connection is managed in `server.js`. The application uses a connection string to connect to the Atlas cluster.
- **Security**: To keep credentials secure, the connection string should not be hardcoded. Instead, it is stored in a `.env` file at the root of the project. The `dotenv` package is used to load these environment variables.

To set up the database connection:
1.  Create a `.env` file in the project root.
2.  Add your MongoDB Atlas connection string to this file:
    ```
    MONGO_URI="mongodb+srv://<username>:<password>@your-cluster-url"
    ```
3.  The `server.js` file is configured to read this variable to establish the database connection.

## Frontend Overview

The frontend is built with standard HTML, CSS, and JavaScript, enhanced with Bootstrap for responsive design and pre-styled components.

### HTML Files

Each HTML file represents a different page or view in the application:
- `index.html`: The landing page.
- `login.html` & `register.html`: User authentication pages.
- `dashboard.html`: The main view after a user logs in.
- `profile.html`: User profile and settings.
- ...and other pages for specific features.

### CSS Styling

- **Bootstrap**: Used for the grid system, responsive components, and general styling.
- **Custom Styles**: Additional custom styles are defined in the `css/` directory to override or extend Bootstrap and implement the project's unique design.

## Running the Project

For detailed instructions on how to get the project running on your local machine, please refer to the [**`readme.md`**](readme.md) file. It provides a step-by-step guide for cloning, installing dependencies, and starting the server.

## Key Dependencies

- **`express`**: A minimal and flexible Node.js web application framework.
- **`mongodb`**: The official MongoDB driver for Node.js.
- **`dotenv`**: A zero-dependency module that loads environment variables from a `.env` file. 