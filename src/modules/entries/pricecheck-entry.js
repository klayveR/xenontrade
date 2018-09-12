const Entry = require("../entry.js");

class PriceCheckEntry extends Entry {
  /**
  * Creates a new PriceCheckEntry object
  *
  * @constructor
  */
  constructor() {
    super();
  }

  /**
  * Make parent functions accessible for children
  */
  setTemplate(template) { super.setTemplate(template); }
  setReplacements(replacements) { super.setReplacements(replacements); }
  enableAutoClose(seconds) { super.enableAutoClose(seconds); }
  cancelAutoClose() { super.cancelAutoClose(); }
  enableClose() { super.enableClose(); }
  close() { super.close(); }
  getId() { super.getId(); }
  add() { super.add(); }

  /**
  * Enables a toggle
  */
  enableToggle(toggle) {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find("[data-button='" + toggle + "']");

    $(".entry[data-id='" + this.id + "']").find(".left").removeClass("hidden");

    button.removeClass("hidden");
    button.click(function(e) {
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
  * Removes null from sparkline data and returns the trend as an array
  *
  * @param {Object} sparkline Sparkline object that contains a sparkline data array
  * @return {Array}
  */
  _formatTrendData(sparkline) {
    var trend = [0];

    if(sparkline != null && sparkline.hasOwnProperty("data")) {
      if(sparkline.data.length > 0) {
        trend = sparkline.data;
        trend = trend.filter(function(e) { return e === 0 || e; });
      }
    }

    return trend;
  }

  /**
  * Returns a color based on a value
  *
  * @param {number} count Number the confidence color should be based on
  * @return {string}
  */
  _getConfidenceColor(count) {
    var color = "red";

    if(count >= 10) {
      color = "green";
    } else if(count >= 5) {
      color = "yellow";
    }

    return color;
  }
}

module.exports = PriceCheckEntry;
