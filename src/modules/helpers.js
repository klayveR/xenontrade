const Config = require("electron-store");
const cp = require("child-process-es6-promise");
const os = require("os");
const path = require("path");
const request = require("request-promise-native");
const ffi = require("ffi");
const {shell} = require("electron");

class Helpers {
  /**
  * Returns `true` if the number is a float
  *
  * @param {number} number Number that should be checked for float type
  * @return {boolean}
  */
  static isFloat(number) {
    return Number(number) === number && number % 1 !== 0;
  }

  /**
  * Returns `true` if the number is an integer
  *
  * @param {number} number Number that should be checked for integer type
  * @return {boolean}
  */
  static isInt(number) {
    return Number(number) === number && number % 1 === 0;
  }

  /**
  * Returns `true` if the object is empty
  *
  * @param {Object} object The object to be checked for emptiness
  * @return {boolean}
  */
  static isEmpty(obj) {
    for(var key in obj) {
      if(obj.hasOwnProperty(key)) {
        return false;
      }
    }

    return true;
  }

  /**
  * Generates a random ID
  * https://stackoverflow.com/a/2117523
  *
  * @return {number}
  */
  static generateRandomId() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  /**
  * Checks whether a package is installed on Linux
  *
  * @param {string} pkg Package to be checked for installation
  */
  static isPackageInstalled(pkg) {
    return new Promise(function(resolve, reject) {
      // APT based
      cp.exec("which " + pkg)
      .then((output) => {
        return resolve(true);
      })
      .catch((error) => {
        return reject(error);
      });
    });
  }

