/**
 * This file defines the basis of the Clique front-end.
 * 
 * @author: PtJung (Patrick Jung)
 * @requires react
 * @requires react-router-dom
 * @requires bootstrap.min.css
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, AboutBox, TWidgetBox, SignUpWindow, LogInWindow, SessionResetModal, TermsBox, Footer, Room, Permitter } from './components';

/**
 * This component acts as the main wrapper for all of the routes and components.
 * 
 * @function MainWrapper
 */
function MainWrapper() {
    const [permitted, setPermitted] = useState(false);

    return (
        <Router>
            <Permitter setPermitted={setPermitted} />
            <SessionResetModal />
            
            <Route exact path='/' render={() =>
                <div>
                    <Navbar userPermitted={permitted} />
                    <AboutBox />
                    <Footer />
                </div>
            } />
            <Route exact path='/rooms' render={() =>
                <div>
                    <Navbar userPermitted={permitted} />
                    <TWidgetBox userPermitted={permitted} />
                    <Footer />
                </div>
            } />
            <Route exact path='/rooms/:code' render={(props) =>
                <div>
                    <Room room={props} />
                </div>
            } />
            <Route exact path='/terms' render={() =>
                <div>
                    <Navbar userPermitted={permitted} />
                    <TermsBox />
                    <Footer />
                </div>
            } />
            <Route exact path='/login' render={() =>
                <div>
                    <LogInWindow />
                    <Footer />
                </div>
            } />
            <Route exact path='/signup' render={() =>
                <div>
                    <SignUpWindow />
                    <Footer />
                </div>
            } />

        </Router>
    );
}

// Export the main wrapper as a component
export default MainWrapper;