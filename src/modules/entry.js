const Helpers = require("./helpers.js");

class Entry {
  /**
  * Creates a new Entry object
  *
  * @constructor
  */
  constructor() {
    this.id = Helpers.generateRandomId();
    this.template = "";
    this.replacements = [];
    this.timeout = null;
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
  * Returns the jQuery selector for this entry
  */
  getId() {
    return this.id;
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
  enableClose() {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find("[data-button='close']");

    button.show().click(function(e) {
      e.preventDefault();
      self.close(true);
    });
  }

  /**
  * Enables a toggle
  */
  enableToggle(toggle) {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find("[data-button='" + toggle + "']");

    $(".entry[data-id='" + this.id + "']").find(".left").removeClass("hidden");

    button.show().click(function(e) {
      e.preventDefault();
      self._toggle(toggle);
    });
  }

  /**
  * Toggles a toggle on this entry
  */
  _toggle(toggle) {
    var icon = $(".entry[data-id='" + this.id + "']").find("[data-button='" + toggle + "']").find("i");
    icon.toggleClass("grey");

    $(".entry[data-id='" + this.id + "']").find("[data-" + toggle + "]").toggleClass("hidden");
    gui.updateWindowHeight();
    this._onButtonClick();
  }

  /**
  * Focuses Path of Exile on a button click
  */
  _onButtonClick() {
    if(config.get("focusPathOfExile")) {
      Helpers.focusPathOfExile();
    }
  }

  /**
  * Visualizes every trend on this entry
  */
  visualizeTrend() {
    var trend = $(".entry[data-id='" + this.id + "']").find(".trend");

    trend.peity("line");
    gui.updateWindowHeight();
  }

  /**
  * Enables auto close for this entry
  */
  enableAutoClose(seconds) {
    var self = this;
    var timeoutContainer = $(".entry[data-id='" + this.id + "']").find(".timeout");

    if(seconds > 0) {
      this._enableStopAutoCloseButton();
      timeoutContainer.html(seconds);

      this.timeout = setInterval(function() {
        seconds--;
        if(seconds < 99) {
          timeoutContainer.html(seconds);
        }
        if (seconds === 0) {
          clearInterval(self.timeout);
          self.close(false);
        }
      }, 1000);
    }
  }

  /**
  * Enables button that autocloses entry
  */
  _enableStopAutoCloseButton() {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find(".timeout");

    button.click(function(e) {
      e.preventDefault();
      button.hide();
      self.stopAutoClose();
    });
  }

  /**
  * Stops auto close timeout
  */
  stopAutoClose() {
    clearInterval(this.timeout);
    this._onButtonClick();
  }

  /**
  * Replaces replacements in entry and adds it to the GUI
  */
  add() {
    var self = this;
    var template = this._getReplacedTemplate(this.template, this.replacements, "%");

    // Check if the entries div is empty, remove whitespaces and newlines
    if (!$.trim($(".entries").html())) {
      $(".entries").html(template);
    } else {
      $(".entries > .entry:last").after(template);
    }

    gui.updateWindowHeight();
  }

  /**
  * Closes and removes this entry
  */
  close(focusPathOfExile) {
    $(".entry[data-id='" + this.id + "']").remove();
    gui.updateWindowHeight();

    if(focusPathOfExile && config.get("focusPathOfExile")) {
      Helpers.focusPathOfExile();
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
