import React, { useEffect, useState, useRef } from 'react';
import { ProgressBar } from 'react-bootstrap';
import YouTube from 'react-youtube';
import { V_UNSTARTED, V_END, V_PLAY, V_PAUSE, V_BUFFER, V_CUE } from './VideoStates';
import styles from './VideoPlayer.module.css';
import cx from 'classnames';

function VideoPlayer(props) {
    const playerTarget = useRef(null);
    const [playerState, setPlayerState] = useState(-1);
    const [currVideoDuration, setCurrVideoDuration] = useState(0);
    const [maxVideoDuration, setMaxVideoDuration] = useState(0);
    const [intervalId, setIntervalId] = useState(0);
    const [volScroll, setVolScroll] = useState(false);
    const [currPlaying, setCurrPlaying] = useState(false);
    const [execOnStart, setExecOnStart] = useState(true);

    const [volScrollMaxWidth, iconPlay, iconPause, videoOptions] = [72, '\u25b6', '\u275a\u275a', {
        height: '488',
        width: `800`,
        playerVars: {
            origin: `${window.location.protocol}//${window.location.host}`,
            enablejsapi: 1,
            disablekb: 1,
            rel: 0,
            controls: 0,
            modestbranding: 1
        },
    }];

    const modifyPlayState = (paramPlayState) => {
        setCurrPlaying(paramPlayState);
        props.playHandler(paramPlayState);
    }

    const restartVideo = () => {
        setCurrVideoDuration(0);
        modifyPlayState(true);
        playerTarget.current.playVideo();
    }

    const execNewInterval = () => {
        return setInterval(() => {
            const currVideoTime = playerTarget.current.getCurrentTime();
            setCurrVideoDuration(currVideoTime);
            props.timeHandler(currVideoTime);
        }, 100);
    };

    const putFullScreen = () => {
        playerTarget.current.getIframe().requestFullscreen();
    }

    const padStart = (paramString, paramChar, paramMaxLen) => {
        // padStart: IE (all versions) compatibility
        let padding = "";
        for (let charCount = 0; charCount < (paramMaxLen - paramString.length); charCount++) {
            padding += paramChar;
        }
        return padding + paramString;
    }

    const encodeAsDigitTime = (paramSeconds, periodScale = [24, 60, 60]) => {
        let encodedTime = [];
        let timeUseZeros = false;
        let maxInterval = periodScale.reduce((a, b) => a * b);
        for (let intervalScale of periodScale) {
            const remainSeconds = paramSeconds % maxInterval;
            const timeThisScale = paramSeconds - remainSeconds;
            if (timeUseZeros) {
                encodedTime.push(padStart(`${timeThisScale / maxInterval}`, '0', 2));
            }
            else if (timeThisScale) {
                timeUseZeros = true;
                encodedTime.push(`${timeThisScale / maxInterval}`);
            }
            paramSeconds = remainSeconds;
            maxInterval /= intervalScale;
        }
        if (!encodedTime.length) {
            encodedTime.push('0');
        }
        encodedTime.push(padStart(`${(paramSeconds - paramSeconds % maxInterval) / maxInterval}`, '0', 2));
        return encodedTime.join(':');
    }

    const skipToTime = (paramDuration) => {
        // console.log("Player > paramDuration = " + paramDuration);
        clearInterval(intervalId);
        setCurrVideoDuration(paramDuration);
        playerTarget.current.seekTo(paramDuration, true);
    }

    const handleTimeNavClick = (evt) => {
        const timeNavRefProps = evt.currentTarget.getBoundingClientRect();
        const newCurrDuration = maxVideoDuration * Math.min(Math.max((evt.clientX - timeNavRefProps.left) / (timeNavRefProps.right - timeNavRefProps.left), 0), 1);
        // skipToTime(newCurrDuration);
        props.skipHandler(newCurrDuration);
    };

    const handleVolumeKnobDrag = (evt) => {
        if (playerTarget.current) {
            const volumeKnobNode = document.querySelector("#volumeKnob");
            const volumeBarNode = document.querySelector("#volumeScrBar");
            const volumeBarProps = volumeBarNode.getBoundingClientRect();

            const posAdjustment = Math.min(Math.max(evt.clientX - volumeBarProps.left, 0), volScrollMaxWidth);
            volumeKnobNode.style.left = `${posAdjustment - 6}px`;
            volumeBarNode.style.width = `${posAdjustment}px`;
            playerTarget.current.setVolume(100 * posAdjustment / volScrollMaxWidth);
        }
    };

    const handleFrameReady = (evt) => {
        // Note to self: I may need to set more references to playerTarget later; one video had it not updating
        playerTarget.current = evt.target;
        modifyPlayState(true);
        // console.log("Player > Initialized");
    };

    const handleStateChange = (evt) => {
        const newPlayerState = evt.data;
        // console.log("Player > State: " + playerState + " => " + newPlayerState + ", Playing: " + currPlaying);

        switch (newPlayerState) {
            case V_PLAY:
                setIntervalId(execNewInterval());
                setMaxVideoDuration(evt.target.getDuration());
                if (!currPlaying) {
                    // Illegal screen interaction
                    evt.target.pauseVideo();
                }
                break;
            case V_PAUSE:
                clearInterval(intervalId);
                if (playerState === V_END) {
                    // Play button's end screen interaction
                    restartVideo();
                }
                else if (currPlaying) {
                    // Illegal screen interaction
                    evt.target.playVideo();
                }
                break;
            case V_END:
                clearInterval(intervalId);
                modifyPlayState(false);
                setCurrVideoDuration(maxVideoDuration);
                props.endObserver(maxVideoDuration);
                break;
            case V_BUFFER:
                clearInterval(intervalId);
                break;
            case V_CUE:
                break;
            case V_UNSTARTED:
                if (!currPlaying) {
                    // Playing searched video after pausing/ending another
                    restartVideo();
                }
                else {
                    // Initializing video upon starting (includes seeking to the current video time and pausing if needed)
                    evt.target.playVideo();
                    if (execOnStart && (props.userCount > 1)) {
                        // Execute "onStart" event for multiple user rooms
                        const fallbackNoStart = setInterval(() => {
                            if (evt.target.getPlayerState() === V_PLAY) {
                                evt.target.seekTo(props.startTime + ((new Date()).getTime() - props.offsetExecTime) / 1000, true);
                                setExecOnStart(false);
                                clearInterval(fallbackNoStart);
                            }
                        }, 100);
                    }
                    else if (props.userCount === 1) {
                        // Already executed the "onStart" event for single user rooms
                        setExecOnStart(false);
                    }
                    // console.log("Player > startTime = " + props.startTime);
                }
                break;
            default:
                return;
        }

        evt.target.setLoop(false);
        setPlayerState(newPlayerState);
    };

    useEffect(() => {
        setCurrPlaying(props.isPlaying);
    }, [props.isPlaying]);

    useEffect(() => {
        // console.log("Player > playerTarget.current = " + playerTarget.current);
        if (playerTarget.current) {
            const playState = currPlaying;
            // console.log("Player > playState = " + currPlaying);
            if (playState) {
                playerTarget.current.playVideo();
            }
            else {
                playerTarget.current.pauseVideo();
            }
        }
    }, [currPlaying]);

    useEffect(() => {
        if (props.skipTime) {
            skipToTime(props.skipTime);
        }
    }, [props.skipTime]);

    return (
        <div className={styles.videoWrapper}>
            <YouTube
              videoId={props.videoId}
              opts={videoOptions}
              onReady={(evt) => handleFrameReady(evt)}
              onStateChange={(evt) => handleStateChange(evt)}
            />
            <div className={cx(styles.controlsBar, styles.unselectable)}>
                <div className={styles.timeNavBar} onClick={(evt) => handleTimeNavClick(evt)}>
                    <ProgressBar className={styles.progressBar} variant="danger" now={currVideoDuration} max={maxVideoDuration} />
                </div>
                <button className={cx(styles.playButton, styles.playerWidget)} onClick={() => modifyPlayState(!currPlaying)}
                  style={{fontSize: (currPlaying ? '19' : '18') + 'px', paddingBottom: (currPlaying ? '0' : '1') + 'px'}}>
                    {currPlaying ? iconPause : iconPlay}
                </button>
                <div className={styles.volumeWidget}>
                    <button className={cx(styles.volumeButton, styles.playerWidget)} onClick={() => setVolScroll(!volScroll)}>
                        <div className={styles.volumeIcon} alt="Volume" draggable="false"
                          onContextMenu={(evt) => {evt.preventDefault()}} />
                    </button>
                    <div className={cx(styles.volumeScrollBarWrapper, styles.playerWidget)} style={{display: volScroll ? 'block' : 'none'}}>
                        <div className={styles.volumeScrollBarBg} />
                        <div id="volumeScrBar" className={styles.volumeScrollBar}
                          onClick={(evt) => handleVolumeKnobDrag(evt)} onMouseDown={(evt) => handleVolumeKnobDrag(evt)} />
                        <div id="volumeKnob" className={styles.volumeScrollBarKnob} draggable="true"
                          onDrag={(evt) => handleVolumeKnobDrag(evt)}
                          onDragEnd={(evt) => handleVolumeKnobDrag(evt)} />
                    </div>
                </div>
                <div className={cx(styles.timeCaption, styles.playerWidget)}>
                    {encodeAsDigitTime(currVideoDuration)} / {encodeAsDigitTime(maxVideoDuration)}
                </div>
                <button className={cx(styles.fullScreenButton, styles.playerWidget)} onClick={() => putFullScreen()}>
                    &#x26F6;
                </button>
            </div>
        </div>
    )
}

export default VideoPlayer;