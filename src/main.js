const {app, Menu, BrowserWindow, Tray} = require("electron");
const {ipcMain} = require("electron");
const Config = require("electron-store");

const path = require("path");
const os = require("os");
const kill = require('tree-kill');
const find = require('find-process');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, tray;
let config;
let debug = false;

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }
});

if (shouldQuit) {
  quitApp();
  return;
}

function createWindow() {
  createConfig();

  // Create the browser window.
  win = new BrowserWindow({
    x: config.get("window.x"),
    y: config.get("window.y"),
    width: 300,
    height: 0,
    frame: false,
    hasShadow: false,
    skipTaskbar: true
  });

  if(debug) { win.setSize(800, 600); }

  // and load the index.html of the app.
  win.loadFile("./src/index.html");

  win.setResizable(false);
  win.setAlwaysOnTop(true, "floating", 1);
  win.setVisibleOnAllWorkspaces(true);
  win.setFullScreenable(false);

  // Open the DevTools.
  if(debug) { win.webContents.openDevTools(); }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  // Send focus event to renderer
  win.on("focus", () => {
    win.webContents.send('focus');
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();

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
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  quitApp();
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

function createConfig() {
  config = new Config({
    defaults: {
      league: "Delve",
      focusPathOfExile: true,
      autoMinimize: false,
      pricecheck: true,
      maxHeight: 500,
      autoclose: {
        enabled: true,
        threshold: {
          enabled: false,
          value: 20
        },
        timeouts: {
          currency: {
            enabled: false,
            value: 10
          },
          item: {
            enabled: false,
            value: 10
          }
        }
      },
      window: {
        x: 0,
        y: 0,
        locked: false
      }
    }
  });
}

function quitApp() {
  // Kill all child processes that have been created during runtime
  if(os.platform() === "win32") {
    find('name', 'window-change-listener.exe')
    .then(function (list) {
      for(var index in list) {
        var proc = list[index];
        kill(proc.pid);

        if(proc.ppid != null) {
          kill(proc.ppid); // Kill parent
        }
      }
    })
    .catch((error) => {
      console.log("Error during app quit", error);
    })
    .then(() => {
      app.quit();
    });
  } else {
    app.quit();
  }
}
