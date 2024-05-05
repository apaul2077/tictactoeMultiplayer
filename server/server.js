const myServer = require('socket.io')(process.env.port || 3000, {
    cors: {
        origin: ['http://localhost:8080','https://tic-tac-toe-multiplayer1439.netlify.app/']
    }
})

function randomPlayerMoveChoose(){
    return Math.floor(Math.random() * 2);
}

let roomsList = {};

//Player can join multiple rooms at the same time

myServer.on("connection", socket => {
    const socketID = socket.id;
    console.log(socketID);
    
    //Listening to the whether a client has joined room or not
    socket.on("join-room-msg", room => {
        //Check if room is present or not
        let roomPresent = false;
        for(const eachRoom in roomsList){
            if(room === eachRoom) roomPresent = true;
        }

        //Based on if its present add players appropriately to rooms
        if(!roomPresent && room !== ''){
            const randomChoice = randomPlayerMoveChoose();
            roomsList[room] = [[socketID, randomChoice]];
            socket.join(room);
            //myServer.to(roomsList[room][0][0]).emit('server-chosen-move', roomsList[room][0][1]);
            myServer.to(roomsList[room][0][0]).emit('joined-room');
        }
        else if(roomPresent && roomsList[room].length < 2){
            let randomChoice;

            myServer.to(roomsList[room][0][0]).emit('server-chosen-move', roomsList[room][0][1]);
            //myServer.to(roomsList[room][0][0]).emit('second-player-joined');
            myServer.to(socketID).emit('joined-room');

            if(roomsList[room][0][1] === 0){
                randomChoice = 1;
                roomsList[room].push([socketID, randomChoice]);
                myServer.to(roomsList[room][1][0]).emit('server-chosen-move', roomsList[room][1][1]);
            }
            else{
                randomChoice = 0;
                roomsList[room].push([socketID, randomChoice]);
                myServer.to(roomsList[room][1][0]).emit('server-chosen-move', roomsList[room][1][1]);
            }
            socket.join(room);
        }
        else if(roomPresent && roomsList[room].length === 2){
            console.log(`${room} is full. Can't join.`)
        }
        console.log(roomsList);

    })

    //Listening to whether client has clicked a cell or not
    socket.on("cell-clicked", (index, room) => {
        socket.to(room).emit('player-made-move', index);
    })

    //Listening whether client has resetted the game or not
    socket.on('reset-game', (room) => {
        socket.to(room).emit('reset-game-initiated');
        roomsList[room][0][1] = randomPlayerMoveChoose();

        if(roomsList[room][0][1] === 0) roomsList[room][1][1] = 1;
        else roomsList[room][1][1] = 0;

        console.log(roomsList);
        myServer.to(roomsList[room][0][0]).emit('server-chosen-move', roomsList[room][0][1]);
        myServer.to(roomsList[room][1][0]).emit('server-chosen-move', roomsList[room][1][1])
    })

    socket.on('leave', room => {
        if(roomsList.length > 0){
            roomsList[room].forEach((item) => {
                let player = myServer.sockets.sockets.get(item[0]);
                player.leave(room);
            })
        }
        myServer.to(room).emit('player-left');
        delete roomsList[room];
    })
})

