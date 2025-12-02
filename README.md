# Student Dormitory Management System

## Project Structure

- **backend**: Java Spring Boot application (API).
- **frontend**: React application (Vite).
- **database**: SQL scripts for database setup.

## Prerequisites

- Java 17+
- Node.js & npm
- MySQL Server

## Setup Instructions

### 1. Database Setup

1. Open your MySQL client (Workbench, Command Line, etc.).
2. Run the script `database/schema.sql` to create the database and tables.
3. Update `backend/src/main/resources/application.properties` with your MySQL username and password.

### 2. Backend Setup

1. Open the `backend` folder in VS Code or IntelliJ.
2. Run the `DormitoryApplication.java` file.
3. The server will start on `http://localhost:8080`.

### 3. Frontend Setup

1. Open a terminal in the `frontend` folder.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Open `http://localhost:5173` in your browser.

## Features Implemented (MVP)

- **Database Schema**: Complete schema for Students, Dorms, Rooms, Beds, Check-ins, Repair Requests, and Users.
- **Backend**: Spring Boot setup with `Student` entity and CRUD API.
- **Frontend**: Basic React setup with Vite.

## Next Steps

- Implement the remaining entities (DormBuilding, Room, Bed, etc.) in the backend.
- Create frontend pages to consume the APIs.
- Implement Login/Authentication.
