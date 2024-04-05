import React, { useState, useEffect } from 'react';
import { Notification } from './Notification';

export const Application = () => {
    const [notificationMessage, setNotificationMessage] = useState(null);
    const [notificationClass, setNotificationClass] = useState(null);

    useEffect(() => {
        // Listen for messages from the preload script
        const eventListener = event => {
            if (event.detail) {
                const data = event.detail.split("--");
                setNotificationClass(data[0]);
                setNotificationMessage(data[1]);
                setTimeout(() => {
                    setNotificationMessage(null);
                }, 2000);            }
        };

        window.addEventListener('NOTIFICATION', eventListener);

        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener('NOTIFICATION', eventListener);
        };
    }, []); // Empty dependency array ensures this effect runs only once after mount


    function logIntoX() {
        window.savedXApi.logIntoX();
    }

    return (
        <section>
            <h1>Hi, bros!</h1>
            <button onClick={logIntoX}>Log into X</button>
            {notificationMessage &&
                <Notification
                    notificationClass={notificationClass}
                    notificationMessage={notificationMessage}
                />}
        </section>
    );
};
