import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import styles from './AboutBox.module.css';
import cx from 'classnames';

class AboutBox extends Component {
    render() {
        return (
            <nav>
                <div id="aboutboxContainer" className={styles.aboutboxContainer}>
                    <div className={styles.separatorTop}>
                        <img src="/brand_full.png" className={cx(styles.unselectable, styles.brand)} height="100" alt="Clique"
                        draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                    </div>
                    <div className={styles.separatorButtonTop}>  
                        <Button href="/rooms" variant="outline-dark" draggable="false" className={cx(styles.unselectable, styles.roomButton)}>
                            Start Watching
                        </Button>
                    </div>
                    <div>
                        <p style={{textAlign: 'justify'}}>
                            This is an application built for watching YouTube videos with your friends in real-time, and was heavily insired
                            by <b>Watch2Gether</b>. Some notable differences are the Room List, custom display names, the options that come
                            with creating rooms, and accounts.
                        </p>
                        <br />
                        <p style={{textAlign: 'justify'}}>
                            Clique is currently being worked on to support all latest versions of modern browsers. The backend is powered by
                            Node.js and Express.js, while the frontend uses the React library with Bootstrap. Mongoose interacts with MongoDB
                            Atlas to store room session and user data and real-time video interactions are made through Socket.IO. Finally,
                            jQuery is used to implement DataTables.
                        </p>
                        <br />
                        <div className={styles.logoSeries}>
                            <img src="/logo_mongodb.png" className={cx(styles.unselectable, styles.logo)}  alt="MongoDB" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                            <img src="/logo_expressjs.png" className={cx(styles.unselectable, styles.logo)}  alt="ExpressJS" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                            <img src="/logo_react.png" className={cx(styles.unselectable, styles.logo)}  alt="React" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                            <img src="/logo_nodejs.png" className={cx(styles.unselectable, styles.logo)}  alt="NodeJS" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                        </div>
                    </div>
                </div>
            </nav>
        )
    }
}

export default AboutBox;