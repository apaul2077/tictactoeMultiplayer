import { listOfCells, gameBoard, count, won, currentPlayer } from '../game/state.js';
import { indexToCoords, checkWinner } from '../game/board.js';
import { gameBoardTitle } from './dom.js';

export function updateGameBoardDOM() {
  listOfCells.forEach((cell, index) => {
    const { x, y } = indexToCoords(index);
    cell.textContent = gameBoard[x][y];
  });
}

export function updateCellsAvailability() {
  if (checkWinner(gameBoard) !== null) {
    listOfCells.forEach(cell => cell.disabled = true);
  } else {
    listOfCells.forEach((cell, index) => {
      const { x, y } = indexToCoords(index);
      cell.disabled = (gameBoard[x][y] !== '');
    });
  }
}

export function checkWinAndUpdate() {
  const result = checkWinner(gameBoard);
  if (result && result !== 'tie') {
    won = result;
    gameBoardTitle.textContent = `${result} won`;
  } else if (result === 'tie') {
    gameBoardTitle.textContent = 'Draw';
  }
}

export function resetGame() {
  gameBoard.forEach(row => row.fill(''));
  listOfCells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
  });
  gameBoardTitle.textContent = 'MAKE A MOVE';
  won = '';
  count = 0;
}

export const showBuffering = () => (bufferingDiv.style.display = 'block');
export const hideBuffering = () => (bufferingDiv.style.display = 'none');
