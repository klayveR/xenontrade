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
    this.initializeSettings();
    this.updateWindowHeight();

    // Initialize position from config
    this.setWindowPosition(this.app.config.get("window.x"), this.app.config.get("window.y"));

    // Finally show window
    ipcRenderer.send("ready");
  }

  /**
  * Initializes the settings
  */
  initializeSettings() {
    var self = this;

    $(".settings").find("[data-type='currency']").find(".seconds").html(this.app.config.get("timeouts.currency"));
    $(".settings").find("[data-type='item']").find(".seconds").html(this.app.config.get("timeouts.item"));

    $(".settings").find(".plusButton").click(function(e) {
      e.preventDefault();
      self.changeTimeoutValue($(this).attr("data-type"), 1);
    });

    $(".settings").find(".minusButton").click(function(e) {
      e.preventDefault();
      self.changeTimeoutValue($(this).attr("data-type"), -1);
    });
  }

  /**
  * Initializes league settings
  */
  initializeLeagueSettings(leagues) {
    var self = this;

    $.each(leagues, function (i, league) {
      $("#leagueSelect").append($("<option>", {
        value: league,
        text : league
      }));
    });

    $("#leagueSelect").change(function() {
      self.app.config.set("league", $("#leagueSelect").val());
      self.app.updateNinja();
    });

    // Select league from config
    $("#leagueSelect").find("option[value='" + this.app.config.get("league") + "']").attr("selected", "selected");
  }

  /**
  * Toggles between settings and entries
  */
  toggleSettings() {
    $("#settingsButton").find("i").toggleClass("grey");

    $(".entries").toggleClass("hidden");
    $(".settings").toggleClass("hidden");

    this.updateWindowHeight();
  }

  /**
  * Changes the value of a timeout in the GUI and config
  *
  * @param {string} type data-type/config property of the timeout
  * @param {number} add Number to add to config value
  */
  changeTimeoutValue(type, add) {
    var value = this.app.config.get("timeouts." + type);
    value += add;

    if(value >= 0) {
      this.app.config.set("timeouts." + type, value);
      $(".settings").find("[data-type='" + type + "']").find(".seconds").html(value);
    }
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
      self.close();
    });

    $("#updateButton").click(function(e) {
      e.preventDefault();
      self.app.updateNinja();
    });

    $("#settingsButton").click(function(e) {
      e.preventDefault();
      self.toggleSettings();
    });
  }

  /**
  * Saves position to config and closes GUI
  */
  close() {
    var windowPosition = this.window.getPosition();
    this.app.config.set("window.x", windowPosition[0]);
    this.app.config.set("window.y", windowPosition[1]);

    this.window.close();
  }

  /**
  * Updates the window height based on contents
  */
  updateWindowHeight() {
    var height = $(".container").innerHeight();
    ipcRenderer.send("resize", this.width, height);
  }

  /**
  * Updates the window position
  *
  * @param {number} x x position
  * @param {number} y y position
  */
  setWindowPosition(x, y) {
    ipcRenderer.send("position", x, y);
  }

  /**
  * Maximizes the window
  */
  maximize() {
    this.window.maximize();
  }
}

module.exports = GUI;
