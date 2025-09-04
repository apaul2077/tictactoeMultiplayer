export const listOfCells = [];
export const gameBoard = Array.from({ length: 3 }, () => Array(3).fill(''));

export let currentPlayer = 'X';
export let won = '';
export let againstAI = false;
export let room = '';
export let multiplayerSwitch = 0;
export let count = 0;
export const aiPlayer = 'O';
export let currentMode = 'local';
export let myMarker = '';
export let opponentMarker = '';
