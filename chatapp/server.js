const http = require('http')
const express = require('express')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

io.on('connection', socket => {
  console.log('cliente conectado', socket.id)
  socket.on('identify', user => { socket.user = user; })
  socket.on('message', msg => {
    for (const [id, s] of Object.entries(io.sockets.sockets)) {
      if (s.user && s.user.id === msg.to) {
        s.emit('message', msg)
      }
    }
  })
  socket.on('typing', data => { socket.broadcast.emit('typing', data) })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log('Socket.IO server en puerto', PORT))