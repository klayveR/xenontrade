const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const Entries = require("./entries.js");
const Helpers = require("./helpers.js");

class GUI {
  // TODO: jsdocs
  constructor(app, width) {
    this.app = app;
    this.width = width;
    this.window = remote.getCurrentWindow();
    this.entries = new Entries(this.app);

    this.initialize();
  }

  initialize() {
    this.initializeButtons();
    this.updateWindowHeight();
  }

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

  updateWindowHeight() {
    var height = $(".main").height();
    ipcRenderer.send("resize", this.width, height);
  }

  maximize() {
    this.window.maximize();
    Helpers.focusPathOfExile();
  }
}

module.exports = GUI;
