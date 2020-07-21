import React from 'react';
import { Card } from 'react-bootstrap';
import styles from './VideoCard.module.css';
import cx from 'classnames';

function VideoCard(props) {

    return (
        <Card className={cx(styles.videoCard, styles.unselectable)} onClick={() => props.clickHandler(props.videoId)} title={props.videoName}>
            <Card.Img className={styles.unselectable} variant="top" src={props.videoThumb} />
            <Card.Body className={styles.videoTitleWrapper}>
                <Card.Text className={styles.videoTitleText}>
                    {props.videoName}
                </Card.Text>
            </Card.Body>
            <Card.Text className={styles.videoAuthorText}>
                {props.channelName}
            </Card.Text>
        </Card>
    )
}

export default VideoCard;