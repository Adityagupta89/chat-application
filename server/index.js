const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });
const cors = require("cors");
const router = require("./router");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");
const { response } = require("express");

app.use(cors());

io.on("connect", (socket) => {
  console.log("connected");
  socket.on("join", ({ name, room }) => {
    console.log("Adi", socket.id);
    const { error, user } = addUser({ id: socket.id, name, room });
    console.log(user);
    // if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("sendMessage", ({ room, name, msg }, callback) => {
    const user = getUser(socket.id);
    console.log(room, name, msg);
    io.to(room).emit("message", { user: name, text: msg });
    callback("Hello");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    console.log("Connect disconnected");
    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

app.use(router);

server.listen(5000, () => console.log(`Server has started on port 5000`));
