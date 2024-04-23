import React from "react";
import { Title } from "./Title";

export const Progress = ({ state }) => {
    // debugger;
    const logginClass = !state.login ? "text-gray-400" : "text-red-500";
    const loginText = !state.login ? "Logging into X..." : "Logged into X ✅";

    const scrapingClass = !state.scrape ? "text-gray-400" : "text-red-500";
    const scrapingText = !state.scrape ? "Scraping bookmarks..." : "Scraped bookmarks ✅";

    const logoutClass = !state.logout ? "text-gray-400" : "text-red-500";
    const logoutText = !state.logout ? "Logging out of X..." : "Logged out of X ✅";

    return (
        <>
            <Title />
            Bro, we're working on it...⏱

            <div id="login" className={logginClass}>{loginText}</div>
            <div id="scraping" className={scrapingClass}>{scrapingText}</div>
            <div id="logout" className={logoutClass}>{logoutText}</div>
        </>
    )
}