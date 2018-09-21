const remote = require("electron").remote;
const os = require("os");

const Helpers = require("../helpers.js");
const Settings = require("./settings.js");

class GUI {
  /**
  * Creates a new GUI object
  *
  * @constructor
  */
  constructor() {
    var self = this;
    this.window = remote.getCurrentWindow();
    this.settings = new Settings();
    this.settingsMenuActive = false;
    this.overrideFocus = false;
  }

  /**
  * Initializes essential parts of the GUI
  */
  initialize() {
    this.initializeButtons();
    this.initializeLock();
    this.initializeWindowsTransparency();
    this.settings.initialize();

    this.updateWindowHeight();
  }

  /**
  * Initializes the lock setting from the config
  */
  initializeLock() {
    if(config.get("window.locked")) {
      this.toggleLock();
    }
  }

  /**
  * Initializes the header buttons
  */
  initializeButtons() {
    var self = this;

    $(".menu").find("[data-button='minimize']").click(function() {
      self.window.hide();
    });

    $(".menu").find("[data-button='close']").click(function() {
      self.close();
    });

    $(".menu").find("[data-button='update']").click(function() {
      app.updateNinja();
    });

    $(".menu").find("[data-button='settings']").click(function() {
      self.toggleSettingsMenu();
    });

    $(".menu").find("[data-button='lock']").click(function() {
      self.toggleLock();
    });

    $(".menu").find("[data-button='close-all']").click(function() {
      self.closeAllEntries();
    });
  }

  /**
  * TODO: Fix blocking transparent area below menu bar, if no entries available
  */
  initializeWindowsTransparency() {
    if(os.platform() !== "win32") {
      // If OS is not Windows, add background color to body to prevent white flash on new entry/close entry
      $("body").css("background-color", "#202630");
    }
  }

  /**
  * Closes all entries (if they're closable)
  */
  closeAllEntries() {
    for(var entryIndex in entries) {
      var entry = entries[entryIndex];

      if(entry.isCloseable()) {
        entry.close();
      }
    }

    this.updateWindowHeight();
  }

  /**
  * Toggles the header lock and saves to config
  */
  toggleLock() {
    $("[data-button='lock']").find("i").toggleClass("fa-unlock fa-lock");
    $(".container > .menu").toggleClass("draggable");

    var configLock = !config.get("window.locked");

    config.set("window.locked", configLock);
  }

  /**
  * Toggles the header update icon color
  */
  toggleUpdate() {
    $("[data-button='update']").find("i").toggleClass("grey");
  }

  /**
  * Toggles between settings and entries
  */
  toggleSettingsMenu() {
    this.settingsMenuActive = !this.settingsMenuActive;
    $("[data-button='settings']").find("i").toggleClass("grey");

    $(".entries").toggle();
    $(".settings").toggle();

    this.updateWindowHeight();
  }

  /**
  * Updates the window height based on contents
  */
  updateWindowHeight() {
    var self = this;

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
  * Saves position to config and closes GUI
  */
  close() {
    var windowPosition = this.window.getPosition();
    config.set("window.x", windowPosition[0]);
    config.set("window.y", windowPosition[1]);

    this.window.close();
  }

  /**
  * Shows the window and sets it on top again
  */
  show() {
    if(!this.window.isVisible()) {
      if(this.window.isMinimized()) {
        this.window.restore();
      } else {
        this.window.showInactive();
      }

      Helpers.setAlwaysOnTop();
      this.updateWindowHeight();
    }
  }

  /**
  * Hides the window
  */
  minimize() {
    if(this.window.isVisible()) {
      this.window.hide();
    }
  }

  /**
  * Scrolls to the bottom of the entries div
  */
  scrollToBottom() {
    $('.entries').scrollTop($('.entries')[0].scrollHeight);
  }

  /**
  * Called when window is focused
  */
  onFocus() {
    var self = this;

    var timeout = setTimeout(function() {
      if(config.get("focusPathOfExile") && !self.settingsMenuActive && !self.overrideFocus) {
        Helpers.setAlwaysOnTop();
        Helpers.focusGame();
      }
    }, 20);
  }

  /**
  * Flashes the error icon in the menu bar
  */
  flashErrorIcon() {
    var statusButton = $(".menu").find("[data-button='status']");
    var statusIcon = statusButton.find("i");

    statusIcon.removeClass();
    statusIcon.addClass("fas fa-exclamation-circle red");
    statusButton.show().delay(1000).fadeOut("slow");
  }

  /**
  * Called when a new update is available
  *
  * @param {Object} info Update information
  */
  showUpdateAvailableEntry(info) {
    var self = this;

    var updateEntry = new TextEntry("Update available", "A new version of XenonTrade (<span>v" + info.version + "</span>) is available.<br /><i class='fas fa-arrow-right'></i> <span data-entry-link='download'>Update now</span>", {icon: "fa-box blue"});
    updateEntry.setId("update-entry");
    updateEntry.add();

    $(".entry[data-id='" + updateEntry.getId() + "']").find("[data-entry-link='download']").click(function() {
      ipcRenderer.send("download-update");
      $(".menu").find("[data-button='download']").show();

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
  showUpdateDownloadedEntry(info) {
    if(entries.hasOwnProperty("update-entry")) {
      var updateEntry = entries["update-entry"];
      updateEntry.setTitle("Update downloaded");
      updateEntry.setText("XenonTrade <span>v" + info.version + "</span> has been downloaded. It will be automatically installed after closing XenonTrade.<br /><i class='fas fa-arrow-right'></i> <span data-entry-link='install'>Install now</span>");
      updateEntry.setCloseable();

      $(".menu").find("[data-button='download']").hide();

      $(".entry[data-id='" + updateEntry.getId() + "']").find("[data-entry-link='install']").click(function() {
        ipcRenderer.send("install-update");
      });
    }
  }
}

module.exports = GUI;
