const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

const regd_users = express.Router(); // For registered/authenticated users
let users = [];  // Store registered users

// ---------------- AUTHENTICATION AND USER ROUTES ----------------------

// Register new user
regd_users.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(409).json({ message: "User already exists" });
    }

    users.push({ username, password });
    console.log("Users after registration:", users);
    return res.status(200).json({ message: "User registered successfully" });
});

// User login
regd_users.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ username: user.username }, "your-secret-key", { expiresIn: '1h' });
        return res.status(200).json({ message: "Login successful", token });
    } else {
        return res.status(401).json({ message: "Invalid credentials" });
    }
});

// Middleware to verify JWT token in Authorization header
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ message: "Authentication required." });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: "Token not found." });
    }

    try {
        const decoded = jwt.verify(token, "your-secret-key");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Add or modify a book review (protected route)
regd_users.put('/auth/review/:isbn', authMiddleware, (req, res) => {
    const { review } = req.body;
    const isbn = req.params.isbn;

    const username = req.user.username;
    const book = books[isbn];

    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Ensure the book has a reviews array
    if (!book.reviews) {
        book.reviews = [];
    }

    const existingReview = book.reviews.find(r => r.username === username);

    if (existingReview) {
        existingReview.review = review;
    } else {
        book.reviews.push({ username, review });
    }

    return res.status(200).json({ message: "Review added or modified successfully", reviews: book.reviews });
});

module.exports.authenticated = regd_users;
