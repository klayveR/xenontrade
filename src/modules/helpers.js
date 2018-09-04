const exec = require("child-process-promise").exec;
const os = require("os");
const path = require("path");

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
    var nirCmd = path.join(__dirname, "/resource/executables/nircmdc.exe").replace("app.asar", "app.asar.unpacked");

    if(os.arch() === "x64") {
      nirCmd = path.join(__dirname, "/resource/executables/nircmdc64.exe").replace("app.asar", "app.asar.unpacked");
    }

    if(os.platform() === "linux") {
      exec("poeWId=$(xdotool search --desktop 0 --name 'Path of Exile' | head -n1) && xdotool windowactivate $poeWId");
    } else if(os.platform() === "win32") {
      exec(nirCmd + " win activate title 'Path of Exile'");
    }
  }

  /**
  * Checks whether a package is installed on Linux
  *
  * @param {string} package Package to be checked for installation
  */
  static isPackageInstalled(pkg) {
    return new Promise(function(resolve, reject) {
      // APT based
      exec("dpkg-query -W -f='${Status} ${Version}\n' " + pkg)
      .then((output) => {
        return resolve(true);
      })
      .catch((error) => {
        return exec("rpm -qa | grep " + pkg);
      })
      // RPM based
      .then((output) => {
        // Check if there's any output at all
        if(output && !output.trim()) {
          return resolve(true);
        } else {
          return reject(new Error("Package " + pkg + " is not installed"));
        }
      })
      .catch((error) => {
        return reject(error);
      });
    });
  }

  /**
  * Checks whether a program is installed on Windows
  *
  * @param {string} path Path to program to be checked for installation
  */
  static isExeInstalled(path) {
    return new Promise(function(resolve, reject) {
      exec("IF EXIST '" + path + "' (echo yes) ELSE (echo no)")
      .then((output) => {
        if(output.includes("yes")) {
          resolve(true);
        } else {
          reject(new Error("Program at path " + path + " is not installed"));
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  /**
  * Checks if Path of Exile is currently focused
  *
  * @param {callback} callback Callback that handles the response
  */
  static isPathOfExileActive(callback) {
    var ahkExe = path.join(__dirname, "/resource/executables/poeActive.exe").replace("app.asar", "app.asar.unpacked");

    return new Promise(function(resolve, reject) {
      if(os.platform() === "linux") {
        exec("xdotool getwindowfocus getwindowname")
        .then((output) => {
          if(output.includes("Path of Exile")) {
            resolve(true);
          } else {
            reject(new Error("Path of Exile is not focused"));
          }
        })
        .catch((error) => {
          reject(error);
        });
      } else if(os.platform() === "win32") {
        exec(ahkExe + " |more")
        .then((output) => {
          if(output.includes("true")) {
            resolve(true);
          } else {
            reject(new Error("Path of Exile is not focused"));
          }
        })
        .catch((error) => {
          reject(error);
        });
      }
    });
  }
}

module.exports = Helpers;
