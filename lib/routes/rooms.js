/**
 * This file defines routes for the expected endpoint at 'api/rooms/'. It supports the following functions:
 * 
 *     - GET / => Obtain an array of all rooms in the database
 *     - POST /userinfo => Obtain a user (or "past user" if applicable) from a specified room
 *     - POST /create => Create a room and add it to the database
 *     - PATCH /enter => Simulates a user entering a room by adding them to the room's user list
 *     - PATCH /leave => Simulates a user leaving a room by removing them from the room's user list
 *     - DELETE /remove => Delete a room from the database
 * 
 * @author: PtJung (Patrick Jung)
 * @requires express
 * @requires axios
 */

const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Room = require('../models/room.model');
 
/**
 * This function provides a time-unique serial code made up of only lowercase, alphanumeric characters.
 * 
 * @return {String} The time (down to the millisecond) since epoch in base-36
 */
const createRoomCode = () => {
    return (new Date()).getTime().toString(36);
}

/**
 * Route which obtains an array of all rooms in the database.
 * 
 * @route GET api/rooms
 * @method
 */
router.get('/', auth, (req, res) => {
    Room.find()
        .then(rooms => res.json(rooms))
        .catch(err => {
            // res.status(400).json('[ Router GET ./rooms ] ' + err)
        });
});

/**
 * Route which obtains a user (or "past user" if applicable) from a specified room.
 * 
 * @route POST api/rooms/userinfo
 * @method
 */
router.post('/userinfo', auth, (req, res) => {

    Room.findOne({roomCode: req.body.roomCode})
        .then(roomSelected => {
            let roomUsers = roomSelected ? roomSelected.users : [];
            let foundStatus = false;

            // This block finds a user in the room with the specified user ID
            roomUsers.forEach(user => {
                if (user.userId === req.body.userId) {
                    
                    // If the user is found, return the user within the response
                    foundStatus = true;
                    res.json(user);
                    return;
                }
            });

            // Assert: the user was not found in the room
            if (!foundStatus) {
                let roomUsersPast = roomSelected ? roomSelected.usersPast : [];
                let foundStatusForPast = false;

                // This block finds a "PAST" user in the room with the specified user ID
                roomUsersPast.forEach((user) => {
                    if (user.userId === req.body.userId) {

                        const enterRoomConfig = {
                            dispName: user.dispName,
                            roomCode: req.body.roomCode,
                            guestName: user.realName,
                            guestId: user.userId,
                            isOwner: user.isOwner
                        };

                        // Since this method is called upon joining a room, the found "PAST" user may be added to the "PRESENT" users list
                        axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/enter", enterRoomConfig)
                            .catch(err => {
                                // console.log(err)
                            });

                        // If the "PAST" user is found, return the user within the response
                        foundStatusForPast = true;
                        res.json(user);
                        return;
                    }
                });

                if (!foundStatusForPast) {
                    // Empty response for failed attempts at getting this user
                    res.json({});
                }
            }
        })
        .catch(err => {
            // res.status(400).json('[ Router POST ./userinfo ]' + err)
        });
});

/**
 * Route which creates a room and adds it to the database.
 * 
 * @route POST api/rooms/create
 * @method
 */
router.post('/create', auth, (req, res) => {
    const roomHost = req.body.host;
    const roomHostId = req.body.hostId;
    const roomName = req.body.name;
    const roomPass = req.body.password ? req.body.password : "";
    const roomCode = createRoomCode();
    const maxUsers = req.body.usercap;

    // This block adds a new room given properties
    const newRoom = new Room({ roomHost, roomName, roomPass, roomCode, maxUsers: maxUsers, users: [
        {realName: roomHost, dispName: roomHost, userId: roomHostId, isOwner: true}
    ]});
    newRoom.save()
        .then(() => res.json({code: `${roomCode}`}))
        .catch(err => {
            // res.status(400).json('[ Router POST ./rooms/create ] ' + err)
        });
});

/**
 * Route which simulates a user entering a room by adding them to the room's user list.
 * 
 * @route PATCH api/rooms/enter
 * @method
 */
