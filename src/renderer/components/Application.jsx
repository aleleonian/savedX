import React, { useState, useEffect } from 'react';

export const Application = () => {
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        // Listen for messages from the preload script
        const eventListener = event => {
            if (event.detail) {
                setNotification(event.detail);
            }
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
            {notification && <p>{notification}</p>}
        </section>
    );
};
