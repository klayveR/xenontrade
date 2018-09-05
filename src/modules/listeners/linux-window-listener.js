var x11, Getx11Property;

try {
  x11 = require("x11");
  Getx11Property = require("x11-prop").get_property;
} catch(error) {
  // In case of an error requiring x11 dependencies the user is 99.9% using Windows, so this error can be ignored
}

class LinuxWindowListener {
  /**
  * Creates a new LinuxWindowListener object
  *
  * @constructor
  * @param {XenonTrade} app The XenonTrade object
  */
  constructor(app) {
    this.app = app;
    this.xClient = null;
    this.xClientDisplay = null;
    this.initialized = false;
  }

  /**
  * Setting the XClient and XClientDisplay
  */
  initialize() {
    var self = this;

    return new Promise(function(resolve, reject) {
      x11.createClient(function(error, display) {
        if(error) {
          return reject(error);
        }

        self.xClient = display.client;
        self.xClientDisplay = display.screen[0].root;
        self.initialized = true;
        return resolve();
      });
    });
  }

  /**
  * Initialize the XClient event listener
  */
  start() {
    if(this.initialized) {
      var self = this;

      this.xClient.ChangeWindowAttributes(this.xClientDisplay, {
        eventMask: x11.eventMask.PropertyChange
      });

      this.xClient.on("event", function(ev) {
        self._windowPropertyChangeHandler(ev);
      });
    }
  }

  /**
  * Checks if the event fired by the XClient is a window change event
  */
  _windowPropertyChangeHandler(ev) {
    var self = this;

    if (ev.name === "PropertyNotify") {
      this.xClient.GetAtomName(ev.atom, function(error, name) {
        if (name === "_NET_ACTIVE_WINDOW") {
          Getx11Property(self.xClient, ev.wid, ev.atom, function(error, data) {
            self._handleActiveWindowChange(data);
          });
        }
      });
    }
  }

  /**
  * Handles the window change event by showing the gui when switched to Path of Exile or XenonTrade or
  * hiding the GUI when switched to another window
  */
  _handleActiveWindowChange(data) {
    var self = this;

    Getx11Property(this.xClient, data[0], "_NET_WM_NAME", function(error, windowTitle) {
      if(error) {
        return;
      }

      if(windowTitle.length > 0) {
        if(windowTitle[0] === "XenonTrade") {
          self.app.poeFocused = false;
        } else if(windowTitle[0] === "Path of Exile") {
          self.app.poeFocused = true;
          self.app.gui.show();
        } else {
          self.app.poeFocused = false;
          self.app.gui.minimize();
        }
      }
    });
  }
}

module.exports = LinuxWindowListener;
