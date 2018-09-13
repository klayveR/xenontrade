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
  * Sets the template that should be used for this entry
  */
  setReplacements(replacements) {
    this.replacements = replacements;
    this.replacements.push({find: "entry-id", replace: this.id});
  }

  /**
  * Enables auto close for this entry
  */
  enableAutoClose(seconds) {
    var self = this;
    var timeoutContainer = $(".entry[data-id='" + this.id + "']").find(".timeout");
    timeoutContainer.removeClass("hidden");

    if(seconds > 0) {
      this._enableCancelAutoCloseButton();
      timeoutContainer.html(seconds);

      this.timeout = setInterval(function() {
        seconds--;
        if(seconds < 99) {
          timeoutContainer.html(seconds);
        }
        if (seconds === 0) {
          clearInterval(self.timeout);
          self.close();
        }
      }, 1000);
    }
  }

  /**
  * Enables button that autocloses entry
  */
  _enableCancelAutoCloseButton() {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find(".timeout");

    button.click(function() {
      button.hide();
      self.cancelAutoClose();
    });
  }

  /**
  * Stops auto close timeout
  */
  cancelAutoClose() {
    clearInterval(this.timeout);
  }

  /**
  * Enables the close button on this entry
  */
  enableClose() {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find("[data-button='close']");

    button.removeClass("hidden");
    button.click(function() {
      self.close();
    });
  }

  /**
  * Closes and removes this entry
  */
  close() {
    $(".entry[data-id='" + this.id + "']").remove();
    gui.updateWindowHeight();
  }

  /**
  * Replaces replacements in entry and adds it to the GUI
  */
  add() {
    var template = this._getReplacedTemplate(this.template, this.replacements, "%");

    // Check if the entries div is empty, remove whitespaces and newlines
    if (!$.trim($(".entries").html())) {
      $(".entries").html(template);
    } else {
      $(".entries > .entry:last").after(template);
    }

    gui.updateWindowHeight();
    gui.scrollToBottom();
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

  /**
  * Returns the jQuery selector for this entry
  */
  getId() {
    return this.id;
  }
}

module.exports = Entry;
