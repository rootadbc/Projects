// =========================
// DIALOG ELEMENTS
// =========================

// Get the dialog element from the page.
// This should match your <dialog> element in the HTML.
const dialog = document.querySelector("#dialog");

// Get the button that opens the dialog.
const openBtn = document.querySelector("#openBtn");

// Get the button that closes the dialog.
const closeBtn = document.querySelector("#closeBtn");


// Open the dialog when the "Add Book" button is clicked.
openBtn.addEventListener("click", () => {
  dialog.showModal();
});


// Close the dialog when the close button is clicked.
closeBtn.addEventListener("click", () => {
  dialog.close();
});


// =========================
// DATA STORAGE
// =========================

// Store all book objects in this array.
// This is the main data source for the whole app.
const myLibrary = [];


// =========================
// BOOK CONSTRUCTOR
// =========================

// Constructor function for creating book objects.
// Each book gets its own ID and book details.
function Book(title, author, pages, read) {
  // Give each book a unique and stable ID.
  this.id = crypto.randomUUID();

  // Save the values passed into the constructor.
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
}


// Add a prototype method to every Book object.
// This method flips the read status from true to false or false to true.
Book.prototype.toggleRead = function () {
  this.read = !this.read;
};


// =========================
// ADD BOOK HELPER
// =========================

// Create a new book object and push it into the library array.
function addBookToLibrary(title, author, pages, read) {
  const newBook = new Book(title, author, pages, read);
  myLibrary.push(newBook);
}


// =========================
// SAMPLE BOOKS FOR TESTING
// =========================

// Add starter books so the UI can be tested immediately.
addBookToLibrary("Atomic Habit", "James Clear", 320, true);
addBookToLibrary("The Hobbit", "J.R.R. Tolkien", 295, false);


// =========================
// DOM ELEMENTS
// =========================

// Get the container where all book cards will be displayed.
const booksContainer = document.getElementById("book-list");

// Get the form used for adding new books.
const bookForm = document.getElementById("book-form");


// =========================
// DISPLAY BOOKS
// =========================

// Render all books from the myLibrary array onto the page.
function displayBooks() {
  // Clear the container first so old cards do not duplicate.
  booksContainer.innerHTML = "";

  // Loop through every book object in the array.
  myLibrary.forEach((book) => {
    // Create one card for each book.
    const card = document.createElement("div");

    // Add a class for styling.
    card.classList.add("book-card");

    // Store the book's unique ID in a data attribute.
    // This connects the DOM card to the real book object.
    card.dataset.id = book.id;

    // Fill the card with book information.
    // The status text and button label both depend on book.read.
    card.innerHTML = `
      <h3>${book.title}</h3>
      <p>Author: ${book.author}</p>
      <p>Pages: ${book.pages}</p>
      <p>Status: ${book.read ? "Read" : "Not read yet"}</p>

      <button class="toggle-read-btn">
        ${book.read ? "Mark as unread" : "Mark as read"}
      </button>

      <button class="remove-book-btn">Remove</button>
    `;

    // Add the finished card to the page.
    booksContainer.appendChild(card);
  });
}


// =========================
// FORM SUBMISSION
// =========================

// Listen for form submission when the user adds a new book.
bookForm.addEventListener("submit", (event) => {
  // Stop the form from refreshing the page.
  event.preventDefault();

  // Get values typed into the form fields.
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const pages = document.getElementById("pages").value;

  // Get the selected radio button for reading status.
  const selectedStatus = document.querySelector(
    'input[name="reading_status"]:checked'
  );

  // Safety check: if no radio option is selected, stop here.
  if (!selectedStatus) return;

  // Convert the selected radio value into a boolean.
  // "read" becomes true, "not_read" becomes false.
  const read = selectedStatus.value === "read";

  // Create the new book and add it to the array.
  addBookToLibrary(title, author, pages, read);

  // Re-render the books so the new book appears immediately.
  displayBooks();

  // Reset the form fields after submission.
  bookForm.reset();

  // Close the dialog after adding the new book.
  dialog.close();
});


// =========================
// BOOK CARD BUTTON ACTIONS
// =========================

// Use event delegation so one listener handles all card buttons.
booksContainer.addEventListener("click", (event) => {
  // Find the nearest parent book card.
  const card = event.target.closest(".book-card");

  // If the click was not inside a card, stop.
  if (!card) return;

  // Get the book ID stored on that card.
  const bookId = card.dataset.id;

  // If the toggle read button was clicked...
  if (event.target.classList.contains("toggle-read-btn")) {
    // Find the matching book object in the array.
    const book = myLibrary.find((item) => item.id === bookId);

    // If found, flip the read status and re-render.
    if (book) {
      book.toggleRead();
      displayBooks();
    }
  }

  // If the remove button was clicked...
  if (event.target.classList.contains("remove-book-btn")) {
    // Find the index of the matching book in the array.
    const index = myLibrary.findIndex((item) => item.id === bookId);

    // If found, remove the book and re-render.
    if (index !== -1) {
      myLibrary.splice(index, 1);
      displayBooks();
    }
  }
});


// =========================
// INITIAL RENDER
// =========================

// Show starter books when the page first loads.
displayBooks();