import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './ChatMessage.module.css';
import axios from 'axios';
import cx from 'classnames';

function ChatMessage(props) {
    const MAX_CONTENT_LENGTH = 256;

    const padStart = (paramString, paramChar, paramMaxLen) => {
        // padStart: IE (all versions) compatibility
        let padding = "";
        for (let charCount = 0; charCount < (paramMaxLen - paramString.length); charCount++) {
            padding += paramChar;
        }
        return padding + paramString;
    }

    const getTimeStamp = (paramDateArr) => {
        return paramDateArr.map(intvl => padStart(`${intvl}`, '0', 2)).join(':');
    }

    return (
        <div className={styles.chatMsgBox}>
            {!props.notice ?
            <div className={styles.chatMsgHeader}>
                <span title={`${props.senderDisp}${props.senderReal ? (' (' + props.senderReal + ')') : ''}`} style={{color: `${props.senderIsOwner ? '#a00' : 'black'}`}}>
                    {props.senderDisp}
                </span>
                <span className={styles.chatMsgTimestamp}>
                    {getTimeStamp(props.timestamp)}
                </span>
            </div>
            :
            <div />}
            <div className={styles.chatMsgContent}>
                {props.content.trim().substring(0, MAX_CONTENT_LENGTH)}
            </div>
        </div>
    )
}

export default ChatMessage;