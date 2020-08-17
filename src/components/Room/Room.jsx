import React, { useEffect, useState, useRef, useCallback } from 'react';
import RoomNavbar from './RoomNavbar/RoomNavbar';
import VideoPicker from './VideoPicker/VideoPicker';
import VideoPlayer from './VideoPlayer/VideoPlayer';
import RoomChatFooter from './RoomChatFooter/RoomChatFooter';
import Footer from '../Footer/Footer';
import queryString from 'query-string';
import urlChecker from 'is-url';
import styles from './Room.module.css';
import axios from 'axios';
import io from "socket.io-client";
import { JOIN_ROOM, REQ_VIDEO, END_VIDEO, SET_VID, SEND_MSG, SET_MSGS, UPD_MSGS, GET_VTIME, SET_VTIME, NAV_VTIME, GET_USERS, SET_PLAY, SEND_NTCE } from '../../Constants';



function Room(props) {

    /* === States & Constants === */
    const roomSocket = useRef(null);
    const [startTime, setStartTime] = useState(0);
    const [skipTime, setSkipTime] = useState(0);
    const [currVideoTime, setCurrVideoTime] = useState(0);
    const [roomUserCount, setRoomUserCount] = useState(0);
    const [offsetExecTime, setOffsetExecTime] = useState((new Date()).getTime());
    const [roomVideo, setRoomVideo] = useState("");
    const [userMetadata, setUserMetadata] = useState({});
    const [playVideo, setPlayVideo] = useState(false);
    const [isUserAllowed, setIsUserAllowed] = useState(false);
    const [videoResults, setVideoResults] = useState([]);
    const [msgList, setMsgList] = useState([]);
    const INITIAL_VIDEO_ID = "e2qG5uwDCW4";
    const MAX_CHAT_MESSAGES = 100;

    /*
    This function appends a message to the message list, simulating a "send".
    */
    const sendMessage = (paramSenderDisp, paramSenderReal, paramSenderIsOwner, paramContent, paramMsgList) => {
        const newMsgTime = new Date();
        const newMsgNode = {
            notice: false,
            content: paramContent,
            key: newMsgTime.getTime(),
            senderDisp: paramSenderDisp,
            senderReal: paramSenderReal,
            senderIsOwner: paramSenderIsOwner,
            timestamp: [newMsgTime.getHours(), newMsgTime.getMinutes(), newMsgTime.getSeconds()]
        };
        
        // <ChatMessage senderDisp={paramSenderDisp} senderReal={paramSenderReal} senderIsOwner={paramSenderIsOwner} content={paramContent} timestamp={newMsgTime} key={newMsgTime.getTime()} />;
        appendMsgNode(newMsgNode, paramMsgList);
    }

    /*
    This function appends a notice to the message list, simulating a "send".
    */
    const sendNotice = (paramContent, paramMsgList) => {
        const newNoticeTime = new Date();
        const newNoticeNode = {
            notice: true,
            content: paramContent,
            key: newNoticeTime.getTime()
        };
        
        // <ChatMessage notice={true} content={paramContent} key={newNoticeTime.getTime()} />;
        appendMsgNode(newNoticeNode, paramMsgList);
    }

    /*
    This callback function appends a message node to the message list, while keeping the maximum chat messages.
    */
    const appendMsgNode = (paramNode, paramMsgList) => {
        let newMsgList = paramMsgList;
        if (newMsgList.length >= MAX_CHAT_MESSAGES) {
            newMsgList.shift();
        }
        newMsgList = newMsgList.concat([paramNode]);
        roomSocket.current.emit(UPD_MSGS, { newMsgList: newMsgList });
        setMsgList(newMsgList);
    }
    
    /*
    This function automatically handles browser unloading of the Room.
    */
    window.onbeforeunload = () => {
        roomSocket.current.close();
    }

    /*
    This function tracks the current time of the played video.
    */
    const handleTimeTrack = (paramCurrVideoTime) => {
        // console.log("Room: " + paramCurrVideoTime + ", currently (but untrust): " + currVideoTime);
        setCurrVideoTime(paramCurrVideoTime);
    }

    /*
    This function tracks the playing state of the video frame. Expects a boolean value for whether the video is being played.
    */
    const handlePlayTrack = (paramPlayVideo) => {
        setPlayVideo(paramPlayVideo);
    }

    /*
    This function tracks any skips which occur in the socket. Expects a parameter being a value between 0 and the video's length.
    */
    const handleSkipTrack = (paramSkipTime) => {
        // console.log("Room > Skip to: " + paramSkipTime)
        setSkipTime(paramSkipTime);
    }

    /*
    This function handles the end of a video and reproduces the ending throughout the entire socket. Expects a parameter value being the video's length.
    */
    const handleVideoEnd = (paramEndTime) => {
        roomSocket.current.emit(END_VIDEO, {
            endTime: paramEndTime
        });
    }

    /*
    This function handles a click of a video card, playing that selected video for all others in the socket.
    */
    const handleCardClick = (paramVideoId) => {
        roomSocket.current.emit(REQ_VIDEO, { query: paramVideoId });
        window.scrollTo(0, 0);
    }

    /*
    This function handles a sent message from one client, which is then sent to all others in the socket.
    */
    const handleSendMsg = (paramSenderDisp, paramSenderReal, paramSenderIsOwner, paramContent) => {
        roomSocket.current.emit(SEND_MSG, { senderDisp: paramSenderDisp, senderReal: paramSenderReal, senderIsOwner: paramSenderIsOwner, msgContent: paramContent, currMsgList: msgList });
    }

    /*
    This function tracks search bar states from the child RoomNavbar and delivers them here to handle.
    Also handles the search bar query ("queryInput") from the user ("userMetadata"), emitting the video to all socket users.
    */
    const handleNavbarInput = async (paramQueryInput) => {
        paramQueryInput = paramQueryInput.trim();
        
        if (paramQueryInput) {

            // Extract URL if possible
            let urlExtractor = document.createElement('a');
            urlExtractor.href = paramQueryInput;
            const inputHostnameParts = urlExtractor.hostname.split('.');
            const inputQueryParameters = queryString.parse(urlExtractor.search);
            // console.log(urlChecker(paramQueryInput) + ":" + inputHostnameParts.includes('youtube') + ":" + inputQueryParameters.v);

            if (urlChecker(paramQueryInput) && inputHostnameParts.includes('youtube') && inputQueryParameters.v) {
                // Using a trick with sourcing video ID thumbnail to check if the ID is valid (credits: tonY1883)
                var img = new Image();
                img.src = "http://img.youtube.com/vi/" + inputQueryParameters.v + "/mqdefault.jpg";
                img.onload = () => {
                    if (img.width !== 120) {
                        // REQ_VIDEO for every YouTube direct link query
                        roomSocket.current.emit(REQ_VIDEO, { query: inputQueryParameters.v });
                    }
                    else if (inputQueryParameters.v) {
                        // On invalid video queries (query is also case-sensitive here)
                        getYTQuerySearch(inputQueryParameters.v);
                    }
                }
            }
            else {
                // Youtube API: GET request for search with query 
                getYTQuerySearch(paramQueryInput);
            }
        }
        else {
            setVideoResults([]);
        }
    }

    /*
    This function asynchronously requests the YouTube search of some query input, setting the video results of Room if possible.
    */
    const getYTQuerySearch = async (paramQueryInput, proxy = 'https://cors-anywhere.herokuapp.com/') => {
        await axios.get(proxy + 'https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: process.env.REACT_APP_YT_SECRET,
                q: paramQueryInput,
                maxResults: 50,
                part: 'snippet',
                type: 'video',
                videoEmbeddable: 'true'
            }})
            .then(res => {
                if (res.data && res.data.items) {
                    const searchResultsArr = res.data.items;
                    setVideoResults(searchResultsArr);
                }
            })
            .catch(err => {
                // console.log(err);
            });
    }

    /*
    This callback function handles the events of the initial socket.
    */
    const handleSocket = useCallback((socket, creds) => {
        roomSocket.current = socket;

        socket.on('connect', async () => {

            setOffsetExecTime((new Date()).getTime());

            let realName = "";
            let dispName = "";
            let isOwner = false;
            await axios.post(process.env.REACT_APP_API_URL + "/api/rooms/userinfo", {roomCode: creds.roomCode, userId: creds.userId})
                .then(resUserObject => {
                    if (resUserObject && resUserObject.data) {
                        realName = resUserObject.data.realName;
                        dispName = resUserObject.data.dispName;
                        isOwner = resUserObject.data.isOwner;
                    }
                })
                .catch(err => {
                    // console.log(err);
                });
            setUserMetadata({realName: realName, dispName: dispName, isOwner: isOwner});

            if (dispName) {
                // Somebody joined the room; has a real name, display name, and some privileges
                socket.emit(JOIN_ROOM, {
                    roomId: creds.roomCode,
                    userId: creds.userId,
                    realName: realName,
                    dispName: dispName,
                    isOwner: isOwner
                });
                socket.emit(GET_USERS);
                socket.emit(SEND_NTCE, { msgContent: `*${dispName + (realName ? (" (" + realName + ")") : "")}* has joined the room.` });
            }
            else {
                // Return to /rooms if anonymous (i.e. this person does not have a cookie)
                window.location.pathname = "/rooms";
            }
        });

        socket.on(END_VIDEO, (data) => {
            setSkipTime(data.endTime);
        });

        socket.on(SET_VID, (data) => {
            if (data.respVideo) {
                setRoomVideo(data.respVideo);
            }
            if (data.respVideoTime) {
                setStartTime(data.respVideoTime);
            }
        });

        socket.on(GET_USERS, (data) => {
            if (data.userCount) {
                // console.log("User Count: " + data.userCount);
                setRoomUserCount(data.userCount);
            }
        });

        socket.on(SET_PLAY, (data) => {
            if (data.playVideo !== undefined) {
                setPlayVideo(data.playVideo);
            }
        });

        socket.on(NAV_VTIME, (data) => {
            if (data.newTime !== undefined) {
                // console.log("Room > NAV_VTIME (recv): newTime = " + data.newTime);
                setSkipTime(data.newTime);
            }
        });

        socket.on(SEND_MSG, (data) => {
            sendMessage(data.senderDisp, data.senderReal, data.senderIsOwner, data.msgContent, data.currMsgList);
        });

        socket.on(SEND_NTCE, (data) => {
            sendNotice(data.msgContent, data.currMsgList);
        });

        socket.on(SET_MSGS, (data) => {
            setMsgList(data.currMsgList ? data.currMsgList : []);
        });
    }, [props.room.match.params.code]);

    /*
    This useEffect function is called at the start, initializing the Room's video ID and the component is re-rendered.
    */
    useEffect(() => {
        if (!roomVideo) {
            // Initialize a playing video if the Room does not contain a video yet
            // console.log("Room > setRoomVideo: videoId = " + (roomSocket.current ? roomSocket.current.videoId : INITIAL_VIDEO_ID));
            setRoomVideo(roomSocket.current ? roomSocket.current.videoId : INITIAL_VIDEO_ID);
        }
    }, [roomVideo]);

    /*
    This useEffect function is called when the time navigation bar is interacted with; socket video time will then be changed.
    */
    useEffect(() => {
        const socket = roomSocket.current || io(process.env.REACT_APP_API_URL);
        // console.log("Room > NAV_VTIME (sent): newTime = " + skipTime);
        socket.emit(NAV_VTIME, {
            newTime: skipTime
        });
    }, [skipTime]);

    /*
    This useEffect function updates sets the current video time in the server every time it is updated here.
    */
    useEffect(() => {
        const socket = roomSocket.current || io(process.env.REACT_APP_API_URL);
        socket.off(GET_VTIME);
        socket.on(GET_VTIME, () => {
            // console.log("Room > GET_VTIME: currVideoTime = " + currVideoTime);
            socket.emit(SET_VTIME, {
                currVideoTime: currVideoTime
            });
        });
    }, [currVideoTime]);

    /*
    This useEffect function runs the "playVideo" state throughout the entire socket.
    */
    useEffect(() => {
        const socket = roomSocket.current || io(process.env.REACT_APP_API_URL);
        socket.emit(SET_PLAY, {
            playVideo: playVideo
        });
    }, [playVideo]);

    /*
    This useEffect function is called at the start, handling passed properties into the Room, setting up the socket, and validating the user session.
    */
    useEffect(() => {
        
        const setupRoom = async () => {
            // Room Token Verification & Handling
            const resRoomSession = await axios.post(process.env.REACT_APP_API_URL + "/api/users/roomauth/verify");
            const foundRoomCode = props.room.match.params.code || "";
            if (!resRoomSession.data || !foundRoomCode || (resRoomSession.data.roomCode !== foundRoomCode)) {
                window.location.href = "/";
                return;
            }
            
            // ID -> User Properties
            const foundSessId = resRoomSession.data.id || "";
            // console.log({roomCode: foundRoomCode, userId: foundSessId, realName: realName, dispName: dispName, isOwner: isOwner});

            // Socket.IO Implementation
            const socket = io(process.env.REACT_APP_API_URL) || roomSocket.current;
            handleSocket(socket, {roomCode: foundRoomCode, userId: foundSessId});
            setIsUserAllowed(true);
        }
        setupRoom();

    }, [handleSocket, props.room.match.params.code]);

    /*
    This return function simulates the entire room: a sticky video "search bar", "video player", "room chat", and "user list" are all created sub-components which make up this page.
    */
    return (
        <>
            {isUserAllowed ?
            <>
                <RoomNavbar searchHandler={handleNavbarInput} />
                <div className={styles.videoPlayerWrapper}>
                    <div className={styles.videoPlayer}>
                        <VideoPlayer
                          videoId={roomVideo}
                          isPlaying={playVideo}
                          offsetExecTime={offsetExecTime}
                          startTime={startTime}
                          skipTime={skipTime}
                          userCount={roomUserCount}
                          timeHandler={handleTimeTrack}
                          playHandler={handlePlayTrack}
                          skipHandler={handleSkipTrack}
                          endObserver={handleVideoEnd}
                        />
                    </div>
                </div>
                <div className={styles.pickerContainer}>
                    <VideoPicker videoResults={videoResults} clickHandler={handleCardClick} />
                </div>
                <Footer />
                <RoomChatFooter userMetadata={userMetadata} msgList={msgList} handleSendMsg={handleSendMsg} />
            </>
            :
            <div />}
        </>
    )
}

export default Room;