
/* =============================================================
     Project : Tic Tac Toe Game
     File    : script.js
     Author  : rootadbc
     Purpose : Main JAVASCRIP structure for the Tic Tac Toe Game app UI
     Notes   : 
============================================================== */

console.log("Tic Tac Toe Game")


// the board - this is a 2D array that represents the game board
// Odin says to store the gameboard as an array inside a Gameboard object, and to tuck as much as possible aways from the global scope.

const Gameboard = ( () => { // IIFE - Immediately Invoked Function Expression - means that the function is executed immediately after it is defined. 

    const board = [ // this is a 2D array that represents the game board
        ["", "", ""], // each inner array represents a row on the board
        ["", "", ""], // "" - empty string means that the cell is empty
        ["", "", ""]
    ];

    //
    const getBoard = () => board; // this function returns the board array - means that the board array is private and can only be accessed through this function.

    //
    const placeMark = (index, mark) => { // this function places a mark on the board at the specified index - means that the index is a number from 0 to 8, and the mark is either "X" or "O"

        if (board[index] !== "") return false; // if the cell is not empty, return false - means that the cell is already occupied

        board[index] = mark; // place the mark on the board

        return true; // return true - means that the mark was placed successfully
    };

    //
    //
    const reset = () => { // this function resets the board to its initial state - means that all cells becomes empty}

        

        for (let i = O ; i < board.length ; i++) { // loop through each row of the board
            
            board[i] = ""; // set each cell in the row to an empty string - means that the cell is empty

       }
        
        
    };
    
    //
    //
    return { getBoard, placeMark , reset }; // return an object that contains the getBoard, placeMark and reset functions - means that these functions can be accessed from outside the IIFE


})(); // this is the end of the IIFE - means that the function is executed immediately after it is defined.



//
// Test the board in console

console.log(Gameboard.getBoard()); // should log the initial board state

Gameboard.placeMark(O, "X"); // place an X in the top left corner

console.log(Gameboard.getBoard()); // should log the board state with the X in the top left corner

Gameboard.placeMark(O, "O"); // place an O in the top right corner

console.log(Gameboard.getBoard()); // should log the board state with the O in the top right corner



// 
//Players Factory - this is a factory function that creates player objects
// Players - players should be stored in objects

function Player( name, mark) { // this is a constructor function that creates a player object - means that the player object has a name and a mark

    return( name, mark); // return the name and mark of the player - means that the player object can be accessed from outside the function

}


//
//
// Game controller - this is a module that controls the game flow
// This decides whose turn it is, checks for a win or a tie, and updates the game board accordingly.
// We want the game rules to work without the UI, so we can test the game logic without having to worry about the UI.

