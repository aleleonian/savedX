import React from 'react';

export const Application = () => {

    function logIntoX() {
        window.savedXApi.logIntoX();
    }
    
    return (
        <section>
            <h1>Hi, bros!</h1>
            <button onClick={logIntoX}>Log into X</button>
        </section>
    );
};
