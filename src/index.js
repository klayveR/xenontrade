"use strict";

const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const windowManager = remote.require('electron-window-manager');
const ioHook = require("iohook");
const clipboardy = require("clipboardy");
const os = require("os");
const log = require('electron-log');

const Config = require("electron-store");
const Helpers = require("./modules/helpers.js");
const NinjaAPI = require("poe-ninja-api-manager");
const Templates = require("./modules/templates.js");
const Pricecheck = require("./modules/pricecheck.js");
const AutoMinimize = require("./modules/auto-minimize.js");
const TextEntry = require("./modules/entries/text-entry.js");

const GUI = require("./modules/gui/gui.js");

global.config = Helpers.createConfig();
global.templates = new Templates();
global.ninjaAPI = new NinjaAPI();
global.entries = {};

class XenonTrade {
  /**
  * Creates a new XenonTrade object
  *
  * @constructor
  */
  constructor() {
    this.poeFocused = false;
    this.autoMinimize = new AutoMinimize();
    this.initialize();
  }

  /**
  * Load templates, then initialize essential parts of the app
  */
  initialize() {
    templates.loadTemplates()
    .then(() => {
      // Initialize GUIs
      GUI.initialize();

      // Initialize Others
      this.initializeAutoMinimize();
      this.initializeHotkeys();
      this.initializeIpcListeners();

      // Check dependencies and update poe.ninja
      this.checkDependencies();
      Pricecheck.updateNinja();
      Pricecheck.updatePoeData();
      return;
    })
    .catch((error) => {
      var errorMsg = "Error initializing app\n" + JSON.stringify(error, null, 4);

      log.error(errorMsg);
      alert(errorMsg);
      windowManager.closeAll();
      return;
    });
  }

  /**
  * Initializes the connection between IPC main and renderer
  */
  initializeIpcListeners() {
    var self = this;

    ipcRenderer.on("focus", function(event) {
      GUI.onFocus();
    });

    ipcRenderer.on("update-available", function(event, info) {
      GUI.showUpdateAvailableEntry(info);
    });

    ipcRenderer.on("update-downloaded", function(event, info) {
      GUI.showUpdateDownloadedEntry(info);
    });
  }

  /**
  * Starts the window listener based on OS
  * The window listener automatically hides the GUI when Path of Exile is not focused
  */
  initializeAutoMinimize() {
    var self = this;

    this.autoMinimize.initialize()
    .then(() => {
      self.autoMinimize.start();
    });
  }

  /**
  * Registers global hotkeys
  */
  initializeHotkeys() {
    var self = this;

    // Register CTRL + C hotkey
    const clipboardShortcut = ioHook.registerShortcut([29, 46], (keys) => {
      if(config.get("pricecheck") && this.poeFocused) {
        // Waiting 100ms before calling the processing method, because the clipboard needs some time to be updated
        var timeout = setTimeout(function() {
          Pricecheck.getPrice(clipboardy.readSync());
        }, 100);
      }
    });

    ioHook.start();
  }

  /**
  * Checks if required packages are installed
  */
  checkDependencies() {
    if(os.platform() === "linux") {
      Helpers.isPackageInstalled("wmctrl")
      .catch((error) => {
        var message = "This tool uses <strong>wmctrl</strong> to focus the Path of Exile window. It is recommended to install it for an optimal experience.";
        new TextEntry("Missing dependency", message, {icon: "fa-exclamation-triangle yellow"}).add();
      });
    }
  }
}

global.app = new XenonTrade();
