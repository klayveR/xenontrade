const electron = require("electron");
const { ipcRenderer } = electron;
const remote = electron.remote;
const windowManager = remote.require('electron-window-manager');
const os = require("os");

const Helpers = require("../helpers.js");
const Pricecheck = require("../pricecheck.js");
const SettingsGUI = require("./settings.js");

class GUI {
  /**
  * Getter for name of the GUI
  */
  static get NAME() {
    return "main";
  }

  /**
  * Initializes essential parts of the GUI
  */
  static initialize() {
    GUI._initializeButtons();
    GUI._initializeTransparency();
    GUI._initializeWindowListeners();
    GUI._applyConfigValues();

    // Create the settings GUI
    SettingsGUI.create();

    Helpers.setAlwaysOnTop();
    GUI.updateWindowHeight();
  }

  /**
  * Listens for events from other windows
  */
  static _initializeWindowListeners() {
    // Reset menu settings button color on hide
    windowManager.bridge.on('hide', function(event) {
      if(event.window === "settings") {
        // Call onEntriesChange here, in case all entries where closed while settings window was open
        GUI.onEntriesChange();
        GUI.toggleMenuButtonColor("settings", true);
      }
    });

    // Update Ninja when the league is changed in settings
    windowManager.bridge.on('league-change', function(event) {
      Pricecheck.updateNinja();
    });

    // Update PoeData when the the according provider is selected in the settings
    windowManager.bridge.on('provider-change', function(event) {
      if (event.provider == "poetrade") {
        Pricecheck.updatePoeData();
      }
    });

    // Adjust window size based on scale factor when it's changed
    windowManager.bridge.on('zoomfactor-change', function(event) {
      GUI.setZoomFactor(event.value);
    });

    // Adjust max height when it's changed
    windowManager.bridge.on('maxheight-change', function(event) {
      GUI.setMaxHeight(event.value);
    });

    // Set always on top when shown
    windowManager.bridge.on('show', function(event) {
      Helpers.setAlwaysOnTop(event.window, true);
    });
  }

  /**
  * Gets the values from the config and applies them to the GUI
  */
  static _applyConfigValues() {
    if(config.get("window.locked")) {
      GUI.toggleLock();
    }

    GUI.setMaxHeight(config.get("maxHeight"));
    GUI.setZoomFactor(config.get("window.zoomFactor"));
  }

  /**
  * Initializes the header buttons
  */
  static _initializeButtons() {
    $(".menu").find("[data-button='minimize']").click(function() {
      GUI.hide();
    });

    $(".menu").find("[data-button='close']").click(function() {
      GUI.close();
    });

    $(".menu").find("[data-button='update']").click(function() {
      Pricecheck.updateNinja();
    });

    $(".menu").find("[data-button='settings']").click(function() {
      GUI.toggleSettingsWindow();
    });

    $(".menu").find("[data-button='lock']").click(function() {
      GUI.toggleLock();
    });

    $(".menu").find("[data-button='close-all']").click(function() {
      GUI.closeAllEntries();
    });
  }

  /**
  * TODO: Fix blocking transparent area below menu bar, if no entries available
  */
  static _initializeTransparency() {
    if(os.platform() !== "win32") {
      // If OS is not Windows, add background color to body to prevent white flash on new entry/close entry
      $("body").css("background-color", "#202630");
    }
  }

  /**
  * Saves position to config and closes all windows
  */
  static close() {
    var windowPosition = windowManager.get(GUI.NAME).object.getPosition();
    config.set("window.x", windowPosition[0]);
    config.set("window.y", windowPosition[1]);

    windowManager.closeAll();
  }

  /**
  * Shows the window and sets it on top again
  *
  * @param {boolean} [automatic=false] Whether this function was called automatically and not by the user
  */
  static show(automatic = false) {
    var win = windowManager.get(GUI.NAME).object;

    // If this function was called automatically, don't show if there are no entries
    // and the hide menu option is enabled
    if(automatic && config.get("hideMenu") && !GUI.hasEntries()) {
      return;
    }

    if(!win.isVisible()) {
      if(win.isMinimized()) {
        win.restore();
      } else {
        win.showInactive();
      }

      Helpers.setAlwaysOnTop();
      GUI.updateWindowHeight();
    }
  }

  /**
  * Hides the window
  *
  * @param {boolean} [automatic=false] Whether this function was called automatically and not by the user
  */
  static hide(automatic = false) {
    var settingsWin = windowManager.get(SettingsGUI.NAME).object;
    var win = windowManager.get(GUI.NAME).object;

    // If settings window is visible, override this
    if(automatic === true && settingsWin.isVisible()) {
      return;
    }

    win.hide();
    if(settingsWin.isVisible()) {
      settingsWin.hide();
    }
  }

  /**
  * Toggles the header lock and saves to config
  */
  static toggleLock() {
    $("[data-button='lock']").find("i").toggleClass("fa-unlock fa-lock");
    $(".container > .menu").toggleClass("draggable");

    var configLock = !config.get("window.locked");

    config.set("window.locked", configLock);
  }

  /**
  * Toggles a menu buttons icon color
  */
  static toggleMenuButtonColor(button, state) {
    var button = $("[data-button='" + button + "']").find("i");

    if(typeof state === "undefined") {
      button.toggleClass("grey");
    } else {
      button.toggleClass("grey", state);
    }
  }

