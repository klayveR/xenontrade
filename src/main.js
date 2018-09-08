const {app, BrowserWindow} = require("electron");
const {ipcMain} = require("electron");
const Config = require("electron-store");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
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
  app.quit();
  return;
}

function createConfig() {
	config = new Config({
		defaults: {
			league: "Delve",
      focusPathOfExile: true,
      autoMinimize: true,
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

function createWindow() {
	createConfig();

	// Create the browser window.
	win = new BrowserWindow({
		x: config.get("window.x"),
		y: config.get("window.y"),
		width: 300,
		height: 0,
		frame: false,
		hasShadow: false
	});

	if(debug) { win.setSize(800, 600); }

	// and load the index.html of the app.
	win.loadFile("./src/index.html");

	win.setResizable(false);
	win.setAlwaysOnTop(true, "floating", 1);
	win.setVisibleOnAllWorkspaces(true);
	win.setFullScreenable(false);

  // Windows only
  win.setFocusable(false);

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
  // Save position before resizing and then apply position again
  // The window would resize but try to keep it centered for one
  // user, this should fix it
	if(!debug) {
    var windowPosition = win.getPosition();
    win.setSize(Math.round(w), Math.round(h));
    win.setPosition(windowPosition[0], windowPosition[1]);
  }
});
