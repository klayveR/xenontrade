const Entries = require("./entries.js");
const Helpers = require("./helpers.js");

class Settings {
  /**
  * Initializes settings
  */
  initialize() {
    this._initializeToggles();
    this._initializeLeagues();
    this._initializeSliders();
    this._initializeMaxHeight();
  }

  _initializeMaxHeight() {
    this._changeMaxHeight(config.get("maxHeight"));
  }

  _initializeSliders() {
    var self = this;

    $(".settings").find("[data-slider]").each(function (index, element) {
      self._initializeSlider($(this));
      //self._initializeSliderState($(this));
    });
  }

  _initializeSlider(selector) {
    var self = this;
    var configKey = selector.attr("data-slider");
    var sliderSelector = selector.find("div");
    var sliderLabel = selector.find(".slider-value");
    var slider = sliderSelector[0];

    noUiSlider.create(slider, {
    	start: [ config.get(configKey) ],
    	range: {
    		'min': [ parseInt(sliderSelector.attr("slider-min")) ],
    		'max': [ parseInt(sliderSelector.attr("slider-max")) ]
    	}
    });

    slider.noUiSlider.on('set', function(values){
      var value = Math.round(values[0]);
      config.set(configKey, value);

      if(configKey === "maxHeight") {
        self._changeMaxHeight(value);
      }
    });

    slider.noUiSlider.on('update', function(values){
      sliderLabel.html(Math.round(values[0]));
    });
  }

  /**
  * Change the maximum height of the entries div
  */
  _changeMaxHeight(value) {
    $(".entries").css("max-height", value + "px");
    gui.updateWindowHeight();
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
  */
  _initializeToggleState(selector) {
    var toggle = selector.attr("data-toggle");
    if(config.get(toggle)) {
      $(".settings").find("[data-toggle='" + toggle + "'] > i").removeClass("fa-toggle-off grey").addClass("fa-toggle-on");
    }
  }

  /**
  * Enables a toggle button
  */
  _initializeToggleButton(selector) {
    var self = this;

    var toggle = selector.attr("data-toggle");
    selector.click(function(e) {
      e.preventDefault();
      self.toggleSetting(toggle);
    });
  }

  /**
  * Toggles a setting in the config and the settings icon
  */
  toggleSetting(toggle) {
    var enabled = !config.get(toggle);
    config.set(toggle, enabled);

    // Change settings icon accordingly
    $(".settings").find("[data-toggle='" + toggle + "'] > i").toggleClass("fa-toggle-off fa-toggle-on grey");
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
      Entries.addText("Error loading leagues", error.message, "fa-exclamation-circle red");
    });
  }

  /**
  * Initializes league settings
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
  * Changes the league in config and update poe.ninja
  *
  * @param {string} league League name that should be saved to config
  */
  changeLeagueSetting(league) {
    config.set("league", league);
    app.updateNinja();
  }
}

module.exports = Settings;
