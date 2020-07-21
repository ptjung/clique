import React, { useState, useEffect } from 'react'
import { Button, Form } from 'react-bootstrap';
import { TextField } from '@material-ui/core';
import styles from './LogInWindow.module.css';
import utils from '../utils';
import $ from 'jquery';
import cx from 'classnames';
import axios from 'axios';

const CRED_ERROR_MESSAGE = "The credentials you entered did not match our records. Please try again.";
const LOGIN_EVENT_EXEC = "click";

async function getAccountObj(identifier) {
    let accountObject;
    await utils.getUsersResponse().then(dataInJSON => {
        accountObject = dataInJSON.find(account =>
            (account.username.toUpperCase() === identifier.toUpperCase()) ||
            (account.email === identifier.toUpperCase()));
    });
    return accountObject;
}

function getSessionPerm(email, password) {
    return axios.post(process.env.REACT_APP_API_URL + "/api/users/auth/obtain", {
            "email": email,
            "password": password,
            "ignorePass": false
        })
        .then(res => {
            return res.data;
        })
        .catch(err => {
            // console.log("Failed (/users/auth): " + err);
        });
}

function LogInWindow() {
    const [showError, setShowError] = useState(false);
    const [identInput, setIdentInput] = useState("");
    const [passInput, setPassInput] = useState("");

    useEffect(() => {
        async function redirectOnLogin() {
            let resSession = await utils.getSession();
            if (resSession.data && !showError) {
                // Test for valid session data in this attempt as well as the current session
                window.location.href = "/rooms";
            }
        }
        redirectOnLogin();

        // 'Log In' button given click event: attempt to join with fixed cooldown
        $('#loginButton').unbind(LOGIN_EVENT_EXEC);
        $('#loginButton').on(LOGIN_EVENT_EXEC, function() {
            let pressedButton = $(this);
            pressedButton.attr('disabled',true);
            window.setTimeout(function () { 
                pressedButton.attr('disabled',false);
            }, 500);
        });
    });

    return (
        <div id="master" className={styles.logInWrap}>
            <div className={styles.logInBox}>
                <div className={styles.iconContainer}>
                    <span className={styles.iconHelper} />
                    <span className={cx(styles.iconTextContainer, styles.unselectable)}>
                        <img src="/brand.png" className={styles.icon} height="64" alt="Clique"
                            draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                        <b style={{fontSize: '32px'}}>
                            &nbsp;
                            Log In
                        </b>
                    </span>
                </div>
                <div style={{height: '20px'}} />
                <div className={styles.errorMessage}>
                    {showError ? CRED_ERROR_MESSAGE : ' '}
                </div>
                <div className={styles.formWrapper}>
                    <Form>
                        <TextField id="formInputIdentifier" className={styles.formInput} label="Username / Email" type="text" variant="outlined" size="small" required value={identInput}
                          onChange={(evt) => setIdentInput(evt.target.value)} />
                        <div className={styles.formInputSeparator} />
                        <TextField id="formInputPassword" className={styles.formInput} label="Password" type="password" variant="outlined" size="small" required value={passInput}
                          onChange={(evt) => setPassInput(evt.target.value)} />
                        <div className={styles.formInputSeparator} />
                        <div className={styles.logInContainer}>
                            <Button id="loginButton" variant="primary" type="submit" className={styles.logInButton} onClick={async () => {
                                
                                // Use identifier (i.e. username / email) to get account in database
                                let inMemoryToken = false;
                                let accountObject = await getAccountObj(identInput);
                                if (accountObject !== undefined) {
                                    // Account is found in database; then, check if credentials match
                                    inMemoryToken = await getSessionPerm(accountObject.email, passInput);
                                }

                                // Unsuccessful credentials: show error caption & reset password field
                                setShowError((accountObject === undefined) || (!inMemoryToken));
                                setPassInput("");
                            }}>
                                Log In
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default LogInWindow;