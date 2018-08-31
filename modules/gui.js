const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const Templates = require("./templates.js");
const Entry = require("./entry.js");

class GUI {
  // TODO: jsdocs
  constructor(app, width) {
    this.app = app;
    this.templates = new Templates();
    this.templatesLoaded = false;
    this.width = width || 300;
    this.window = remote.getCurrentWindow();
    this.entryContainer = $(".entries");
    this.entryCount = 0;

    this.initialize();
  }

  initialize() {
    this.initializeButtons();
    this.loadTemplates();
    this.updateWindowHeight();
  }

  addTextEntry(title, text, icon = "fa-info-circle grey") {
    var template = this.templates.get("text.html");

    var replacements = [
      { find: "title", replace: title } ,
      { find: "text", replace: text } ,
      { find: "icon", replace: icon }
    ];

    return this.addEntry(template, replacements);
  }

  addEntry(template, replacements, options) {
    options = options || {};

    var timeout = options.timeout || 0;
    var isCloseable = options.close || true;
    var isExpandable = options.expand || false;
    var isSwitchable = options.switch || false;
    var visualizeTrend = options.visualizeTrend || false;

    var entry = new Entry(this, this.entryCount);
    entry.setTemplate(template);
    entry.setReplacements(replacements);
    entry.add();

    if(timeout > 0) {
      entry.enableAutoClose(timeout);
    }

    if(isCloseable) {
      entry.enableClose();
    }

    if(isExpandable) {
      entry.enableExpand();
    }

    if(isSwitchable) {
      entry.enableSwitch();
    }

    if(visualizeTrend) {
      entry.visualizeTrend();
    }

    this.entryCount++;
    return entry;
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
    .then((templates) => {
      this.templatesLoaded = true;
      this.app.loadNinja();
    })
    .catch((error) => {
      console.error("Couldn't load templates:", error);
      this.templatesLoaded = false;
    });
  }

  updateWindowHeight() {
    var height = $(".main").height();
    ipcRenderer.send("resize", this.width, height);
  }
}

module.exports = GUI;
