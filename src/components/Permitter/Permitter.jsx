import React, { useEffect } from 'react';
import axios from 'axios';

function permitUser(props) {
    axios.post(process.env.REACT_APP_API_URL + "/api/users/permit")
        .then((res) => {
            axios.defaults.headers.common['api-auth-pass'] = res.data.token;
            props.setPermitted(true);
        });
}

function Permitter(props) {

    useEffect(() => {
        // Having the permitter in every page is convenient to set default headers, so that all requests are secure
        permitUser(props);
        setInterval(() => {
            // Expects the permit lifetime to be greater than 1 second
            permitUser(props);
        }, 1000);
    }, [props]);

    return (<></>);
}

export default Permitter;