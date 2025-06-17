import {
  bufferingDiv,
  gameBoardTitle,
  leaveRoomButton,
  roomJoinTextbox,
  roomJoinButton,
  gameModeDropdown,
  multiplayerComponents,
  resetButton,
  statusText,
  chatSection,
  chatInput,
  sendChatMessage
} from './ui/dom.js';

import { handleLocalMove } from './game/local.js';
import { handleAIMove } from './game/ai.js';
import { handleMultiplayerMove } from './game/online.js';
import { checkWinner, gameBoard } from './game/board.js';
import { multiplayerSwitch, room, currentMode, againstAI } from './game/state.js';
import { resetGame } from '../utils/helpers.js';
import { toggleChatVisibility, appendChatMessage, showBuffering } from './ui/chat.js';
import socket from './game/socket.js';

// Populate listOfCells from DOM (assumes classes .c1, .c2, …, .c9)
for (let i = 1; i <= 9; i++) {
  const cell = document.querySelector(`.c${i}`);
  listOfCells.push(cell);
}

// Initially disable the leave room button.
leaveRoomButton.disabled = true;

function handleCellClick(index) {
  if (checkWinner(gameBoard) !== null) return;

  if (multiplayerSwitch) {
    handleMultiplayerMove(index);
  } else if (againstAI) {
    handleAIMove(index);
  } else {
    handleLocalMove(index);
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

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  } else {
    gameModeDropdown.value = 'local';
  }
});

