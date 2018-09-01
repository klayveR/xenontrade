const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const Templates = require("./templates.js");
const Entries = require("./entries.js");

class GUI {
  // TODO: jsdocs
  constructor(app, width) {
    this.app = app;
    this.templates = new Templates();
    this.entries = new Entries(app);
    this.templatesLoaded = false;
    this.width = width || 300;
    this.window = remote.getCurrentWindow();
    this.entryCount = 0;

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
      this.templatesLoaded = true;
      return this.app.loadNinja();
    })
    .catch((error) => {
      this.addTextEntry("Couldn't load templates", error.message, "fa-exclamation-triangle yellow");
      return this.templatesLoaded = false;
    });
  }

  updateWindowHeight() {
    var height = $(".main").height();
    ipcRenderer.send("resize", this.width, height);
  }
}

module.exports = GUI;
