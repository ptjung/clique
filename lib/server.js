const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const axios = require('axios');
const { JOIN_ROOM, REQ_VIDEO, END_VIDEO, SET_VID, RESP_MSG, SEND_MSG, SET_MSGS, UPD_MSGS, GET_VTIME, SET_VTIME, NAV_VTIME, GET_USERS, SET_PLAY, SEND_NTCE } = require('../src/Constants');
if (process.env.NODE_ENV !== 'production') require('dotenv').config({path:__dirname + '/./../.env'});

// Server & Socket.IO Setup
const port = process.env.PORT || process.env.REACT_APP_PORT || 5000;
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
io.on('connection', (socket) => {

    socket.on(JOIN_ROOM, async (data) => {
        socket.roomId = data.roomId;
        socket.userId = data.userId;
        socket.realName = data.realName;
        socket.dispName = data.dispName;
        socket.isOwner = data.isOwner;

        socket.join(socket.roomId);
        // console.log(`Server > "${socket.roomId}", "${socket.userId}", "${socket.realName}", "${socket.dispName}", "${socket.isOwner}"`);

        const currVideoId = io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].videoId : "";
        io.in(socket.roomId).emit(GET_VTIME);
        io.in(socket.roomId).emit(RESP_MSG, {
            respJoin: `Room > ("${socket.userId}", "${currVideoId}")`
        });
        io.in(socket.roomId).emit(SET_MSGS, {
            currMsgList: io.sockets.adapter.rooms[socket.roomId].currMsgList
        });

        const fallbackNoVideoTime = setInterval(() => {
            if (io.sockets.adapter.rooms[socket.roomId]) {
                const newVideoTime = io.sockets.adapter.rooms[socket.roomId].videoTime;
                // console.log("Server > Data: respVideo = " + currVideoId + ", respVideoTime = " + newVideoTime);
                if (newVideoTime) {
                    io.in(socket.roomId).emit(SET_VID, {
                        respVideo: currVideoId,
                        respVideoTime: newVideoTime
                    });
                    clearInterval(fallbackNoVideoTime);
                }
            }
            else {
                clearInterval(fallbackNoVideoTime);
            }
        }, 1000);
    });

    socket.on(REQ_VIDEO, (data) => {
        if (io.sockets.adapter.rooms[socket.roomId]) {
            io.sockets.adapter.rooms[socket.roomId].videoId = data.query;
            io.in(socket.roomId).emit(SET_VID, {
                respVideo: io.sockets.adapter.rooms[socket.roomId].videoId
            });
        }
    });

    socket.on(END_VIDEO, (data) => {
        io.in(socket.roomId).emit(END_VIDEO, {
            endTime: data.endTime
        });
    });

    socket.on(SET_VTIME, (data) => {
        io.sockets.adapter.rooms[socket.roomId].videoTime = data.currVideoTime;
    });

    socket.on(GET_USERS, () => {
        io.in(socket.roomId).emit(GET_USERS, {
            userCount: io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].length : 0
        });
    });

    socket.on(SET_PLAY, (data) => {
        io.in(socket.roomId).emit(SET_PLAY, {
            playVideo: data.playVideo
        });
    });

    socket.on(NAV_VTIME, (data) => {
        io.in(socket.roomId).emit(NAV_VTIME, {
            newTime: data.newTime
        });
    });

    socket.on(SEND_MSG, (data) => {
        io.in(socket.roomId).emit(SEND_MSG, {
            senderDisp: data.senderDisp,
            senderReal: data.senderReal,
            senderIsOwner: data.senderIsOwner,
            msgContent: data.msgContent,
            currMsgList: data.currMsgList
        });
    });

    socket.on(SEND_NTCE, (data) => {
        io.in(socket.roomId).emit(SEND_NTCE, {
            msgContent: data.msgContent,
            currMsgList: (io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].currMsgList : []) || []
        });
    });

    socket.on(UPD_MSGS, (data) => {
        if (io.sockets.adapter.rooms[socket.roomId]) {
            io.sockets.adapter.rooms[socket.roomId].currMsgList = data.newMsgList;
        }
    });

    socket.on('disconnect', () => {
        io.in(socket.roomId).emit(GET_USERS, {
            userCount: io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].length : 0
        });
        io.in(socket.roomId).emit(RESP_MSG, {
            respJoin: `${socket.userId} has left the room.`
        });
        io.in(socket.roomId).emit(SEND_NTCE, {
            msgContent: `*${socket.dispName + (socket.realName ? (" (" + socket.realName + ")") : "")}* has left the room.`,
            currMsgList: (io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].currMsgList : []) || []
        });
        axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/leave", {roomCode: socket.roomId, guestId: socket.userId})
            .catch(err => console.log(err));
    });
});

// Express Build
app.use(express.json());
app.use(cors({
    origin: ((process.env.NODE_ENV !== 'production') ? ['http://localhost:5000', 'http://localhost:3000', 'http://localhost:60167'] : ['https://cliquepj.herokuapp.com']),
    credentials: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// MongoDB Connection & Indicator
mongoose.connect(process.env.REACT_APP_ATLAS_URI || 'mongodb://localhost/clique_app', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
mongoose.connection.on('connected', () => {
    console.log("[ Server ] Database connection established")
});

// MongoDB: Express Session
app.use(session({
    // store: new MongoStore({
    //     mongooseConnection: mongoose.connection,
    //     ttl: parseInt(process.env.REACT_APP_SESSION_LIFE)
    // }),
    secret: `${process.env.REACT_APP_SESS_SECRET}`,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: parseInt(process.env.REACT_APP_SESSION_LIFE + '000')
    }
}));

// Connect Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'build')));
    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
    });
}

// Express Listen & Indicator
http.listen(port, () => {
    console.log(`[ Server ] Running on PORT: ${port}`);
});
