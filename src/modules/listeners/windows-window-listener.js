const path = require("path");
const Helpers = require("../helpers.js");
const spawn = require('child_process').spawn;

class WindowsWindowListener {
  /**
  * Creates a new WindowsWindowListener object
  *
  * @constructor
  * @param {XenonTrade} app The XenonTrade object
  */
  constructor(app) {
    this.app = app;
  }

  /**
  * Listen to window changes with python
  */
  start() {
    var self = this;

    try {
      var scriptPath = Helpers.fixPathForAsarUnpack(path.join(__dirname, "../../", "/resource/python/window-change-listener.py"));
      var scriptExecution = spawn("python", [scriptPath]);

      scriptExecution.stdout.on('data', (data) => {
        if(["Path of Exile", "XenonTrade"].includes(Helpers.uint8arrayToString(data))) {
          self.app.poeFocused = true;
          self.app.gui.show();
        } else {
          self.app.poeFocused = false;
          self.app.gui.minimize();
        }
      });

      scriptExecution.stderr.on('data', (data) => {
          self.gui.entries.addText("Window listener error", "The window listener failed, which means this app can no longer be minimized automatically. Restart to restore functionality.", "fa-exclamation-circle red");
      });

      scriptExecution.on('exit', (code) => {
        self.gui.entries.addText("Window listener exit", "The window listener quit, which means this app can no longer be minimized automatically. Restart to restore functionality.", "fa-exclamation-circle red");
      });
    } catch(error) {
      // TODO: Python probably not installed, maybe do something here
    }
  }
}

module.exports = WindowsWindowListener;
