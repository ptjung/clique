import React, { Component } from 'react';
import styles from './TermsBox.module.css';

class TermsBox extends Component {

    render() {
        return (
            <nav>
                <div id="termsboxContainer" className={styles.termsboxContainer}>
                    <div className={styles.separatorTop}>
                        Terms of Service
                    </div>
                    <div>
                        <p style={{textAlign: 'justify'}}>
                            Last updated: July 19, 2020
                            <br /><br />
                            Please read these terms and conditions (the "Terms of Service") carefully before
                            using the Clique website (the "Service"). By signing up for a Clique Account and
                            using the Services, you are agreeing to be bound by the following terms and
                            conditions.
                            <br /><br />
                            Clique reserves the right to update and change the Terms of Service by posting
                            updates and changes to the Clique website. You are advised to check the Terms of
                            Service from time to time for any updates or changes that may impact you. If
                            you do not accept such amendments, you must cease using the Services.
                            <br /><br />
                            If you're under the required age of 13 years old to manage your own Clique Account,
                            you must have your parent or legal guardian's permission to use a Clique Account.
                            <br /><br />
                            While we have made attempts at ensuring that Clique is secure, this application
                            is open-source and uses elementary concepts of security. There is no certainty
                            that breaches in security will never occur. As such, you are advised to refrain
                            from entering "real" personal information in signing up for a Clique Account. Clique
                            is not responsible for any personal damages that may occur and proactive measures
                            will not be taken.
                        </p>
                    </div>
                </div>
            </nav>
        )
    }
}

export default TermsBox;