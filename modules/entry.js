const Helpers = require("./helpers.js");

class Entry {
  /**
  * Creates a new Entry object
  *
  * @constructor
  */
  constructor(gui, id) {
    this.gui = gui;
    this.id = id;
    this.template = "";
    this.replacements = [];
    this.added = false;
  }

  setTemplate(template) {
    this.template = template;
  }

  setReplacements(replacements) {
    this.replacements = replacements;
    this.replacements.push({find: "entry-id", replace: this.id});
  }

  enableClose(id) {
    var self = this;

    $("#closeButton[data-id='" + this.id + "']").show();
    $("#closeButton[data-id='" + this.id + "']").click(function(e) {
      e.preventDefault();
      self.close(true);
    });
  }

  enableExpand(id) {
    var self = this;

    $("#expandButton[data-id='" + this.id + "']").show();
    $("#expandButton[data-id='" + this.id + "']").click(function(e) {
      e.preventDefault();
      self._expandEntry(id);
    });
  }

  enableSwitch() {
    var self = this;

    $("#switchButton[data-id='" + this.id + "']").show();
    $("#switchButton[data-id='" + this.id + "']").click(function(e) {
      e.preventDefault();
      self._switchEntry();
    });
  }

  _expandEntry() {
    $("#expandButton[data-id='" + this.id + "'] > i").toggleClass("grey");
    $("[data-expand='" + this.id + "']").toggleClass("hidden");
    this.gui.updateWindowHeight();
    Helpers.focusPathOfExile();
  }

  _switchEntry() {
    $("#switchButton[data-id='" + this.id + "] > i").toggleClass("grey");
    $("[data-switch='" + this.id + "']").toggleClass("hidden");
    this.gui.updateWindowHeight();
    Helpers.focusPathOfExile();
  }

  visualizeTrend(id) {
    $(".trend[data-id='" + this.id + "']").peity("line");
    this.gui.updateWindowHeight();
  }

  enableAutoClose(seconds) {
    var self = this;

    if(this.added && seconds > 0) {
      $("#timeout[data-id='" + this.id + "']").html(seconds);

      var autoClose = setInterval(function() {
        seconds--;
        if(seconds < 99) {
          $("#timeout[data-id='" + self.id + "']").html(seconds);
        }
        if (seconds === 0) {
          clearInterval(autoClose);
          self.close(false);
        }
      }, 1000);
    }
  }

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

  close(focusPathOfExile) {
    if(this.added) {
      $(".entry[data-id='" + this.id + "']").remove();
      this.gui.updateWindowHeight();

      if(focusPathOfExile) {
        Helpers.focusPathOfExile();
      }
    }
  }

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