  /**
  * Shows/hides the settings window
  */
  static toggleSettingsWindow() {
    var settingsWindow = windowManager.get("settings").object;

    if(settingsWindow) {
      if(!settingsWindow.isVisible()) {
        GUI.toggleMenuButtonColor("settings", false);

        if(settingsWindow.isMinimized()) {
          settingsWindow.restore();
        }

        SettingsGUI.show();
      } else {
        GUI.toggleMenuButtonColor("settings", true);
        SettingsGUI.hide();
      }
    }
  }

  /**
  * Updates the window height based on contents
  */
  static updateWindowHeight() {
    // There needs to be a slight delay before updating the window height
    // because in some cases the last entry can get cut off without a timeout
    // if the entries height is dynamically changed after appending
    var timeout = setTimeout(function() {
      var zoomFactor = config.get("window.zoomFactor");
      var height = $(".container").height() * zoomFactor;
      ipcRenderer.send("resize", 300 * zoomFactor, height);
    }, 50);
  }

  /**
  * Set the maximum height of the entries div
  *
  * @param {number} value Maximum height value
  */
  static setMaxHeight(value) {
    var zoomFactor = config.get("window.zoomFactor");
    var height = value / zoomFactor;

    $(".entries").css("max-height", height + "px");
    GUI.updateWindowHeight();
  }

  /**
  * Set the zoom factor of the window
  *
  * @param {number} value Zoom factor value
  */
  static setZoomFactor(value) {
    $(".container").css("zoom", value);
    GUI.setMaxHeight(config.get("maxHeight"));

    GUI.updateWindowHeight();
  }

  /**
  * Scrolls to the bottom of the entries div
  */
  static scrollToBottom() {
    $('.entries').scrollTop($('.entries')[0].scrollHeight);
  }

  /**
  * Called when window is focused
  */
  static onFocus() {
    var timeout = setTimeout(function() {
      var activeElement = $(document.activeElement);
      var currentWindow = windowManager.getCurrent();

      // If...
      if(config.get("focusPathOfExile") // ... Always focus Path of Exile is enabled
      && currentWindow.name === GUI.NAME // ... Current window is main GUI
      && !windowManager.get(SettingsGUI.NAME).object.isVisible() // ... Settings GUI is not visible
      && !activeElement.is("textarea")) { // ... Focused element is not a textarea
        Helpers.focusGame();
        Helpers.setAlwaysOnTop();
      }
    }, 20);
  }

  /**
  * Called when an entry is added or closed and hides the window if
  * hide menu setting is enabled and no entries available
  */
  static onEntriesChange() {
    var win = windowManager.get(GUI.NAME).object;

    if(config.get("hideMenu")) {
      var hasEntries = GUI.hasEntries();

      if(!hasEntries && win.isVisible()) {
        GUI.hide(true);
      } else
      if(hasEntries && !win.isVisible()) {
        GUI.show(true);
      }
    }
  }

  /**
  * Returns `true` if the entries div has entries
  *
  * @returns {boolean}
  */
  static hasEntries() {
    if(!$.trim($(".entries").html())) {
      return false;
    }

    return true;
  }

  /**
  * Closes all entries (if they're closable)
  */
  static closeAllEntries() {
    for(var entryIndex in entries) {
      var entry = entries[entryIndex];

      if(entry.isCloseable()) {
        entry.close();
      }
    }

    GUI.updateWindowHeight();
  }

  /**
  * Flashes the error icon in the menu bar
  *
  * @param {string} icon Font awesome icon class
  */
  static flashIcon(icon = "fas fa-exclamation-circle red") {
    var statusButton = $(".menu").find("[data-button='status']");
    var statusIcon = statusButton.find("i");

    statusButton.stop(true, true);
    statusIcon.removeClass();
    statusIcon.addClass(icon);
    statusButton.show().delay(1000).fadeOut("slow");
  }

  /**
  * Called when a new update is available
  *
  * @param {Object} info Update information
  */
  static showUpdateAvailableEntry(info) {
    var updateEntry = new TextEntry("Update available", "A new version of XenonTrade (<span>v" + info.version + "</span>) is available.<br /><i class='fas fa-arrow-right'></i> <span data-entry-link='download'>Update now</span>", {icon: "fa-box blue"});
    updateEntry.setId("update-entry");
    updateEntry.add();

    GUI.flashIcon("fas fa-box blue");

    $(".entry[data-id='" + updateEntry.getId() + "']").find("[data-entry-link='download']").click(function() {
      ipcRenderer.send("download-update");

      updateEntry.setTitle("Downloading <span>v" + info.version + "</span>...");
      updateEntry.setText("");
      updateEntry.setCloseable(false);
    });
  }

  /**
  * Called when new update has been downloaded and is ready to install
  *
  * @param {Object} info Update information
  */
  static showUpdateDownloadedEntry(info) {
    if(entries.hasOwnProperty("update-entry")) {
      var updateEntry = entries["update-entry"];
      updateEntry.setTitle("Update downloaded");
      updateEntry.setText("XenonTrade <span>v" + info.version + "</span> has been downloaded. It will be automatically installed after closing XenonTrade.<br /><i class='fas fa-arrow-right'></i> <span data-entry-link='install'>Install now</span>");
      updateEntry.setCloseable();

      GUI.flashIcon("fas fa-download blue");

      $(".entry[data-id='" + updateEntry.getId() + "']").find("[data-entry-link='install']").click(function() {
        ipcRenderer.send("install-update");
      });
    }
  }
}

module.exports = GUI;
