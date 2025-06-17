import { gameBoard, currentPlayer } from './state.js';

export function indexToCoords(index) {
  return {
    x: Math.floor(index / 3),
    y: index % 3,
  };
}

export function checkWinner(board) {
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2])
      return board[i][0];
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i])
      return board[0][i];
  }

  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2])
    return board[0][0];
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0])
    return board[0][2];

  return board.flat().includes('') ? null : 'tie';
}

export function makeMove(index, marker) {
  const { x, y } = indexToCoords(index);
  if (gameBoard[x][y] === '') {
    gameBoard[x][y] = marker;
    return true;
  }
  return false;
}

export function togglePlayer() {
  return currentPlayer === 'X' ? 'O' : 'X';
}
