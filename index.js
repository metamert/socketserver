const express = require('express')
const app = express()

const port = 5000

const isSecure = process.env.HTTPS?true:false

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

let server = false
if (isSecure) {
	server = https.createServer({
		key: fs.readFileSync(path.resolve("./socketssl/server.key")),
		cert: fs.readFileSync(path.resolve("./socketssl/server.crt"))
	},app)
} else {
	server = http.createServer(app)
}
const public_dir = __dirname + './express_public'

const io = require('socket.io')(server)

let broadcaster = false

app.use(express.static(public_dir))

io.sockets.on("error",e => {
	console.group("Socket Error")
	console.log(e)
	console.groupEnd()
})

server.listen(port, () => {
	console.group("Server")
	console.log("Listening on port:", port)
	console.log("Hosting: ", public_dir)
	console.groupEnd()
})

io.sockets.on("connection",(socket)=>{
	console.log("new Connection", socket.id)
	socket.on("broadcaster",()=>{
		broadcaster = socket.id
		console.log("new Broadcaster", socket.id)
		socket.broadcast.emit("broadcaster")
	})
	socket.on("subscribe", data=>{
		console.log("Join event", socket.id, data.room)
		socket.join(data.room)
	})
	socket.on("unsubscribe",data=>{
		console.log("Leave event", socket.id, data.room)
		socket.leave(data.room)
	})
	socket.on("publish", data=>{
		console.log("Room Event", data.room)
		console.log(data.event, data.data)
		socket.to(data.room).emit(data.event, data.data)
	})
})

io.sockets.on("watcher",()=>{
	console.log("new Watcher", socket.id)
	socket.to(broadcaster).emit("watcher", socket.id)
})
io.sockets.on("disconnect",()=>{
	console.log("Disconnect", socket.id)
	socket.to(broadcaster).emit("disconnectPeer", socket.id)
})
io.sockets.on("offer", (id,message) => {
	socket.to(id).emit("offer", socket.id, message)
})
io.sockets.on("answer", (id,message) => {
	socket.to(id).emit("answer", socket.id, message)
})
io.sockets.on("candidate", (id,message) => {
	socket.to(id).emit("candidate", socket.id, message)
})