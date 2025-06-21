# Project Feature Checklist

## 1. General Module
- [x] Register for a new user account: Users can sign up with basic details (name, 
email, phone, password). Email verification may be considered. 
- [x] Login: Secure user login with registered credentials. Social login options (such as 
Google) may be implemented. 
- [x] Logout: Secure session termination. Automatic logout after inactivity may be 
implemented. 
- [ ] Manage sessions: Users can view and manage active sessions across devices, 
with an option to log out of other devices. 
    - [ ] Backend: Create an endpoint to list active sessions for a user.
    - [ ] Backend: Create an endpoint to invalidate a specific session.
    - [ ] Frontend: Create a UI to display active sessions.
    - [ ] Frontend: Add a "logout" button for each session.

## 2. Profile Management Module: 
- [x] View profile: Users can view their account details (e.g. name, email, age, weight, 
height, fitness goals, physical stats). 
- [x] Update profile: Users can edit their personal information, profile pictures, fitness 
goals, and physical stats. 
- [ ] Delete/Deactivate User Account: Options for temporary deactivation or 
permanent deletion of accounts, with confirmation. 
    - [ ] Backend: Implement logic for temporary account deactivation.
    - [ ] Backend: Implement logic for permanent account deletion.
    - [ ] Frontend: Create a UI for account deactivation and deletion.
    - [ ] Frontend: Implement a confirmation modal for both actions.
- [x] Change password: Users can change their account password with validation and 
secure password strength rules. "Forgot Password" functionality will also be 
included. 

## 3. Fitness Tracker Module: 
- [x] Log activities: 
    - [x] Categorize activities (Cardio, Strength, Flexibility, etc.). 
        - [x] Backend: Enhance `activities` model to include `category` and `intensity`.
        - [x] Frontend: Add UI elements for selecting category and intensity.
    - [x] Specify intensity levels (Light, Moderate, Intense). 
    - [x] Set duration, time, and date for each activity. 
- [x] Log workout: 
    - [x] Utilize or create workout templates (e.g., Leg Day Routine). 
        - [x] Backend: Create a `WorkoutTemplate` model.
        - [x] Backend: Implement CRUD endpoints for workout templates.
        - [x] Frontend: Create a UI to manage workout templates.
    - [x] Track workout streak for daily exercise consistency. 
        - [x] Backend: Add logic to calculate workout streaks.
        - [x] Frontend: Display workout streak on the dashboard.
    - [x] Set duration, time, and date for each workout. 
- [x] Log steps: 
    - [x] Manual input for number of steps, distance, duration, date, and time. 
    - [x] Check for run/cycling routes. 
        - [x] Backend: Integrate with a mapping API.
        - [x] Frontend: Display a map for route creation/selection.
        - [x] Backend: Save route data with activities.

## 4. Progress Charts Module: 
- [x] Visual display of user progress: 
    - [ ] View weekly progress (e.g., workouts done in a specific week). 
        - [ ] Backend: Create an endpoint for weekly workout data.
        - [ ] Frontend: Create a chart to display weekly progress.
    - [ ] Track custom metrics. 
        - [ ] Backend: Allow users to define custom metrics.
        - [ ] Frontend: Create a UI for managing custom metrics.
    - [ ] Track and save weight, BMI, body fat %, and muscle mass. 
        - [ ] Backend: Extend user model or create a new one to store physical stats over time.
        - [ ] Frontend: Create a form for users to input these stats.
        - [ ] Frontend: Create charts to visualize trends.
    - [ ] Compare fitness progress between periods (e.g., two different weeks). 
        - [ ] Frontend: Add controls for period selection.
        - [ ] Frontend: Display side-by-side comparison.
    - [ ] View progress towards defined goals (e.g., steps remaining to reach a 
target). 
        - [ ] Backend: Allow users to set goals.
        - [ ] Frontend: Display progress towards goals.

## 5. Nutrition Planner Module: 
- [x] Calorie calculator: 
    - [ ] Add daily calorie intake. 
        - [ ] Backend: Create an endpoint to log daily calorie intake.
        - [ ] Frontend: Create a form for calorie input.
    - [ ] Receive total daily calorie intake suggestions based on BMI. 
        - [ ] Backend: Implement a formula for BMR and calorie suggestion.
        - [ ] Frontend: Display suggested calorie intake.
    - [ ] Get meal suggestions with nutritional insights based on suggested daily 
calorie intakes. 
        - [ ] Backend: Integrate with a nutrition API.
        - [ ] Frontend: Display meal suggestions with nutritional info.
- [x] Food Database: 
    - [ ] Search for meal suggestions and add them to favourites. 
        - [ ] Backend: Implement search functionality.
        - [ ] Backend: Create endpoints for managing favorite meals.
        - [ ] Frontend: Add a search bar and "favorite" button.
    - [ ] Save and reuse meal plans. 
        - [ ] Backend: Create `Meal` and `MealPlan` models.
        - [ ] Backend: Implement endpoints for meal plan management.
        - [ ] Frontend: Create a UI for building and saving meal plans.
    - [x] Option to take a picture of a meal and save it (Instagram feed concept). 

## 6. Notification Reminders Module: 
- [x] Receive web push notifications. 
- [x] Receive In-App reminders. 
- [ ] Receive email notifications. 
    - [ ] Backend: Integrate an email service (e.g., SendGrid).
    - [ ] Backend: Implement logic to trigger emails.
    - [ ] Frontend: Provide user settings for email notifications.
- [x] Schedule and receive notifications based on desired routine/time. 