const axios = require('axios');
const router = require('express').Router();
const CryptoJS = require("crypto-js");
let Room = require('../models/room.model');
 
// This function returns a time-unique serial code (i.e. time since epoch in base-36)
const createRoomCode = () => {
    return (new Date()).getTime().toString(36);
}

// [GET ./ ]: Attempt to obtain all of the database's rooms
router.route('/').get((req, res) => {
    Room.find()
        .then(rooms => res.json(rooms))
        .catch(err => res.status(400).json('[ Router GET ./rooms ] ' + err));
});

// [POST ./userinfo ]: Attempt to obtain the info of a user in a room (since this is called initially upon connection, move the "past user" to "user" if possible)
router.route('/userinfo').post(async (req, res) => {
    // const roomSelected = await Room.findOne({roomCode: req.body.roomCode});

    Room.findOne({roomCode: req.body.roomCode})
        .then(roomSelected => {
            let roomUsers = roomSelected ? roomSelected.users : [];
            let foundStatus = false;

            roomUsers.forEach(user => {
                if (user.userId === req.body.userId) {
                    foundStatus = true;
                    res.json(user);
                    return;
                }
            });

            if (!foundStatus) {
                let roomUsersPast = roomSelected ? roomSelected.usersPast : [];
                let foundStatusForPast = false;

                roomUsersPast.forEach((user) => {
                    if (user.userId === req.body.userId) {
                        const enterRoomConfig = {
                            dispName: user.dispName,
                            roomCode: req.body.roomCode,
                            guestName: user.realName,
                            guestId: user.userId,
                            isOwner: user.isOwner
                        };
                        foundStatusForPast = true;

                        axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/enter", enterRoomConfig)
                            .catch(err => console.log(err));

                        res.json(user);
                        return;
                    }
                });

                if (!foundStatusForPast) {
                    res.json({});
                }
            }
        })
        .catch(err => res.status(400).json('[ Router POST ./userinfo ]' + err));
});

// [POST ./create ]: Attempt to create a room, add to the database (fields: creator, title, password, code), and update the creator's current room code
router.route('/create').post((req, res) => {
    const roomHost = req.body.host;
    const roomHostId = req.body.hostId;
    const roomName = req.body.name;
    const roomPass = req.body.password ? req.body.password : "";
    const roomCode = createRoomCode();
    const maxUsers = req.body.usercap;

    // Block to add a new room given properties
    const newRoom = new Room({ roomHost, roomName, roomPass, roomCode, maxUsers: maxUsers, users: [
        {realName: roomHost, dispName: roomHost, userId: roomHostId, isOwner: true}
    ]});
    newRoom.save()
        // .then(() => res.json(`[ Router POST ./rooms/create ] Successfully added: ${roomHost}'s ${roomName} (p: "${roomPass}")`))
        .then(() => res.json({code: `${roomCode}`}))
        .catch(err => res.status(400).json('[ Router POST ./rooms/create ] ' + err));
});

// [PATCH ./enter ]: Attempt to add a guest user to a room's list of users
router.route('/enter').patch((req, res) => {
    const roomCode = req.body.roomCode;
    const guestNameDisp = req.body.dispName;
    const guestNameReal = req.body.guestName ? req.body.guestName : "";
    const guestId = req.body.guestId;
    const userIsOwner = req.body.isOwner || false;

    // Block to find some Room using the given roomCode, and add a new {realName, dispName, isOwner} object to its 'users'
    Room.findOneAndUpdate({roomCode: roomCode}, {$push: {users: {realName: guestNameReal, dispName: guestNameDisp, userId: guestId, isOwner: userIsOwner}}})
        .then(() => res.json(`[ Router PATCH ./enter ] Successfully added: ${guestNameDisp} to Room ${roomCode}`))
        .catch(err => {
            console.log(err);
            res.status(400).json('[ Router PATCH ./enter ] ' + err);
        });
});

// [PATCH ./leave ]: Attempt to remove a guest user to a room's list of users
router.route('/leave').patch((req, res) => {
    const roomCode = req.body.roomCode;
    const guestId = req.body.guestId;

    // Block to find some Room using the given roomCode, and remove an object in 'users' which has a specific userId
    Room.findOneAndUpdate({roomCode: roomCode}, {$pull: {users: {userId: guestId}}})
        .then(async (data) => {

            // Delete the room if there is nobody else in it (within 3 seconds)
            setTimeout(() => {
                Room.findOne({roomCode: roomCode})
                    .then(async (roomInfo) => {
                        if (roomInfo && roomInfo.users && (roomInfo.users.length === 0)) {
                            await Room.findOneAndDelete({roomCode: roomCode})
                                .catch(err => {
                                    console.log(err);
                                    res.status(400).json('[ Router PATCH ./leave (1) ] ' + err);
                                });
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(400).json('[ Router PATCH ./leave (2) ] ' + err);
                    });
            }, 3000);

            // If somebody else is in the room still, store the user as a "past" user (if not found in the array already)
            if (data && data.users) {
                data.users.forEach(user => {
                    if (user.userId === guestId) {
                        
                        let foundInPast = false;
                        for (let pastUser of data.usersPast) {
                            if (pastUser.userId === guestId) {
                                foundInPast = true;
                                break;       
                            }
                        }
                        if (!foundInPast) {
                            Room.findOneAndUpdate({roomCode: roomCode}, {$push: {usersPast: {realName: user.realName, dispName: user.dispName, userId: user.userId, isOwner: user.isOwner}}})
                                .catch(err => console.log(err));
                        }
                    }
                });
            }
            // console.log(data);

            res.json(`[ Router PATCH ./leave ] Successfully removed: ${guestId} from Room ${roomCode}`);
        })
        .catch(err => {
            console.log(err);
            res.status(400).json('[ Router PATCH ./leave (3) ] ' + err);
        });
});

// [DELETE ./remove ]: Attempt to remove an existing room from the database
router.route('/remove').delete((req, res) => {
    const roomCode = req.body.roomCode;

    // Block to find some Room using the given roomCode, and deletes it
    Room.findOneAndDelete({roomCode: roomCode})
        .then(() => res.json(`[ Router DELETE ./remove ] Successfully removed: Room ${roomCode}`))
        .catch(err => res.status(400).json('[ Router DELETE ./remove ] ' + err));
});

module.exports = router;