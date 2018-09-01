"use strict";

const ioHook = require("iohook");
const clipboardy = require("clipboardy");

const NinjaAPI = require("poe-ninja-api-manager");
const Templates = require("./modules/templates.js");
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
    this.config = {league: "Standard"};

    this.gui = new GUI(this, 300);
    this.templates = new Templates();
    this.ninjaAPI = new NinjaAPI({
      path: __dirname + "/",
      league: this.config.league
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
  * Loads entry template files
  */
  loadTemplates() {
    this.templates.loadTemplates()
    .then(() => {
      return this.loadNinja();
    })
    .catch((error) => {
      return this.gui.entries.addText("Couldn't load templates", error.message, "fa-exclamation-triangle yellow");
    });
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
        var parsedData = parser.parseData();
        this.getItemFromParsedData(parsedData);
      }
    }
  }

  getItemFromParsedData(data) {
    if(data.type !== "Rare" && data.identified === true) {
      this.ninjaAPI.getItem(data.name, {links: data.links, variant: data.variant, relic: data.relic})
      .then((itemArray) => {
        this.onNinjaItemReceive(data, itemArray[0]);
      })
      .catch((error) => {
        console.error(error);
      });
    }
  }

  onNinjaItemReceive(parsedData, item) {
    // this.gui.maximize();
    var entry;

    if(parsedData.type === "Currency" || parsedData.type === "Fragment") {
      entry = this.gui.entries.addCurrency(item, parsedData.stackSize);
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
      var updateEntry = this.gui.entries.addText("Updating...", this.config.league + " league", "fa-info-circle grey", {closeable: false});

      this.ninjaAPI.update()
      .then((result) => {
        updateEntry.close();
        this.gui.entries.addText("Update successful", this.config.league + " league", "fa-check-circle green", {timeout: 5});

        return this.ninjaAPI.save();
      })
      .then((success) => {
        // Save successful
        return success;
      })
      .catch((error) => {
        updateEntry.close();
        return this.gui.entries.addText("Update failed", error.message, "fa-exclamation-triangle yellow");
      })
      .then(() => {
        return this.updating = false;
      });
    }
  }

  /**
  * Loads previously saved poe.ninja data from file
  */
  loadNinja() {
    if(!this.updating && !this.loading) {
      this.loading = true;

      this.ninjaAPI.load()
      .then((success) => {
        return this.gui.entries.addText("Welcome back", "Successfully loaded poe.ninja data", "fa-check-circle green", {timeout: 5});
      })
      .catch((error) => {
        return this.handleNinjaLoadError(error);
      })
      .then(() => {
        return this.loading = false;
      });
    }
  }

  /**
  * If loadNinja() failed to load data, update data
  */
  handleNinjaLoadError(error) {
    this.loading = false;

    // Only show error entry if the file exists and the data couldn't be loaded
    if(error.code !== "ENOENT") {
      this.gui.entries.addText("Failed to load data!", error.message, "fa-exclamation-triangle yellow");
    }

    this.updateNinja();
  }
}

var app = new XenonTrade();
