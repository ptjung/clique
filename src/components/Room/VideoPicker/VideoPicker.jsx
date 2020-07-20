import React, { useEffect, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import VideoCard from './VideoCard/VideoCard';
import styles from './VideoPicker.module.css';
import axios from 'axios';
import cx from 'classnames';

function VideoPicker(props) {
    const [videoCards, setVideoCards] = useState([]);

    const handleCardClick = (paramVideoId) => {
        props.clickHandler(paramVideoId);
    }

    useEffect(() => {
        const updatedVideoCards = [];
        props.videoResults.forEach(videoResult => {
            try {
                const resVideoId = videoResult.id.videoId;
                const resVideoName = videoResult.snippet.title;
                const resChannelName = videoResult.snippet.channelTitle;
                const resVideoThumb = videoResult.snippet.thumbnails.medium.url;
                updatedVideoCards.push(
                    <VideoCard
                      key={resVideoId}
                      videoId={resVideoId}
                      videoName={resVideoName}
                      channelName={resChannelName}
                      videoThumb={resVideoThumb}
                      clickHandler={handleCardClick}
                    />
                );
            }
            catch (err) {}
        });
        setVideoCards(updatedVideoCards);
    }, [props.videoResults])

    return (
        <ul className={styles.videoPicker}>
            {videoCards}
        </ul>
    )
}

export default VideoPicker;