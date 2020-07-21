import React, { useEffect, useState } from 'react';
import ChatMessage from './ChatMessage/ChatMessage';
import styles from './ChatBox.module.css';
import cx from 'classnames';

function ChatBox(props) {
    const [dispName, setDispName] = useState("");
    const [realName, setRealName] = useState("");
    const [ownerPriv, setOwnerPriv] = useState(false);
    const [chatInput, setChatInput] = useState("");

    const sendToBottom = () => {
        const msgBoxNode = document.getElementById("msgBoxScrollable");
        if (msgBoxNode) {
            // Upon adding a message to the message list, scroll to the bottom after all updates (i.e. current chat)
            setTimeout(() => {
                msgBoxNode.scrollTop = msgBoxNode.scrollHeight
            }, 1);
        }
    }

    const handleSend = () => {
        // console.log(`ChatBox > "${dispName || "Anonymous"}", "${realName}", "${ownerPriv}"`);
        if (chatInput) {
            props.handleSendMsg(dispName || "Anonymous", realName, ownerPriv, chatInput);
            setChatInput("");
        }
    }

    const renderObjsAsNodes = (paramObjArr) => {
        const chatNodeList = [];
        for (let chatObj of paramObjArr) {
            let newNode = {};

            if (chatObj.notice) {
                newNode = <ChatMessage notice={true} key={chatObj.key} content={chatObj.content} />;
            }
            else {
                newNode = <ChatMessage notice={false} key={chatObj.key} content={chatObj.content} senderDisp={chatObj.senderDisp} senderReal={chatObj.senderReal} senderIsOwner={chatObj.senderIsOwner} timestamp={chatObj.timestamp} />;
            }

            chatNodeList.push(newNode);
        }
        return chatNodeList;
    }

    useEffect(() => {
        sendToBottom();
    }, [props.display, props.msgList]);

    useEffect(() => {
        setDispName(props.userMetadata.dispName || dispName);
        setRealName(props.userMetadata.realName || realName);
        setOwnerPriv(props.userMetadata.isOwner || ownerPriv);
    }, [props.userMetadata]);

    return (
        <>
            {props.display ?
            <div className={styles.chatBox}>
                <div className={styles.chatRoomContainer}>
                    <div id="msgBoxScrollable" className={styles.msgBoxContainer}>
                        {renderObjsAsNodes(props.msgList)}
                    </div>
                </div>
                <div className={styles.msgWidgContainer}>
                    <input placeholder="Message" aria-label="Message" className={cx(styles.chatForm, "form-control")} onKeyPress={(evt) => {
                        if (evt.which === 13 || evt.keyCode === 13) {
                            handleSend();
                        }
                    }}
                    onChange={(evt) => setChatInput(evt.target.value)} value={chatInput} />
                    <div className={cx(styles.sendButtonWrapper, "input-group-append")}>
                        <button type="button" className={cx(styles.sendButton, "btn btn-light")} onClick={() => handleSend()}>
                            &#x276F;
                        </button>
                    </div>
                </div>
            </div>
            :
            <div />}
        </>
    )
}

export default ChatBox;