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

//Connect to server
// const clientSideSocket = io('http://localhost:3000');
// const clientSideSocket = io('http://localhost:3000', {
//   cors: {
//     origin: ["https://tic-tac-toe-multiplayer1439.netlify.app", "http://localhost:8080"],
//     methods: ["GET", "POST"]
//   }
// });

const clientSideSocket = io('https://tic-tac-toe-multiplayer-epyb.onrender.com', {
    withCredentials: true,  
    transports: ['websocket'], 
  });

//JS Functions
function indexToCoords(index){
    return {x: Math.floor(index/3), y: index%3};
}
function changeCellContent(index){
    const coords = indexToCoords(index);

    if(gameBoard[coords.x][coords.y] === ''){
        gameBoard[coords.x][coords.y] = currentPlayer;
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

function resetGame(){
    listOfCells.forEach((cellItem) => {
        cellItem.textContent = ''
    })

    for(let i = 0; i < 3; i++){
        for(let j = 0; j < 3; j++){
            gameBoard[i][j] = '';
        }
    }

    gameBoardTitle.textContent = 'MAKE A MOVE';
    won = '';
    currentPlayer = 'X';
    count = 0;

    listOfCells.forEach(toDisable =>{
        toDisable.disabled = false;
    })
}


//--------------------------------------------

//Cody Body
//Multiplayer functionality components
const leaveRoomButton = document.querySelector('.leave-room');
const serverChosenMoveText = document.querySelector('.server-chosen-move');
const roomJoinTextbox = document.querySelector('.room-join');
const roomJoinButton = document.querySelector('.room-join-button');
let room = '';  
let serverChosenMove = '';
let multiplayerSwitch = 0;

//Actual game components
const gameBoardTitle = document.querySelector(".game-board-title");
const resetButton = document.querySelector(".reset-button");
let count = 0;          //count maintained to see if draw or not

//Push DOM of cells to list
for(let i = 1; i <= 9; i++){
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
        if(won){
            gameBoardTitle.textContent = `${won} won`
            listOfCells.forEach(cell => cell.disabled = true);
        }   

        console.log(count);
        count++;
        if(count === 9 && won === '') gameBoardTitle.textContent = `Draw`;
        cellItem.disabled = true;

         //emit for every click
        if(currentPlayer === 'X') currentPlayer = 'O';
        else currentPlayer = 'X';

        if(multiplayerSwitch){
            listOfCells.forEach(cellItem => cellItem.disabled = true);
            clientSideSocket.emit("cell-clicked", index, room);
        }
    })
})

//reset button
resetButton.addEventListener("click", () => {
    resetGame();
    if(multiplayerSwitch) clientSideSocket.emit('reset-game', room);
})

//Event listener to join button for joining through socket
roomJoinButton.addEventListener('click', () => {
    room = roomJoinTextbox.value;
    clientSideSocket.emit("join-room-msg", room);
    multiplayerSwitch = 1;
    roomJoinButton.disabled = true;
    // leaveRoomButton.disabled = false;
})

//Listeners for multiplayer
//Listening for the other player's moves and making changes on my board 
//because of opponent
clientSideSocket.on("player-made-move", (index) => {
    changeCellContent(index);
    updateGameBoardDOM();
    checkWin();
    if(won){
        gameBoardTitle.textContent = `${won} won`
        listOfCells.forEach(cell => cell.disabled = true);
    }

    console.log(count);
    count++;
    if(count === 9 && won === '') gameBoardTitle.textContent = `Draw`;
    listOfCells[index].disabled = true;
    if(currentPlayer === 'X') currentPlayer = 'O';
    else currentPlayer = 'X';

    if(!won){
        for(let i = 0; i < 9; i++){
            console.log(gameBoard[indexToCoords(i).x][indexToCoords(i).y]);
            if(gameBoard[indexToCoords(i).x][indexToCoords(i).y] === ''){
                listOfCells[i].disabled = false;
            }
            else{
                listOfCells[i].disabled = true;
            }
        }
    }
    else{
        listOfCells.forEach(cellItem => cellItem.disabled = true);
    }
});

//Listening to what the server alots the client with 
clientSideSocket.on("server-chosen-move", (randomChoice) => {
    resetGame();
    resetButton.disabled = false;
    if(randomChoice === 1){
        serverChosenMove = 'X';
        serverChosenMoveText.textContent = `You play: ${serverChosenMove}`;
    } 
    else {
        serverChosenMove = 'O'
        serverChosenMoveText.textContent = `You play: ${serverChosenMove}`;
    }

    if(serverChosenMove === 'O'){
        listOfCells.forEach(cellItem => cellItem.disabled = true);
    }
});

//Listening to whether opponent resets the game or not
clientSideSocket.on('player-left', () => {
    resetGame();
    serverChosenMoveText.textContent = 'Local Play';
    multiplayerSwitch = 0;
    roomJoinButton.disabled = false;
    leaveRoomButton.disabled = true;
})

clientSideSocket.on('joined-room', () => {
    // roomJoinButton.disabled = true;
    serverChosenMoveText.textContent = 'Waiting';
    listOfCells.forEach(cellItem => cellItem.disabled = true);
    leaveRoomButton.disabled = false;
    resetButton.disabled = true;
})


clientSideSocket.on('reset-game-initiated', () => resetGame())
//clientSideSocket.on('second-player-joined', () => resetGame())

leaveRoomButton.addEventListener('click', () => {
    clientSideSocket.emit('leave', room);
    roomJoinButton.disabled = false;
    leaveRoomButton.disabled = true;
    resetButton.disabled = false;
})

clientSideSocket.on("error-joining-room", () => {
    serverChosenMoveText.textContent = "Error!";
    roomJoinButton.disabled = false;
})

window.onbeforeunload = function() {
    clientSideSocket.emit('leave', room);
}
window.onbeforeunload();


// [].forEach.call(document.querySelectorAll("*"),function(a){a.style.outline="2px solid #"+(~~(Math.random()*(1<<24))).toString(16)})

