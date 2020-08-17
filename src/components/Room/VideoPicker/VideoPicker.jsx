import React, { useEffect, useState } from 'react';
import VideoCard from './VideoCard/VideoCard';
import styles from './VideoPicker.module.css';

function VideoPicker(props) {
    const [searched, setSearched] = useState(false);
    const [videoCards, setVideoCards] = useState([]);

    const handleCardClick = (paramVideoId) => {
        props.clickHandler(paramVideoId);
    }

    useEffect(() => {
        const updatedVideoCards = [];
        if (props.videoResults.length > 0) {
            setSearched(true);
        }
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
        <>
            {(videoCards.length > 0) ?
            (<ul className={styles.videoPicker}>
                {videoCards}
            </ul>)
            :
            (<ul className={styles.videoPicker}>
                <div className={styles.emptyCaption}>
                    {!searched ? "Search results will display here." : ""}
                </div>
            </ul>)
            }
        </>
    )
}

export default VideoPicker;