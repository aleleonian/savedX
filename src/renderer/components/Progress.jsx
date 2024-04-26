import React from "react";
import { Title } from "./Title";
import { ProgressIcon } from "./ProgressIcon";

const addClass = (classList, className) => {
    const classesArray = classList.split(/\s+/);
    classesArray.push(className);
    return classesArray.join(" ");
}
const removeClass = (classList, className) => {
    return classList
        .split(/\s+/)
        .filter(classItem => classItem !== className)
        .join(" ");
}

export const Progress = ({ state }) => {
    let logginClass = "flex items-center text-gray-400 py-4";
    let loginText = "Log into X.";

    let scrapingClass = "flex items-center text-gray-400 py-4";
    let scrapingText = "Scrape bookmarks."

    let logoutClass = "flex items-center text-gray-400 py-4";
    let logoutText = "Log out of X.";

    if (state.logingIn) {
        logginClass = removeClass(logginClass, 'text-gray-400');
        logginClass = addClass(logginClass, 'text-blue-500');
        loginText = "Logging into X...";
    }
    else if (state.loggedIn) {
        logginClass = removeClass(logginClass, 'text-gray-400');
        logginClass = addClass(logginClass, 'text-blue-500');
        loginText = "Logged into X ✅";
    }

    if (state.scraping) {
        scrapingClass = removeClass(scrapingClass, 'text-gray-400');
        scrapingClass = addClass(scrapingClass, 'text-blue-500');
        scrapingText = "Scraping bookmarks " + state.data;
    }
    else if (state.scraped) {
        scrapingClass = removeClass(scrapingClass, 'text-gray-400');
        scrapingClass = addClass(scrapingClass, 'text-blue-500');
        scrapingText = "Scraped bookmarks ✅";
    }

    if (state.loggingOut) {
        logoutClass = removeClass(logoutClass, 'text-gray-400');
        logoutClass = addClass(logoutClass, 'text-blue-500');
        logoutText = "Logging out of X...";
    }

    else if (state.loggedOut) {
        logoutClass = removeClass(logoutClass, 'text-gray-400');
        logoutClass = addClass(logoutClass, 'text-blue-500');
        logoutText = "Logged out of X ✅";
    }


    return (
        <>
            <div className="container mx-auto text-center">
                <Title />
                📝Todo list:

                <div className="flex flex-col items-center py-8">
                    <div id="login" className={logginClass}>
                        {loginText}
                        {state.logingIn && <ProgressIcon />}
                    </div>
                    <div id="scraping" className={scrapingClass}>
                        {scrapingText}
                        {state.scraping && <ProgressIcon />}
                    </div>
                    <div id="logout" className={logoutClass}>
                        {logoutText}
                        {state.loggingOut && <ProgressIcon />}
                    </div>
                </div>
            </div>
        </>
    )
}