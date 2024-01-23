const myServer = require('socket.io')(3000, {
    cors: {
        origin: ['http://localhost:8080']
    }
})

myServer.on("connection", socket => {
    console.log(socket.id);
    socket.on("cell-clicked", (currentPlayer, index) => {
        console.log(currentPlayer, index);
    })
})

