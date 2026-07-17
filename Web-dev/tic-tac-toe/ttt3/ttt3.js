/* =============================================================
     Project : Tic Tac Toe
     File    : ttt3.js
     Author  : rootadbc
     Purpose : Main JAVASCRIP structure for the TicTacToe app UI
     Notes   : 
============================================================== */

// GAMEBOARD MODULE

const Gameboard = (() => {
  // using IIFE here because we only need One gameboard for the game

  const board = ["", "", "", "", "", "", "", "", ""];
  // stores the 9 spots on the board

  const getBoard = () => board;
  // returns the current board array

  //Places a mark ("X" or "O") only if the chosen spot is empty
  const placeMark = (index, mark) => {
    if (board[index] !== "") return false; // means spot taken
    board[index] = mark; // place mark
    return true; // success
  };

  // function loops over the whole board array and sets every position back to an empty string, effectively clearing the board.
  const resetBoard = () => {
    for (let i = 0; i < board.length; i++) {
      //starts i at 0 and goes through each index until the end of the array

      board[i] = ""; // replaces the value at each index with an empty string, so all cells beomes BLANK
    }
  };

  // Exposes only the functions other parts of the app need

  return { getBoard, placeMark, resetBoard }; // returns and object that exposes these functions, so other code can call on them.
})();

console.log("Gameboard: seems ok");

// Player Factory Function
const Player = (name, mark) => {
  return { name, mark };
};
console.log("player:ok");

// CONTROLLER MODULE
// this section controls the flow of the game:
// whose turns it is, whether someone won , whter it's a tie ..etc..

const GameController = (() => {
  let player1; // store data for player 1 ( name, mark "X")
  let player2; // stores data for player 2 ( name, mark "O")
  let currentPlayer; //track whose turn it is
  let gameOver = false; // flag to indicate if the game has finished ( true, when someone wins or it's a draw)

  // all possible combination - logic
  const winningCombos = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left colum
    [1, 4, 7], // middle column
    [2, 5, 8], // right column
    [0, 4, 8], // diagonal
    [2, 4, 6], // diagonal
  ];

  /*
    
        0 | 1 | 2
        ---+---+---
        3 | 4 | 5
        ---+---+---
        6 | 7 | 8
    
     */

  // Player Factory Function
  const Player = (name, mark) => {
    return { name, mark };
  };

  // Starting a brand new game
  const startGame = (name1 = "Player 1", name2 = "Player 2") => {

      player1 = Player(name1, "X"); // creates player 1 with given nameand mark "X"
      player2 = Player(name2, "O"); // creates player 2 with given name and mark "O"
      currentPlayer = player1; // set the first turn to player 1
      gameOver = false; // reset game , so a new game can began
      Gameboard.resetBoard(); // clear the board back to empty cells to prepare for the new game

      
  };  console.log("StartGame: is OK");


  const getCurrentPlayer = () => currentPlayer; // returns the player whose turn it is right now ( player1 or player2)

  const checkWinner = () => {
    // checks whether the current board has a winning line.

    const board = Gameboard.getBoard(); // get the array representing the 3X3 board.

    // loop through each winning combination
    for (let i = 0; i < winningCombos.length; i++) {
      const [a, b, c] = winningCombos[i]; // destructure curent combo into 3 indices a, b, c

      // Win means:
      // 1. the first spot is not empty
      // 2. all three spots hold the same value

      if (
        board[a] !== "" && // ensure the starting cell isn't blank
        board[a] === board[b] && // a and b have the same mark
        board[a] === board[c] // a and c have the same mark
      ) 
      
      {
        return true; // a winning line exists - someone has won
      }
    }

    return false; // no combo matched, so there is no winner.
  };
  console.log("checkWinner: OK");

  // check to see if every post is filled and nobody has won
  const checkTie = () => {
    const board = Gameboard.getBoard();
    return board.every((cell) => cell !== "");
  };
  console.log("checkTie: OK");

  // Switches turns between player 1 and player2
  const switchPlayerTurn = () => {
    currentPlayer = currentPlayer === player1 ? player2 : player1; // ternary operator: condition ? valueIfTrue : valueIfFalse
  };
  console.log("swtchPlayerTurn: OK");

  // Plays one turn at a given borad index
  const playRound = (index) => {
    // if the game already ended, stop here.
    if (gameOver) {
      return { status: "game-over" }; // return a status object, so the caller knows the game has finished
    }

    // Try to place the current players's mark
    const validMove = Gameboard.placeMark(index, currentPlayer.mark); // tries to place the current player's mark at the chosen index;

    if (!validMove) {
      // if placing the mark failed ( spot occupied), exit and report as "invalid" so the caller can handle it
      return { status: "invalid" };
    }

    // check if the move caused a win
    if (checkWinner()) {
      gameOver = true;
      return {
        // if this move completed a winning combo, mark the game as over and return a status with the winner's name
        status: "win",
        winner: currentPlayer.name,
      };
    }

    // check if the board is full and nobody won
    if (checkTie()) {
      gameOver = true; // mark game as finished because all cells are filled with no wonner
      return { status: "tie" }; // report a tie result to the caller
    }

    // switching turns
    switchPlayerTurn(); // move player over to the other player for the next round

    return {
      status: "continue", // signal that the game should continue going
      currentPlayer: currentPlayer.name, // tells the caller whose turn is next
    };
  };
  console.log("playRound: OK");

  return { startGame, playRound, getCurrentPlayer };
  // expose the startGame function as a public method of GameController
  // expose playRound so outside code can play moves and get status back
  // expose getCurrentPlayer to know whose turn it is from outside the module
})(); // imediately invokes the IIFE, so GameCOntroller holds this returned object

