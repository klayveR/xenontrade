"use strict";

const ioHook = require("iohook");
const clipboardy = require("clipboardy");
const os = require("os");

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
