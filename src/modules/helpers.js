const DefaultConfig = require("../resource/defaultConfig");
const Config = require("electron-store");
const dotProp = require('dot-prop');
const cp = require("child-process-es6-promise");
const os = require("os");
const path = require("path");
const request = require("request-promise-native");
const ffi = require("ffi");
const {shell, clipboard} = require("electron");
const robot = require("robotjs");

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
      var timeout = setTimeout(function() {
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
  * Creates the config and returns it
  *
  * @return {Config}
  */
  static createConfig() {
    var config = new Config({
      "defaults": DefaultConfig.defaults
    });

    // Version config changes
    for(var version in DefaultConfig.changes) {
      var changes = DefaultConfig.changes[version];

      // Added properties
      for(var index in changes.add) {
        var key = changes.add[index];

        if(!config.has(key)) {
          var defaultProp = dotProp.get(DefaultConfig.defaults, key);
          config.set(key, defaultProp);
        }
      }

      // Changed property keys
      for(var oldKey in changes.migrate) {
        var newKey = changes.migrate[oldKey];

        if(!config.has(newKey) && config.has(oldKey)) {
          config.set(newKey, config.get(oldKey));
          config.delete(oldKey);
        }
      }
    }

    return config;
  }

  /**
  * Opens the logfile folder and selects the log file
  */
  static openFile(file) {
    var location = "";

    if(os.platform() === "linux") {
      location = path.join(os.homedir(), "/.config/XenonTrade/", file);
    } else {
      location = path.join(os.homedir(), "/AppData/Roaming/XenonTrade/", file);
    }

    // Create file if it doesn't exist
    fs.writeFile(location, "", { flag: 'wx' })
    .catch((error) => {
      log.debug("File " + location + " already exists", error);
    });

    shell.openItem(location);
  }
}

module.exports = Helpers;
