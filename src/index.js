"use strict";

const ioHook = require("iohook");
const clipboardy = require("clipboardy");
const os = require("os");

const Config = require("electron-store");
const NinjaAPI = require("poe-ninja-api-manager");
const Templates = require("./modules/templates.js");
const AutoMinimize = require("./modules/auto-minimize.js");
const Helpers = require("./modules/helpers.js");
const Parser = require("./modules/parser.js");
const GUI = require("./modules/gui.js");
const PoePrices = require("./modules/poeprices.js");

const ItemEntry = require("./modules/entries/item-entry.js");
const CurrencyEntry = require("./modules/entries/currency-entry.js");
const TextEntry = require("./modules/entries/text-entry.js");
const RareItemEntry = require("./modules/entries/rare-item-entry.js");

global.config = Helpers.createConfig();
global.templates = new Templates();
global.gui = new GUI();
global.ninjaAPI = new NinjaAPI();
global.entries = {};

class XenonTrade {
  /**
  * Creates a new XenonTrade object
  *
  * @constructor
  */
  constructor() {
    this.updating = false;
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
      gui.initialize();
      this.initializeAutoMinimize();
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
        var message = "This tool uses <strong>xdotool</strong> to focus the Path of Exile window. It is recommended to install it for an optimal experience.";
        new TextEntry("Missing dependency", message, {icon: "fa-exclamation-triangle yellow"}).add();
      });
    }
  }

  /**
  * Checks if the copied content is item data from Path of Exile, parses it and adds an entry in the GUI
  */
  onClipboard() {
    var clipboard = clipboardy.readSync();
    var parser = new Parser(clipboard);

    if(parser.isPathOfExileData()) {
      this.getItem(parser);
    }
  }

  /**
  * Gets the item based on the parsed data
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  getItem(parser) {
    var itemType = parser.getItemType();

    // If identified...
    if(parser.isIdentified() === true) {
      // If rare, get poeprices data
      if(itemType === "Rare") {
        this._getRareItem(parser);
      } else if(!this.updating) {
        // If not rare, get ninja data
        if(ninjaAPI.hasData(config.get("league"))) {
          if(itemType !== "Magic") {
            this._getNinjaItem(parser);
          }
        } else {
          new TextEntry("No data", "There's no data for " + config.get("league") + ". You should update before attempting to price check another item.", {icon: "fa-exclamation-triangle yellow", timeout: 10}).add();
        }
      }
    }
  }

  /**
  * Gets the item based on the parsed data from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  _getNinjaItem(parser) {
    ninjaAPI.getItem(parser.getName(), {league: config.get("league"), links: parser.getLinks(), variant: parser.getVariant(), relic: parser.isRelic(), baseType: parser.getBaseType()})
    .then((itemArray) => {
      this.onNinjaItemReceive(parser, itemArray[0]);
    })
    .catch((error) => {
      // No item received, not much you can do, huh
    });
  }

  /**
  * Gets the item price from poeprices
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  _getRareItem(parser) {
    var entry = new TextEntry("Getting price prediction...", {closeable: false});
    entry.add();

    PoePrices.request(parser.getItemText())
    .then((result) => {
      entry.close();
      new RareItemEntry(result, parser).add();
    })
    .catch((error) => {
      entry.setTitle("Failed to get price prediction");
      entry.setText(error.message);
      entry.setIcon("fa-exclamation-triangle yellow");
      entry.enableClose();
    });
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
      new CurrencyEntry(item, parser).add();
    } else {
      new ItemEntry(item, parser).add();
    }
  }

  /**
  * Updates and saves poe.ninja data
  */
  updateNinja() {
    if(!this.updating) {
      this.updating = true;
      gui.toggleUpdate();

      var updateEntry = new TextEntry("Updating poe.ninja prices...", {closeable: false});
      updateEntry.add();

      ninjaAPI.update({league: config.get("league")})
      .then((result) => {
        updateEntry.setTitle("Update successful");
        updateEntry.setIcon("fa-check-circle green");
        updateEntry.enableClose();
        updateEntry.enableAutoClose(10);
      })
      .catch((error) => {
        updateEntry.setTitle("Update failed");
        updateEntry.setText(error.message);
        updateEntry.enableClose();
        updateEntry.setIcon("fa-exclamation-triangle yellow");
      })
      .then(() => {
        gui.toggleUpdate();
        return this.updating = false;
      });
    }
  }
}

global.app = new XenonTrade();
