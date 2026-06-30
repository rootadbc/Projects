
// Data model: Book and Library array

const myLibrary = []; // main source of truth

function Book(title, author, pages, read) {
  this.id = crypto.randomUUID(); // unique identifier per book
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
}

// helper to create and store book
function addBookToLibrary(title, author, pages, read) {
  const book = new Book(title, author, pages, read);
  myLibrary.push(book);
  return book;
}

// sample data
addBookToLibrary("The Pragmatic Programmer", "Hunt & Thomas", 352, true);
addBookToLibrary("Clean Code", "Robert C. Martin", 464, false);


// Rendering array to DOM

const booksContainer = document.getElementById("book-list");

function renderLibrary() {
  booksContainer.innerHTML = ""; // reset

  myLibrary.forEach((book) => {
    const card = document.createElement("div");
    card.classList.add("book-card");
    card.dataset.id = book.id; // link DOM → data

    card.innerHTML = `
      <h3>${book.title}</h3>
      <p>Author: ${book.author}</p>
      <p>Pages: ${book.pages}</p>
      <p>Status: ${book.read ? "Read" : "Not read yet"}</p>
    `;

    booksContainer.appendChild(card);
  });
}

renderLibrary(); // initial render

// New books will be added via a form, so we need to handle that submission.

const newBookForm = document.getElementById("book-form");

newBookForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop page reload []

  const formData = new FormData(newBookForm);
  const title = formData.get("title");
  const author = formData.get("author");
  const pages = Number(formData.get("pages"));
  const read = formData.get("read") === "on";

  addBookToLibrary(title, author, pages, read);
  renderLibrary();
  newBookForm.reset();
});