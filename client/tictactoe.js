import { io } from 'socket.io-client';

//------------------------------------
// Socket Connection
//------------------------------------
// const clientSideSocket = io('https://tic-tac-toe-multiplayer-epyb.onrender.com', {
//   withCredentials: true,
//   transports: ['websocket'],
// });

const clientSideSocket = io('http://localhost:3000', {
  withCredentials: true,
  transports: ['websocket'],
});



//------------------------------------
// Global Variables & DOM Elements
//------------------------------------
const listOfCells = [];
const gameBoard = Array.from({ length: 3 }, () => Array(3).fill(''));
let currentPlayer = 'X'; 
let won = '';
let againstAI = false;
let room = '';
let multiplayerSwitch = 0;
let count = 0;
const aiPlayer = 'O';
let currentMode = 'local';
let myMarker = '';       
let opponentMarker = ''; 

//------------------------------------
// DOM Elements
//------------------------------------
const bufferingDiv = document.getElementById('buffering');
const gameBoardTitle = document.querySelector('.game-board-title');
const leaveRoomButton = document.querySelector('.leave-room');
const roomJoinTextbox = document.querySelector('.room-join');
const roomJoinButton = document.querySelector('.room-join-button');
const gameModeDropdown = document.getElementById('gameModeDropdown');
const multiplayerComponents = document.querySelector('.multiplayer-components');
const resetButton = document.querySelector('.reset-button');
const statusText = document.querySelector('.server-chosen-move');
const chatSection = document.getElementById('chatSection');
const chatInput = document.getElementById('chatInput');
const sendChatMessage = document.getElementById('sendChatMessage');


// Populate listOfCells from DOM (assumes classes .c1, .c2, …, .c9)
for (let i = 1; i <= 9; i++) {
  const cell = document.querySelector(`.c${i}`);
  listOfCells.push(cell);
}

// Initially disable the leave room button.
leaveRoomButton.disabled = true;

//------------------------------------
// Helper Functions
//------------------------------------

/**
 * Toggle chat panel visibility.
 * @param {boolean} show 
 */
function toggleChatVisibility(show) {
  chatSection.style.display = show ? 'flex' : 'none';
}


// Convert an index (0–8) into board coordinates.
const indexToCoords = index => ({
  x: Math.floor(index / 3),
  y: index % 3,
});

function appendChatMessage(msg) {
  const msgEl = document.createElement('p');
  msgEl.textContent = msg;
  document.getElementById('chatContainer').appendChild(msgEl);
  document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
}

// Reset the game state and UI.
function resetGame() {
  gameBoard.forEach(row => row.fill(''));
  listOfCells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
  });
  gameBoardTitle.textContent = 'MAKE A MOVE';
  won = '';
  currentPlayer = 'X';
  count = 0;
}

// Update the game board DOM based on the board state.
function updateGameBoardDOM() {
  listOfCells.forEach((cell, index) => {
    const { x, y } = indexToCoords(index);
    cell.textContent = gameBoard[x][y];
  });
}

// Update cells' disabled state based on whether they are taken.
function updateCellsAvailability() {
  if (checkWinner(gameBoard) !== null) {
    listOfCells.forEach(cell => cell.disabled = true);
  } else {
    listOfCells.forEach((cell, index) => {
      const { x, y } = indexToCoords(index);
      cell.disabled = (gameBoard[x][y] !== '');
    });
  }
}


// Show or hide the buffering animation.
const showBuffering = () => (bufferingDiv.style.display = 'block');
const hideBuffering = () => (bufferingDiv.style.display = 'none');

// Check whether the board has a winner or tie.
// Returns 'X' or 'O' if a player won, 'tie' if board is full, or null if ongoing.
function checkWinner(board) {
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2])
      return board[i][0];
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i])
      return board[0][i];
  }
  // Check diagonals.
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2])
    return board[0][0];
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0])
    return board[0][2];

  return board.flat().includes('') ? null : 'tie';
}

function checkWinAndUpdate() {
  const result = checkWinner(gameBoard);
  if (result && result !== 'tie') {
    won = result;
    gameBoardTitle.textContent = `${result} won`;
  } else if (result === 'tie') {
    gameBoardTitle.textContent = 'Draw';
  }
}

function makeMove(index, marker) {
  const { x, y } = indexToCoords(index);
  if (gameBoard[x][y] === '') {
    gameBoard[x][y] = marker;
    count++;
    updateGameBoardDOM();
    checkWinAndUpdate();
    return true;
  }
  return false;
}

