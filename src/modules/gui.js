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
  }

  /**
  * Initializes essential parts of the GUI
  */
  initialize() {
    this.initializeButtons();
    this.initializeSettings();
    this.updateWindowHeight();
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
      self.updateTimeoutSetting($(this).attr("data-type"), 1);
    });

    $(".settings").find(".minusButton").click(function(e) {
      e.preventDefault();
      self.updateTimeoutSetting($(this).attr("data-type"), -1);
    });
  }

  /**
  * Initializes league settings
  */
  initializeLeagueSettings(leagues) {
    var self = this;

    // Add leagues as options to select
    $.each(leagues, function (i, league) {
      $("#leagueSelect").append($("<option>", {
        value: league,
        text : league
      }));
    });

    // Select option change listener
    $("#leagueSelect").change(function() {
      var league = $("#leagueSelect").val();
      self.updateLeagueSetting(league);
    });

    // Select league from config
    $("#leagueSelect").find("option[value='" + this.app.config.get("league") + "']").attr("selected", "selected");
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
  * Toggles between settings and entries
  */
  toggleSettings() {
    $("#settingsButton").find("i").toggleClass("grey");

    $(".entries").toggleClass("hidden");
    $(".settings").toggleClass("hidden");

    this.updateWindowHeight();
  }

  /**
  * Changes the league in config and update poe.ninja
  *
  * @param {string} league League name that should be saved to config
  */
  updateLeagueSetting(league) {
    this.app.config.set("league", league);
    this.app.updateNinja();
  }

  /**
  * Changes the value of a timeout in the GUI and config
  *
  * @param {string} type data-type/config property of the timeout
  * @param {number} add Number to add to config value
  */
  updateTimeoutSetting(type, add) {
    var value = this.app.config.get("timeouts." + type);
    value += add;

    if(value >= 0) {
      this.app.config.set("timeouts." + type, value);
      $(".settings").find("[data-type='" + type + "']").find(".seconds").html(value);
    }
  }

  /**
  * Updates the window height based on contents
  */
  updateWindowHeight() {
    var self = this;
    var height = $(".container").height();

    // There needs to be a slight delay before updating the window height
    // because in some cases the last entry can get cut off without a timeout
    // if the entries height is dynamically changed after appending
    setTimeout(function() {
      ipcRenderer.send("resize", self.width, height);
    }, 20);
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
  * Shows the window
  */
  show() {
    if(!this.window.isVisible()) {
      this.window.show();
      Helpers.focusPathOfExile();
    }
  }

  /**
  * Hides the window
  */
  minimize() {
    if(this.window.isVisible()) {
      this.window.minimize();
    }
  }
}

module.exports = GUI;
