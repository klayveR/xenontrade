"use strict";

const ioHook = require("iohook");
const clipboardy = require("clipboardy");
const os = require("os");
const request= require("request-promise-native");

const Config = require("electron-store");
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

    // Set config defaults
    this.config = new Config({
      defaults: {
        league: "Delve",
        timeouts: {
          currency: 0,
          item: 0
        },
        focusPathOfExile: true,
        window: {
          x: 0,
          y: 0
        }
      }
    });

    this.gui = new GUI(this, 300);
    this.templates = new Templates();
    this.ninjaAPI = new NinjaAPI();

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
      this.loadLeagues();
      return this.updateNinja();
    })
    .catch((error) => {
      alert("Couldn't load templates\n" + error.message);
      return this.gui.window.close();
    });
  }

  /**
  * Loads entry template files, on success updates poe.ninja and checks dependencies
  */
  loadLeagues() {
    request("http://api.pathofexile.com/leagues?type=main", {json: true})
    .then((body) => {
      var leagues = [];
      var leaguesCount = 0;
      // Iterate through each league
      for(var i = 0; i < body.length; i++) {
        var league = body[i];
        var ssf = false;
        leaguesCount++;

        // Check if any rule indicates that this is an SSF league
        if(league.rules.length > 0) {
          for(var j = 0; j < league.rules.length; j++) {
            if(league.rules[j].name === "Solo") {
              ssf = true;
            }
          }
        }

        // Add league if it's not SSF
        if(!ssf) {
          leagues.push(league.id);
        }

        // When done with every league
        if(leaguesCount === body.length) {
          this.gui.initializeLeagueSettings(leagues);
        }
      }
    })
    .catch((error) => {
      this.gui.entries.addText("Error loading leagues", error.message, "fa-exclamation-circle red");
    });
  }

  /**
  * Checks if required packages are installed
  */
  checkDependencies() {
    var self = this;

    if(os.platform() === "linux") {
      Helpers.isPackageInstalled("xdotool")
      .catch((error) => {
        return this.gui.entries.addText("Missing dependency", "This tool uses <strong>xdotool</strong> to focus Path of Exile. The price checking feature works without this, but it is recommended to install it for an optimal experience.", "fa-exclamation-triangle yellow");
      });
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

    if(this.ninjaAPI.hasData(this.config.get("league"))) {
      if(!["Magic", "Rare"].includes(parser.getItemType()) && parser.isIdentified() === true) {
        this.ninjaAPI.getItem(parser.getName(), {league: this.config.get("league"), links: parser.getLinks(), variant: parser.getVariant(), relic: parser.isRelic(), baseType: parser.getBaseType()})
        .then((itemArray) => {
          this.onNinjaItemReceive(parser, itemArray[0]);
        })
        .catch((error) => {
          console.error(error);
        });
      }
    } else {
      this.gui.entries.addText("No data", "There's no data for " + this.config.get("league") + ". You should update before attempting to price check another item.", "fa-exclamation-triangle yellow", {timeout: 15});
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
    var entry;

    if(itemType === "Currency" || itemType === "Fragment") {
      entry = this.gui.entries.addCurrency(item, parser.getStackSize());
      entry.enableAutoClose(this.config.get("timeouts.currency"));
    } else {
      entry = this.gui.entries.addItem(item);
      entry.enableAutoClose(this.config.get("timeouts.item"));
    }
  }

  /**
  * Updates and saves poe.ninja data
  */
  updateNinja() {
    if(!this.updating) {
      this.updating = true;
      var updateEntry = this.gui.entries.addTitle("Updating poe.ninja prices...", "fa-info-circle grey", {closeable: false});

      this.ninjaAPI.update({league: this.config.get("league")})
      .then((result) => {
        updateEntry.close();
        this.gui.entries.addTitle("Update successful 🎉", "fa-check-circle green", {timeout: 15});
      })
      .catch((error) => {
        updateEntry.close();
        return this.gui.entries.addText("Failed to update", error.message, "fa-exclamation-triangle yellow");
      })
      .then(() => {
        return this.updating = false;
      });
    }
  }
}

var app = new XenonTrade();
