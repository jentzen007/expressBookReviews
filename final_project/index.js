const express = require('express');
const fs = require('fs'); // File system module
const jwt = require('jsonwebtoken');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
const path = './users.json'; // Path to users file

app.use(express.json());

// Function to load users from the file
const loadUsers = () => {
    if (fs.existsSync(path)) {
        const fileContent = fs.readFileSync(path);
        return JSON.parse(fileContent);
    }
    return [];
};

// Function to save users to the file
const saveUsers = (users) => {
    fs.writeFileSync(path, JSON.stringify(users, null, 2)); // Writing with indentation for readability
};

// Register new user
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Load existing users from file
    let users = loadUsers();

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const userExists = users.find(user => user.username === username);

    if (userExists) {
        return res.status(409).json({ message: "User already exists" });
    }

    // Add the new user
    users.push({ username, password });

    // Save users back to the file
    saveUsers(users);

    console.log("Users after registration:", users);
    return res.status(200).json({ message: "User registered successfully" });
});

// Login route to authenticate and generate a JWT token
app.post('/customer/login', (req, res) => {
    const { username, password } = req.body;

    // Load users from the file
    let users = loadUsers();

    // Log the users array to ensure users are loaded
    console.log("Registered users during login:", users);

    // Find the user in the registered users list
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign({ username: user.username }, "your-secret-key", { expiresIn: '1h' });
        return res.status(200).json({ message: "Login successful", token });
    } else {
        console.log("Login attempt failed. No matching credentials.");
        return res.status(400).send('Invalid credentials');
    }
});

// Middleware to authenticate based on the Authorization header (JWT)
app.use("/customer/auth/*", (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ message: "Authentication required." });
    }

    // Extract the token from the 'Bearer' scheme
    const token = authHeader.split(' ')[1]; // Get the token part after 'Bearer'

    if (!token) {
        return res.status(403).json({ message: "Token not found." });
    }

    try {
        const decoded = jwt.verify(token, "your-secret-key");
        req.user = decoded;  // Store decoded user information in the request
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token" });
    }
});

// Protected routes
app.use("/customer", customer_routes);
app.use("/", genl_routes);

// Start the server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
