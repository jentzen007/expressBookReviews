const express = require('express');
let books = require("./booksdb.js");

const public_users = express.Router(); // For general routes accessible by anyone

// ---------------- PUBLIC ROUTES ----------------------

// Task 10: Get the list of all books using async callback function
public_users.get('/async/books', (req, res) => {
    setTimeout(() => {
        return res.status(200).json(books);
    }, 1000);  // Simulating async behavior with setTimeout
});

// Task 11: Get book details based on ISBN using Promises
public_users.get('/promise/isbn/:isbn', (req, res) => {
    const getBookByISBN = new Promise((resolve, reject) => {
        const isbn = req.params.isbn;
        const book = books[isbn];
        if (book) {
            resolve(book);
        } else {
            reject({ message: "Book not found" });
        }
    });

    getBookByISBN
        .then(book => res.status(200).json(book))
        .catch(err => res.status(404).json(err));
});

// Task 12: Get book details based on author using async/await
public_users.get('/async/author/:author', async (req, res) => {
    try {
        const author = req.params.author.toLowerCase();
        const filteredBooks = Object.values(books).filter(book => book.author.toLowerCase() === author);
        if (filteredBooks.length > 0) {
            res.status(200).json(filteredBooks);
        } else {
            res.status(404).json({ message: "No books found by this author" });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Task 13: Get all books based on title using Promises
public_users.get('/promise/title/:title', (req, res) => {
    const getBooksByTitle = new Promise((resolve, reject) => {
        const title = req.params.title.toLowerCase();
        const filteredBooks = Object.values(books).filter(book => book.title.toLowerCase() === title);
        if (filteredBooks.length > 0) {
            resolve(filteredBooks);
        } else {
            reject({ message: "No books found with this title" });
        }
    });

    getBooksByTitle
        .then(books => res.status(200).json(books))
        .catch(err => res.status(404).json(err));
});

module.exports.general = public_users;