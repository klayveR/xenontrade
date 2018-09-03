const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const Entries = require("./entries.js");
const Helpers = require("./helpers.js");

class GUI {
  /**
  * Creates a new GUI object
  *
  * @constructor
  * @param {XenonTrade} app A XenonTrade object to which the entry should be added to
  * @param {number} width Width of the GUI
  */
  constructor(app, width) {
    this.app = app;
    this.width = width;
    this.window = remote.getCurrentWindow();
    this.entries = new Entries(this.app);

    this.initialize();
  }

  /**
  * Initializes essential parts of the GUI
  */
  initialize() {
    this.initializeButtons();
    this.updateWindowHeight();
  }

  /**
  * Initializes the header buttons
  */
  initializeButtons() {
    var self = this;

    $("#minimizeButton").click(function(e) {
      e.preventDefault();
      self.window.minimize();
    });

    $("#closeButton").click(function(e) {
      e.preventDefault();
      self.window.close();
    });

    $("#updateButton").click(function(e) {
      e.preventDefault();
      self.app.updateNinja();
    });
  }

  /**
  * Updates the window height based on contents
  */
  updateWindowHeight() {
    var height = $(".container").innerHeight();
    ipcRenderer.send("resize", this.width, height);
  }

  /**
  * Maximizes the window
  */
  maximize() {
    this.window.maximize();
  }
}

module.exports = GUI;
