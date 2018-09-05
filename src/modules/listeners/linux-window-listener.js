var x11, Getx11Property;

try {
  x11 = require('x11');
  Getx11Property = require('x11-prop').get_property;
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
    this.XClient = null;
    this.XClientDisplay = null;
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

        self.XClient = display.client;
        self.XClientDisplay = display.screen[0].root;
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

      this.XClient.ChangeWindowAttributes(this.XClientDisplay, {
        eventMask: x11.eventMask.PropertyChange
      });

      this.XClient.on('event', function(ev) {
        self._windowPropertyChangeHandler(ev);
      });
    }
  }

  /**
  * Checks if the event fired by the XClient is a window change event
  */
  _windowPropertyChangeHandler(ev) {
    var self = this;

    if (ev.name == 'PropertyNotify') {
      this.XClient.GetAtomName(ev.atom, function(error, name) {
        if (name == '_NET_ACTIVE_WINDOW') {
          Getx11Property(self.XClient, ev.wid, ev.atom, function(error, data) {
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

    Getx11Property(this.XClient, data[0], '_NET_WM_NAME', function(err, windowTitle) {

      if(windowTitle.length > 0 && ["Path of Exile", "XenonTrade"].includes(windowTitle[0])) {
        self.app.poeFocused = true;
        self.app.gui.show();
      } else {
        self.app.poeFocused = false;
        self.app.gui.minimize();
      }
    });
  }
}

module.exports = LinuxWindowListener;
