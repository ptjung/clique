/**
 * This file defines routes for the expected endpoint at 'api/users/'. It supports the following functions:
 * 
 *     - GET / => Obtain an array of all users in the database
 *     - POST /auth/retrieve => Retrieve the information about a user given an ID
 *     - GET /auth/verify => Verifies a given token and returns its payload if successful
 *     - POST /auth/clear => Clears this user's session
 *     - POST /auth/obtain => Permits this user to obtain a session, given credentials via some login system and flags for refreshing
 *     - POST /roomauth/verify => Verifies a given token for a session within a room and returns its payload if successful
 *     - POST /roomauth/obtain => Permits this user to obtain a session within a room
 *     - POST /add => Add a user to the database
 *     - POST /delete => Delete a user from the database
 *     - POST /permit => Obtain a short-lifetime token for calling APIs, expected to be called frequently
 * 
 * Notice: some functions here may use MemoryStore for storing sessions!
 * 
 * @author: PtJung (Patrick Jung)
 * @requires express
 * @requires jsonwebtoken
 */

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const auth = require('../middleware/auth');

/**
 * Route which obtains an array of all users in the database.
 * 
 * @route GET api/users
 * @method
 */
router.get('/', auth, (req, res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('[ Router GET ./users/ ] ' + err));
});

/**
 * Route which retrieves the information about a user given an ID.
 * 
 * @route POST api/users/auth/retrieve
 * @method
 */
router.post('/auth/retrieve', auth, (req, res) => {

    // Selects up to public information & email only
    User.findById(req.body.id)
        .select('-password -createdAt -updatedAt -__v')
        .then(user => res.json(user))
        .catch(err => res.status(400).json('[ Router GET ./users/auth/retrieve ] ' + err));
});

/**
 * Route which verifies a given token and returns its payload if successful.
 * 
 * @route GET api/users/auth/verify
 * @method
 */
router.get('/auth/verify', auth, (req, res) => {
    if (req.sessionStore.sessions) {
        try {
            let sessionAsJSON = JSON.parse(Object.values(req.sessionStore.sessions).slice(-1)[0]);
            let payload = jwt.verify(sessionAsJSON.token, process.env.REACT_APP_JWT_SECRET);
            res.send(payload);
        }
        catch (err) {
            res.end();
        }
    }
    res.end();
});

/**
 * Route which clears this user's session.
 * 
 * @route POST api/users/auth/clear
 * @method
 */
router.post('/auth/clear', auth, (req, res) => {
    req.sessionStore.clear();
    res.end();
});

/**
 * Route which permits this user to obtain a session, given credentials via
 * some login system and flags for refreshing.
 * 
 * @route POST api/users/auth/obtain
 * @method
 */
router.post('/auth/obtain', auth, (req, res) => {
    const email = req.body.email.toUpperCase();
    const password = req.body.password ? req.body.password : "";
    const ignorePass = req.body.ignorePass ? req.body.ignorePass : false;

    User.findOne({email: email})
        .then(user => {
            if (!user) return res.status(400).json('[ Router POST ./users/auth/obtain ] Non-existant user');

            // Assert: a user exists with this email
            user.validPassword(password)
                .then(isMatch => {
                    if (!isMatch && !ignorePass) return res.status(400).json('[ Router POST ./users/auth/obtain ] Invalid credentials');

                    // Assert: this user has a correct email & password
                    jwt.sign(
                        {id: user._id},
                        process.env.REACT_APP_JWT_SECRET,
                        {expiresIn: parseInt(process.env.REACT_APP_SESSION_LIFE)},
                        (err, token) => {
                            if (err) throw err;
                            
                            // Assert: JWT created successfully
                            // Warning: this may reset room session tokens as well
                            req.sessionStore.clear();
                            req.session.token = token;
                            res.json({
                                token: token
                            });
                            res.end();
                        }
                    );
                })
        })
        .catch(err => {
            // console.log(err)
        });
});

/**
 * Route which verifies a given token for a session within a room and returns
 * its payload if successful.
 * 
 * @route POST api/users/roomauth/verify
 * @method
 */
router.post('/roomauth/verify', (req, res) => {
    if (req.sessionStore.sessions) {
        try {
            let sessionAsJSON = JSON.parse(Object.values(req.sessionStore.sessions).slice(-1)[0]);
            let payload = jwt.verify(sessionAsJSON.tokenRoom, process.env.REACT_APP_JWT_SECRET);
            res.send(payload);
        }
        catch (err) {
            res.end();
        }
    }
    res.end();
});

/**
 * Route which permits this user to obtain a session within a room.
 * 
 * @route POST api/users/roomauth/obtain
 * @method
 */
router.post('/roomauth/obtain', auth, (req, res) => {
    const roomCode = req.body.code;
    const userId = req.body.id ? req.body.id : "";

    jwt.sign(
        {roomCode: roomCode, id: userId},
        process.env.REACT_APP_JWT_SECRET,
        (err, tokenRoom) => {
            if (err) throw err;
            
            // Assert: JWT created successfully
            req.session.tokenRoom = tokenRoom;
            res.json({
                token: tokenRoom
            });
            res.end();
        }
    );
});

/**
 * Route which adds a user to the database,
 * 
 * @route POST api/users/add
 * @method
 */
router.post('/add', auth, (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email.toUpperCase();

    const newUser = new User({username: username, email: email});
    newUser.password = newUser.generateHash(password);

    newUser.save()
        .then(user => {

            jwt.sign(
                {id: user._id},
                process.env.REACT_APP_JWT_SECRET,
                {expiresIn: parseInt(process.env.REACT_APP_SESSION_LIFE)},
                (err, token) => {
                    if (err) throw err;

                    // Assert: JWT created successfully
                    res.json({
                        token: token
                    });
                }
            );
        })
        .catch(err => res.status(400).json('[ Router POST ./users/add ] ' + err));
});

/**
 * Route which deletes a user from the database.
 * 
 * @route POST api/users/delete
 * @method
 */
router.post('/delete', auth, (req, res) => {
    const username = req.body.username;

    User.findOneAndDelete({username: username})
        .then(res.json({found: true}))
        .catch(err => res.status(400).json('[ Router DELETE ./users/delete ] ' + err));
});

/**
 * Route which obtains a short-lifetime token for calling APIs, expected to be called frequently.
 * (On a developer note, the DELETE method did not work when trying it here!)
 * 
 * @route POST api/users/permit
 * @method
 */
router.post('/permit', (req, res) => {
    jwt.sign(
        {apiKey: process.env.REACT_APP_PERMIT_KEY},
        process.env.REACT_APP_JWT_SECRET,
        {expiresIn: 2},
        (err, token) => {
            if (err) throw err;

            // Assert: JWT created successfully
            res.json({
                token: token
            });
        }
    );
});

// Export the Express router with all of the user-related functions mounted
module.exports = router;