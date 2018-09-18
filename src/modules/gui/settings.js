const electron = require('electron');
var screenElectron = electron.screen;

const { version } = require('../../../package.json');
const Helpers = require("../helpers.js");
const TextEntry = require("../entries/text-entry.js");

class Settings {
  /**
  * Initializes settings
  */
  initialize() {
    this._initializeToggles();
    this._initializeLeagues();
    this._initializeMaxHeight();
    this._initializeZoomFactor();
    this._initializeSliders();

    // Show version
    $(".settings").find(".rightText").html("v" + version);
  }

  /**
  * Initializes the maximum height CSS setting based on the config value
  */
  _initializeMaxHeight() {
    var mainScreen = screenElectron.getPrimaryDisplay();
    var sliderDiv = $("[data-slider='maxHeight']").find("[slider-max]");
    sliderDiv.attr("slider-max", mainScreen.size.height);

    this.changeMaxHeight(config.get("maxHeight"));
  }

  /**
  * Initializes the maximum height CSS setting based on the config value
  */
  _initializeZoomFactor() {
    this.changeZoomFactor(config.get("window.zoomFactor"));
  }

  /**
  * Iterates through each slider in the settings menu and calls _initializeSlider
  */
  _initializeSliders() {
    var self = this;

    $(".settings").find("[data-slider]").each(function (index, element) {
      self._initializeSlider($(this));
    });
  }

  /**
  * Initializes slider by creating a noUiSlider and registering events
  *
  * @param {jQuery} $selector Slider div
  */
  _initializeSlider(selector) {
    var self = this;
    var configKey = selector.attr("data-slider");
    var sliderSelector = selector.find("div");
    var sliderLabel = selector.find(".slider-value");
    var slider = sliderSelector[0];
    var step = parseFloat(sliderSelector.attr("slider-step"));

    noUiSlider.create(slider, {
    	start: [ config.get(configKey) ],
    	range: {
    		'min': [ parseFloat(sliderSelector.attr("slider-min")) ],
    		'max': [ parseFloat(sliderSelector.attr("slider-max")) ]
    	},
      step: step
    });

    slider.noUiSlider.on('set', function(values){
      var value = Math.round(values[0]);
      if(step !== 1) {
        value = parseFloat(values[0]);
      }

      config.set(configKey, value);

      if(configKey === "maxHeight") {
        self.changeMaxHeight(value);
      } else if(configKey === "window.zoomFactor") {
        self.changeZoomFactor(value);
      }
    });

    slider.noUiSlider.on('update', function(values){
      if(step === 1) {
        sliderLabel.html(Math.round(values[0]));
      } else {
        sliderLabel.html(parseFloat(values[0]));
      }
    });
  }

  /**
  * Initializes all toggle buttons and states in the settings menu
  */
  _initializeToggles() {
    var self = this;

    $(".settings").find("[data-toggle]").each(function (index, element) {
      self._initializeToggleState($(this));
      self._initializeToggleButton($(this));
    });
  }

  /**
  * Sets the state of a toggle based on the config value
  *
  * @param {jQuery} $selector Toggle button
  */
  _initializeToggleState(selector) {
    var toggle = selector.attr("data-toggle");
    if(config.get(toggle)) {
      $(".settings").find("[data-toggle='" + toggle + "'] > i").removeClass("fa-toggle-off grey").addClass("fa-toggle-on");
    }
  }

  /**
  * Enables a toggle button
  *
  * @param {jQuery} $selector Toggle button
  */
  _initializeToggleButton(selector) {
    var self = this;

    var toggle = selector.attr("data-toggle");
    selector.click(function() {
      self.toggleSetting(toggle);
    });
  }

  /**
  * Loads leagues, adds them to the settings menu if successful, error entry if not
  */
  _initializeLeagues() {
    Helpers.getPathOfExileLeagues()
    .then((leagues) => {
      this._initializeLeagueSettings(leagues);
    })
    .catch((error) => {
      log.warn("Error loading leagues, " + error);
      var entry = new TextEntry("Error loading leagues", "Please check the log file for more information.", {icon: "fa-exclamation-circle red"});
      entry.add();
      entry.addLogfileButton();
    });
  }

  /**
  * Initializes league settings
  *
  * @param {Array} leagues Array of leagues
  */
  _initializeLeagueSettings(leagues) {
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
      self.changeLeagueSetting(league);
    });

    // Select league from config
    $("#leagueSelect").find("option[value='" + config.get("league") + "']").attr("selected", "selected");
  }

  /**
  * Toggles a setting in the config and the settings icon
  *
  * @param {string} toggle Name of toggle
  */
  toggleSetting(toggle) {
    var enabled = !config.get(toggle);
    config.set(toggle, enabled);

    // Change settings icon accordingly
    $(".settings").find("[data-toggle='" + toggle + "'] > i").toggleClass("fa-toggle-off fa-toggle-on grey");
  }

  /**
  * Changes the league in config and update poe.ninja
  *
  * @param {string} league League name that should be saved to config
  */
  changeLeagueSetting(league) {
    config.set("league", league);
    app.updateNinja();
  }

  /**
  * Change the maximum height of the entries div
  *
  * @param {number} value Maximum height value
  */
  changeMaxHeight(value) {
    $(".entries").css("max-height", (value / config.get("window.zoomFactor")) + "px");
    gui.updateWindowHeight();
  }

  /**
  * Change the zoom factor of the window
  *
  * @param {number} value Zoom factor value
  */
  changeZoomFactor(value) {
    $(".container").css("zoom", value);
    this.changeMaxHeight(config.get("maxHeight"));

    gui.updateWindowHeight();
  }
}

module.exports = Settings;
