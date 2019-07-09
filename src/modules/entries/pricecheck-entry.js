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
  setCloseable(closeable) { super.setCloseable(closeable); }
  close() { super.close(); }
  getId() { return super.getId(); }
  add() { super.add(); }
  enableExternalLinks() { super.enableExternalLinks(); }
  isCloseable() { return super.isCloseable(); }

  /**
  * Enables a toggle
  */
  enableToggle(toggle) {
    var self = this;
    var button = $(".entry[data-id='" + this.id + "']").find("[data-button='" + toggle + "']");
    button.show();

    $(".entry[data-id='" + this.id + "']").find(".left").show();

    button.click(function() {
      self._toggle(toggle);
    });
  }

  /**
  * Toggles a toggle on this entry
  */
  _toggle(toggle) {
    var icon = $(".entry[data-id='" + this.id + "']").find("[data-button='" + toggle + "']").find("i");
    icon.toggleClass("grey");

    $(".entry[data-id='" + this.id + "']").find("[data-" + toggle + "]").toggle();
    GUI.updateWindowHeight();
  }

  /**
  * Visualizes every trend on this entry
  */
  visualizeTrend() {
    var trend = $(".entry[data-id='" + this.id + "']").find(".trend");

    trend.peity("line");
    GUI.updateWindowHeight();
  }

  /**
   * Add notice about max rolls on item mods
   * @param mods
   */
  addMaxRolls(item) {
    if (item === null) {
      return;
    }
    let mods = item.getMaxRolledMods();
    if (mods.length > 0) {
      let modsText = [];
      for (let i = 0; i < mods.length; i++) {
        modsText.push( mods[i].modBase["trade text"] );
      }
      $(".entry[data-id='" + this.id + "']").find(".note-max-rolls .count").text(mods.length);
      $(".entry[data-id='" + this.id + "']").find(".note-max-rolls .mod-list").html("<li>"+modsText.join("</li><li>")+"</li>");
      $(".entry[data-id='" + this.id + "']").find(".note-max-rolls").show();
    }    
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
