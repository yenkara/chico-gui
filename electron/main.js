const { app, BrowserWindow } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) return app.quit();

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './preload.js')
        },
        show: false,
        icon: path.join(__dirname,'../view/img/ico/48x48.ico')
    });

    mainWindow.loadFile('./view/index.html');
    // mainWindow.webContents.openDevTools();

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});