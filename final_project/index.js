const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer", session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
}));

// Login route to authenticate and store token in session
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Dummy user for demonstration
    const user = { id: 1, username: 'user1', password: 'password' };

    if (username === user.username && password === user.password) {
        // Generate a JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, "your-secret-key", { expiresIn: '1h' });
        
        // Store the token in the session
        req.session.token = token;

        // Respond to the client
        res.json({ message: "Login successful", token });
    } else {
        res.status(400).send('Invalid credentials');
    }
});

// Middleware to authenticate based on the session token
app.use("/customer/auth/*", function auth(req, res, next) {
    const token = req.session.token;  // Get the token from the session

    if (!token) {
        return res.status(403).send("Authentication required.");
    }

    try {
        const decoded = jwt.verify(token, "your-secret-key");
        req.user = decoded;  // Store decoded user information in the request
        next();
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
});

// Protected routes
app.use("/customer", customer_routes);
app.use("/", genl_routes);

// Optional logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Logout failed");
        }
        res.send("Logged out successfully");
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
