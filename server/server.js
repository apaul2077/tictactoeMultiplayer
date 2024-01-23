const myServer = require('socket.io')(3000, {
    cors: {
        origin: ['http://localhost:8080']
    }
})

myServer.on("connection", socket => {
    console.log(socket.id);
})