// ======================================================
// LIBRARY APP SCRIPT
// ------------------------------------------------------
// Project: The Odin Project - Library
// Author: rootadbc
// Purpose:
// - Store books in an array
// - Render books as cards
// - Add books through a dialog form
// - Remove books from the library
// - Toggle read status on each book
//
// Debug tip:
// Search section labels like:
// "DATA LAYER", "RENDER", "EVENTS", "HELPERS"
// ======================================================

// ==============================
// 1. DATA LAYER
// ==============================

// Main source of truth for the entire app.
// Every book object lives inside this array.
const myLibrary = [];

// Constructor function for building a single book object.
// Each book gets a unique ID so it can be reliably found later.
function Book(title, author, pages, read) {
  this.id = crypto.randomUUID();
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
}

// Prototype method required by the assignment.
// This flips the read status from true -> false or false -> true.
Book.prototype.toggleRead = function () {
  this.read = !this.read;
};

// Helper function to create a book and store it in myLibrary.
// Keeps object creation separate from storage logic.
function addBookToLibrary(title, author, pages, read) {
  const book = new Book(title, author, pages, read);
  myLibrary.push(book);
}

// Removes one book from myLibrary by its unique ID.
// This is safer than using array index from the DOM.
function removeBookFromLibrary(bookId) {
  const index = myLibrary.findIndex((book) => book.id === bookId);

  if (index !== -1) {
    myLibrary.splice(index, 1);
  }
}

// Finds and returns a book object by its unique ID.
// Helpful for toggle-read actions and future features.
function getBookById(bookId) {
  return myLibrary.find((book) => book.id === bookId);
}

// Starter books so the UI has visible content immediately.
addBookToLibrary("The Hobbit", "J.R.R. Tolkien", 295, true);
addBookToLibrary("Eloquent JavaScript", "Marijn Haverbeke", 472, false);
addBookToLibrary("Atomic Habits", "James Clear", 320, true);

// ==============================
// 2. DOM SELECTION
// ==============================

// Section where all book cards are rendered.
const booksContainer = document.getElementById("books-container");

// Dialog and form controls.
const dialog = document.getElementById("book-dialog");
const newBookBtn = document.getElementById("new-book-btn");
const closeBtn = document.getElementById("close-dialog-btn");
const newBookForm = document.getElementById("new-book-form");

// ==============================
// 3. RENDER HELPERS
// ==============================

// Returns the markup for the read-status badge.
// This keeps the main render function easier to read.
function createReadBadgeMarkup(book) {
  if (book.read) {
    return `<span class="read-badge read">Read</span>`;
  }

  return `<span class="read-badge not-read">Not Read</span>`;
}

// Returns the correct button label for the toggle button.
function createToggleButtonLabel(book) {
  return book.read ? "Mark as Not Read" : "Mark as Read";
}

// ==============================
// 4. MAIN RENDER FUNCTION
// ==============================

// Rebuilds the full book list from myLibrary.
// Important rule:
// We update the array first, then re-render the DOM from the array.
function displayBooks() {
  // Clear the container before rebuilding all cards.
  booksContainer.innerHTML = "";

  // Optional empty state when there are no books.
  if (myLibrary.length === 0) {
    booksContainer.innerHTML = `
      <div class="card">
        <h2>No books yet</h2>
        <p>Your library is empty.</p>
        <p>Add a new book to get started.</p>
      </div>
    `;
    return;
  }

  // Create one card per book object.
  myLibrary.forEach((book) => {
    const card = document.createElement("article");

    // Styling hook for CSS.
    card.classList.add("card");

    // Connect this DOM card to the real book object using data-id.
    // This is exactly what the project requirement asks for.
    card.dataset.id = book.id;

    // Card markup includes:
    // - title
    // - author
    // - pages
    // - read status
    // - toggle button
    // - remove button
    card.innerHTML = `
      <h2>${book.title}</h2>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Pages:</strong> ${book.pages}</p>
      <p><strong>Status:</strong> ${book.read ? "Already read" : "Not read yet"}</p>
      ${createReadBadgeMarkup(book)}

      <div class="card-actions">
        <button class="toggle-read-btn" type="button">
          ${createToggleButtonLabel(book)}
        </button>

        <button class="remove-btn" type="button">
          Remove
        </button>
      </div>
    `;

    booksContainer.appendChild(card);
  });
}

// ==============================
// 5. DIALOG CONTROLS
// ==============================

// Open the dialog when the main page button is clicked.
newBookBtn.addEventListener("click", () => {
  dialog.showModal();
});

// Close the dialog when the close button is clicked.
closeBtn.addEventListener("click", () => {
  dialog.close();
});

// Optional UX improvement:
// If user clicks outside the dialog panel, close the dialog.
dialog.addEventListener("click", (event) => {
  const dialogBox = dialog.getBoundingClientRect();

  const clickedOutside =
    event.clientX < dialogBox.left ||
    event.clientX > dialogBox.right ||
    event.clientY < dialogBox.top ||
    event.clientY > dialogBox.bottom;

  if (clickedOutside) {
    dialog.close();
  }
});

// ==============================
// 6. FORM SUBMISSION
// ==============================

// Handles adding a new book from the modal form.
newBookForm.addEventListener("submit", (event) => {
  // Prevent normal form submission and page reload.
  event.preventDefault();

  // Read form values from the inputs.
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const pages = Number(document.getElementById("pages").value);

  // Convert radio input into a true/false read value.
  const read =
    document.querySelector('input[name="reading_status"]:checked').value ===
    "read";

  // Add the new book to the data layer.
  addBookToLibrary(title, author, pages, read);

  // Re-render UI so the new book appears.
  displayBooks();

  // Reset the form so old values do not remain.
  newBookForm.reset();

  // Close the modal dialog.
  dialog.close();
});

// ==============================
// 7. CARD BUTTON EVENTS
// ==============================

// Event delegation:
// Listen once on the container instead of attaching listeners
// to every button on every render.
booksContainer.addEventListener("click", (event) => {
  // Find the nearest card from the clicked element.
  const card = event.target.closest(".card");

  // If click did not happen inside a card, ignore it.
  if (!card) return;

  // Read the book ID from the card's data attribute.
  const bookId = card.dataset.id;

  // Handle remove button.
  if (event.target.classList.contains("remove-btn")) {
    removeBookFromLibrary(bookId);
    displayBooks();
    return;
  }

  // Handle toggle-read button.
  if (event.target.classList.contains("toggle-read-btn")) {
    const book = getBookById(bookId);

    if (book) {
      book.toggleRead();
      displayBooks();
    }
  }
});

// ==============================
// 8. INITIAL RENDER
// ==============================

// Render starter books when the page first loads.
displayBooks();
