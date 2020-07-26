/**
 * Defines the Mongoose schema for 'User'. The following block summarizes this schema.
 * 
 *     - Username: required, must not be taken, accepts only word characters, length from 3 to 16
 *     - Email: required, must not be taken, accepts only ASCII characters (though, expects ALL CAPS), length from 1 to 100
 *     - Password: required, accepts only ASCII characters, length from 8 to 100
 * 
 * @author PtJung (Patrick Jung)
 * @module models/user.model
 * @requires mongoose
 * @requires bcrypt
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Schema: User
const schUser = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, match: /^\w*$/, minlength: 3, maxlength: 16 },
    email: { type: String, required: true, unique: true, trim: true, match: /^[\x00-\x7F]*$/, minlength: 1, maxlength: 100 },
    password: { type: String, required: true, match: /^[\x00-\x7F]*$/, minlength: 8, maxlength: 100 }
}, 
{
    timestamps: true
});

/**
 * This function hashes a password using 'bcrypt' and returns it.
 * 
 * @method generateHash
 * @param {String} password The password parameter
 * @return {String} The hashed password
 */
schUser.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

/**
 * This function checks if two passwords match using 'bcrypt'.
 * 
 * @method validPassword
 * @param {String} password The password parameter
 * @return {boolean} Whether the passwords match
 */
schUser.methods.validPassword = function (password) {
    return bcrypt.compare(password, this.password);
}

// Export the User schema
module.exports = mongoose.model('User', schUser);