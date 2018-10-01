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

      this.getJQueryObject().find("[data-link]").each(function() {
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
    if(this.added && this.timeout == null) {
      var self = this;
      var timeoutContainer = this.getJQueryObject().find(".timeout");

      if(seconds > 0) {
        this._enableCancelAutoCloseButton();
        timeoutContainer.html(seconds);
        timeoutContainer.show();
        this.updateMiddleWidth();

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
  * Enables a timer that counts up
  */
  enableTimer() {
    if(this.added && this.timeout == null) {
      var self = this;
      var time = moment();
      var timeoutContainer = this.getJQueryObject().find(".timer");

      timeoutContainer.html(time.fromNow());
      timeoutContainer.show();
      this.updateMiddleWidth();

      this.timeout = setInterval(function() {
        timeoutContainer.html(time.fromNow());
        self.updateMiddleWidth();
      }, 1000);
    }
  }

  /**
  * Enables button that autocloses entry
  */
  _enableCancelAutoCloseButton() {
    if(this.added) {
      var self = this;
      var button = this.getJQueryObject().find(".timeout");

      button.click(function() {
        self.cancelAutoClose();
      });
    }
  }

  /**
  * Stops auto close timeout
  */
  cancelAutoClose() {
    var button = this.getJQueryObject().find(".timeout");

    if(this.timeout != null) {
      button.hide();
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
      var button = this.getJQueryObject().find("[data-button='close']");

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

      this.updateMiddleWidth();
    }
  }

  /**
  * Closes and removes this entry
  */
  close() {
    if(this.added) {
      this.added = false;
      this.getJQueryObject().remove();

      // Remove entry from global entries variable
      entries = _.omit(entries, this.id);

      GUI.onEntriesChange();
      GUI.updateWindowHeight();
    }
  }

  /**
  * Replaces replacements in entry and adds it to the GUI
  */
  add() {
    if(!this.added) {
      this.added = true;
      var template = Entry.getReplacedString(this.template, this.replacements, "%");

      // If no entries available, set whole content of div, otherwise append
      if(!GUI.hasEntries()) {
        $(".entries").html(template);
      } else {
        $(".entries > .entry:last").after(template);
      }

      this.updateMiddleWidth();

      // Add entry to global entries variable
      entries[this.id] = this;

      GUI.onEntriesChange();
      GUI.updateWindowHeight();
      GUI.scrollToBottom();
    }
  }

  /**
  * Updates the width of the middle element to properly apply ellipsis if text is too long
  */
  updateMiddleWidth() {
    if(this.added) {
      var title = this.getJQueryObject().find(".title");
      var middle = title.find(".middle");
      var middlePadding = middle.outerWidth(true) - middle.width();
      var middleWidth = title.width() - middlePadding;

      // Wait 50ms to make sure every document change has been applied
      // Should probably be done in a more elegant way
      setTimeout(function() {
        title.children('div').each(function () {
          if(!$(this).hasClass("middle")) {
            middleWidth -= $(this).outerWidth(true);
          }
        }).promise()
        .done( function() {
          middle.css("max-width", middleWidth);
        });
      }, 50);
    }
  }

  /**
  * Replaces replacements in string and returns it
  *
  * @param {string} string String
  * @param {Array} replacements An array of objects containing the properties find and replace
  * @param {string} [delimiter] Boundary delimiter for the find property
  * @return {Object}
  */
  static getReplacedString(string, replacements, delimiter = "%") {
    for(var i = 0; i < replacements.length; i++) {
      if(replacements[i].hasOwnProperty("replace") && replacements[i].hasOwnProperty("find")) {
        // Format if value is float
        if(Helpers.isFloat(replacements[i].replace)) {
          replacements[i].replace = +parseFloat(replacements[i].replace).toFixed(2);
        }

        if(typeof string !== "undefined") {
          string = string.replace(new RegExp(delimiter + replacements[i].find + delimiter, "g"), replacements[i].replace);
        }
      }
    }

    return string;
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

      this.getJQueryObject().attr("data-id", id);
    }

    this.id = id;
  }

  /**
  * Returns the jQuery selector of this entry
  *
  * @return {jQuery}
  */
  getJQueryObject() {
    return $(".entry[data-id='" + this.id + "']");
  }

  /**
  * Returns true if the entry is closeable
  */
  isCloseable() {
    return this.closeable;
  }
}

module.exports = Entry;
