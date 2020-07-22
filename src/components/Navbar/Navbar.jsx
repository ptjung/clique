import React, { useState, useEffect } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import styles from './Navbar.module.css';
import utils from '../utils';
import cx from 'classnames';
import axios from 'axios';

function Navbar() {
    const [userCaption, setUserCaption] = useState("");
    const [buttonsReady, setButtonsReady] = useState(false);

    useEffect(() => {
        async function setupNavbar() {
            let resSession = await utils.getSession();
            if (resSession && resSession.data) {
                setUserCaption(resSession.data.username);
            }
            setButtonsReady(true);
        }
        setupNavbar();
    });

    return (

        <nav className={cx("navbar navbar-expand-lg navbar-light shadow-sm bg-light rounded", styles.navbar)}>
            <div id="navbarContainer" className={styles.navbarContainer}>
                <div className={styles.navLeft}>
                    <a href="/" className={styles.unselectable}>
                        <span className={styles.bIcon}>
                            <img src="/brand.png" className={styles.unselectable} height="36" alt="Clique"
                            draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                        </span>
                    </a>
                    <span className={styles.navIconSeparator} />
                    <Button href="/" variant="light" className={cx(styles.capsule, styles.unselectable, styles.bWebsite)}>
                        Home
                    </Button>
                    <span className={styles.navSeparator} />
                    <Button href="/rooms" variant="light" className={cx(styles.capsule, styles.unselectable, styles.bWebsite)}>
                        Rooms
                    </Button>
                </div>
                
                <div className={styles.navRight}>
                    {!buttonsReady ?
                    <>
                        <div className={cx(styles.capsule, styles.unselectable, styles.delayed)} />
                        <span className={styles.navSeparator} />
                        <div className={cx(styles.capsule, styles.unselectable, styles.delayed)} />
                    </>
                    :
                    <>
                        {!userCaption ?
                        <>
                            <Button href="/login" variant="outline-primary" className={cx(styles.capsule, styles.unselectable, styles.bLogin)}>
                                Log in
                            </Button>
                            <span className={styles.navSeparator} />
                            <Button href="/signup" variant="primary" className={cx(styles.capsule, styles.unselectable, styles.bSignUp)}>
                                Sign up
                            </Button>
                        </>
                        :
                        <>
                            <span className={styles.unselectable}>
                                {userCaption}
                            </span>
                            <span style={{padding: '0 2px'}} />
                            <Dropdown>
                                <Dropdown.Toggle variant="light" className={cx(styles.sqButton, styles.unselectable)}>
                                    &#11206;
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={async () => {
                                        await axios.post(process.env.REACT_APP_API_URL + "/api/users/auth/clear");
                                        window.location.reload();
                                    }}>
                                        Sign Out
                                    </Dropdown.Item>
                                    <Dropdown.Item style={{color: '#c00'}} onClick={async () => {
                                        await axios.post(process.env.REACT_APP_API_URL + "/api/users/delete", {username: userCaption});
                                        await axios.post(process.env.REACT_APP_API_URL + "/api/users/auth/clear");
                                        window.location.reload();
                                    }}>
                                        Delete Account
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </>
                        }
                    </>
                    }
                </div>
            </div>
        </nav>

    )
}

export default Navbar;