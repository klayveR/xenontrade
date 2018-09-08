const path = require("path");
const Helpers = require("../helpers.js");
const Entries = require("../entries.js");
const spawn = require("child_process").spawn;

class WindowsWindowListener {
  /**
  * Creates a new WindowsWindowListener object
  *
  * @constructor
  */
  constructor() {
    this.scriptExecution = null;
    this.started = false;
  }

  /**
  * Listen to window changes with python
  */
  start() {
    var self = this;

    try {
      /**
      * These were used for calling the python script directly, unfortunately that required python installed on the users system
      *
      * var scriptPath = Helpers.fixPathForAsarUnpack(path.join(__dirname, "../../", "/resource/python/window-change-listener.py"));
      * var scriptExecution = spawn("python", [scriptPath]);
      */

      this.started = true;

      var scriptPath = Helpers.fixPathForAsarUnpack(path.join(__dirname, "../../", "/resource/executables/window-change-listener.exe"));
      this.scriptExecution = spawn(scriptPath);

      this.scriptExecution.stdout.on("data", (data) => {
        var output = self._uint8arrayToString(data);

        self._handleActiveWindowChange(output);
      });

      this.scriptExecution.stderr.on("data", (data) => {
        Entries.addText("Window listener error", "The window listener failed, which means this app can no longer be minimized automatically. Restart to restore functionality.", "fa-exclamation-circle red");
      });

      this.scriptExecution.on("exit", (code) => {
        self.started = false;
        Entries.addText("Window listener exit", "The window listener quit, which means this app can no longer be minimized automatically. Restart to restore functionality.", "fa-exclamation-circle red");
      });
    } catch(error) {
      // TODO: This shouldn't fail but maybe it does
    }
  }

  /**
  * Handles the window change event by showing the gui when switched to Path of Exile or XenonTrade or
  * hiding the GUI when switched to another window
  */
  _handleActiveWindowChange(windowTitle) {
    if(windowTitle.includes("focus:'XenonTrade'")) {
      app.poeFocused = false;
    } else if(windowTitle.includes("focus:'Path of Exile'")) {
      app.poeFocused = true;
      if(config.get("autoMinimize")) { gui.show(); }
    } else {
      app.poeFocused = false;
      if(config.get("autoMinimize")) { gui.minimize(); }
    }
  }

  /**
  * Convert an Uint8Array to a string
  */
  _uint8arrayToString(data) {
    return String.fromCharCode.apply(null, data);
  }
}

module.exports = WindowsWindowListener;
