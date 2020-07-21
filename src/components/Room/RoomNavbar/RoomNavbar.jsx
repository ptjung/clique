import React, { useState } from 'react';
import styles from './RoomNavbar.module.css';
import cx from 'classnames';

function RoomNavbar(props) {
    const [queryInput, setQueryInput] = useState("");

    return (
        <nav className={cx("navbar navbar-expand-lg navbar-light shadow-sm bg-light rounded", styles.roomBar)}>
            <div id="roomBarContainer" className={styles.roomBarContainer}>
                <div className={styles.roomBarContent}>
                    <div className={styles.navLeft}>
                        <a href="/" className={styles.unselectable}>
                            <span className={styles.bIcon}>
                                <img src="/brand.png" className={styles.unselectable} height="36" alt="Clique"
                                draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                            </span>
                        </a>
                    </div>
                    <div className={cx(styles.navCenter, styles.barWrapper)}>
                        <div className={cx(styles.barInputGroup, "input-group input-group-sm")}>
                            <input placeholder="Search" aria-label="Search" className={cx(styles.searchForm, "form-control")} onKeyPress={(evt) => {
                                if (evt.which === 13 || evt.keyCode === 13) {
                                    props.searchHandler(queryInput);
                                }
                            }}
                            onChange={(evt) => setQueryInput(evt.target.value)} />
                            <div className={"input-group-append"}>
                                <button type="button" className={cx(styles.searchButton, "btn btn-light")} onClick={() => props.searchHandler(queryInput)}>
                                    <img src="/widget_ico_search.png" className={styles.unselectable} height="14" alt="Search"
                                    draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* <div className={styles.navRight} /> */}
                </div>
            </div>
        </nav>
    )
}

export default RoomNavbar;