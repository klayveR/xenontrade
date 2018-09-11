const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const Entries = require("./entries.js");
const Helpers = require("./helpers.js");
const Settings = require("./gui.settings.js");

class GUI {
  /**
  * Creates a new GUI object
  *
  * @constructor
  */
  constructor() {
    var self = this;
    this.width = 300;
    this.window = remote.getCurrentWindow();
    this.settings = new Settings();
    this.inSettings = false;

    ipcRenderer.on("focus", function(event) {
      self.onFocus();
    });
  }

  /**
  * Initializes essential parts of the GUI
  */
  initialize() {
    this.initializeButtons();
    this.initializeLock();
    this.settings.initialize();

    this.updateWindowHeight();
  }

  /**
  * Initializes the lock status of the draggable header
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

    $(".menu").find("[data-button='minimize']").click(function(e) {
      e.preventDefault();
      self.window.minimize();
    });

    $(".menu").find("[data-button='close']").click(function(e) {
      e.preventDefault();
      self.close();
    });

    $(".menu").find("[data-button='update']").click(function(e) {
      e.preventDefault();
      app.updateNinja();
    });

    $(".menu").find("[data-button='settings']").click(function(e) {
      e.preventDefault();
      self.toggleSettingsMenu();
    });

    $(".menu").find("[data-button='lock']").click(function(e) {
      e.preventDefault();
      self.toggleLock();
    });

    $(".menu").find("[data-button='close-all']").click(function(e) {
      e.preventDefault();
      self.closeAllEntries();
    });
  }

  /**
  * Closes all entries
  */
  closeAllEntries() {
    $('.entries').empty();

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
    this.inSettings = !this.inSettings;
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
      ipcRenderer.send("resize", self.width, height);
      self.scrollToBottom();
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
      this.window.setAlwaysOnTop(true, "floating", 1);
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
    if(config.get("focusPathOfExile") && !this.inSettings) {
      Helpers.focusGame();
    }
  }
}

module.exports = GUI;
