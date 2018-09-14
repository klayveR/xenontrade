const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;
const os = require("os");

const Helpers = require("./helpers.js");
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
    this.updateEntry = null;

    ipcRenderer.on("focus", function(event) {
      self.onFocus();
    });

    ipcRenderer.on("update-available", function(event, info) {
      self.onUpdateAvailable(info);
    });

    ipcRenderer.on("update-downloaded", function(event, info) {
      self.onUpdateDownloaded(info);
    });
  }

  /**
  * Initializes essential parts of the GUI
  */
  initialize() {
    this._initializeButtons();
    this._initializeLock();
    this._initializeWindowsTransparency();
    this.settings.initialize();

    this.updateWindowHeight();
  }

  /**
  * Initializes the lock status of the draggable header
  */
  _initializeLock() {
    if(config.get("window.locked")) {
      this.toggleLock();
    }
  }

  /**
  * Initializes the header buttons
  */
  _initializeButtons() {
    var self = this;

    $(".menu").find("[data-button='minimize']").click(function() {
      self.window.minimize();
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
  * Registers mouse listeners for the empty transparent entries div, so clickthrough is possible
  */
  _initializeWindowsTransparency() {
    if(os.platform() === "win32") {
      // Set minimum height of entries div to 20px to make the window a total of 38px
      $(".entries").css("min-height", "20px");

      let el = document.getElementsByClassName('entries')[0];
      el.addEventListener("mouseenter", () => {
        // If entries div is empty
        if (!$.trim($(".entries").html())) {
          this.window.setIgnoreMouseEvents(true, {forward: true})
        }
      });

      el.addEventListener("mouseleave", () => {
        this.window.setIgnoreMouseEvents(false)
      });
    } else {
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

    $(".entries").toggleClass("hidden");
    $(".settings").toggleClass("hidden");

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
    setTimeout(function() {
      var height = $(".container").height();
      ipcRenderer.send("resize", 300, height);
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
    if(this.window.isMinimized()) {
      this.window.show();
      Helpers.setAlwaysOnTop();
      this.updateWindowHeight();
    }
  }

  /**
  * Hides the window
  */
  minimize() {
    if(this.window.isVisible()) {
      this.window.minimize();
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
    setTimeout(function() {
      if(config.get("focusPathOfExile") && !this.settingsMenuActive && !this.overrideFocus) {
        Helpers.setAlwaysOnTop();
        Helpers.focusGame();
      }
    }, 20);
  }

  /**
  * Called when a new update is available
  */
  onUpdateAvailable(info) {
    var self = this;

    this.updateEntry = new TextEntry("Update available", "A new version of XenonTrade (<span>v" + info.version + "</span>) is available.<br /><i class='fas fa-arrow-right'></i> <span data-update='download'>Update now</span>", {icon: "fa-box blue"});
    this.updateEntry.add();

    $(".entry[data-id='" + this.updateEntry.getId() + "']").find("[data-update='download']").click(function() {
      ipcRenderer.send("download-update");
      $(".menu").find("[data-button='download']").removeClass("hidden");

      self.updateEntry.setTitle("Downloading <span>v" + info.version + "</span>...");
      self.updateEntry.setText("");
      self.updateEntry.enableClose(false);
    });
  }

  /**
  * Called when new update has been downloaded and is ready to install
  */
  onUpdateDownloaded(info) {
    if(this.updateEntry != null) {
      this.updateEntry.setTitle("Update downloaded");
      this.updateEntry.setText("XenonTrade <span>v" + info.version + "</span> has been downloaded. It will be automatically installed after closing XenonTrade.<br /><i class='fas fa-arrow-right'></i> <span data-update='install'>Install now</span>");
      this.updateEntry.enableClose();
    }

    $(".menu").find("[data-button='download']").addClass("hidden");

    $(".entry[data-id='" + this.updateEntry.getId() + "']").find("[data-update='install']").click(function() {
      ipcRenderer.send("install-update");
    });
  }
}

module.exports = GUI;
