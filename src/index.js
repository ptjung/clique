/**
 * This file renders the Clique front-end.
 * 
 * @author: PtJung (Patrick Jung)
 * @requires react
 * @requires react-router-dom
 * @requires bootstrap.min.css
 */

 import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

// Export the entire web application
export default App;