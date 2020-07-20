import React, { useState } from 'react'
import { Button, Form } from 'react-bootstrap';
import { TextField } from '@material-ui/core';
import styles from './SignUpWindow.module.css';
import utils from '../utils';
import cx from 'classnames';
import axios from 'axios';

const NAME_INPUT_MESSAGES = ["This username is already taken!", "This username is not available.", "The username must be between 3 and 16 characters long.", "The username may only consist of word characters (0-9, a-z, A-Z, _)"];
const EMAIL_INPUT_MESSAGES = ["This email is already taken!", "You must have an email.", "Enter a valid email."];
const EMAIL_DEFAULT_MESSAGE = "We'll never share your email with anyone else.";
const PASS_INPUT_MESSAGES = ["The password must be between 8 and 100 characters long.", "Passwords are limited to ASCII."];
const PASS_CONF_INPUT_MESSAGE = "The passwords do not match. Please try again.";
const EMAIL_VALIDATION_REGEX = /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

async function handleInputName(nameInput) {
    let isNameUnique = true;
    await utils.getUsersResponse().then(dataInJSON => {
        isNameUnique = !(dataInJSON.some((user) => user.username.toUpperCase() === nameInput.toUpperCase()));
    });

    let isNameOffendErr = false; // // // // // // // // // // // // // // // // // // // // // WIP
    let isNameInRange = (3 <= nameInput.length) && (nameInput.length <= 16);
    let isNameWordChars = /^\w*$/.test(nameInput);
    return [!isNameUnique, isNameOffendErr, !isNameInRange, !isNameWordChars];
}

// CREDITS TO: https://gist.github.com/badsyntax/719800
async function handleInputEmail(emailInput) {
    let isEmailUnique = true;
    await utils.getUsersResponse().then(dataInJSON => {
        isEmailUnique = !(dataInJSON.some((user) => user.email.toUpperCase() === emailInput.toUpperCase()));
    });

    let isEmailEmptyErr = (emailInput.length === 0);
    let isEmailValid = EMAIL_VALIDATION_REGEX.test(emailInput);	
    return [!isEmailUnique, isEmailEmptyErr, !isEmailValid];
}

function handleInputPass(passInput) {
    let isPassInRange = (8 <= passInput.length) && (passInput.length <= 100);
    let isPassASCII = /^[\x20-\x7F]*$/.test(passInput);
    return [!isPassInRange, !isPassASCII];
}

function sendAccountRequest(username, email, password) {
    axios.post(process.env.REACT_APP_API_URL + "/api/users/add", {
        "username": username,
        "password": password,
        "email": email
      })
      .catch(err => {
        console.log("Failed (/users/add): " + err);
      });
}

function getSessionPerm(email) {
    return axios.post(process.env.REACT_APP_API_URL + "/api/users/auth/obtain", {
            "email": email,
            "ignorePass": true
        })
        .then(res => {
            return res.data;
        })
        .catch(err => {
            console.log("Failed (/users/auth): " + err);
        });
}

function SignUpWindow() {
    const [nameErrStatus, setNameErrStatus] = useState(-1);
    const [passErrStatus, setPassErrStatus] = useState(-1);
    const [emailErrStatus, setEmailErrStatus] = useState(-1);
    const [passConfErrStatus, setPassConfErrStatus] = useState(false);

    const [nameInput, setNameInput] = useState("");
    const [passInput, setPassInput] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [passConfInput, setPassConfInput] = useState("");
    
    const launchTerms = () => {
        window.open(window.location.origin + '/terms');
    }

    return (
        <div className={styles.signUpWrap}>
            <div className={cx("", styles.signUpBox)}>
                <div className={styles.iconContainer}>
                    <span className={styles.iconHelper} />
                    <span className={cx(styles.iconTextContainer, styles.unselectable)}>
                        <img src="/brand.png" className={styles.icon} height="64" alt="Clique"
                            draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                        <b style={{fontSize: '32px'}}>
                            &nbsp;
                            Sign Up
                        </b>
                    </span>
                </div>
                <div style={{padding: '10px'}} />
                <div className={styles.formWrapper}>
                    <Form>
                        <TextField id="formInputUsername" className={styles.formInput} label="Username" type="text" variant="outlined" size="small" required value={nameInput}
                          onChange={(evt) => setNameInput(evt.target.value)}
                          error={nameErrStatus >= 0}
                          helperText={(nameErrStatus >= 0) ? NAME_INPUT_MESSAGES[nameErrStatus] : ' '} />
                          
                        <div className={styles.formInputSeparator} />
                        <TextField id="formInputEmail" className={styles.formInput} label="Email" type="text" variant="outlined" size="small" required value={emailInput}
                          onChange={(evt) => setEmailInput(evt.target.value)}
                          error={emailErrStatus >= 0}
                          helperText={(emailErrStatus >= 0) ? EMAIL_INPUT_MESSAGES[emailErrStatus] : EMAIL_DEFAULT_MESSAGE} />

                        <div className={styles.formInputSeparator} />
                        <TextField id="formInputPassword" className={styles.formInput} label="Password" type="password" variant="outlined" size="small" required value={passInput}
                          onChange={(evt) => setPassInput(evt.target.value)}
                          error={passErrStatus >= 0}
                          helperText={(passErrStatus >= 0) ? PASS_INPUT_MESSAGES[passErrStatus] : ' '} />

                        <div className={styles.formInputSeparator} />
                        <TextField id="formInputPasswordConf" className={styles.formInput} label="Confirm Password" type="password" variant="outlined" size="small" required value={passConfInput}
                          onChange={(evt) => setPassConfInput(evt.target.value)}
                          error={passConfErrStatus}
                          helperText={passConfErrStatus ? PASS_CONF_INPUT_MESSAGE : ' '} />

                        <div className={styles.formInputSeparator} />
                        <div className={styles.formCheckSubContainer}>
                            <label className={cx("container", styles.checkboxContainer)} style={{paddingLeft: '5px'}}>
                                <input id="termsCheckbox" type="checkbox" />
                                &nbsp;&nbsp;&nbsp;
                                By signing up, you agree to our <a href="#" onClick={() => launchTerms()}>Terms of Service</a>.
                                <span className={styles.checkmark}></span>
                            </label>
                        </div>
                        <div className={styles.formInputSeparator} />
                        <div className={styles.signUpContainer}>
                            <Button variant="primary" className={styles.signUpButton} onClick={async () => {
                                let inputNameTest = -1;
                                await handleInputName(nameInput)
                                        .then((res) => inputNameTest = res.indexOf(true))
                                        .catch((err) => console.log(err));
                                let inputEmailTest = -1;
                                await handleInputEmail(emailInput)
                                        .then((res) => inputEmailTest = res.indexOf(true))
                                        .catch((err) => console.log(err));
                                const inputPassTest = handleInputPass(passInput).indexOf(true);
                                const inputPassConfTest = (passInput !== passConfInput);
                                const termsChecked = document.getElementById('termsCheckbox').checked;

                                if (((inputNameTest + inputEmailTest + inputPassTest) === -3) && !inputPassConfTest && termsChecked) {
                                    await sendAccountRequest(nameInput, emailInput, passInput);
                                    setTimeout(async () => {
                                        await getSessionPerm(emailInput);
                                        window.location.href = "/rooms";
                                    }, 1);
                                    return;
                                }
                                setNameErrStatus(inputNameTest);
                                setEmailErrStatus(inputEmailTest);
                                setPassErrStatus(inputPassTest);
                                setPassConfErrStatus(inputPassConfTest);
                            }}>
                                Sign Up
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default SignUpWindow;