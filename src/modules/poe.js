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

class PathOfExile {
  /**
  * Focuses the Path of Exile window based on the OS
  */
  static focus() {
    if(os.platform() === "linux") {
      PathOfExile._focusOnLinux();
    } else if(os.platform() === "win32") {
      PathOfExile._focusOnWindows();
    }
  }

  /**
  * Focuses the game on Linux
  */
  static _focusOnLinux() {
    cp.exec("wmctrl -F -a 'Path of Exile'")
    .catch((error) => {
      console.error("Tried to focus Path of Exile but failed, either wmctrl is not installed or Path of Exile is not running");
    });
  }

  /**
  * Focuses the game on Windows
  */
  static _focusOnWindows() {
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
  static getLeagues() {
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

          if(!PathOfExile._isSoloLeague(league)) { leagues.push(league.id); }

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
  * Focuses Path of Exile and sends a message in chat
  *
  * @param {string} message Chat message
  * @param {boolean} [send=true] Whether the message should be sent automatically
  */
  static chat(message, send = true) {
    PathOfExile.focus();

    var previousClipboard = clipboard.readText();
    clipboard.writeText(message);

    var intervalCount = 0;
    var interval = setInterval(function() {
      // Send chat message if PoE is focused
      if(app.poeFocused && clipboard.readText() === message) {
        clearInterval(interval);
        robot.setKeyboardDelay(0);
        robot.keyToggle("enter", "down");
        robot.keyToggle("enter", "up");
        robot.keyToggle("control", "down");
        robot.keyToggle("v", "down");
        robot.keyToggle("v", "up");
        robot.keyToggle("control", "up");

        if(send) {
          robot.keyToggle("enter", "down");
          robot.keyToggle("enter", "up");
        }

        // Restore clipboard content
        var timeout = setTimeout(function() {
          clipboard.writeText(previousClipboard);
        }, 100);
      }

      // Clear interval if focusing Path of Exile is taking too long
      if(intervalCount >= 500) {
        clearInterval(interval);
        clipboard.writeText(previousClipboard);
      }

      intervalCount++;
    }, 0);
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
}

module.exports = PathOfExile;
