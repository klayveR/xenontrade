const {app, Menu, BrowserWindow, Tray} = require("electron");
const {ipcMain} = require("electron");
const {autoUpdater} = require("electron-updater");
const isDev = require('electron-is-dev');

const Helpers = require("./modules/helpers.js");
const path = require("path");
const os = require("os");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, tray;
let config;
let debug = false;

let shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }
});

if (shouldQuit) {
  app.quit();
  return;
}

// Creates default window
function createWindow() {
  config = Helpers.createConfig();

  win = new BrowserWindow({
    x: config.get("window.x"),
    y: config.get("window.y"),
    width: 300,
    height: 0,
    frame: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    transparent: true
  });

  win.setResizable(false);
  win.loadFile("./src/index.html");
  win.setVisibleOnAllWorkspaces(true);
  win.setFullScreenable(false);

  if(debug) {
    win.setSize(800, 600);
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed
  win.on("closed", () => {
    win = null;
  });

  // Emitted when the window is focused
  win.on("focus", () => {
    win.webContents.send('focus');
  });

  // Emitted when the window is ready to be shown
  win.on('ready-to-show', () => {
    win.show();
    win.setAlwaysOnTop(true);
  })
}

function createTray() {
  const iconPath = path.join(__dirname, '../', 'build/icon_512.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: function(){
      win.show();
    }},
    { label: 'Close', click: function(){
      win.close();
    }}
  ]);

  tray.setToolTip('XenonTrade');
  tray.setContextMenu(contextMenu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  createTray();

  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

// when the update has been downloaded and is ready to be installed, notify the BrowserWindow
autoUpdater.on('update-downloaded', (info) => {
  win.webContents.send('updateReady');
});

ipcMain.on("resize", function (e, w, h) {
  // Save position before resizing and then apply position again
  // The window would resize but try to keep it centered for one
  // user, this should fix it
  if(!debug) {
    var windowPosition = win.getPosition();
    win.setSize(Math.round(w), Math.round(h));
    if(os.platform() === "linux") {
      win.setPosition(windowPosition[0], windowPosition[1]);
    }
  }
});

// when receiving a quitAndInstall signal, quit and install the new version ;)
ipcMain.on("quitAndInstall", (event, arg) => {
  autoUpdater.quitAndInstall();
})
