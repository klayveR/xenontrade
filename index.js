"use strict";

const ioHook = require("iohook");
const clipboardy = require("clipboardy");

const NinjaAPI = require("poe-ninja-api-manager");
const ClipboardItem = require("./modules/clipboardItem.js");
const GUI = require("./modules/gui.js");

class XenonTrade {
  constructor() {
    this.updating = false;
    this.loading = false;
    this.config = {league: "Standard"};

    this.gui = new GUI(this, 300);
    this.ninjaAPI = new NinjaAPI({
      path: "./resource/",
      league: this.config.league
    });

    this.initialize();
  }

  initialize() {
    this.registerHotkeys();
  }

  registerHotkeys() {
    var self = this;

    const clipboardShortcut = ioHook.registerShortcut([29, 46], (keys) => {
      setTimeout(function() {
        self.onClipboard();
      }, 100)
    });

    ioHook.start();
  }

  onClipboard() {
    var clipboard = clipboardy.readSync();
    var cbItem = new ClipboardItem(clipboard);

    if(cbItem.isPathOfExileData()) {
      var itemData = cbItem.parseData();
      // TODO: add item entry in gui
    }
  }

  updateNinja() {
    if(!this.updating && !this.loading) {
      this.updating = true;
      var updateEntry = this.gui.addTextEntry("Updating...", this.config.league + " league");

      this.ninjaAPI.update()
      .then((result) => {
        updateEntry.close();
        var entry = this.gui.addTextEntry("Update successful!", this.config.league + " league", "fa-check-circle green");
        entry.enableAutoClose(5);

        return this.ninjaAPI.save();
      })
      .then((success) => {
        console.log("Saved poe.ninja data:", success);
      })
      .catch((error) => {
        updateEntry.close();
        this.gui.addTextEntry("Update failed!", error.message, "fa-exclamation-triangle yellow");
      })
      .then(() => {
        this.updating = false;
      });
    }
  }

  loadNinja() {
    if(!this.updating && !this.loading) {
      this.loading = true;

      this.ninjaAPI.load()
      .then((success) => {
        console.log("Loaded poe.ninja data:", success);
      })
      .catch((error) => {
        console.error("Failed to load poe.ninja data", error.code);
        this.handleNinjaLoadError(error);
      })
      .then(() => {
        this.loading = false;
      })
    }
  }

  handleNinjaLoadError(error) {
    this.loading = false;

    // Only show error entry if the file exists and the data couldn't be loaded
    if(error.code !== "ENOENT") {
      this.gui.addTextEntry("Failed to load data!", error.message, "fa-exclamation-triangle yellow");
    }

    this.updateNinja();
  }
}

var app = new XenonTrade();
