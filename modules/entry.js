const ExecHelpers = require("./helpers.exec.js");
const Helpers = require("./helpers.js");

class Entry {
  /**
  * Creates a new Entry object
  *
  * @constructor
  * @param {GUI} gui A GUI object to which the entries should be added to
  * @param {number} id ID of the entry
  */
  constructor(gui, id) {
    this.gui = gui;
    this.id = id;
    this.template = "";
    this.replacements = [];
    this.added = false;
  }

  /**
  * Sets the template that should be used for this entry
  *
  * @param {string} template `.html` format template
  */
  setTemplate(template) {
    this.template = template;
  }

  /**
  * Sets the template that should be used for this entry
  */
  setReplacements(replacements) {
    this.replacements = replacements;
    this.replacements.push({find: "entry-id", replace: this.id});
  }

  /**
  * Enables the close button on this entry
  */
  enableClose(id) {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find('#closeButton');

    button.show().click(function(e) {
      e.preventDefault();
      self.close(true);
    });
  }

  /**
  * Enables the expand button on this entry
  */
  enableExpand() {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find('#expandButton');

    button.show().click(function(e) {
      e.preventDefault();
      self._expandEntry();
    });
  }

  /**
  * Enables the trend button on this entry
  */
  enableTrend() {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find('#trendButton');

    button.show().click(function(e) {
      e.preventDefault();
      self._showTrend();
    });
  }

  /**
  * Enables the switch button on this entry
  */
  enableSwitch() {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find('#switchButton');

    button.show().click(function(e) {
      e.preventDefault();
      self._switchEntry();
    });
  }

  /**
  * Expands this entry and focuses Path of Exile
  */
  _expandEntry() {
    var icon = $(".entry[data-id='" + this.id + "']").find('#expandButton').find('i');
    icon.toggleClass("grey");

    $("[data-expand='" + this.id + "']").toggleClass("hidden");
    this.gui.updateWindowHeight();
    this._onButtonClick();
  }

  /**
  * Expands this entry and focuses Path of Exile
  */
  _showTrend() {
    var icon = $(".entry[data-id='" + this.id + "']").find('#trendButton').find('i');
    icon.toggleClass("grey");

    $("[data-trend='" + this.id + "']").toggleClass("hidden");
    this.gui.updateWindowHeight();
    this._onButtonClick();
  }

  /**
  * Switches this entry and focuses Path of Exile
  */
  _switchEntry() {
    var icon = $(".entry[data-id='" + this.id + "']").find('#switchButton').find('i');
    icon.toggleClass("grey");

    $("[data-switch='" + this.id + "']").toggleClass("hidden");
    this.gui.updateWindowHeight();
    this._onButtonClick();
  }

  /**
  * Focuses Path of Exile on a button click
  */
  _onButtonClick() {
    ExecHelpers.focusPathOfExile();
  }

  /**
  * Visualizes every trend on this entry
  */
  visualizeTrend(id) {
    //$(".trend[data-id='" + this.id + "']").peity("line");
    var trend = $(".entry[data-id='" + this.id + "']").find('.trend');

    trend.peity("line");
    this.gui.updateWindowHeight();
  }

  /**
  * Enables auto close for this entry
  */
  enableAutoClose(seconds) {
    var self = this;
    var timeoutContainer = $(".entry[data-id='" + this.id + "']").find('#timeout');

    if(this.added && seconds > 0) {
      timeoutContainer.html(seconds);

      var autoClose = setInterval(function() {
        seconds--;
        if(seconds < 99) {
          timeoutContainer.html(seconds);
        }
        if (seconds === 0) {
          clearInterval(autoClose);
          self.close(false);
        }
      }, 1000);
    }
  }

  /**
  * Replaces replacements in entry and adds it to the GUI
  */
  add() {
    if(!this.added) {
      this.added = true;
      var template = this._getReplacedTemplate(this.template, this.replacements, "%");

      $(".main div:last-child").after(template);
      this.gui.updateWindowHeight();
    } else {
      console.error("Tried adding entry " + this.id + ", but it has already been added");
    }
  }

  /**
  * Closes and removes this entry
  */
  close(focusPathOfExile) {
    if(this.added) {
      $(".entry[data-id='" + this.id + "']").remove();
      this.gui.updateWindowHeight();

      if(focusPathOfExile) {
        ExecHelpers.focusPathOfExile();
      }
    }
  }

  /**
  * Replaces replacements in template and returns it
  *
  * @return {Object}
  */
  _getReplacedTemplate(template, replacements, delimiter) {
    for(var i = 0; i < replacements.length; i++) {
      if(replacements[i].hasOwnProperty("replace") && replacements[i].hasOwnProperty("find")) {
        // Format if value is float
        if(Helpers.isFloat(replacements[i].replace)) {
          replacements[i].replace = +parseFloat(replacements[i].replace).toFixed(2);
        }

        if(typeof template !== "undefined") {
          template = template.replace(new RegExp(delimiter + replacements[i].find + delimiter, "g"), replacements[i].replace);
        }
      }
    }

    return template;
  }
}

module.exports = Entry;