console.log("GameController: is OK");

/*

Why each piece:

winningCombos – we list all ways to win (rows, columns, diagonals) so we don’t have to write a big messy if‑statement.
startGame – builds two players, picks who goes first, clears the board, and marks the game as active.
playRound(index) – this is the single function that handles one move:

Tries to put the current player’s mark at index.
Checks win.
Checks tie.
Switches turns if game continues.

checkWin – goes through each winning combo and checks if the three cells are the same and not empty.
checkTie – if every cell is filled and nobody won, it’s a tie.

We return simple objects like { status: "win", winner: "rootadbc" } so other parts (like the display) know what happened without poking inside. This keeps logic and visuals separate.

*/

// DISPLAY CONTROLLER MODULE
// This module is responsible for:
// 1. drawing the board on the page
// 2. handling clicks on board cells
// 3. showing messages to the user

const DisplayController = (() => {
  // boxes that helps us show or control different things in our game.
  const gameboardDiv = document.getElementById("gameboard");
  const messageDiv = document.getElementById("message");
  const startButton = document.getElementById("start-btn");
  const player1Input = document.getElementById("player1");
  const player2Input = document.getElementById("player2");

  // this function draws the gameboard : to show us where to play
  const renderBoard = () => {
        const board = Gameboard.getBoard(); // asking gameboard of how it will look

        gameboardDiv.textContent = ""; // clearing the board first with empty ""

        // for each place on board; create a little cell/box
        board.forEach((cell, index) => {
        const cellDiv = document.createElement("div"); // creates the div container

        cellDiv.classList.add("cell"); // confirms it's part of the gameboard
        cellDiv.textContent = cell; // prints/shows "X" or "O" inside the box

        // this helps us know which square the user clicked
        // we store where the cell is located using an index
        cellDiv.dataset.index = index;

        // puts these boxes into our gameboard box, helping us see the whole game.
        gameboardDiv.appendChild(cellDiv);
        });

    };  console.log("renderBoard: OK");


  // shows a message to the user
  // this tells us what's happeneing in the game
    const updateMessage = (text) => {
        messageDiv.textContent = text; // updates the message box to tell us news.
    };  console.log("updateMessage: OK");




  // handles clicks on the board
  const clickHandler = (event) => {
        // if the clicked thins is not a cell, ignore it..
        if (!event.target.classList.contains("cell")) return;

        // finds the exact spot number where we clicked
        const selectedIndex = event.target.dataset.index;

        // ask the game controller to play one turn
        // try playing here - and checks what happens
        const result = GameController.playRound(selectedIndex);

        // After playing, redraws the board so we can see updates
        renderBoard();

        // ssection shares news like someone winning, if there is a tie or whose turn it is
        if (result.status === "invalid") {
        updateMessage("That spot is already taken."); // tells us we can't play there - already taken
        } else if (result.status === "win") {
        updateMessage(`${result.winner} wins!`); // Annouces the winner
        } else if (result.status === "tie") {
        updateMessage("it's a tie!"); // says it's a tie - no winner
        } else if (result.result === "continue") {
        updateMessage(`${result.currentPlayer}'s turn.`);
        }

    };  console.log("clickHandler: OK");

  
  // Start or restart the game using the game input names
  const handleStart = () => {
        // gets the name of the players or uses player 1 and player 2
        const player1Name = player1Input.value || "Player 1";
        const player2Name = player2Input.value || "Player 2";

        // tells the game to start using these names inputed.
        GameController.startGame(player1Name, player2Name);

        //  redras the board so it starts clean and fresh
        renderBoard();
        updateMessage(`${GameController.getCurrentPlayer().name}'s turn.`); // annouces the first player's name

    };  console.log("handleStart: OK");



  // Attach all event listeners.
  // Sets up listeners, which let us know when buttons or cells are pressed
  const init = () => {
        startButton.addEventListener("click", handleStart); // listens for the start button

        gameboardDiv.addEventListener("click", clickHandler); //listens for clicks on the game board

        renderBoard(); // initially draws the empty board for everyone
    };

    return { init }; // shares how things are setup

})();   console.log("DisplayController: OK ");


DisplayController.init();

/* 

Why this follows the framework:

Odin says that after the console game works, you should create an object that handles display/DOM logic.

DisplayController does only display work: render board, listen for clicks, update text.

The actual game rules still stay inside GameController and Gameboard, which is the “put logic in logical places” part of the assignment.



xxxxxxxx==========================>>>>>

A good rule:

If it changes the board data, it belongs in Gameboard.

If it controls turns, wins, ties, or game state, it belongs in GameController.

If it changes what the user sees in HTML, it belongs in DisplayController.

<<<<<<========================xxxxxxxxx


*/
