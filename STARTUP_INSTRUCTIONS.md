# How to Start the Application

Follow these steps to start your frontend and backend servers. You need to use two separate terminal windows so both servers can run at the same time.

### Step 1: Start the Backend Server
Open your first terminal window and paste the following commands:

```bash
# Navigate to the backend directory
cd "/Users/hareeshwarr9/Downloads/JSJV2139-Implementing Secure and Flexible User Authentication Mechanisms with Role- Based Access Control to Safeguard Enterprise Applications Against Unauthorized Access/code/backend/spring-boot-spring-security-jwt-authentication-master_spring-boot-spring-security-jwt-authentication-master"

# Use Java 21 and run the Spring Boot server
export JAVA_HOME=$(/usr/libexec/java_home -v 21) && sh mvnw spring-boot:run
```
*(Wait until you see `Started SpringBootSecurityJwtApplication` indicating the backend is running on `http://localhost:8080`)*

### Step 2: Start the Frontend Application
Open a **new, second terminal window** (do not stop the backend terminal) and paste the following commands:

```bash
# Navigate to the frontend directory
cd "/Users/hareeshwarr9/Downloads/JSJV2139-Implementing Secure and Flexible User Authentication Mechanisms with Role- Based Access Control to Safeguard Enterprise Applications Against Unauthorized Access/code/frontend/RFrontEnd"

# Start the React / Vite frontend server
npm run dev
```
*(Wait until you see `VITE ready`. You can then Command+Click the `http://localhost:5173/` link in your terminal to view the app in your browser)*

---
**💡 Important Note:** Make sure your local MySQL database is actively running before you start the backend, or the backend will fail to connect!
