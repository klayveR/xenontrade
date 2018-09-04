const {app, BrowserWindow} = require("electron");
const {ipcMain} = require("electron");

try {
	require("electron-reloader")(module);
} catch (err) {}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let debug = false;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 300,
    height: 0,
    frame: false,
    hasShadow: false,
		show: false
  });

  if(debug) {
    win.setSize(800, 600);
  }

  // and load the index.html of the app.
  win.loadFile("./src/index.html");
  win.setResizable(false);
  win.setAlwaysOnTop(true, "floating", 1);

  // allows the window to show over a fullscreen window
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

ipcMain.on("resize", function (e, w, h) {
  if(!debug) { win.setSize(Math.round(w), Math.round(h)); }
});

ipcMain.on("position", function (e, x, y) {
  win.setPosition(Math.round(x), Math.round(y));
});

ipcMain.on("ready", function (e) {
  win.show();
});
