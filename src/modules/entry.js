const Helpers = require("./helpers.js");
const shell = require('electron').shell;
const _ = require("underscore");

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
    this.closeable = false;
    this.added = false;
  }

  /**
  * Sets the template that should be used for this entry
  *
  * @param {string} template `.html` format template
  */
  setTemplate(template) {
    if(!this.added) {
      this.template = template;
    }
  }

  /**
  * Sets the template that should be used for this entry
  *
  * @param {Array} replacements An array of objects containing the properties find and replace
  */
  setReplacements(replacements) {
    if(!this.added) {
      this.replacements = replacements;
      this.replacements.push({find: "entry-id", replace: this.id});
    }
  }

  /**
  * Enables link buttons
  */
  enableExternalLinks() {
    if(this.added) {
      var self = this;

      $(".entry[data-id='" + this.id + "']").find("[data-link]").each(function() {
        var link = $(this).attr("data-link");
        $(this).show();

        $(this).click(function() {
          shell.openExternal(link);
        });
      });
    }
  }

  /**
  * Enables auto close for this entry
  *
  * @param {number} seconds Initial countdown value
  */
  enableAutoClose(seconds) {
    if(this.added) {
      var self = this;
      var timeoutContainer = $(".entry[data-id='" + this.id + "']").find(".timeout");

      if(seconds > 0) {
        this._enableCancelAutoCloseButton();
        timeoutContainer.html(seconds);
        timeoutContainer.show();

        this.timeout = setInterval(function() {
          seconds--;
          if(seconds > 0) {
            timeoutContainer.html(seconds);
          } else {
            clearInterval(self.timeout);
            self.close();
          }
        }, 1000);
      }
    }
  }

  /**
  * Enables button that autocloses entry
  */
  _enableCancelAutoCloseButton() {
    if(this.added) {
      var self = this;
      var button = $(".entry[data-id='" + this.id + "']").find(".timeout");

      button.click(function() {
        button.hide();
        self.cancelAutoClose();
      });
    }
  }

  /**
  * Stops auto close timeout
  */
  cancelAutoClose() {
    if(this.timeout != null) {
      clearInterval(this.timeout);
    }
  }

  /**
  * Enables the close button on this entry
  *
  * @param {boolean} [closeable] Whether the close button should be enabled or disabled
  */
  setCloseable(closeable = true) {
    if(this.added) {
      var self = this;
      var button = $(".entry[data-id='" + this.id + "']").find("[data-button='close']");

      if(closeable) {
        this.closeable = true;
        button.show();

        button.click(function() {
          self.close();
        });
      } else {
        this.closeable = false;
        button.hide();

        button.unbind();
      }
    }
  }

  /**
  * Closes and removes this entry
  */
  close() {
    if(this.added) {
      this.added = false;
      $(".entry[data-id='" + this.id + "']").remove();

      // Remove entry from global entries variable
      entries = _.omit(entries, this.id);

      GUI.updateWindowHeight();
    }
  }

  /**
  * Replaces replacements in entry and adds it to the GUI
  */
  add() {
    if(!this.added) {
      this.added = true;
      var template = this._getReplacedTemplate(this.template, this.replacements, "%");

      // If no entries available, set whole content of div, otherwise append
      if (!$.trim($(".entries").html())) {
        $(".entries").html(template);
      } else {
        $(".entries > .entry:last").after(template);
      }

      // Add entry to global entries variable
      entries[this.id] = this;

      GUI.updateWindowHeight();
      GUI.scrollToBottom();
    }
  }

  /**
  * Replaces replacements in template and returns it
  *
  * @param {string} template `.html` format template
  * @param {Array} replacements An array of objects containing the properties find and replace
  * @param {string} [delimiter] Boundary delimiter for the find property
  * @return {Object}
  */
  _getReplacedTemplate(template, replacements, delimiter = "%") {
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
  * Returns the ID of this entry
  */
  getId() {
    return this.id;
  }

  /**
  * Sets the ID of the Entry
  *
  * @param {string} id Entry identifier
  */
  setId(id) {
    // Update ID in global entries variable and element if it has already been added
    if(this.added) {
      entries = _.omit(entries, this.id);
      entries[id] = this;

      $(".entry[data-id='" + this.id + "']").attr("data-id", id);
    }

    this.id = id;
  }

  /**
  * Returns true if the entry is closeable
  */
  isCloseable() {
    return this.closeable;
  }
}

module.exports = Entry;
