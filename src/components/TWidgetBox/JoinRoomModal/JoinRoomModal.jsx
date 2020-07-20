import React, { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import { TextField } from '@material-ui/core';
import styles from './JoinRoomModal.module.css';
import utils from '../../utils';
import cx from 'classnames';
import $ from 'jquery';
import 'bootstrap';

const NAME_INPUT_MESSAGES = ["You must have a display name.", "Cannot be over 36 characters.", "This display name is not available."];
const PASS_INPUT_MESSAGE = "Wrong password.";
const JOIN_EVENT_EXEC = "click";
const MODAL_EVENT_EXEC = "hidden.bs.modal";

function handleInputName(nameInput) {
    let isNameEmptyErr = (nameInput.length < 1);
    let isNameLongErr = (nameInput.length > 36);
    let isNameOffendErr = false; // // // // // // // // // // // // // // // // // // // // // WIP
    return [isNameEmptyErr, isNameLongErr, isNameOffendErr];
}

function handleInputPass(isPassEnabled, passInput, passKey) {
    return (!isPassEnabled || passInput === passKey);
}

function JoinRoomModal(props) {
    const [nameErrStatus, setNameErrStatus] = useState(-1);
    const [passErrStatus, setPassErrStatus] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [passInput, setPassInput] = useState("");
    const isRoomFull = props.rowData[2].userCountCurr === props.rowData[2].userCountMax; // TEMP: Disable the 'Join' button for full rooms
    const isPassEnabled = props.rowData[3].length > 0;
    const sessData = props.sessData;

    useEffect(() => {

        // 'Join' button given click event: attempt to join with fixed cooldown
        $('#joinButton').unbind(JOIN_EVENT_EXEC);
        $('#joinButton').on(JOIN_EVENT_EXEC, function() {
            let pressedButton = $(this);
            pressedButton.attr('disabled',true);
            window.setTimeout(function () { 
                pressedButton.attr('disabled',false);
            }, 500);
        });

        // Reset Modal fields upon given event (MODAL_EVENT_EXEC)
        $('#joinRoomModal').unbind(MODAL_EVENT_EXEC);
        $('#joinRoomModal').on(MODAL_EVENT_EXEC, function (e) {
            setNameErrStatus(-1);
            setPassErrStatus(false);
            setNameInput("");
            setPassInput("");
        });
    });

    return (
        <div className="modal" id="joinRoomModal">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="modal-title" style={{fontSize: '24px', fontWeight: '500'}}>
                            Join Room
                        </div>
                        <button type="button" className={cx("close", styles.closeButton)} data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">
                                &times;
                            </span>
                        </button>
                    </div>
                    <Form>
                        <div className={cx("modal-content", styles.contentContainer)} style={{padding: '1rem'}}>
                            <span className={styles.contentBox}>
                                    <TextField id="formNameInput" label="Display Name" type="text" variant="outlined" size="small" value={nameInput} required={!sessData}
                                    onChange={(evt) => setNameInput(evt.target.value)}
                                    error={nameErrStatus >= 0}
                                    helperText={(nameErrStatus >= 0) ? NAME_INPUT_MESSAGES[nameErrStatus] : ' '} />
                                    <span className={styles.formSeparator} />
                                    <TextField id="formPassInput" label="Password" type="text" variant="outlined" size="small" value={passInput}
                                    style={{display: isPassEnabled ? 'inline-block' : 'none', float: 'right'}}
                                    onChange={(evt) => setPassInput(evt.target.value)}
                                    error={passErrStatus}
                                    helperText={passErrStatus ? PASS_INPUT_MESSAGE : ' '} />
                            </span>
                            <div className={styles.formSeparator} />
                            <span className={styles.contentBox}>
                                <div style={{fontSize: '16px', fontWeight: '500'}}>
                                    <b>Name: </b> {props.rowData[0]}
                                    <br />
                                    <b>Host: </b> {props.rowData[1]}
                                    <br />
                                    <b>Users: </b> {`${props.rowData[2].userCountCurr}/${props.rowData[2].userCountMax}`}
                                </div>
                            </span>
                        </div>
                        <div className="modal-footer">
                            <Button variant="secondary" onClick={() => $('#joinRoomModal').modal('hide')}>
                                Cancel
                            </Button>
                            <Button id="joinButton" variant="primary" type="submit"
                              disabled={isRoomFull}
                              title={isRoomFull ? "This room is full!" : ""}
                              onClick={async () => {
                                const inputNameTest = handleInputName(nameInput).indexOf(true);
                                const inputPassOK = handleInputPass(isPassEnabled, passInput, props.rowData[3]);

                                if ((inputNameTest === -1 || (inputNameTest === 0 && sessData)) && inputPassOK) {
                                    const chosenId = props.sessData ? props.sessData._id : utils.genUniqueId();
                                    const dispName = nameInput;
                                    const realName = props.sessData ? props.sessData.username : "";
                                    await utils.addRoomUser(realName, dispName || realName, chosenId, props.rowData[4]);
                                    await utils.createRoomSession(props.rowData[4], chosenId);
                                    window.location.pathname += `/${props.rowData[4]}`;
                                    return;
                                }
                                setNameErrStatus(sessData ? (inputNameTest === 0 ? -1 : inputNameTest) : inputNameTest);
                                setPassErrStatus(!inputPassOK);
                            }}>
                                Join
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}

export default JoinRoomModal;