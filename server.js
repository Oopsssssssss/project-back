// require necessary NPM packages
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const { createServer } = require('http')
const { Server } = require('socket.io')

// require route files
const profileRoutes = require('./app/routes/profile_routes')
const userRoutes = require('./app/routes/user_routes')

// require middleware
const errorHandler = require('./lib/error_handler')
const requestLogger = require('./lib/request_logger')

// require database configuration logic
// `db` will be the actual Mongo URI as a string
const db = require('./config/db')

// require configured passport authentication middleware
const auth = require('./lib/auth')

// define server and client ports
// used for cors and local port declaration
const serverDevPort = 4741
const clientDevPort = 7165
// establish database connection
// use new version of URL parser
// use createIndex instead of deprecated ensureIndex
mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
})

const allowedOrigin = process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}`
// instantiate express application object and companion server for
// sockets.
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    credentials: true
  }
})
io.on('connection', socket => {
  console.log('We have a sock-et connection!!!!')
  // In the socket.on we will specify the event chatMessage. We have our callback function, and something that is going to happen on chatMessage. So we have our parameters chatObject
  socket.on('message', ({ name, message }) => {
    console.log(name, message)
    // io.on('connection', socket => {
    io.emit('message', { name, message })
  })
})
// const { error, user } = ProfileCreate({ id: socket.id, name, aboutMe })
// if (error) return callback(error)
// socket.emit('message', {
//   user: 'admin',
//   text: `${user.name}, welcome to the Socket-To-Me Chat`
// })
// socket.broadcast.to(user).emit('message', {
//   user: 'admin',
//   text: `${user.name}, has joined the Socket-To-Me Chat!`
// })

//   socket.join(user.chatObject)
//   callback()
// socket.on('disconnect', () => {
//   console.log('The sock has left!!!')
// })

// // now we are creating user generated messages
// socket.on('sendMessage', (message, callback) => {
//   const user = getUser(socket.id)

// })
// set CORS headers on response from this API using the `cors` NPM package
// `CLIENT_ORIGIN` is an environment variable that will be set on Heroku
app.use(
  cors({
    origin: allowedOrigin
  })
)

// define port for API to run on
const port = process.env.PORT || serverDevPort

// register passport authentication middleware
app.use(auth)

// add `express.json` middleware which will parse JSON requests into
// JS objects before they reach the route files.
// The method `.use` sets up middleware for the Express application
app.use(express.json())
// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }))

// log each request as it comes in for debugging
app.use(requestLogger)

// register route files
app.use(profileRoutes)
app.use(userRoutes)

// register error handling middleware
// note that this comes after the route middlewares, because it needs to be
// passed any error messages from them
app.use(errorHandler)

// run API on designated port (4741 in this case)
httpServer.listen(port, () => {
  console.log('listening on port ' + port)
})

// needed for testing
module.exports = app
