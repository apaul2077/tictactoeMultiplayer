import { makeMove, togglePlayer } from './board.js';
import { updateCellsAvailability } from '../ui/helpers.js';
import { gameBoard, currentPlayer, count } from './state.js';
import { checkWinner } from './board.js';

export function handleLocalMove(index) {
  if (!makeMove(index, currentPlayer)) return;

  if (checkWinner(gameBoard) === null && count < 9) {
    togglePlayer();
  }

  updateCellsAvailability();
}
