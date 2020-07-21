import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './ChatMessage.module.css';
import axios from 'axios';
import cx from 'classnames';

function ChatMessage(props) {
    const [content, setContent] = useState("");
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

    const formatBold = (paramMessage) => {
        let messageArr = [];
        let paramMessageArr = (" " + paramMessage).split('*');
        paramMessageArr[0] = paramMessageArr[0].substring(1);

        for (let partInd = 0; partInd < paramMessageArr.length; partInd++) {
            if (partInd % 2 === 1) {
                messageArr.push(<b key={partInd}>{paramMessageArr[partInd]}</b>);
            }
            else {
                messageArr.push(<span key={partInd}>{paramMessageArr[partInd]}</span>);
            }
        }
        return messageArr;
    }

    useEffect(() => {
        setContent(props.content.trim().substring(0, MAX_CONTENT_LENGTH));
    }, [props.content]);

    return (
        <div className={styles.chatMsgBox} style={{backgroundColor: `${props.notice ? "#f9f2f2" : "#f2f2f9"}`}}>
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
                {props.notice ? formatBold(content) : content}
            </div>
        </div>
    )
}

export default ChatMessage;