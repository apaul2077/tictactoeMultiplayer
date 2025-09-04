import { indexToCoords } from './board.js';
import { checkWinner } from './board.js';
import { makeMove } from './board.js';
import { updateCellsAvailability } from '../ui/helpers.js';
import { gameBoard, currentPlayer, aiPlayer, count } from './state.js';

export function minimax(depth, isMaximizing, aiPlayer) {
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
        const score = minimax(depth + 1, false, aiPlayer);
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
        const score = minimax(depth + 1, true, aiPlayer);
        gameBoard[x][y] = '';
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

export function findBestMove(aiPlayer) {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    const { x, y } = indexToCoords(i);
    if (gameBoard[x][y] === '') {
      gameBoard[x][y] = aiPlayer;
      const score = minimax(0, false, aiPlayer);
      gameBoard[x][y] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

export function handleAIMove(index) {
  if (!makeMove(index, currentPlayer)) return;

  if (checkWinner(gameBoard) === null && count < 9) {
    const bestMove = findBestMove();
    if (bestMove > -1) {
      makeMove(bestMove, aiPlayer);
    }
  }

  updateCellsAvailability();
}