// Toggle the local current player (for local non-AI mode).
function togglePlayer() {
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

//------------------------------------
// AI (Minimax) Functions
//------------------------------------
function minimax(depth, isMaximizing) {
  const result = checkWinner(gameBoard);
  if (result !== null) {
    if (result === aiPlayer) return 10 - depth;
    else if (result === 'tie') return 0;
    else return depth - 10;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      const { x, y } = indexToCoords(i);
      if (gameBoard[x][y] === '') {
        gameBoard[x][y] = aiPlayer;
        const score = minimax(depth + 1, false);
        gameBoard[x][y] = '';
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    const opponent = aiPlayer === 'X' ? 'O' : 'X';
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      const { x, y } = indexToCoords(i);
      if (gameBoard[x][y] === '') {
        gameBoard[x][y] = opponent;
        const score = minimax(depth + 1, true);
        gameBoard[x][y] = '';
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function findBestMove() {
  let bestScore = -Infinity, bestMove = -1;
  for (let i = 0; i < 9; i++) {
    const { x, y } = indexToCoords(i);
    if (gameBoard[x][y] === '') {
      gameBoard[x][y] = aiPlayer;
      const score = minimax(0, false);
      gameBoard[x][y] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}
//----------------------------------------
function handleCellClick(index) {
  if (checkWinner(gameBoard) !== null) return;

  if (multiplayerSwitch) {
    if (!makeMove(index, myMarker)) return;
    clientSideSocket.emit("cell-clicked", index, room);
    listOfCells.forEach(cell => {cell.disabled = true;})
  } 
  else {
    if (!makeMove(index, currentPlayer)) return;

    if (againstAI && checkWinner(gameBoard) === null && count < 9) {
      const bestMove = findBestMove();
      if (bestMove > -1) {
        makeMove(bestMove, aiPlayer);
        updateCellsAvailability();
      }
    } else if (!againstAI && checkWinner(gameBoard) === null && count < 9) {
      togglePlayer();
    }
    updateCellsAvailability();
  }
}


//------------------------------------
// DOM Event Listeners
//------------------------------------

sendChatMessage.addEventListener('click', () => {
  const message = chatInput.value;
  if (message.trim() === '') return;
  clientSideSocket.emit('chat-message', message, room);
  appendChatMessage(`You: ${message}`);
  chatInput.value = '';
});



// Add click listener to each cell.
listOfCells.forEach((cell, index) => {
  cell.addEventListener("click", () => handleCellClick(index));
});

resetButton.addEventListener("click", () => {
  resetGame();
  if (multiplayerSwitch) clientSideSocket.emit('reset-game', room);
});

// Room join button for multiplayer.
roomJoinButton.addEventListener('click', () => {
  if (roomJoinTextbox.value) {
    resetButton.disabled = true;
    statusText.textContent = "Connecting";
    showBuffering();
    room = roomJoinTextbox.value;
    clientSideSocket.emit("join-room-msg", room);
    multiplayerSwitch = 1;
    roomJoinButton.disabled = true;
  } else {
    statusText.textContent = "Enter room!";
    setTimeout(() => (statusText.textContent = "Play Against Friend"), 3000);
  }
});

gameModeDropdown.addEventListener('change', (e) => {
  const newMode = e.target.value;
  
  // If the previous mode was multiplayer, leave the room.
  if (currentMode === 'multiplayer') {
    clientSideSocket.emit('leave', room);
    multiplayerSwitch = 0;
    roomJoinButton.disabled = false;
    leaveRoomButton.disabled = true;
    resetButton.disabled = false;
  }
  
  toggleChatVisibility(false);
  resetGame();
  
  // Update UI based on the new mode.
  if (newMode === 'local') {
    multiplayerComponents.style.display = 'none';
    statusText.textContent = 'Play Against Friend';
    listOfCells.forEach(cell => cell.disabled = false);
    againstAI = false;
  } else if (newMode === 'multiplayer') {
    multiplayerComponents.style.display = 'flex';
    statusText.textContent = 'Play Online - Enter Room';
    listOfCells.forEach(cell => cell.disabled = true);
    againstAI = false;
    // Chat remains hidden until the room is joined.
  } else if (newMode === 'computer') {
    multiplayerComponents.style.display = 'none';
    statusText.textContent = 'Playing Against Computer';
    listOfCells.forEach(cell => cell.disabled = false);
    againstAI = true;
  }
  
  // Update the current mode.
  currentMode = newMode;
});



//------------------------------------
// Socket Event Listeners
//------------------------------------

clientSideSocket.on('chat-message', (message) => {
  appendChatMessage(`Opponent: ${message}`);
});

// Server assigns this client's marker (for multiplayer).
clientSideSocket.on("server-chosen-move", (randomChoice) => {
  resetGame();
  resetButton.disabled = false;
  myMarker = randomChoice === 1 ? 'X' : 'O';
  opponentMarker = myMarker === 'X' ? 'O' : 'X';
  statusText.textContent = `You play: ${myMarker}`;

  // If you are not starting (e.g., assigned 'O'), disable moves until it's your turn.
  if (myMarker === 'O') {
    listOfCells.forEach(cell => (cell.disabled = true));
  }
});

// When the opponent makes a move, update the board with their marker.
clientSideSocket.on("player-made-move", (index) => {
  makeMove(index, opponentMarker);
  updateCellsAvailability();
});



clientSideSocket.on('joined-room', () => {
  hideBuffering();
  statusText.textContent = 'Waiting';
  // updateCellsAvailability();
  leaveRoomButton.disabled = false;
  resetButton.disabled = true;
  toggleChatVisibility(true);
});

// When a player leaves.
clientSideSocket.on('player-left', () => {
  resetGame(); 
  if (currentMode !== 'multiplayer') return;
  statusText.textContent = 'Play Online - Enter Room';
  multiplayerSwitch = 0;
  roomJoinButton.disabled = false;
  leaveRoomButton.disabled = true;
  resetButton.disabled = false;
  updateCellsAvailability();
  toggleChatVisibility(false);
  listOfCells.forEach(cell => cell.disabled = true);
});

// When the opponent initiates a reset.
clientSideSocket.on('reset-game-initiated', resetGame);

// Handle any errors joining the room.
clientSideSocket.on("error-joining-room", () => {
  statusText.textContent = "Error!";
  roomJoinButton.disabled = false;
});

// Leave room on button click.
leaveRoomButton.addEventListener('click', () => {
  clientSideSocket.emit('leave', room);
});

// Leave room when the page unloads.
window.onbeforeunload = () => clientSideSocket.emit('leave', room);

window.onload = () => {
  gameModeDropdown.value = 'local';
}

// [].forEach.call(document.querySelectorAll("*"),function(a){a.style.outline="2px solid #"+(~~(Math.random()*(1<<24))).toString(16)})