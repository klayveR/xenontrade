const { exec } = require("child_process");
const os = require("os");

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
  * Focuses the Path of Exile window based on the OS
  */
  static focusPathOfExile() {
    var command = "";

    if(os.platform() === "linux") {
      exec("poeWId=$(xdotool search --desktop 0 --name 'Path of Exile' | head -n1) && xdotool windowactivate $poeWId");
    } else if(os.platform() === "win32") {
      command = "nircmd.exe win activate title 'Path of Exile'";
    }
  }

  /**
  * Checks whether a package is installed based on the OS
  *
  * @param {string} package Package to be checked for installation
  * @param {callback} callback Callback that handles the response
  */
  static isPackageInstalled(pkg, callback) {
    if(os.platform() === "linux") {
      exec("dpkg -s " + pkg, function(error, stdout, stderr) {
        if(error) {
          callback(error);
        }

        if(stdout.includes("install ok")) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      });
    }
  }

  /**
  * Gets the name of the currently focused window
  * HERES SOMETHING INTERESTING: xprop -id $(xprop -root 32x "\t$0" _NET_ACTIVE_WINDOW | cut -f 2) WM_CLASS WM_NAME
  *
  * @param {callback} callback Callback that handles the response
  */
  static getFocusedWindowName(callback) {
    if(os.platform() === "linux") {
      exec("xdotool getwindowfocus getwindowname", function(error, stdout, stderr) {
        if(error) {
          callback(error);
        }

        var window = stdout;

        // Replace line breaks
        window = window.replace(/\r?\n|\r/g, "");
        callback(null, window);
      });
    }
  }
}

module.exports = Helpers;