router.patch('/enter', auth, (req, res) => {
    const roomCode = req.body.roomCode;
    const guestNameDisp = req.body.dispName;
    const guestNameReal = req.body.guestName ? req.body.guestName : "";
    const guestId = req.body.guestId;
    const userIsOwner = req.body.isOwner || false;

    // This block finds some room using the given roomCode, and adds a new user (the object as stated below) to its 'users'
    Room.findOneAndUpdate({roomCode: roomCode}, {$push: {users: {realName: guestNameReal, dispName: guestNameDisp, userId: guestId, isOwner: userIsOwner}}})
        .then(() => {
            // If entering is successful, the same user may be removed from the "PAST" users if possible
            Room.findOneAndUpdate({roomCode: roomCode}, {$pull: {usersPast: {userId: guestId}}});
            res.json(`[ Router PATCH ./enter ] Successfully added: ${guestNameDisp} to Room ${roomCode}`);
        })
        .catch(err => {
            // res.status(400).json('[ Router PATCH ./enter ] ' + err);
        });
});

/**
 * Route which simulates a user leaving a room by removing them to the room's user list.
 * 
 * @route PATCH api/rooms/leave
 * @method
 */
router.patch('/leave', (req, res) => {
    const roomCode = req.body.roomCode;
    const guestId = req.body.guestId;

    // This block finds some room using the given roomCode, and removes a user having the specified ID
    Room.findOneAndUpdate({roomCode: roomCode}, {$pull: {users: {userId: guestId}}})
        .then(async (data) => {

            // This block deletes the room if there is nobody else in it (within 3 seconds); may be thought of as garbage collection
            setTimeout(() => {
                Room.findOne({roomCode: roomCode})
                    .then(async (roomInfo) => {
                        if (roomInfo && roomInfo.users && (roomInfo.users.length === 0)) {

                            // Assert: after 3 seconds, the room is found with no users
                            await Room.findOneAndDelete({roomCode: roomCode})
                                .catch(err => {
                                    // console.log(err);
                                    res.status(400).json('[ Router PATCH ./leave (1) ] ' + err);
                                });
                        }
                    })
                    .catch(err => {
                        // console.log(err);
                        res.status(400).json('[ Router PATCH ./leave (2) ] ' + err);
                    });
            }, 3000);

            // On the other hand, if somebody else is in the room still, store the user as a "PAST" user (if not found in the array already)
            if (data && data.users) {
                data.users.forEach(user => {
                    if (user.userId === guestId) {
                        
                        // Assigns foundInPast -> whether the user with the given ID was found in the 'usersPast' array
                        let foundInPast = false;
                        for (let pastUser of data.usersPast) {
                            if (pastUser.userId === guestId) {
                                foundInPast = true;
                                break;       
                            }
                        }

                        if (!foundInPast) {

                            // Assert: it was not found in the 'usersPast' array; the user is permitted to be added to 'usersPast'
                            Room.findOneAndUpdate({roomCode: roomCode}, {$push: {usersPast: {realName: user.realName, dispName: user.dispName, userId: user.userId, isOwner: user.isOwner}}})
                                .catch(err => {
                                    // console.log(err)
                                });
                        }
                    }
                });
            }

            res.json(`[ Router PATCH ./leave ] Successfully removed: ${guestId} from Room ${roomCode}`);
        })
        .catch(err => {
            // res.status(400).json('[ Router PATCH ./leave (3) ] ' + err);
        });
});

/**
 * Route which attempts to delete a room from the database.
 * 
 * @route PATCH api/rooms/remove
 * @method
 */
router.delete('/remove', auth, (req, res) => {
    const roomCode = req.body.roomCode;

    // This block finds some room using the given roomCode, and deletes it if it exists
    Room.findOneAndDelete({roomCode: roomCode})
        .then(() => res.json(`[ Router DELETE ./remove ] Successfully removed: Room ${roomCode}`))
        .catch(err => res.status(400).json('[ Router DELETE ./remove ] ' + err));
});

// Export the Express router with all of the room-related functions mounted
module.exports = router;