function GameController() { // creates two players and keeps track of whose turn it is, checks for a win or a tie, and updates the game board accordingly.

    const players = [ // creates an array of player objects
        Player("Player 1", "X"),// creates a player object with the name "Player 1" and the mark "X"

        Player("Player 2", "O") // creates a player object with the name "Player 2" and the mark "O"
    
    ]; // creates an array of player objects - means that the players can be accessed from outside the function


    let activePlayer = players[0]; // sets the active player to the first player in the array - tldr; this variable will be used to keep track of whose turn it is

    let gameOver = false; // sets the gameOver variable to false - means that the game is not over yet

    let resultMessage = `${activePlayer.name}'s turn`; // sets the resultMessage variable to the active player's name - tldr: this variable will be used to display the result of the game


    const getActivePlayer = () => activePlayer; // Getter so other parts can read whose tuen it is.

    const getGameOver = () => gameOver; // Getter so other parts can read if the game is over.


    const getResultMessage = () => resultMessage; // Getter so other parts can read the result message.


    //
    //
    // This switches between Player 1 and Player 2.
    const switchTurn = () => { // this function switches the active player to the other player - means that the active player is now the other player
        
        activePlayer = activePlayer === players[0] ? players[1] : players[0]; // if the active player is the first player, set the active player to the second player, otherwise set the active player to the first player - means that the active player is now the other player

        resultMessage = `${activePlayer.name}'s turn`; // update the result message to the active player's name - means that the result message is now the active player's name
    };




    //
    // This secion is for winning patterns in Tic Tac Toe. It checks if the active player has won the game.

    const winningCOmbos = [ // tldr; this is an array of arrays that represents the winning combinations in Tic Tac Toe - means that if the active player has any of these combinations, they win the game

        [0, 1, 2], // top row 
        [3, 4, 5], // middle row
        [6, 7, 8], // bottom row
        [0, 3, 6], // left column
        [1, 4, 7], // middle column
        [2, 5, 8], // right column
        [0, 4, 8], // diagonal from top left to bottom right
        [2, 4, 6] // diagonal from top right to bottom left
    ];

    //
    // checks whether the current board contains a winning line
    //
    const checkWinner = () => { // checks if the active player has won the game - means that if the active player has any of the winning combinations, they win the game

        const board = Gameboard.getBoard(); // get the current board state

        return winningCombos.some( ([a,b,c]) => { // check if any of the winning combinations are present on the board - means that if any of the winning combinations are present, the active player has won the game
            
            return ( // check if the cells at the indices a, b, and c are not empty and are equal to each other - means that if the cells are equal, the active player has won the game
                
                board[a] !== "" && // check if the cell at index a is not empty - means that the cell is occupied by a mark
                board[a] === board[b] && // checks if the cell at index a is equal to the cell at index b - means that the cells are occupied by the same mark
                board[a] === board[c] // checks if the cell at index a is equal to the cell at index c - means that the cells are occupied by the same mark
            );
        });

    };



    //
    //
    // This is our tie check, as long as winner was checked first, we can just check if the board is full and no winner was found.
    //

    const checkTie = () => { // checks if the game is a tie - means that if the board is full and there is no winner, the game is a tie

        const board = Gameboard.getBoard(); // get the current board state

        return board.every((cell) => cell !== ""); // check if every cell on the board is not empty - means that the board is full
    }


    //
    // This is the  main 'take one turn ' function, it will be called by the UI when a player clicks on a cell.

    const playRound = (index) => { // this function plays a round of the game - means that it takes the index of the cell that was clicked and places the active player's mark on the board

        // step 1: check if the game is over, if it is, return - means that if the game is over, no more moves can be made
        if (gameOver) return; // if the game is over, return - means that the game is over and no more moves can be made


        // step 2: place the active player's mark on the board at the specified index - means that the active player's mark is now on the board
        const moveMade = Gameboard.placeMark(index, activatePlayer.mark); // place the active player's mark on the board at the specified index - means that the active player's mark is now on the board


        // step 3: if the move failed, keep the same turn and show a helpful message - means that if the cell is already occupied, the active player cannot make a move and must choose another cell
        if (!moveMade) { // if the move was not made, return - means that the cell is already occupied and no more moves can be made

            resultMessage = "Cell is already occupied!"; // update the result message to show that the cell is already occupied - means that the active player must choose another cell

            return; // return - means that the active player must choose another cell
        
        }
        
        //
        // step 4: check if the active player has won the game - means that if the active player has any of the winning combinations, they win the game
        // This must happen Before switching turns, otherwise the check will be for the next player.

        if (checkWinner()) { // if the active player has won the game, set the gameOver variable to true - means that the game is over and no more moves can be made

            gameOver = true;// set the gameOver variable to true - means that the game is over and no more moves can be made

            resultMessage = `${activePlayer.name} wins!`; // update the result message to show that the active player has won the game - means that the active player has won the game
        }


        //
        // step 5: if nobody wins, check for a tie
        // This must happen before switching turns - because the game may end immediately after this move.

        if (checkTie()) { // 

            gameOver = true; // 

            resultMessage = "It's a tie!"; 

            return;
        }


        // 
        // Step 6: Only if the move succeeded and did not end the game

        switchTurn(); 



    };



    












}
