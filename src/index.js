"use strict";

const ioHook = require("iohook");
const clipboardy = require("clipboardy");
const os = require("os");

const Config = require('electron-store');
const NinjaAPI = require("poe-ninja-api-manager");
const Templates = require("./modules/templates.js");
const Helpers = require("./modules/helpers.js");
const Parser = require("./modules/parser.js");
const GUI = require("./modules/gui.js");

class XenonTrade {
  /**
  * Creates a new XenonTrade object
  *
  * @constructor
  */
  constructor() {
    this.updating = false;
    this.loading = false;

    // Set config defaults
    this.config = new Config({
      defaults: {
        league: "Standard",
        timeouts: {
          currency: 0,
          divinationCard: 0,
          map: 0
        }
      }
    });

    this.gui = new GUI(this, 300);
    this.templates = new Templates();
    this.ninjaAPI = new NinjaAPI({
      path: __dirname + "/",
      league: this.config.get("league")
    });

    this.initialize();
  }

  /**
  * Initializes essential parts of the app
  */
  initialize() {
    this.registerHotkeys();
    this.loadTemplates();
    ioHook.start();
  }

  /**
  * Loads entry template files, on success updates poe.ninja and checks dependencies
  */
  loadTemplates() {
    this.templates.loadTemplates()
    .then(() => {
      this.checkDependencies();
      return this.updateNinja();
    })
    .catch((error) => {
      alert("Couldn't load templates", error.message);
      return this.gui.window.close();
    });
  }

  /**
  * Checks if required packages are installed
  */
  checkDependencies() {
    var self = this;

    if(os.platform() === "linux") {
      Helpers.isPackageInstalled("xdotool", function(error, isInstalled) {
        if(error) {
          self.gui.entries.addText("Error checking dependencies", error.message, "fa-exclamation-circle red");
        }

        if(!isInstalled) {
          self.gui.entries.addText("Missing dependency", "This tool uses <i>xdotool</i> to focus Path of Exile. The price checking feature works without this, but it is recommended to install it for an optimal experience.", "fa-exclamation-triangle yellow");
        }
      })
    }
  }

  /**
  * Registers global hotkeys
  */
  registerHotkeys() {
    var self = this;

    // Register CTRL + C hotkey
    const clipboardShortcut = ioHook.registerShortcut([29, 46], (keys) => {
      // Waiting 100ms before calling the processing method, because the clipboard needs some time to be updated
      setTimeout(function() {
        self.onClipboard();
      }, 100);
    });
  }

  /**
  * Checks if the copied content is item data from Path of Exile, parses it and adds an entry in the GUI
  */
  onClipboard() {
    if(!this.updating && !this.loading) {
      var clipboard = clipboardy.readSync();
      var parser = new Parser(clipboard);

      if(parser.isPathOfExileData()) {
        this.getItem(parser);
      }
    }
  }

  getItem(parser) {
    var itemType = parser.getItemType();

    if(itemType !== "Magic" && itemType !== "Rare" && parser.isIdentified() === true) {
      console.log("Basetype", parser.getBaseType());

      this.ninjaAPI.getItem(parser.getName(), {links: parser.getLinks(), variant: parser.getVariant(), relic: parser.isRelic(), baseType: parser.getBaseType()})
      .then((itemArray) => {
        this.onNinjaItemReceive(parser, itemArray[0]);
      })
      .catch((error) => {
        console.error(error);
      });
    }
  }

  onNinjaItemReceive(parser, item) {
    var itemType = parser.getItemType();
    var entry;

    if(itemType === "Currency" || itemType === "Fragment") {
      entry = this.gui.entries.addCurrency(item, parser.getStackSize());
    } else {
      entry = this.gui.entries.addItem(item);
    }
  }

  /**
  * Updates and saves poe.ninja data
  */
  updateNinja() {
    if(!this.updating && !this.loading) {
      this.updating = true;
      var updateEntry = this.gui.entries.addTitle("Updating...", "fa-info-circle grey", {closeable: false});

      this.ninjaAPI.update()
      .then((result) => {
        updateEntry.close();
        this.gui.entries.addTitle("Update successful!", "fa-check-circle green", {timeout: 5});
      })
      .catch((error) => {
        updateEntry.close();
        return this.gui.entries.addText("Update failed!", error.message, "fa-exclamation-triangle yellow");
      })
      .then(() => {
        return this.updating = false;
      });
    }
  }
}

var app = new XenonTrade();
