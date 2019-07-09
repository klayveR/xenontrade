const PriceCheckEntry = require("./pricecheck-entry.js");
const CurrencyIcons = require("../../resource/icons/currencyIcons");
const BaseTypeIcons = require("../../resource/icons/baseTypeIcons");

class PoeTradeEntry extends PriceCheckEntry {
  /**
  * Creates a new RareItemEntry object
  *
  * @constructor
  * @param {Object} poePrices pathofexile.com/trade result
  * @param {Parser} parser Parser object
  */
  constructor(poePrices, parser) {
    super();
    this.poePrices = poePrices;
    this.parser = parser;
  }

  add() {
    var template = templates.get("poeTrade.html");
    var replacements = this._buildReplacements();

    // Set template, replacements and add
    super.setTemplate(template);
    super.setReplacements(replacements);
    super.add();

    // Set buttons, links, prediction explanation and feedback elements
    super.addMaxRolls(this.parser.item);
    super.setCloseable(true);
    super.enableExternalLinks();

    // Enable autoclose if configured
    if(config.get("autoclose.enabled") && config.get("autoclose.timeouts.rare.enabled")) {
      if(!(config.get("autoclose.threshold.enabled")
        && (this.poePrices.price.min > config.get("autoclose.threshold.value") || this.poePrices.price.currency === "exalt"))) {
        super.enableAutoClose(config.get("autoclose.timeouts.rare.value"));
      }
    }
  }

  _buildReplacements() {
    var baseType = this.parser.getBaseType();
    var url = this.poePrices.searchUrl;
    var currencyIcon = "", currencyName = "";

    if(this.poePrices.price.currency === "chaos") {
      currencyName = "Chaos Orb";
    } else {
      currencyName = "Exalted Orb";
    }

    currencyIcon = CurrencyIcons[currencyName];

    var replacements = [
      { find: "item-name", replace: this.parser.getName() },
      { find: "item-baseType", replace: baseType },
      { find: "item-value-min", replace: this.poePrices.price.min },
      { find: "item-value-max", replace: this.poePrices.price.max },
      { find: "currency-name", replace: currencyName },
      { find: "currency-icon", replace: currencyIcon },
      { find: "link", replace: url}
    ];

    if(BaseTypeIcons.hasOwnProperty(baseType)) {
      replacements.push({ find: "item-icon", replace: BaseTypeIcons[baseType] });
    }

    return replacements;
  }

}

module.exports = PoeTradeEntry;
