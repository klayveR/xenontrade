const { exec } = require("child_process");
const os = require("os");

class ExecHelpers {
  // TODO: jsdocs
  static focusPathOfExile() {
    var command = "";

    if(os.platform() === "linux") {
      command = "poeWId=$(xdotool search --desktop 0 --name 'Path of Exile' | head -n1) && xdotool windowactivate $poeWId";
    } else if(os.platform() === "windows") {
      command = "nircmd.exe win activate title 'Path of Exile'";
    }

    exec(command);
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

module.exports = ExecHelpers;
