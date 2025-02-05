import { io } from 'socket.io-client'

//Game Variables
//DOM variables
const listOfCells = [];

//JS Variables
const gameBoard = [['', '', ''],
['', '', ''],
['', '', '']];

let currentPlayer = 'X';
let won = '';
let againstAI = false;
let room = '';
let serverChosenMove = '';
let multiplayerSwitch = 0;

// a dedicated variable for AI
let aiPlayer = 'O';

// Connect to server
//server was at port 3000 but now it is at 2000
// const clientSideSocket = io('http://localhost:2000');

const clientSideSocket = io('http://localhost:3000', {
    withCredentials: true,
    transports: ['websocket'],
});

// const clientSideSocket = io('https://ec2-13-232-193-192.ap-south-1.compute.amazonaws.com/', {
//     withCredentials: true,  
//     transports: ['websocket'], 
//   });

//JS Functions
function indexToCoords(index) {
    return { x: Math.floor(index / 3), y: index % 3 };
}
function changeCellContent(index) {
    const coords = indexToCoords(index);

    if (gameBoard[coords.x][coords.y] === '') {
        gameBoard[coords.x][coords.y] = currentPlayer;
    }
}

function checkWin() {
    for (let i = 0; i < 3; i++) {
        //rows
        if (gameBoard[i][0] === gameBoard[i][1] && gameBoard[i][1] === gameBoard[i][2] && gameBoard[i][0] != '') {
            won = gameBoard[i][0];
            return;
        }
        //columns
        else if (gameBoard[0][i] === gameBoard[1][i] && gameBoard[1][i] === gameBoard[2][i] && gameBoard[0][i] != '') {
            won = gameBoard[0][i];
            return;
        }
    }

    //Primary Diagonal
    if (gameBoard[0][0] === gameBoard[1][1] && gameBoard[1][1] === gameBoard[2][2] && gameBoard[0][0] != '') {
        won = gameBoard[0][0];
        return;
    }
    //Secondary Diagonal
    else if (gameBoard[0][2] === gameBoard[1][1] && gameBoard[1][1] === gameBoard[2][0] && gameBoard[0][2] != '') {
        won = gameBoard[0][2];
        return;
    }
}

//DOM accessing functions
function updateGameBoardDOM() {
    listOfCells.forEach((cellItem, index) => {
        cellItem.textContent = gameBoard[indexToCoords(index).x][indexToCoords(index).y]
    })
}

function resetGame() {
    listOfCells.forEach((cellItem) => {
        cellItem.textContent = ''
    })

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            gameBoard[i][j] = '';
        }
    }

    gameBoardTitle.textContent = 'MAKE A MOVE';
    won = '';
    currentPlayer = 'X';
    count = 0;

    listOfCells.forEach(toDisable => {
        toDisable.disabled = false;
    })
}

// Function to show the buffering animation
function showBuffering() {
    bufferingDiv.style.display = 'block';
}

// Function to hide the buffering animation
function hideBuffering() {
    bufferingDiv.style.display = 'none';
}

function availableMoves() {
    const availableMovesList = [];
    for (let i = 0; i < 9; i++) {
        if (gameBoard[indexToCoords(i).x][indexToCoords(i).y] === '') availableMovesList.push(i);
    }
    return availableMovesList;
}

