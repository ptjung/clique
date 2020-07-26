import React from 'react';
import { Card } from 'react-bootstrap';
import styles from './VideoCard.module.css';
import cx from 'classnames';

function VideoCard(props) {
    const converterHTML = document.createElement("textarea");

    const extractHTML = (paramText) => {
        converterHTML.innerHTML = paramText;
        return converterHTML.value;
    }

    return (
        <Card className={cx(styles.videoCard, styles.unselectable)} onClick={() => props.clickHandler(props.videoId)} title={props.videoName}>
            <Card.Img className={styles.unselectable} variant="top" src={props.videoThumb} />
            <Card.Body className={styles.videoTitleWrapper}>
                <Card.Text className={styles.videoTitleText}>
                    {extractHTML(props.videoName)}
                </Card.Text>
            </Card.Body>
            <Card.Text className={styles.videoAuthorText}>
                {extractHTML(props.channelName)}
            </Card.Text>
        </Card>
    )
}

export default VideoCard;