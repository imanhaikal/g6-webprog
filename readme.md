# Health & Fitness Tracker

This is a web application designed to help users track their health and fitness goals. It includes features for monitoring nutrition, workouts, progress, and more.

## Table of Contents
- [Health & Fitness Tracker](#health--fitness-tracker)
  - [Table of Contents](#table-of-contents)
  - [Key Features](#key-features)
  - [Technologies Used](#technologies-used)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
  - [Color Scheme](#color-scheme)
    - [Primary Color: Teal (Vitality & Freshness)](#primary-color-teal-vitality--freshness)
    - [Accent Color: Coral (Energy & Action)](#accent-color-coral-energy--action)
    - [Secondary/Support Color: Emerald Green (Health & Nature)](#secondarysupport-color-emerald-green-health--nature)
    - [Background: Light Gray/Off-White (Clean, Minimal)](#background-light-grayoff-white-clean-minimal)
    - [Text: Dark Charcoal Gray (Readable & Soft Contrast)](#text-dark-charcoal-gray-readable--soft-contrast)
  - [CSS Implementation](#css-implementation)
  - [Usage](#usage)
  - [Contributors](#contributors)


## Key Features

- **User Authentication**: Secure user registration and login system.
- **Personalized Dashboard**: At-a-glance overview of recent activities, goals, and stats.
- **Workout & Activity Logging**:
    - Log different types of activities (cardio, strength, etc.).
    - Create and manage workout routines with specific exercises.
    - Full CRUD (Create, Read, Update, Delete) functionality for all entries.
- **Steps Tracking & Route Finder**:
    - Manually log steps, distance, and duration.
    - **Automatic Step Calculation**: Estimates steps based on user's height, distance, and duration.
    - **Nearby Route Finder**: Integrates with Mapbox to find walking, running, or cycling routes near the user's location.
    - Interactive map to view and select different route options.
- **Nutrition Tracking**:
    - Log meals and track calorie intake.
    - Upload pictures of meals.
- **Profile Management**:
    - View and update user profile information (name, age, height, weight).
    - Upload a profile picture.
    - Securely change passwords.
- **Progress Visualization**:
    - Interactive charts and graphs to monitor progress over time (e.g., weight, calories).
- **Notifications**:
    - Receive reminders and notifications.
- **Responsive Design**:
    - Collapsible sidebar for a seamless experience on mobile devices.
    - Fully responsive layout that adapts to all screen sizes.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose)
- **Authentication**: bcrypt, express-session
- **Push Notifications**: web-push
- **File Uploads**: multer
- **Development**: nodemon

## Prerequisites

- [Node.js](https://nodejs.org/) (which includes npm)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account for the database.
- [Mapbox Account](https://www.mapbox.com/) for the route finder functionality.

## Getting Started

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/imanhaikal/g6-webprog.git
    cd g6-webprog
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up your environment:**
    - Create a `.env` file in the root of the project.
    - Add your MongoDB Atlas connection string and other required variables. You can refer to `.env.example` if it exists, or add the following:
      ```
      MONGO_URI="your_mongodb_connection_string"
      SESSION_SECRET="your_session_secret"
      VAPID_PUBLIC_KEY="your_vapid_public_key"
      VAPID_PRIVATE_KEY="your_vapid_private_key"
      ```
    - To generate VAPID keys for web-push, run:
      ```sh
      npm run vapi
      ```

4.  **Run the application:**
    - For production:
        ```sh
        npm start
        ```
    - For development (with auto-restarting server):
        ```sh
        npm run dev
        ```
    The server will start on `http://localhost:3000`.

## Color Scheme

This project uses a carefully selected color palette designed to convey health, vitality, and wellness:

### Primary Color: Teal (Vitality & Freshness)
- HEX: `#00BFA6`
- RGB: `rgb(0, 191, 166)`

### Accent Color: Coral (Energy & Action)
- HEX: `#FF6B6B`
- RGB: `rgb(255, 107, 107)`

### Secondary/Support Color: Emerald Green (Health & Nature)
- HEX: `#2ECC71`
- RGB: `rgb(46, 204, 113)`

### Background: Light Gray/Off-White (Clean, Minimal)
- HEX: `#FFFAF1`

### Text: Dark Charcoal Gray (Readable & Soft Contrast)
- HEX: `#2D2D2D`
- RGB: `rgb(45, 45, 45)`

## CSS Implementation

The color scheme is implemented using CSS variables for consistency across the application. These variables are defined in `css/style.css` and available throughout the application.

```css
:root {
    /* Color Scheme Variables */
    --primary-color: #00BFA6;       /* Teal */
    --accent-color: #FF6B6B;        /* Coral */
    --secondary-color: #2ECC71;     /* Emerald Green */
    --background-color: #FFFAF1;    /* Light Gray/Off-White */
    --text-color: #2D2D2D;          /* Dark Charcoal Gray */
    
    /* Additional derived variables */
    --primary-hover: #00a890;
    --accent-hover: #ff5252;
    --secondary-hover: #27ae60;
    
    /* Lighter shades for backgrounds */
    --primary-light: rgba(0, 191, 166, 0.1);
    --accent-light: rgba(255, 107, 107, 0.1);
    --secondary-light: rgba(46, 204, 113, 0.1);
}
```

## Usage

To use these colors in your CSS:

```css
.my-element {
    background-color: var(--primary-color);
    color: white;
}

.button:hover {
    background-color: var(--primary-hover);
}
```

## Contributors

- Iman Haikal
- Amir Mustaqim
- Rubab
- Aqmar
- Aliff
