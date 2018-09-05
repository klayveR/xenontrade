const cp = require('child-process-es6-promise');
const os = require("os");
const path = require("path");
const spawn = require('child_process').spawn;

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
  * Checks whether a package is installed on Linux
  *
  * @param {string} package Package to be checked for installation
  */
  static isPackageInstalled(pkg) {
    return new Promise(function(resolve, reject) {
      // APT based
      cp.exec("dpkg-query -W -f='${Status} ${Version}\n' " + pkg)
      .then((output) => {
        return resolve(true);
      })
      .catch((error) => {
        return cp.exec("rpm -qa | grep " + pkg);
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
  * Checks if Python is installed and added to PATH on windows
  * Currently unused
  */
  static isPythonInstalled() {
    return new Promise(function(resolve, reject) {
      cp.exec("python --version")
      .then((output) => {
        resolve(output)
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
  static focusPathOfExile() {
    var nirCmd = this.fixPathForAsarUnpack(path.join(__dirname, "../", "/resource/executables/nircmdc.exe"));

    if(os.platform() === "linux") {
      cp.exec("poeWId=$(xdotool search --desktop 0 --name 'Path of Exile' | head -n1) && xdotool windowactivate $poeWId");
    } else if(os.platform() === "win32") {
      /**
      * These were used for calling the python script directly, unfortunately that required python installed on the users system
      * var scriptPath = Helpers.fixPathForAsarUnpack(path.join(__dirname, "../", "/resource/python/focus-window.py"));
      * var scriptExecution = spawn("python", [scriptPath]);
      */

      var scriptPath = Helpers.fixPathForAsarUnpack(path.join(__dirname, "../", "/resource/executables/focus-window.exe"));
      var scriptExecution = spawn(scriptPath);
    }
  }

  /**
  * Gets Path of Exile leagues that are non-SSF from GGG API and returns the names
  */
  static getPathOfExileLeagues() {
    return new Promise(function(resolve, reject) {
      request("http://api.pathofexile.com/leagues?type=main", {json: true})
      .then((body) => {
        var leagues = [];
        var leaguesCount = 0;
        // Iterate through each league
        for(var i = 0; i < body.length; i++) {
          var league = body[i];
          var ssf = false;
          leaguesCount++;

          if(!Helpers.isSoloLeague(league)) { leagues.push(league.id); }

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
  static isSoloLeague(league) {
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
  * Convert an Uint8Array to a string
  */
  static uint8arrayToString(data) {
    return String.fromCharCode.apply(null, data);
  }
}

module.exports = Helpers;
