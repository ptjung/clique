/**
 * Schema: User
 *     - Username: required, must not be taken, accepts only word characters, length from 3 to 16
 *     - Email: required, must not be taken, accepts only ASCII characters (though, expects ALL CAPS), length from 1 to 100
 *     - Password: required, accepts only ASCII characters, length from 8 to 100
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const schUser = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, match: /^\w*$/, minlength: 3, maxlength: 16 },
    email: { type: String, required: true, unique: true, trim: true, match: /^[\x00-\x7F]*$/, minlength: 1, maxlength: 100 },
    password: { type: String, required: true, match: /^[\x00-\x7F]*$/, minlength: 8, maxlength: 100 }
}, 
{
    timestamps: true
});

schUser.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

schUser.methods.validPassword = function (password) {
    return bcrypt.compare(password, this.password);
}

schUser.methods.generateJWT = function () {
    return jwt.sign(
        { id: user._id },
        process.env.REACT_APP_JWT_SECRET,
        { expiresIn: JWT_LIFETIME }
    );
}

module.exports = mongoose.model('User', schUser);