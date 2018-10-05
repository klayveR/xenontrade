const electron = require('electron');
const { dialog } = electron.remote
const remote = electron.remote;
const screenElectron = electron.screen;
const windowManager = remote.require('electron-window-manager');
const { version } = require('../../../package.json');

const log = require('electron-log');
const Config = require("electron-store");
const PathOfExile = require("../poe.js");
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
      'width': 800,
      'height': 600,
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
    settingsWindow.object.webContents.openDevTools();

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
    SettingsGUI._initializeChatButtons();
    SettingsGUI._initializeSliders();
    SettingsGUI._initializeFileSelects();
    SettingsGUI._initializeTextInputs();
    SettingsGUI._initializeVersionNumber();
    SettingsGUI._initializeNavigation();
  }

  /**
  * Initializes the navigation
  */
  static _initializeNavigation() {
    $(".sidebar").find(".link").each(function() {
      var settings = $(this).attr("data-settings");

      $(this).click(function() {
        SettingsGUI.switchSettingsPage($(this));
      })
    });
  }

  /**
  * Initializes the header buttons
  */
  static _initializeButtons() {
    var self = this;

    $(".header").find("[data-button='close']").click(function() {
      SettingsGUI.hide();
    });

    $(".content").find("[data-button='add-chat-button']").click(function() {
      var direction = $(this).attr("data-direction");
      self.addChatButton({direction, label: "", message: "", close: false});
    });
  }

  /**
  * Shows the version number in the settings GUI
  */
  static _initializeVersionNumber() {
    $(".sidebar").find(".version").html("v" + version);
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
    var sliderLabel = selector.parent().find(".option-value").find(".value");
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
    $(".settings").find("[data-toggle]").each(function() {
      var toggle = $(this).attr("data-toggle");

      // Set value to config value
      if(config.get(toggle)) {
        $(".settings").find("[data-toggle='" + toggle + "'] > i").removeClass("fa-toggle-off grey").addClass("fa-toggle-on green");
      }

      // Change config value on click
      $(this).off("click").on("click", function() {
        SettingsGUI.toggleSetting(toggle);
      });
    });
  }

  /**
  * Initializes text inputs
  */
  static _initializeTextInputs() {
    $(".settings").find("[data-text-input]").each(function() {
      var configKey = $(this).attr("data-text-input");

      // Set value to config value
      $(this).val(config.get(configKey));

      // Change config value on input change
      $(this).off("change").on("change", function() {
        // Set new config value
        config.set(configKey, $(this).val());
      });
    });
  }

  /**
  * Initializes all chat buttons in the trade helper menu
  */
  static _initializeChatButtons() {
    var buttons = config.get("tradehelper.buttons");

    // For each button in config
    for(var id in buttons) {
      var button = buttons[id];

      this.addChatButton(button, id);
    }
  }

  /**
  * Adds a button to the trade helper menu button list
  *
  * @param {Object} button A button object containing direction, label and message
  * @param {string} [id] ID of the button. A random ID is generated if not set
  */
  static addChatButton(button, id = Helpers.generateRandomId()) {
    // Add to config if button is new
    if(!config.has("tradehelper.buttons." + id)) {
      config.set("tradehelper.buttons." + id, button);
    }

    // Insert new row with inputs
    var container = $(".settings").find("[data-trade-buttons='" + button.direction + "']");
    var html = '<div class="row" data-row="' + id + '"><div class="cell chat-button-label"><input placeholder="Button label" data-text-input="tradehelper.buttons.' + id + '.label" type="text" value="' + button.label + '"></div><div class="cell chat-button-message"><input placeholder="Message" data-text-input="tradehelper.buttons.' + id + '.message" type="text" value="' + button.message + '"></div><div class="cell" data-button="remove"><i class="fas fa-minus-square grey"></i></div><div class="cell center" data-toggle="tradehelper.buttons.' + id + '.close"><i class="fas fa-toggle-off grey"></i></div></div>';
    container.find(".row:last").after(html);

    // Initialize new text inputs
    // TODO: Initialize single input instead of all again
    this._initializeTextInputs();
    this._initializeToggles();

    // Initialize the remove button click listener, remove row on click#
    var row = container.find("[data-row='" + id + "']");
    var removeButton = row.find("[data-button='remove']");
    removeButton.click(function() {
      config.delete("tradehelper.buttons." + id);
      row.remove();
    });
  }

  /**
  * Initializes all file select buttons and states in the settings menu
  */
  static _initializeFileSelects() {
    $(".settings").find("[data-file-select]").each(function() {
      var configKey = $(this).attr("data-file-select");
      var valueElement = $(this).parent().find(".file-select").find(".value");

      // Click on button
      $(this).find(".select-button").click(function() {
        dialog.showOpenDialog({
          properties: ["openFile"],
          defaultPath: config.get(configKey)
        }, function(filePaths) {
          // Save new path to config
          config.set(configKey, filePaths[0]);
          valueElement.html(filePaths[0]);
        });
      });

      // Initialize config value
      valueElement.html(config.get(configKey));
    });
  }

  /**
  * Loads leagues, adds them to the settings menu if successful, error entry if not
  */
  static _initializeLeagues() {
    PathOfExile.getLeagues()
    .then((leagues) => {
      SettingsGUI._initializeLeagueSelect(leagues);
    })
    .catch((error) => {
      SettingsGUI._handleLeagueGetError(error);
    });
  }

  /**
  * Called when an error occured while fetching league data from GGG API
  */
  static _handleLeagueGetError(error) {
    log.warn("Error fetching leagues, " + error);
    $("#league").find(".description").after("<div class='banner red-bg'><i class='fas fa-exclamation-circle'></i> An error occured while fetching leagues from the Path of Exile API, please check the log file for more information. The league selection has been populated with the default leagues.</div>");

    var leagues = [
      "Standard",
      "Hardcore",
      "Delve",
      "Hardcore Delve"
    ]
    SettingsGUI._initializeLeagueSelect(leagues);
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

    var configLeague = config.get("league");

    // Add an additional option if league from config doesn't exist in league array
    if(!leagues.includes(configLeague)) {
      $("#leagueSelect").append($("<option>", {
        value: configLeague,
        text : configLeague
      }));
    }

    // Select league from config
    $("#leagueSelect").find("option[value='" + configLeague + "']").attr("selected", "selected");
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

  /**
  * Toggles a setting in the config and the settings icon
  *
  * @param {string} toggle Name of toggle
  */
  static toggleSetting(toggle) {
    var enabled = !config.get(toggle);
    config.set(toggle, enabled);

    // Change settings icon accordingly
    $(".settings").find("[data-toggle='" + toggle + "'] > i").toggleClass("fa-toggle-off fa-toggle-on grey green");
  }

  /**
  * Switches to another settings page
  *
  * @param {jQuery} linkSelector jQuery selector of the link that has been clicked
  */
  static switchSettingsPage(linkSelector) {
    // Clear all active css classes from links
    $(".sidebar").find(".link").each(function() {
      $(this).removeClass("active");
    });

    // Hide all settings pages
    $(".settings[data-settings]").each(function() {
      $(this).hide();
    });

    // Add active css class to clicked link
    linkSelector.addClass("active");

    // Show corresponding settings page
    $(".settings[data-settings='" + linkSelector.attr("data-settings") + "']").show();
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
}

module.exports = SettingsGUI;
