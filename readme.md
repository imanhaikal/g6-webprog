# Health & Fitness Tracker

This is a web application designed to help users track their health and fitness goals. It includes features for monitoring nutrition, workouts, progress, and more.

## Features

- User registration and login
- Personalized dashboard
- Nutrition tracking
- Fitness and workout logging
- Progress monitoring
- Profile management

## Prerequisites

- [Node.js](https://nodejs.org/) (which includes npm)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

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
    - Add your MongoDB Atlas connection string to the `.env` file:
      ```
      MONGO_URI="your_mongodb_connection_string"
      ```
    *Note: A `.env.example` file is included in the repository to show the required environment variables.*

4.  **Run the application:**
    ```sh
    npm start
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
