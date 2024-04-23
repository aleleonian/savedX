import React from "react";
import { Title } from "./Title";

export const Progress = ({ state }) => {
    // debugger;
    const logginClass = !state.login ? "text-gray-400" : "text-red-500";
    const scrapingClass = !state.scrape ? "text-gray-400" : "text-red-500";
    const logoutClass = !state.logout ? "text-gray-400" : "text-red-500";
    return (
        <>
            <Title />
            Bro, we're working on it...⏱

            <div id="login" className={logginClass}>Logging into X</div>
            <div id="scraping" className={scrapingClass}>Scraping bookmarks</div>
            <div id="logout" className={logoutClass}>Logging out of X</div>
        </>
    )
}