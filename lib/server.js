/**
 * This file defines the basis of the Clique back-end & server. It controls real-time interactions with
 * Socket.IO, connects to the MongoDB Atlas database, connects the relevant routes and listens on a port.
 * 
 * @author PtJung (Patrick Jung)
 * @requires express
 * @requires cors
 * @requires mongoose
 * @requires path
 * @requires body-parser
 * @requires cookie-parser
 * @requires express-session
 * @requires axios
 * @requires dotenv
 * @requires http
 * @requires socket.io
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const redirector = require('redirect-https');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const axios = require('axios');
const { JOIN_ROOM, REQ_VIDEO, END_VIDEO, SET_VID, SEND_MSG, SET_MSGS, UPD_MSGS, GET_VTIME, SET_VTIME, NAV_VTIME, GET_USERS, SET_PLAY, SEND_NTCE } = require('../src/Constants');

/** The following block defines some server and Socket.IO initialization. */
if (process.env.NODE_ENV !== 'production') require('dotenv').config({path: __dirname + '/./../.env'});
const port = process.env.PORT || process.env.REACT_APP_PORT || 5000;
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
io.on('connection', (socket) => {

    /**
     * This method handles a user joining the room. They will have their information saved, join a room, gets the
     * message history of the room, and sets their video's time to line up with the rest of the users in the socket.
     * 
     * @method
     */
    socket.on(JOIN_ROOM, async (data) => {

        // This block saves their information here
        socket.roomId = data.roomId;
        socket.userId = data.userId;
        socket.realName = data.realName;
        socket.dispName = data.dispName;
        socket.isOwner = data.isOwner;
        socket.join(socket.roomId);

        // This block allows the user to obtain more information about the room: current video, current time in video, and the message history
        const currVideoId = io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].videoId : "";
        io.in(socket.roomId).emit(GET_VTIME);
        io.in(socket.roomId).emit(SET_MSGS, {
            currMsgList: io.sockets.adapter.rooms[socket.roomId].currMsgList
        });

        // This block sets the user's video player's video and video time; this is achieved through a fallback loop.
        const fallbackNoVideoTime = setInterval(() => {
            if (io.sockets.adapter.rooms[socket.roomId]) {

                // Assert: this room exists
                const newVideoTime = io.sockets.adapter.rooms[socket.roomId].videoTime;
                if (newVideoTime) {

                    // Assert: this video exists and is currently playing at 'newVideoTime'
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

    /**
     * This method handles a user's request for a video; all users in the socket will
     * have their player's video ID switched to this user's query.
     * 
     * @method
     */
    socket.on(REQ_VIDEO, (data) => {
        if (io.sockets.adapter.rooms[socket.roomId]) {
            io.sockets.adapter.rooms[socket.roomId].videoId = data.query;
            io.in(socket.roomId).emit(SET_VID, {
                respVideo: io.sockets.adapter.rooms[socket.roomId].videoId
            });
        }
    });

    /**
     * This method handles a user's ended video. It will forcefully end the video for all other users
     * so that all users are in sync. This is necessary so the play/pause button will work correctly.
     * 
     * @method
     */
    socket.on(END_VIDEO, (data) => {
        io.in(socket.roomId).emit(END_VIDEO, {
            endTime: data.endTime
        });
    });

    /**
     * This method sets the current video time globally, so that any user has access to it, including new users.
     * 
     * @method
     */
    socket.on(SET_VTIME, (data) => {
        io.sockets.adapter.rooms[socket.roomId].videoTime = data.currVideoTime;
    });

    /**
     * This method emits the number of users in a room to that same room.
     * 
     * @method
     */
    socket.on(GET_USERS, () => {
        io.in(socket.roomId).emit(GET_USERS, {
            userCount: io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].length : 0
        });
    });

    /**
     * This method emits a specified play state to all users in the room.
     * 
     * @method
     */
    socket.on(SET_PLAY, (data) => {
        io.in(socket.roomId).emit(SET_PLAY, {
            playVideo: data.playVideo
        });
    });

    /**
     * This method emits a specified time to navigate to, for all users in the room.
     * 
     * @method
     */
    socket.on(NAV_VTIME, (data) => {
        io.in(socket.roomId).emit(NAV_VTIME, {
            newTime: data.newTime
        });
    });

    /**
     * This method emits a user's message to all users in the room. The message's display is controlled by five factors:
     * display name, real name (if applicable), owner privileges, message content, and the current list of messages.
     * 
     * @method
     */
    socket.on(SEND_MSG, (data) => {
        io.in(socket.roomId).emit(SEND_MSG, {
            senderDisp: data.senderDisp,
            senderReal: data.senderReal,
            senderIsOwner: data.senderIsOwner,
            msgContent: data.msgContent,
            currMsgList: data.currMsgList
        });
    });

    /**
     * This method emits a notice to all users in the room. The message's display is controlled by the message content
     * and current list of messages.
     * 
     * @method
     */
    socket.on(SEND_NTCE, (data) => {
        io.in(socket.roomId).emit(SEND_NTCE, {
            msgContent: data.msgContent,
            currMsgList: (io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].currMsgList : []) || []
        });
    });

    /**
     * This method emits a new message list to all users in the room. This is necessary to send messages in real-time.
     * 
     * @method
     */
    socket.on(UPD_MSGS, (data) => {
        if (io.sockets.adapter.rooms[socket.roomId]) {
            io.sockets.adapter.rooms[socket.roomId].currMsgList = data.newMsgList;
        }
    });

    /**
     * This method handles a user disconnect. Miscellaneous calls happen here to simulate a leaving user in the front-end & back-end.
     * 
     * @method
     */
    socket.on('disconnect', () => {

        // The displayed userCount will be updated; since a disconnect has occured, the new userCount is -1 of its original
        io.in(socket.roomId).emit(GET_USERS, {
            userCount: io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].length : 0
        });

        // This block displays a notice to all users in the room that this user has left it
        io.in(socket.roomId).emit(SEND_NTCE, {
            msgContent: `*${socket.dispName + (socket.realName ? (" (" + socket.realName + ")") : "")}* has left the room.`,
            currMsgList: (io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].currMsgList : []) || []
        });

        // This API call simulates a leaving user, by pulling the user from the room's users array
        axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/leave", {roomCode: socket.roomId, guestId: socket.userId})
            .catch(err => {
                // console.log(err)
            });
    });
});

/** The following block sets up the Express app. */
app.use(express.json());
app.use(cors({
    origin: ((process.env.NODE_ENV !== 'production') ? ['http://localhost:3000'] : ['http://cliquepj.herokuapp.com', 'https://cliquepj.herokuapp.com']),
    credentials: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

/** The following block connects the server to MongoDB (Atlas) and gives an indicator. */
mongoose.connect(process.env.REACT_APP_ATLAS_URI || 'mongodb://localhost/clique_app', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
mongoose.connection.on('connected', () => {
    console.log("[ Server ] Database connection established")
});

/** The following block sets up the express session's cookie properties. */
app.use(session({
    secret: `${process.env.REACT_APP_SESS_SECRET}`,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: true,
        httpOnly: true,
        maxAge: parseInt(process.env.REACT_APP_SESSION_LIFE + '000')
    }
}));

/** The following block connects the API routes. */
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/', redirector);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'build')));
    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
    });
}

/** The following block lets the server listen on a port and gives an indicator. */
http.listen(port, () => {
    console.log(`[ Server ] Running on PORT: ${port}`);
});
