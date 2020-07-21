const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// [GET ./ ]: Attempt to obtain all of the database's users
router.route('/').get((req, res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('[ Router GET ./users/ ] ' + err));
});

// [GET ./auth/retrieve ]: Retrieve user information from the given ID
router.route('/auth/retrieve').post((req, res) => {
    User.findById(req.body.id)
        .select('-password -createdAt -updatedAt -__v')
        .then(user => res.json(user))
        .catch(err => res.status(400).json('[ Router GET ./users/auth/retrieve ] ' + err));
});

// [GET ./auth/verify ]: Attempt to verify a given token, returning the payload if successful
router.get('/auth/verify', (req, res) => {
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

// [POST ./auth/clear ]: Attempt to clear the session
router.post('/auth/clear', (req, res) => {
    req.sessionStore.clear();
    res.end();
});

// [POST ./auth/obtain ]: Attempt to obtain permission for session, given credentials (i.e. login system); may also be used for refresh purposes, hence ignoring password is possible
router.route('/auth/obtain').post((req, res) => {
    const email = req.body.email.toUpperCase();
    const password = req.body.password ? req.body.password : "";
    const ignorePass = req.body.ignorePass ? req.body.ignorePass : false;

    User.findOne({email: email})
        .then(user => {
            if (!user) return res.status(400).json('[ Router POST ./users/auth/obtain ] Non-existant user');

            user.validPassword(password)
                .then(isMatch => {
                    if (!isMatch && !ignorePass) return res.status(400).json('[ Router POST ./users/auth/obtain ] Invalid credentials');

                    jwt.sign(
                        {id: user._id},
                        process.env.REACT_APP_JWT_SECRET,
                        {expiresIn: parseInt(process.env.REACT_APP_SESSION_LIFE)},
                        (err, token) => {
                            if (err) throw err;
                            
                            req.sessionStore.clear(); // This may also reset room session tokens. Change this line later.
                            req.session.token = token;
                            res.json({
                                token: token
                            });
                            res.end();
                        }
                    );
                })
        })
        .catch(err => console.log(err));
});

// [POST ./roomauth/obtain ]: Attempt to obtain permission for room session
router.route('/roomauth/verify').post((req, res) => {
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

// [POST ./roomauth/obtain ]: Attempt to obtain permission for room session
router.route('/roomauth/obtain').post((req, res) => {
    const roomCode = req.body.code;
    const userId = req.body.id ? req.body.id : "";

    jwt.sign(
        {roomCode: roomCode, id: userId},
        process.env.REACT_APP_JWT_SECRET,
        (err, tokenRoom) => {
            if (err) throw err;
            
            req.session.tokenRoom = tokenRoom;
            res.json({
                token: tokenRoom
            });
            res.end();
        }
    );
});

// [POST ./add ]: Attempt to add a user to the database (i.e. create account)
router.route('/add').post((req, res) => {
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
                    res.json({
                        token: token
                    });
                }
            );
        })
        .catch(err => res.status(400).json('[ Router POST ./users/add ] ' + err));
});

// [POST ./delete ]: Attempt to delete a user from the database (i.e. delete account)
router.route('/delete').post((req, res) => {
    const username = req.body.username;

    User.findOneAndDelete({username: username})
        .then(res.json({found: true}))
        .catch(err => res.status(400).json('[ Router POST ./users/delete ] ' + err));
});

module.exports = router;