const { exec } = require("child_process");
const os = require("os");

class Helpers {
  static isFloat(n){
    return Number(n) === n && n % 1 !== 0;
  }

  static isEmpty(obj) {
    for(var key in obj) {
      if(obj.hasOwnProperty(key)) {
        return false;
      }
    }

    return true;
  }

  static focusPathOfExile() {
    var command = "";

    if(os.platform() === "linux") {
      exec("poeWId=$(xdotool search --desktop 0 --name 'Path of Exile' | head -n1) && xdotool windowactivate $poeWId");
    } else if(os.platform() === "windows") {
      command = "nircmd.exe win activate title 'Path of Exile'";
    }
  }

  static isPackageInstalled(pkg, callback) {
    if(os.platform() === "linux") {
      exec("dpkg -s " + pkg, function(error, stdout, stderr) {
        if(stdout.includes("install ok")) {
          callback(error, true);
        } else {
          callback(error, false);
        }
      });
    }
  }

  // HERES SOMETHING INTERESTING: xprop -id $(xprop -root 32x "\t$0" _NET_ACTIVE_WINDOW | cut -f 2) WM_CLASS WM_NAME
  static getFocusedWindowName(callback) {
    if(os.platform() === "linux") {
      exec("xdotool getwindowfocus getwindowname", function(error, stdout, stderr) {
        var window = stdout;

        // Replace line breaks
        window = window.replace(/\r?\n|\r/g, "");
        callback(error, window);
      });
    }
  }
}

module.exports = Helpers;
