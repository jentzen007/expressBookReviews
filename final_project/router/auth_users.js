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
    if (!Array.isArray(book.reviews)) {
        book.reviews = [];
    }

    const existingReview = book.reviews.find(r => r.username === username);

    if (existingReview) {
        // Modify the existing review
        existingReview.review = review;
    } else {
        // Add a new review
        book.reviews.push({ username, review });
    }

    return res.status(200).json({ message: "Review added or modified successfully", reviews: book.reviews });
});

// Delete a book review added by that particular user (protected route)
regd_users.delete('/auth/review/:isbn', authMiddleware, (req, res) => {
    const isbn = req.params.isbn;
    const username = req.user.username; // Extract username from JWT token
    const book = books[isbn];

    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!Array.isArray(book.reviews) || book.reviews.length === 0) {
        return res.status(404).json({ message: "No reviews to delete for this book" });
    }

    // Find the user's review for this book
    const reviewIndex = book.reviews.findIndex(r => r.username === username);

    if (reviewIndex === -1) {
        return res.status(403).json({ message: "You have no review to delete for this book" });
    }

    // Remove the review
    book.reviews.splice(reviewIndex, 1);
    return res.status(200).json({ message: "Review deleted successfully", reviews: book.reviews });
});

module.exports.authenticated = regd_users;