  /**
  * Checks if Python is installed and added to PATH on windows
  * Currently unused
  *
  * @returns {Promise}
  * @fulfil {string} - Console output
  * @reject {Error} - The `error.message` contains information about why the promise was rejected
  */
  static isPythonInstalled() {
    return new Promise(function(resolve, reject) {
      cp.exec("python --version")
      .then((output) => {
        resolve(output);
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  /**
  * Fixes path for asar unpack
  *
  * @param {path} path Path to fix
  */
  static fixPathForAsarUnpack(path) {
    return path.replace("app.asar", "app.asar.unpacked");
  }

  /**
  * Focuses the Path of Exile window based on the OS
  */
  static focusGame() {
    if(os.platform() === "linux") {
      Helpers._focusGameOnLinux();
    } else if(os.platform() === "win32") {
      Helpers._focusGameOnWindows();
    }
  }

  /**
  * Focuses the game on Linux
  */
  static _focusGameOnLinux() {
    cp.exec("wmctrl -F -a 'Path of Exile'")
    .catch((error) => {
      console.error("Tried to focus Path of Exile but failed, either wmctrl is not installed or Path of Exile is not running");
    });
  }

  /**
  * Sets a window on top
  *
  * @param {string} [windowName] Window manager name of the window. Defaults to the name of the main GUI
  * @param {boolean} [alwaysOnTop=true] Whether to enable always or top or disable
  */
  static setAlwaysOnTop(windowName = GUI.NAME, alwaysOnTop = true) {
    var win = windowManager.get(windowName).object;
    win.setAlwaysOnTop(alwaysOnTop);

    // https://unix.stackexchange.com/a/180797
    if(os.platform() === "linux" && alwaysOnTop) {
      // Wait 50ms before executing, showing windows on Linux is slow and window needs to
      // be visible in order for this command to work, still check if visible to avoid errors
      setTimeout(function() {
        if(win.isVisible()) {
          cp.exec("wmctrl -F -r '" + win.getTitle() + "' -b add,above")
          .catch((error) => {
            console.warn("Could not set '" + win.getTitle() + "' always on top.", error);
          });
        }
      }, 50);
    }
  }

  /**
  * Focuses the game on Windows
  */
  static _focusGameOnWindows() {
    var user32 = new ffi.Library('user32', {
      'GetTopWindow': ['long', ['long']],
      'FindWindowA': ['long', ['string', 'string']],
      'SetActiveWindow': ['long', ['long']],
      'SetForegroundWindow': ['bool', ['long']],
      'BringWindowToTop': ['bool', ['long']],
      'ShowWindow': ['bool', ['long', 'int']],
      'SwitchToThisWindow': ['void', ['long', 'bool']],
      'GetForegroundWindow': ['long', []],
      'AttachThreadInput': ['bool', ['int', 'long', 'bool']],
      'GetWindowThreadProcessId': ['int', ['long', 'int']],
      'SetWindowPos': ['bool', ['long', 'long', 'int', 'int', 'int', 'int', 'uint']],
      'SetFocus': ['long', ['long']]
    });

    var kernel32 = new ffi.Library('Kernel32.dll', {
      'GetCurrentThreadId': ['int', []]
    });

    var winToSetOnTop = user32.FindWindowA(null, "Path of Exile")
    var foregroundHWnd = user32.GetForegroundWindow()
    var currentThreadId = kernel32.GetCurrentThreadId()
    var windowThreadProcessId = user32.GetWindowThreadProcessId(foregroundHWnd, null)
    var showWindow = user32.ShowWindow(winToSetOnTop, 9)
    var setWindowPos1 = user32.SetWindowPos(winToSetOnTop, -1, 0, 0, 0, 0, 3)
    var setWindowPos2 = user32.SetWindowPos(winToSetOnTop, -2, 0, 0, 0, 0, 3)
    var setForegroundWindow = user32.SetForegroundWindow(winToSetOnTop)
    var attachThreadInput = user32.AttachThreadInput(windowThreadProcessId, currentThreadId, 0)
    var setFocus = user32.SetFocus(winToSetOnTop)
    var setActiveWindow = user32.SetActiveWindow(winToSetOnTop)
  }

  /**
  * Gets Path of Exile leagues that are non-SSF from GGG API and returns the names
  *
  * @returns {Promise}
  * @fulfil {Array} - An array containing every main non-SSF league
  * @reject {Error} - The `error.message` contains information about why the promise was rejected
  */
  static getPathOfExileLeagues() {
    return new Promise(function(resolve, reject) {
      request("http://api.pathofexile.com/leagues?type=main", {json: true, headers: {'Connection': 'keep-alive'}})
      .then((body) => {
        var leagues = [];
        var leaguesCount = 0;
        // Iterate through each league
        for(var i = 0; i < body.length; i++) {
          var league = body[i];
          var ssf = false;
          leaguesCount++;

          if(!Helpers._isSoloLeague(league)) { leagues.push(league.id); }

          // When done with every league
          if(leaguesCount === body.length) {
            resolve(leagues);
          }
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  /**
  * Returns `true` if the league rules have a solo rules
  *
  * @return {boolean}
  */
  static _isSoloLeague(league) {
    if(league.rules.length > 0) {
      for(var j = 0; j < league.rules.length; j++) {
        if(league.rules[j].name === "Solo") {
          return true;
        }
      }
    }

    return false;
  }

  /**
  * Creates the config and returns it
  *
  * @return {Config}
  */
  static createConfig() {
    var config = new Config({
      defaults: {
        league: "Delve",
        focusPathOfExile: false,
        autoMinimize: false,
        hideMenu: false,
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
            },
            rare: {
              enabled: false,
              value: 20
            }
          }
        },
        window: {
          x: 0,
          y: 0,
          locked: false,
          poll: 1000,
          zoomFactor: 1
        },
        provider_unique: "poeprices",
        provider_rare: "poeprices",
        provider_currency: "poeninja",
        provider_others: "poeninja",
        poeDataInterval: 0,
        poeDataLogin: "",
        poeDataPassword: ""
      }
    });

    // 0.1.2
    if(!config.has("window.poll")) {
      config.set("window.poll", 1000);
    }

    // 0.2.0
    if(!config.has("autoclose.timeouts.rare")) {
      config.set("autoclose.timeouts.rare", {enabled: false, value: 20});
    }

    // 0.3.4
    if(!config.has("window.zoomFactor")) {
      config.set("window.zoomFactor", 1);
    }

    // 0.4.0
    if(!config.has("hideMenu")) {
      config.set("hideMenu", false);
    }

    // 0.4.1
    if(!config.has("provider_unique")) {
      config.set("provider_unique", "poeninja");
    }
    if(!config.has("provider_rare")) {
      config.set("provider_rare", "poeprices");
    }
    if(!config.has("provider_currency")) {
      config.set("provider_currency", "poeninja");
    }
    if(!config.has("provider_others")) {
      config.set("provider_others", "poeninja");
    }

    return config;
  }

  /**
  * Opens the logfile folder and selects the log file
  */
  static openLogFile() {
    var logfile = "";

    if(os.platform() === "linux") {
      logfile = path.join(os.homedir(), "/.config/XenonTrade/log.log");
    } else {
      logfile = path.join(os.homedir(), "/AppData/Roaming/XenonTrade/log.log");
    }

    shell.openItem(logfile);
  }
}

module.exports = Helpers;
