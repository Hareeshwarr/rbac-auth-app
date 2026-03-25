# Secure User Authentication with Role-Based Access Control

This project implements authentication (JWT + optional face verification) and role-based dashboards. After login, users see a **User Dashboard** with Role, Status, Access Type cards and charts (Status Overview, Access Security).

## Quick Start

### 1. Backend (Spring Boot)

- **Requirements:** Java 17+, MySQL (e.g. create database `rgba`).
- **Config:** Edit `code/backend/spring-boot-spring-security-jwt-authentication-master_spring-boot-spring-security-jwt-authentication-master/src/main/resources/application.properties` if needed (DB URL, username, password).
- **Run:**
  ```bash
  cd code/backend/spring-boot-spring-security-jwt-authentication-master_spring-boot-spring-security-jwt-authentication-master
  ./mvnw spring-boot:run
  ```
  Backend runs at **http://localhost:8080**. API base: `/api` (e.g. `/api/auth/signin`, `/api/test/user`).

### 2. Frontend (React + Vite)

- **Install & run:**
  ```bash
  cd code/frontend/RFrontEnd
  npm install
  npm run dev
  ```
  Open the URL shown (e.g. **http://localhost:5173**).

### 3. Using the app

- **Register** a user at `/register` (choose role: user / admin / moderator).
- **Login** at `/` or `/login`: complete face verification, then enter username and password.
- After login you are redirected to:
  - **User** → `/user` (User Dashboard)
  - **Admin** → `/admin`
  - **Moderator** → `/mod`

The **User Dashboard** includes:

- **Header:** "User Dashboard" and Logout.
- **Info cards:** Role, Status (e.g. active in green), Access Type (e.g. secured).
- **Status Overview:** Bar chart (Active, Pending, Inactive, Suspended) with colors.
- **Access Security:** Donut chart (Secured Access vs Open Access).

Charts and cards use the added graphics and color styling as requested.

## Project layout

- `code/frontend/RFrontEnd` – React app (Login, Register, User/Admin/Moderator dashboards).
- `code/backend/spring-boot-spring-security-jwt-authentication-master_spring-boot-spring-security-jwt-authentication-master` – Spring Boot + JWT + MySQL.

## Notes

- Face verification on login requires camera access in the browser.
- Backend must be running for login and dashboard API calls; frontend will show "Access denied" for `/test/user` if the backend is down or token is invalid.
