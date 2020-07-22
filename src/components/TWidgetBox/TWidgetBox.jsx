import React, { Component } from 'react';
import { Alert, Button, ButtonGroup } from 'react-bootstrap';
import CreateRoomButton from './CreateRoomButton/CreateRoomButton';
import JoinRoomModal from './JoinRoomModal/JoinRoomModal';
import styles from './TWidgetBox.module.css';
import utils from '../utils';
import cx from 'classnames';
import $ from 'jquery';
import 'datatables.net-responsive/js/dataTables.responsive';

/**
 * === Global Constants ===
 * ROW_EVENT_EXEC: jQuery event for executing the DataTable row's function
 * ALERT_LIFETIME: Duration of all alerts in milliseconds
 */
const ROW_EVENT_EXEC = "click";
const ALERT_LIFETIME = 5000;

/**
 * This function is customized to sort by the Users ratio of rows in the Rooms List DataTable
 * 
 * Computes ascended sorting in the following order:
 *     - Room Capacity (Maximum)
 *     - Room Capacity (Current)
 *     - Full Rooms
 * 
 * @param {String} x The first ratio, above the second, formatted "<current>/<max>" in user count
 * @param {String} y The second ratio, below the first, formatted "<current>/<max>" in user count
 * @return {number} The computed order as an integer
 */
function swapRatioElements(x, y) {

    // Parsing x, y data as respective arrays of [current, max]
    const xAsArray = x.split('/').map(function (num) { 
        return parseInt(num, 10); 
    });
    const yAsArray = y.split('/').map(function (num) { 
            return parseInt(num, 10); 
    });

    // Ascending order computation
    if (xAsArray[0] === xAsArray[1]) {
        // Full Room (tested: x/x, for some 'x')
        return -1;
    }
    else if (yAsArray[0] === yAsArray[1]) {
        // Full Room (tested: y/y, for some 'y')
        return 1;
    }
    else if (yAsArray[0] === xAsArray[0]) {
        // x, y have same current Room Capacity
        return yAsArray[1] > xAsArray[1] ? 1 : -1;
    }
    // x, y have different current Room Capacity
    return yAsArray[0] > xAsArray[0] ? 1 : -1;
}

/**
 * This function updates the Rooms DataTable by clearing it, then adds the contents from a new GET response
 * 
 * @param {boolean} isSuccessAlertOn Flag for alerting the website upon success
 */
function updateRoomTable(isSuccessAlertOn) {
    utils.getRoomsResponse().then(dataInJSON => {

        // Invalid input handling: alert the user in UI
        if (dataInJSON === undefined) {
            $('#failedAPICallAlert').show();
            $('#successAPICallAlert').hide();
            setTimeout(function(){ $('#failedAPICallAlert').hide() }, ALERT_LIFETIME);
            return;
        }
        else if (isSuccessAlertOn) {
            $('#successAPICallAlert').show();
            setTimeout(function(){ $('#successAPICallAlert').hide() }, ALERT_LIFETIME);
        }
        $('#failedAPICallAlert').hide();

        // Full table reset + unbinding if events are placed here
        let table = $('#roomTable').DataTable().clear();
        // $('#roomTable tbody').unbind(ROW_EVENT_EXEC);

        // For each database row, add it to the table
        Object.keys(dataInJSON).forEach(key => {
            let roomInJSON = dataInJSON[key];

            if (roomInJSON['users'] !== undefined) {
                // Event (table): append database row
                table.row.add([
                    roomInJSON['roomName'],
                    roomInJSON['roomHost'],
                    {'userCountCurr': roomInJSON['users'].length, 'userCountMax': roomInJSON['maxUsers']},
                    roomInJSON['roomPass'],
                    roomInJSON['roomCode']
                ]);
            }
            table.draw('false');
        });
    });
}

const SuccessAPICallAlert = () => {
    return (
        <Alert id="successAPICallAlert" variant="success" style={{display: 'none'}} onClose={() => $('#successAPICallAlert').hide()} dismissible>
            <p className={styles.unselectable}>
                Updated rooms have been successfully retrieved.
            </p>
        </Alert>
    )
}

