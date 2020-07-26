/**
 * Defines the Mongoose schema for 'Room'. The following block summarizes this schema.
 * 
 *     - Room Host: required, accepts only word characters
 *     - Room Name: required, accepts only ASCII characters, ranges from 1 to 24 characters
 *     - Room Password: not required, accepts only ASCII characters, goes up to 100 characters
 *     - Room Code: required, accepts only word characters; used as a unique room identifier
 *     - Max Users: required, ranges from 2 to 50 users
 *     - Users: required, an array of objects for display/real names, unique IDs, and owner privilege
 *     - Users Past: array of past users in the room; re-joining users will have their info here
 * 
 * @author PtJung (Patrick Jung)
 * @module models/room.model
 * @requires mongoose
 */

const mongoose = require('mongoose');

// Schema: Room
const schRoom = mongoose.Schema({
    roomHost: { type: String, required: true, unique: true, match: /^\w*$/, trim: true },
    roomName: { type: String, required: true, trim: true, minlength: 1, maxlength: 24 }, 
    roomPass: { type: String, match: /^[\x00-\x7F]*$/, trim: true, maxlength: 100 }, 
    roomCode: { type: String, required: true, unique: true, match: /^\w*$/, trim: true },
    maxUsers: { type: Number, required: true, min: 2, max: 50 },
    users: { type: [{
        realName: {type: String, match: /^\w*$/, required: true},
        dispName: {type: String, required: true, trim: true, minlength: 1, maxlength: 36},
        userId: {type: String, match: /^[\x00-\x7F]*$/, trim: true},
        isOwner: {type: Boolean, required: true}
    }], required: true },
    usersPast: { type: [{
        realName: {type: String},
        dispName: {type: String},
        userId: {type: String},
        isOwner: {type: Boolean}
    }]}
}, 
{
    timestamps: true
});

// Export the Room schema
module.exports = mongoose.model('Room', schRoom);