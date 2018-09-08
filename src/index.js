"use strict";

const ioHook = require("iohook");
const clipboardy = require("clipboardy");
const os = require("os");

const Config = require("electron-store");
const NinjaAPI = require("poe-ninja-api-manager");
const Templates = require("./modules/templates.js");
const LinuxWL = require("./modules/listeners/linux-window-listener.js");
const WindowsWL = require("./modules/listeners/windows-window-listener.js");
const Helpers = require("./modules/helpers.js");
const Parser = require("./modules/parser.js");
const Entries = require("./modules/entries.js");
const GUI = require("./modules/gui.js");

global.config = new Config();
global.templates = new Templates();
global.gui = new GUI();
global.ninjaAPI = new NinjaAPI();

class XenonTrade {
  /**
  * Creates a new XenonTrade object
  *
  * @constructor
  */
  constructor() {
    this.updating = false;
    this.poeFocused = false;
    this.windowsWindowListener = new WindowsWL();
    this.linuxWindowListener = new LinuxWL();

    this.initialize();
  }

  /**
  * Load templates, then initialize essential parts of the app
  */
  initialize() {
    this.initializeExit();
    templates.loadTemplates()
    .then(() => {
      gui.initialize();
      this.initializeWindowListener();
      this.initializeHotkeys();
      this.checkDependencies();
      return this.updateNinja();
    })
    .catch((error) => {
      alert("Error initializing app\n" +  error);
      return gui.window.close();
    });
  }

  /**
  * Prepares the app for exit, kill child processes
  */
  initializeExit() {
    var self = this;
    var cleanExit = function() { process.exit() };

    process.on('SIGINT', cleanExit); // catch ctrl-c
    process.on('SIGTERM', cleanExit); // catch kill

    process.on('exit', function() {
      self.windowsWindowListener.stop();
    });
  }

  /**
  * Starts the window listener based on OS
  * The window listener automatically hides the GUI when Path of Exile is not focused
  */
  initializeWindowListener() {
    if(os.platform() === "linux") {
      this.linuxWindowListener.initialize()
      .then(() => {
        this.linuxWindowListener.start();
      });
    } else
    if(os.platform() === "win32") {
      this.windowsWindowListener.start();
    }
  }

  /**
  * Registers global hotkeys
  */
  initializeHotkeys() {
    var self = this;

    // Register CTRL + C hotkey
    const clipboardShortcut = ioHook.registerShortcut([29, 46], (keys) => {
      if(config.get("pricecheck")) {
        // Waiting 100ms before calling the processing method, because the clipboard needs some time to be updated
        setTimeout(function() {
          self.onClipboard();
        }, 100);
      }
    });

    ioHook.start();
  }

  /**
  * Checks if required packages are installed
  */
  checkDependencies() {
    var self = this;

    if(os.platform() === "linux") {
      Helpers.isPackageInstalled("xdotool")
      .catch((error) => {
        return Entries.addText("Missing dependency", "This tool uses <strong>xdotool</strong> to focus the Path of Exile window. It is recommended to install it for an optimal experience.", "fa-exclamation-triangle yellow");
      });
    }
  }

  /**
  * Checks if the copied content is item data from Path of Exile, parses it and adds an entry in the GUI
  */
  onClipboard() {
    if(!this.updating) {
      var clipboard = clipboardy.readSync();
      var parser = new Parser(clipboard);

      if(parser.isPathOfExileData()) {
        this.getItem(parser);
      }
    }
  }

  /**
  * Gets the item based on the parsed data from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  getItem(parser) {
    var itemType = parser.getItemType();

    if(ninjaAPI.hasData(config.get("league"))) {
      if(!["Magic", "Rare"].includes(parser.getItemType()) && parser.isIdentified() === true) {
        ninjaAPI.getItem(parser.getName(), {league: config.get("league"), links: parser.getLinks(), variant: parser.getVariant(), relic: parser.isRelic(), baseType: parser.getBaseType()})
        .then((itemArray) => {
          this.onNinjaItemReceive(parser, itemArray[0]);
        })
        .catch((error) => {
          // No item received, not much you can do, huh
        });
      }
    } else {
      Entries.addText("No data", "There's no data for " + config.get("league") + ". You should update before attempting to price check another item.", "fa-exclamation-triangle yellow", {timeout: 10});
    }
  }

  /**
  * Adds a new entry for the item that has been received from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {Object} item Item object from poe.ninja
  */
  onNinjaItemReceive(parser, item) {
    var itemType = parser.getItemType();

    if(itemType === "Currency" || itemType === "Fragment") {
      Entries.addCurrency(item, parser);
    } else {
      Entries.addItem(item, parser);
    }
  }

  /**
  * Updates and saves poe.ninja data
  */
  updateNinja() {
    if(!this.updating) {
      this.updating = true;
      gui.toggleUpdate();
      var updateEntry = Entries.addTitle("Updating poe.ninja prices...", "fa-info-circle grey");

      ninjaAPI.update({league: config.get("league")})
      .then((result) => {
        updateEntry.close();
        Entries.addTitle("Update successful 🎉", "fa-check-circle green", {timeout: 10});
      })
      .catch((error) => {
        updateEntry.close();
        return Entries.addText("Failed to update", error.message, "fa-exclamation-triangle yellow");
      })
      .then(() => {
        gui.toggleUpdate();
        return this.updating = false;
      });
    }
  }
}

global.app = new XenonTrade();
