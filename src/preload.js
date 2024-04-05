// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { ipcRenderer, contextBridge } = require("electron");

let domContentLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    domContentLoaded = true;
});

function dispatchNotification(message) {
    window.dispatchEvent(new CustomEvent('NOTIFICATION', { detail: message }));
}

contextBridge.exposeInMainWorld('savedXApi', {
    logIntoX: () => ipcRenderer.send('log-into-x'),
})

ipcRenderer.on('NOTIFICATION', (event, message) => {
    console.log('message from main:', message);
    if (domContentLoaded) dispatchNotification(message);
    else {
        console.log("Dom content not loaded yet!");
        setTimeout(() => { dispatchNotification(message) }, 1500);
    }
});