// Helper: Check whether a win or tie has been reached on the board.
// Returns the winning symbol ('X' or 'O') if someone won,
// 'tie' if the board is full with no winner,
// or null if the game is still ongoing.
function checkWinner(board) {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] !== '' &&
          board[i][0] === board[i][1] &&
          board[i][1] === board[i][2]) {
        return board[i][0];
      }
    }
    // Check columns
    for (let j = 0; j < 3; j++) {
      if (board[0][j] !== '' &&
          board[0][j] === board[1][j] &&
          board[1][j] === board[2][j]) {
        return board[0][j];
      }
    }
    // Check primary diagonal
    if (board[0][0] !== '' &&
        board[0][0] === board[1][1] &&
        board[1][1] === board[2][2]) {
      return board[0][0];
    }
    // Check secondary diagonal
    if (board[0][2] !== '' &&
        board[0][2] === board[1][1] &&
        board[1][1] === board[2][0]) {
      return board[0][2];
    }
    // Check for tie (no empty spots)
    let openSpots = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          openSpots++;
        }
      }
    }
    if (openSpots === 0) return 'tie';
    return null;
  }
  
  // The minimax algorithm. 
  // `depth` is used to favor faster wins (and slower losses).
  // `isMaximizing` is true when the algorithm is trying to maximize the score
  // (i.e. it is the AI's turn), and false when minimizing (the opponent’s turn).
  function minimax(depth, isMaximizing) {
    const result = checkWinner(gameBoard);
    if (result !== null) {
      if (result === aiPlayer) {
        // AI wins: higher score for quicker wins.
        return 10 - depth;
      } else if (result === 'tie') {
        return 0;
      } else {
        // Opponent wins: lower score (more negative for quicker losses).
        return depth - 10;
      }
    }
  
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          // Is the spot available?
          if (gameBoard[i][j] === '') {
            gameBoard[i][j] = aiPlayer;
            const score = minimax(depth + 1, false);
            gameBoard[i][j] = '';  // Undo the move
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      // Determine the opponent's symbol.
      const opponent = aiPlayer === 'X' ? 'O' : 'X';
      let bestScore = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (gameBoard[i][j] === '') {
            gameBoard[i][j] = opponent;
            const score = minimax(depth + 1, true);
            gameBoard[i][j] = '';  // Undo the move
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  }
  
  // Finds the best move for the AI using the minimax algorithm.
  // Returns the index (using your numbering: 0 to 8, or add +1 if needed) of the best move.
  function findBestMove() {
    let indexOfBestMove = -1;
    let bestScore = -Infinity;
  
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (gameBoard[i][j] === '') {
          gameBoard[i][j] = aiPlayer;
          const moveScore = minimax(0, false);
          gameBoard[i][j] = ''; // Undo move
  
          if (moveScore > bestScore) {
            bestScore = moveScore;
            // Convert the 2D coordinate to a single index.
            // (If you prefer indices 0-8, use i * 3 + j.
            // If you need 1-9, add 1 as in your original code.)
            indexOfBestMove = i * 3 + j; // or i * 3 + j + 1 if needed
          }
        }
      }
    }
  
    return indexOfBestMove;
  }
  


//--------------------------------------------

//Cody Body
//Multiplayer functionality components
const leaveRoomButton = document.querySelector('.leave-room');
// const statusText = document.querySelector('.server-chosen-move');
const roomJoinTextbox = document.querySelector('.room-join');
const roomJoinButton = document.querySelector('.room-join-button');
const bufferingDiv = document.getElementById('buffering');
const tabButtons = document.querySelectorAll('.tab-button');
const multiplayerComponents = document.querySelector('.multiplayer-components');
const gameCells = document.querySelectorAll('.game-board button');
const statusText = document.querySelector('.server-chosen-move');

//Actual game components
const gameBoardTitle = document.querySelector(".game-board-title");
const resetButton = document.querySelector(".reset-button");
let count = 0;          //count maintained to see if draw or not

//Push DOM of cells to list
for (let i = 1; i <= 9; i++) {
    const temp = document.querySelector(`.c${i}`);
    listOfCells.push(temp);
}

//At start, leave room is disabled 
leaveRoomButton.disabled = true;



//Add event listeners, which change the player and the content of the text
listOfCells.forEach((cellItem, index) => {
    cellItem.addEventListener("click", () => {
        changeCellContent(index);
        updateGameBoardDOM();
        checkWin();
        if (won) {
            gameBoardTitle.textContent = `${won} won`
            listOfCells.forEach(cell => cell.disabled = true);
        }

        console.log(count);
        count++;
        if (count === 9 && won === '') gameBoardTitle.textContent = `Draw`;
        cellItem.disabled = true;

        //emit for every click
        if (currentPlayer === 'X') currentPlayer = 'O';
        else currentPlayer = 'X';

        if (multiplayerSwitch) {
            listOfCells.forEach(cellItem => cellItem.disabled = true);
            clientSideSocket.emit("cell-clicked", index, room);
        }
        if (againstAI) {
            const availableMovesList = availableMoves();
            if (availableMovesList.length > 0) {
                const computerMove = findBestMove();
                changeCellContent(computerMove);
                updateGameBoardDOM();
                checkWin();
                if (won) {
                    gameBoardTitle.textContent = `${won} won`
                    listOfCells.forEach(cell => cell.disabled = true);
                }

                console.log(count);
                count++;
                if (count === 9 && won === '') gameBoardTitle.textContent = `Draw`;
                listOfCells[index].disabled = true;
                if (currentPlayer === 'X') currentPlayer = 'O';
                else currentPlayer = 'X';

                if (!won) {
                    for (let i = 0; i < 9; i++) {
                        console.log(gameBoard[indexToCoords(i).x][indexToCoords(i).y]);
                        if (gameBoard[indexToCoords(i).x][indexToCoords(i).y] === '') {
                            listOfCells[i].disabled = false;
                        }
                        else {
                            listOfCells[i].disabled = true;
                        }
                    }
                }
                else {
                    listOfCells.forEach(cellItem => cellItem.disabled = true);
                }
            }

        }
    })
})