const FailedAPICallAlert = () => {
    return (
        <Alert id="failedAPICallAlert" variant="danger" style={{display: 'none'}} onClose={() => $('#failedAPICallAlert').hide()} dismissible>
            <p className={styles.unselectable}>
                Failed to retrieve updated rooms via Clique API. Please try again later.
            </p>
        </Alert>
    )
}

class TWidgetBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: ["", "", {userCountCurr: 0, userCountMax: 0}, "", ""],
            sessData: {_id: "", username: "", email: "", exp: 0}
        };
    }

    componentDidMount() {
        $(document).ready(async () => {
            $.noConflict();
            
            // Sorting elements based on room user count (see: swapRatioElements())
            $.fn.dataTable.ext.oSort["userratio-asc"] = function (x, y) {
                return -swapRatioElements(x, y);
            }
            $.fn.dataTable.ext.oSort["userratio-desc"] = function (x, y) {
                return swapRatioElements(x, y);
            };

            // Form table with specific column constraints
            let table = $('#roomTable').DataTable({
                order: [],
                language: {
                    emptyTable: " "
                },
                columnDefs: [{
                    targets: [0, 1, 2],
                    className: styles.unselectable
                }, {
                    targets: 2,
                    searchable: false,
                    type: 'userratio',
                    render: function ( data, type, row, meta ) {
                        return `${data['userCountCurr']}/${data['userCountMax']}`;
                }}, {
                    targets: 3,
                    searchable: false,
                    className: styles.lock,
                    render: function ( data, type, row, meta ) {
                        return (data === '') ? '' : '<img src="/lock.png" className={styles.unselectable} alt="Locked" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />';
                }}]
            });
            updateRoomTable(false);

            // Modal permissions setup before row events
            const setupModalPerms = async () => {
                let resSession = await utils.getSession();
                if (resSession && resSession.data) {
                    this.setState({rowData: this.state.rowData, sessData: resSession.data});
                }
            }
            await setupModalPerms();

            // Rooms 'Row' button given click event; pass table data into state, re-rendering the shown modal
            // Note: here, a parameterized arrow function must be used; two scopes of 'this' are needed!
            $('#roomTable tbody').on(ROW_EVENT_EXEC, 'tr', (evt) => {
                let rowData = table.row(evt.target).data();
                if (rowData !== undefined) {
                    this.setState({rowData: rowData, sessData: this.state.sessData});
                    $('#joinRoomModal').modal('show');
                }
            });
            $('#roomTable tbody').css('cursor', 'pointer');
        });
    }
    
    render() {
        return (

            <div id="widboxContainer" className={styles.widboxContainer}>
                <JoinRoomModal rowData={this.state.rowData} sessData={this.state.sessData} />
                <div style={{height: '40px'}}>
                    <FailedAPICallAlert />
                    <SuccessAPICallAlert />
                </div>
                <div className={styles.separatorTop} />
                <span className={styles.widgetDivider}>
                    <h2 className={cx(styles.unselectable, styles.roomNameCaption)}>
                        Room List
                    </h2>
                    <div className={styles.captionSeparator} />
                    <ButtonGroup>
                        <Button variant="outline-dark" className={cx(styles.unselectable, styles.refreshButton)} id="tableRefreshButton" onClick={() => {
                            // 'Refresh' button given click event: attempt to get rooms with cooldown
                            updateRoomTable(true);

                            let pressedButton = document.getElementById('tableRefreshButton');
                            pressedButton.disabled = true;
                            window.setTimeout(() => { 
                                pressedButton.disabled = false;
                            }, ALERT_LIFETIME);
                        }}>
                            Refresh
                        </Button>
                        <CreateRoomButton />
                    </ButtonGroup>
                </span>
                <br />

                <table id="roomTable" className="hover order-column row-border" style={{width: '100%'}}>
                    <thead>
                        <tr style={{outline: 'none'}}>
                            <th style={{width: '45%'}} className={styles.columnHeader}>
                                Room Name
                            </th>
                            <th style={{width: '25%'}} className={styles.columnHeader}>
                                Host
                            </th>
                            <th style={{width: '15%'}} className={styles.columnHeader}>
                                Users
                            </th>
                            <th style={{width: '15%'}} className={styles.columnHeader}>
                                Password
                            </th>
                        </tr>
                    </thead>
                </table>
                <div className={styles.separatorBot} />
            </div>

        )
    }
}

export default TWidgetBox;