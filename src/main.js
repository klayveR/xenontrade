const {app, Menu, BrowserWindow, Tray, ipcMain} = require("electron");
const {autoUpdater} = require("electron-updater");
const isDev = require('electron-is-dev');
const log = require('electron-log');
const windowManager = require('electron-window-manager');
const Helpers = require("./modules/helpers.js");
const path = require("path");
const os = require("os");

let win;
let config = Helpers.createConfig();
let debug = false;

// Disable auto download of updates
autoUpdater.autoDownload = false;

// Log file format
log.transports.file.format = '[{d}/{m}/{y} {h}:{i}:{s}] [{level}] {text}';
log.transports.console.format = '[{d}/{m}/{y} {h}:{i}:{s}] [{level}] {text}';

// Create XenonTrade window
function createWindow() {
  windowManager.init({
    'devMode': isDev ? true : false,
    'appBase': "file://" + __dirname
  });

  win = windowManager.open('main', 'XenonTrade', '/index.html', false, {
    'x': config.get("window.x"),
    'y': config.get("window.y"),
    'width': 300 * config.get("window.zoomFactor"),
    'height': 0,
    'frame': false,
    'backgroundThrottling': false,
    'skipTaskbar': true,
    'show': false,
    'transparent': true,
    'maximizable': false,
    'resizable': false,
    'fullscreenable': false,
    'alwaysOnTop': true
  });

  // Open dev tools when debug is enabled
  if(debug) {
    win.object.setSize(800, 600);
    win.object.webContents.openDevTools();
  }

  // Emitted when the window is focused
  win.object.on("focus", () => {
    win.object.webContents.send('focus');
  });

  // Emitted when the window is ready to be shown
  win.object.on('ready-to-show', () => {
    win.object.show();
  });
}

// Create XenonTrade Tray
function createTray() {
  let iconPath = path.join(__dirname, '../', 'build/icon_512.png');
  let tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show', click: function() {
        win.object.show();
      }
    },
    {
      label: 'Close', click: function() {
        windowManager.closeAll();
      }
    }
  ]);

  tray.setToolTip('XenonTrade');
  tray.setContextMenu(contextMenu);
}

// Only allow one instance of XenonTrade
let shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  if(win) {
    if(win.object.isMinimized()) {
      win.object.restore();
    }

    win.object.focus();
  }
});

if(shouldQuit) {
  app.quit();
  return;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  createTray();

  // Check for updates if not in dev mode
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

// On update available, let main window know
autoUpdater.on('update-available', (info) => {
  win.object.webContents.send('update-available', info);
});

// On update downloaded, let main window know
autoUpdater.on('update-downloaded', (info) => {
  win.object.webContents.send('update-downloaded', info);
});

// Download update when receiving download-update
ipcMain.on("download-update", (event, arg) => {
  autoUpdater.downloadUpdate();
});

// When receiving install-update, quit and install the new version
ipcMain.on("install-update", (event, arg) => {
  autoUpdater.quitAndInstall();
});

// When receiving resize, resize the main window
ipcMain.on("resize", function (ev, width, height) {
  if(!debug) {
    // Save previous window position
    let windowPosition = win.object.getPosition();

    // Set new window size
    win.object.setSize(Math.round(width), Math.round(height));

    // Apply previous position again to fix up- and downwards resize on some Linux distros
    if(os.platform() === "linux") {
      win.object.setPosition(windowPosition[0], windowPosition[1]);
    }
  }
});
