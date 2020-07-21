import React, { useState, useEffect } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { TextField } from '@material-ui/core';
import styles from './CreateRoomButton.module.css';
import utils from '../../utils';
import cx from 'classnames';
import $ from 'jquery';
import axios from 'axios';

/**
 * === Global Constants ===
 * CREATE_EVENT_EXEC: jQuery event for executing the Create button's function
 * MIN_CAPACITY: Minimum allowed room capacity
 * MAX_CAPACITY: Maximum allowed room capacity
 */
const CREATE_EVENT_EXEC = "click";
const MIN_CAPACITY = 2;
const MAX_CAPACITY = 50;

const NAME_INPUT_MESSAGES = ["You must have a room name.", "Cannot be over 24 characters.", "This name is not available."];
const PASS_INPUT_MESSAGES = ["Cannot be over 100 characters.", "Passwords are limited to ASCII."];
const USERS_INPUT_MESSAGES = ["Must be a positive integer.", `Must be between ${MIN_CAPACITY} and ${MAX_CAPACITY}.`];
const NO_TOKEN_MESSAGE = "You must log in to use this feature!";

function handleInputName(nameInput) {
    let isNameEmptyErr = (nameInput.length < 1);
    let isNameLongErr = (nameInput.length > 24);
    let isNameOffendErr = false; // // // // // // // // // // // // // // // // // // // // // WIP
    return [isNameEmptyErr, isNameLongErr, isNameOffendErr];
}

function handleInputPass(passInput) {
    let isPassLongErr = (passInput.length > 100);
    let isPassASCII = /^[\x20-\x7F]*$/.test(passInput);
    return [isPassLongErr, !isPassASCII];
}

function handleInputUsers(usersInput) {
    let isUsersInteger = /^\d+$/.test(usersInput);
    let isOutsideRangeErr = (parseInt(usersInput) > MAX_CAPACITY) || (MIN_CAPACITY > parseInt(usersInput));
    return [!isUsersInteger, isOutsideRangeErr];
}

function tryCreateRoom(paramHost, paramHostId, paramName, paramPassword, paramUserCap) {
    return axios.post(process.env.REACT_APP_API_URL + "/api/rooms/create", {
            "host": paramHost,
            "hostId": paramHostId,
            "name": paramName,
            "password": paramPassword,
            "usercap": paramUserCap
        })
        .then(res => {
            return res.data;
        })
        .catch(err => {
            // console.log("Failed (/users/auth): " + err);
        });
}

function CreateRoomButton() {
    const [nameErrStatus, setNameErrStatus] = useState(-1);
    const [passErrStatus, setPassErrStatus] = useState(-1);
    const [usersErrStatus, setUsersErrStatus] = useState(-1);

    const [nameInput, setNameInput] = useState("");
    const [passInput, setPassInput] = useState("");
    const [usersInput, setUsersInput] = useState("10");

    const [show, setShow] = useState(false);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  
    const handleClose = () => {
        setNameErrStatus(-1);
        setPassErrStatus(-1);
        setUsersErrStatus(-1);

        setNameInput("");
        setPassInput("");
        setUsersInput("10");

        setShow(false);
    };
    const handleShow = () => setShow(true);
  
    useEffect(() => {
        async function setupButton() {
            let resSession = await utils.getSession();
            if (resSession.data) {
                setIsUserLoggedIn(true);
            }
        
            // 'Create' button given click event: attempt to join with fixed cooldown
            $('#createButton').unbind(CREATE_EVENT_EXEC);
            $('#createButton').on(CREATE_EVENT_EXEC, function() {
                let pressedButton = $(this);
                pressedButton.attr('disabled', true);
                window.setTimeout(function () { 
                    pressedButton.attr('disabled', false);
                }, 500);
            });
        }
        setupButton();
    });
    
    return (
        <>  
            <Button variant="outline-dark" onClick={handleShow} className={cx(styles.unselectable, styles.createButton)}
              disabled={!isUserLoggedIn} title={!isUserLoggedIn ? NO_TOKEN_MESSAGE : ''}>
                Create
            </Button>
    
            <Modal id="createRoomModal" show={show} onHide={handleClose} animation={false} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Create Room
                    </Modal.Title>
                </Modal.Header>
                <Form>
                    <Modal.Body>
                            <TextField id="formRoomName" label="Room Name" type="text" variant="outlined" size="small" value={nameInput} required style={{width: '70%'}}
                            onChange={(evt) => setNameInput(evt.target.value)}
                            error={nameErrStatus >= 0}
                            helperText={(nameErrStatus >= 0) ? NAME_INPUT_MESSAGES[nameErrStatus] : ' '} />

                            <div className={styles.formSeparator} />
                            <TextField id="formRoomPass" label="Password" type="text" variant="outlined" size="small" value={passInput} style={{width: '70%'}}
                            onChange={(evt) => setPassInput(evt.target.value)}
                            error={passErrStatus >= 0}
                            helperText={(passErrStatus >= 0) ? PASS_INPUT_MESSAGES[passErrStatus] : ' '} />

                            <div className={styles.formSeparator} />
                            <TextField id="formMaxUsers" label="Capacity" type="number" variant="outlined" size="small" value={usersInput} required
                            onChange={(evt) => setUsersInput(evt.target.value)}
                            error={usersErrStatus >= 0}
                            helperText={(usersErrStatus >= 0) ? USERS_INPUT_MESSAGES[usersErrStatus] : `Enter an integer between ${MIN_CAPACITY} and ${MAX_CAPACITY}`}
                            InputProps={{inputProps: {min: MIN_CAPACITY, max: MAX_CAPACITY}}} />
                            
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button id="createButton" variant="primary" type="submit" disabled={!isUserLoggedIn} onClick={async () => {
                            const inputNameTest = handleInputName(nameInput).indexOf(true);
                            const inputPassTest = handleInputPass(passInput).indexOf(true);
                            const inputUsersTest = handleInputUsers(usersInput).indexOf(true);

                            if ((inputNameTest + inputPassTest + inputUsersTest) === -3) {
                                const resSession = await utils.getSession();
                                if (resSession.data) {
                                    const payload = await tryCreateRoom(resSession.data.username, resSession.data._id, nameInput, passInput, parseInt(usersInput));
                                    if (payload) {
                                        await utils.createRoomSession(payload.code, resSession.data._id);
                                        window.location.pathname += `/${payload.code}`;
                                        return;
                                    }
                                    window.location.reload();
                                }
                            }
                            setNameErrStatus(inputNameTest);
                            setPassErrStatus(inputPassTest);
                            setUsersErrStatus(inputUsersTest);
                        }}>
                            Create
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </>
    );
}

export default CreateRoomButton;