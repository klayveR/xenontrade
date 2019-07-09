const PriceCheckEntry = require("./pricecheck-entry.js");
const CurrencyIcons = require("../../resource/icons/currencyIcons");

class ItemEntry extends PriceCheckEntry {
  /**
  * Creates a new ItemEntry object
  *
  * @constructor
  */
  constructor(item, parser) {
    super();
    this.item = item;
    this.parser = parser;
    this.switchable = false;
  }

  add() {
    var template = templates.get("item.html");
    var replacements = this._buildReplacements();

    // Set template, replacements and add
    super.setTemplate(template);
    super.setReplacements(replacements);
    super.add();

    // Set buttons and trends
    this.visualizeTrend();
    super.addMaxRolls(this.parser.item);
    super.setCloseable(true);
    if(this.switchable) {
      super.enableToggle("switch");
    }

    // Enable autoclose if configured
    if(config.get("autoclose.enabled") && config.get("autoclose.timeouts.item.enabled")) {
      if(!(config.get("autoclose.threshold.enabled") && this.item.chaosValue > config.get("autoclose.threshold.value"))) {
        super.enableAutoClose(config.get("autoclose.timeouts.item.value"));
      }
    }
  }

  _buildReplacements() {
    var confidence = super._getConfidenceColor(this.item.count);
    var trend = super._formatTrendData(this.item.sparkline);
    var name = this.item.name;
    var info = "";

    // Append variant to item name if it is a variant, not on maps
    if(this.item.variant !== null && this.item.variant !== "Atlas2") {
      info += this.item.variant + " ";
    }

    // Prepend links to item name if links > 0
    if(this.item.links > 0) {
      info += this.item.links + "L";
    }

    // Enable switch button if exalted value is > 1
    if(this.item.exaltedValue >= 1) {
      this.switchable = true;
    }

    return [
      { find: "item-name", replace: name },
      { find: "item-info", replace: info },
      { find: "item-icon", replace: this.item.icon },
      { find: "item-value-chaos", replace: this.item.chaosValue },
      { find: "item-value-exalted", replace: this.item.exaltedValue },
      { find: "chaos-icon", replace: CurrencyIcons["Chaos Orb"] },
      { find: "exalted-icon", replace: CurrencyIcons["Exalted Orb"] },
      { find: "conf-color", replace: confidence },
      { find: "trend", replace: trend }
    ];
  }
}

module.exports = ItemEntry;
