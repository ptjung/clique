import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';

import { Navbar, AboutBox, TWidgetBox, SignUpWindow, LogInWindow, SessionResetModal, TermsBox, Footer, Room } from './components';

function MainWrapper() {
    return (
        <Router>
            <SessionResetModal />
            
            <Route exact path='/' render={() =>
                <div>
                    <Navbar />
                    <AboutBox />
                    <Footer />
                </div>
            } />
            <Route exact path='/rooms' render={() =>
                <div>
                    <Navbar />
                    <TWidgetBox />
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
                    <Navbar />
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

export default MainWrapper;