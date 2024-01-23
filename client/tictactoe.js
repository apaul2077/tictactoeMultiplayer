import {io} from 'socket.io-client'

//Game Variables
//DOM variables
const listOfCells = [];

//JS Variables
const gameBoard = [['', '', ''], 
                   ['', '', ''],
                   ['', '', '']];
    
let currentPlayer = 'X';
let won = '';

//JS Functions
function indexToCoords(index){
    return {x: Math.floor(index/3), y: index - Math.floor(index/3) * 3};
}
function changeCellContent(index){
    const xCoord = indexToCoords(index).x;
    const yCoord = indexToCoords(index).y;

    if(gameBoard[xCoord][yCoord] === ''){
        gameBoard[xCoord][yCoord] = currentPlayer;
        if(currentPlayer === 'X') currentPlayer = 'O';
        else currentPlayer = 'X';
    }
}

function checkWin(){
    for(let i = 0; i < 3; i++){
        //rows
        if(gameBoard[i][0] === gameBoard[i][1] && gameBoard[i][1] === gameBoard[i][2] && gameBoard[i][0] != ''){
            won = gameBoard[i][0];
            return;
        }
        //columns
        else if(gameBoard[0][i] === gameBoard[1][i] && gameBoard[1][i] === gameBoard[2][i] && gameBoard[0][i] != ''){
            won = gameBoard[0][i];
            return;
        }
    }

    //Primary Diagonal
    if(gameBoard[0][0] === gameBoard[1][1] && gameBoard[1][1] === gameBoard[2][2] && gameBoard[0][0] != ''){
        won = gameBoard[0][0];
        return;
    }
    //Secondary Diagonal
    else if(gameBoard[0][2] === gameBoard[1][1] && gameBoard[1][1] === gameBoard[2][0] && gameBoard[0][2] != ''){
        won = gameBoard[0][2];
        return;
    }
}

//DOM accessing functions
function updateGameBoardDOM(){
    listOfCells.forEach((cellItem, index) => {
        cellItem.textContent = gameBoard[indexToCoords(index).x][indexToCoords(index).y]
    })
}


//Cody Body
//Fetch cell objects and push to list
const clientSideSocket = io('http://localhost:3000');

const gameBoardTitle = document.querySelector(".game-board-title");
const resetButton = document.querySelector(".reset-button");
let count = 0;

for(let i = 1; i <= 9; i++){
    const temp = document.querySelector(`.c${i}`);
    listOfCells.push(temp);
}

//Add event listeners, which change the player and the content of the text
listOfCells.forEach((cellItem, index) => {
    cellItem.addEventListener("click", () => {
        changeCellContent(index);
        updateGameBoardDOM();
        checkWin();
        if(won){
            gameBoardTitle.textContent = `${won} won`

            won = ''

            // listOfCells.forEach(toDisable =>{
            //     toDisable.disabled = true;
            // })
        }

        count++;
        console.log(count);
        if(count === 9 && won === '') gameBoardTitle.textContent = `Draw`;
        cellItem.disabled = true;
    })
})

resetButton.addEventListener("click", () => {
    listOfCells.forEach((cellItem) => {
        cellItem.textContent = ''
    })

    for(let i = 0; i < 3; i++){
        for(let j = 0; j < 3; j++){
            gameBoard[i][j] = '';
        }
    }

    gameBoardTitle.textContent = 'Make a move';
    won = '';
    currentPlayer = 'X';
    count = 0;

    listOfCells.forEach(toDisable =>{
        toDisable.disabled = false;
    })
})

