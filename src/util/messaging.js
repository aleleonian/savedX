let mainWindow;

export const sendMessageToMainWindow = (type, data) => {
    mainWindow.webContents.send(type, data);
}

export const setMainWindow = (window) => {
    mainWindow = window;
}

export const encode = (...stages) => {
    let stagesMessage = 0;
    stages.forEach(currentStage => {
        stagesMessage |= currentStage;
    });
    return stagesMessage;
}