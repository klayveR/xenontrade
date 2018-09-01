const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const Templates = require("./templates.js");
const Entries = require("./entries.js");
const Helpers = require("./helpers.js");

class GUI {
  // TODO: jsdocs
  constructor(app, width) {
    this.app = app;
    this.width = width;
    this.window = remote.getCurrentWindow();

    this.templates = new Templates();
    this.entries = new Entries(app);

    this.initialize();
  }

  initialize() {
    this.initializeButtons();
    this.loadTemplates();
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

  loadTemplates() {
    this.templates.loadTemplates()
    .then(() => {
      return this.app.loadNinja();
    })
    .catch((error) => {
      return this.addTextEntry("Couldn't load templates", error.message, "fa-exclamation-triangle yellow");
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
