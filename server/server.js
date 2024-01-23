const myServer = require('socket.io')(3000, {
    cors: {
        origin: ['http://localhost:8080']
    }
})

myServer.on("connection", socket => {
    let currentRoom;
    console.log(socket.id);
    socket.on("cell-clicked", (currentPlayer, index) => {
        socket.to(currentRoom).emit('player-made-move', currentPlayer, index);
    })
    socket.on("join-room-msg", room => {
        console.log(`${socket.id} joined.`)
        socket.join(room);
        currentRoom = room;
    })
})