//reset button
resetButton.addEventListener("click", () => {
    resetGame();
    if (multiplayerSwitch) clientSideSocket.emit('reset-game', room);
})

//Event listener to join button for joining through socket
roomJoinButton.addEventListener('click', () => {
    if (roomJoinTextbox.value) {
        resetButton.disabled = true;
        statusText.textContent = "Connecting"
        showBuffering();
        room = roomJoinTextbox.value;
        clientSideSocket.emit("join-room-msg", room);
        multiplayerSwitch = 1;
        roomJoinButton.disabled = true;
    }
    else {
        statusText.textContent = "Enter room!"
        setTimeout(() => {
            statusText.textContent = "Local Play"
        }, 3000);
    }
    // leaveRoomButton.disabled = false;
})

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const mode = button.dataset.mode;

        if (mode === 'local') {
            multiplayerComponents.style.display = 'none';
            statusText.textContent = 'Local Play';
            gameCells.forEach(cell => cell.disabled = false);
            againstAI = false;
        }
        else if (mode === 'multiplayer') {
            multiplayerComponents.style.display = 'flex';
            statusText.textContent = 'Multiplayer - Enter Room';
            gameCells.forEach(cell => cell.disabled = true);  // Disable at start
            againstAI = false;
        }
        else if (mode === 'computer') {
            multiplayerComponents.style.display = 'none';
            statusText.textContent = 'Playing Against Computer';
            gameCells.forEach(cell => cell.disabled = false);
            againstAI = true;
        }
    });
});

//Listeners for multiplayer
//Listening for the other player's moves and making changes on my board 
//because of opponent
clientSideSocket.on("player-made-move", (index) => {
    changeCellContent(index);
    updateGameBoardDOM();
    checkWin();
    if (won) {
        gameBoardTitle.textContent = `${won} won`
        listOfCells.forEach(cell => cell.disabled = true);
    }

    console.log(count);
    count++;
    if (count === 9 && won === '') gameBoardTitle.textContent = `Draw`;
    listOfCells[index].disabled = true;
    if (currentPlayer === 'X') currentPlayer = 'O';
    else currentPlayer = 'X';

    if (!won) {
        for (let i = 0; i < 9; i++) {
            console.log(gameBoard[indexToCoords(i).x][indexToCoords(i).y]);
            if (gameBoard[indexToCoords(i).x][indexToCoords(i).y] === '') {
                listOfCells[i].disabled = false;
            }
            else {
                listOfCells[i].disabled = true;
            }
        }
    }
    else {
        listOfCells.forEach(cellItem => cellItem.disabled = true);
    }
});

//Listening to what the server alots the client with 
clientSideSocket.on("server-chosen-move", (randomChoice) => {
    resetGame();
    resetButton.disabled = false;
    if (randomChoice === 1) {
        serverChosenMove = 'X';
        statusText.textContent = `You play: ${serverChosenMove}`;
    }
    else {
        serverChosenMove = 'O'
        statusText.textContent = `You play: ${serverChosenMove}`;
    }

    if (serverChosenMove === 'O') {
        listOfCells.forEach(cellItem => cellItem.disabled = true);
    }
});

//Listening to whether opponent resets the game or not
clientSideSocket.on('player-left', () => {
    resetGame();
    statusText.textContent = 'Multiplayer - Enter Room';
    multiplayerSwitch = 0;
    roomJoinButton.disabled = false;
    leaveRoomButton.disabled = true;
    resetButton.disabled = false;
    listOfCells.forEach(cellItem => cellItem.disabled = true);
})

clientSideSocket.on('joined-room', () => {
    // roomJoinButton.disabled = true;
    hideBuffering();
    statusText.textContent = 'Waiting';
    listOfCells.forEach(cellItem => cellItem.disabled = true);
    leaveRoomButton.disabled = false;
    resetButton.disabled = true;
})


clientSideSocket.on('reset-game-initiated', () => resetGame())
//clientSideSocket.on('second-player-joined', () => resetGame())

leaveRoomButton.addEventListener('click', () => {
    clientSideSocket.emit('leave', room);
})

clientSideSocket.on("error-joining-room", () => {
    statusText.textContent = "Error!";
    roomJoinButton.disabled = false;
})

window.onbeforeunload = function () {
    clientSideSocket.emit('leave', room);
}
window.onbeforeunload();


// [].forEach.call(document.querySelectorAll("*"),function(a){a.style.outline="2px solid #"+(~~(Math.random()*(1<<24))).toString(16)})

