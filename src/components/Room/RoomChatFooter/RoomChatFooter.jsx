import React, { useEffect, useState, useRef, useCallback } from 'react';
import ChatBox from './ChatBox/ChatBox';
import styles from './RoomChatFooter.module.css';
import axios from 'axios';
import cx from 'classnames';

function RoomChatFooter(props) {
    const [showChat, setShowChat] = useState(false);

    const handleSendMsg = (paramSenderDisp, paramSenderReal, paramSenderIsOwner, paramContent) => {
        props.handleSendMsg(paramSenderDisp, paramSenderReal, paramSenderIsOwner, paramContent);
    }

    return (
        <>
            <nav className={styles.chatBar}>
                <div className={styles.chatBarContainer}>
                    <div className={cx(styles.chatToggleIcon, styles.unselectable)} alt="Toggle chat" title="Toggle chat"
                      draggable="false" onContextMenu={(evt) => {evt.preventDefault()}} onClick={() => setShowChat(!showChat)} />
                    <ChatBox display={showChat} userMetadata={props.userMetadata} msgList={props.msgList} handleSendMsg={handleSendMsg} />
                </div>
            </nav>
        </>
    )
}

export default RoomChatFooter;