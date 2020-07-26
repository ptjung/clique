/**
 * This file is used to securely authenticate API calls, expecting help from the Permitter component to
 * frequently issue the 'api-auth-pass' token starting at runtime.
 * 
 * @author PtJung (Patrick Jung)
 * @module auth
 * @requires jsonwebtoken
 */

const jwt = require('jsonwebtoken');

/**
 * This middleware function provides secure calls to the users & rooms API. It uses the issued default
 * header from the Permitter component to ensure that API calls are made only from the website.
 * 
 * @function auth
 */
function auth(req, res, next) {
    const token = req.header('api-auth-pass');

    if (!token) {
        // Headers do not include 'api-auth-pass', issued by the Permitter component
        res.status(401).json({ status: 'Access denied' });
    }
    else {
        const decoded = jwt.verify(token || "", process.env.REACT_APP_JWT_SECRET);
        if (!(decoded && decoded.apiKey && (decoded.apiKey === process.env.REACT_APP_PERMIT_KEY))) {
            // Checks for malformed, non-valid, or unextractable JSON content from 'token'
            res.status(400).json({ status: 'Access denied' });
        }
    }

    // Assert: 'api-auth-pass' headers are included with the correctly issued API key
    next();
}

// Export the "auth" function
module.exports = auth;