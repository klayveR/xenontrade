const electron = require('electron');
const remote = electron.remote;
const screenElectron = electron.screen;
const windowManager = remote.require('electron-window-manager');
const { version } = require('../../../package.json');

const log = require('electron-log');
const Config = require("electron-store");
const Helpers = require("../helpers.js");
const GUI = require("./gui.js");

var config = Helpers.createConfig();

class SettingsGUI {
  /**
  * Getter for name of the Settings GUI
  */
  static get NAME() {
    return "settings";
  }

  /**
  * Creates the settings window
  */
  static create() {
    var settingsWindow = windowManager.createNew(SettingsGUI.NAME, 'XenonTrade Settings', '/settings.html', false, {
      'width': 300,
      'height': 387,
      'position': 'center',
      'frame': false,
      'backgroundThrottling': false,
      'skipTaskbar': true,
      'show': false,
      'maximizable': false,
      'resizable': false,
      'fullscreenable': false,
      'alwaysOnTop': true
    });

    settingsWindow.open(null, true);

    settingsWindow.object.on("hide", function() {
      windowManager.bridge.emit('hide', {'window': SettingsGUI.NAME});
    });

    settingsWindow.object.on("show", function() {
      windowManager.bridge.emit('show', {'window': SettingsGUI.NAME});
    });
  }

  /**
  * Initializes settings
  */
  static initialize() {
    SettingsGUI._initializeButtons();
    SettingsGUI._initializeToggles();
    SettingsGUI._initializeLeagues();
    SettingsGUI._initializeSliders();
    SettingsGUI._initializeVersionNumber();
  }

  /**
  * Initializes the header buttons
  */
  static _initializeButtons() {
    $(".menu").find("[data-button='close']").click(function() {
      SettingsGUI.hide();
    });
  }

  /**
  * Shows the version number in the settings GUI
  */
  static _initializeVersionNumber() {
    $(".settings").find(".rightText").html("v" + version);
  }

  /**
  * Iterates through each slider in the settings menu and calls _initializeSlider
  */
  static _initializeSliders() {
    SettingsGUI._initializeMaxHeightSlider();

    $(".settings").find("[data-slider]").each(function (index, element) {
      SettingsGUI._initializeSlider($(this));
    });
  }

  /**
  * Initializes slider by creating a noUiSlider and registering events
  *
  * @param {jQuery} $selector Slider div
  */
  static _initializeSlider(selector) {
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
        windowManager.bridge.emit('maxheight-change', {'value': value});
      } else if(configKey === "window.zoomFactor") {
        windowManager.bridge.emit('zoomfactor-change', {'value': value});
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
  * Initializes the maximum height sliders maximum value
  */
  static _initializeMaxHeightSlider() {
    var mainScreen = screenElectron.getPrimaryDisplay();
    var sliderDiv = $("[data-slider='maxHeight']").find("[slider-max]");
    sliderDiv.attr("slider-max", mainScreen.size.height);
  }

  /**
  * Initializes all toggle buttons and states in the settings menu
  */
  static _initializeToggles() {
    $(".settings").find("[data-toggle]").each(function (index, element) {
      SettingsGUI._initializeToggleState($(this));
      SettingsGUI._initializeToggleButton($(this));
    });
  }

  /**
  * Sets the state of a toggle based on the config value
  *
  * @param {jQuery} $selector Toggle button
  */
  static _initializeToggleState(selector) {
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
  static _initializeToggleButton(selector) {
    var toggle = selector.attr("data-toggle");
    selector.click(function() {
      SettingsGUI.toggleSetting(toggle);
    });
  }

  /**
  * Loads leagues, adds them to the settings menu if successful, error entry if not
  */
  static _initializeLeagues() {
    Helpers.getPathOfExileLeagues()
    .then((leagues) => {
      SettingsGUI._initializeLeagueSelect(leagues);
    })
    .catch((error) => {
      log.warn("Error loading leagues, " + error);
      alert("Error loading leagues", "Please check the log file for more information.");
    });
  }

  /**
  * Initializes league settings
  *
  * @param {Array} leagues Array of leagues
  */
  static _initializeLeagueSelect(leagues) {
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
      SettingsGUI.changeLeagueSetting(league);
    });

    // Select league from config
    $("#leagueSelect").find("option[value='" + config.get("league") + "']").attr("selected", "selected");
  }

  /**
  * Shows settings window
  */
  static show() {
    var win = windowManager.get(SettingsGUI.NAME).object;

    if(win) {
      win.setAlwaysOnTop(true);
      win.show();
    }
  }

  /**
  * Hides settings window
  */
  static hide() {
    var win = windowManager.get(SettingsGUI.NAME).object;

    if(win) {
      win.hide();
    }
  }

  /**
  * Toggles a setting in the config and the settings icon
  *
  * @param {string} toggle Name of toggle
  */
  static toggleSetting(toggle) {
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
  static changeLeagueSetting(league) {
    config.set("league", league);
    windowManager.bridge.emit('league-change', {'league': league});
  }
}

module.exports = SettingsGUI;
