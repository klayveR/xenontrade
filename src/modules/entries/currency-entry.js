const PriceCheckEntry = require("./pricecheck-entry.js");

class CurrencyEntry extends PriceCheckEntry {
  /**
  * Creates a new CurrencyEntry object
  *
  * @constructor
  */
  constructor(item, parser) {
    super();

    this.item = item;
    this.parser = parser;
  }

  add() {
    var template = templates.get("currency.html");
    var replacements = this._buildReplacements();

    // Set template, replacements and add
    super.setTemplate(template);
    super.setReplacements(replacements);
    super.add();

    // Set buttons and trends
    this.visualizeTrend();
    super.enableClose();
    super.enableToggle("switch");
    super.enableToggle("expand");

    // Enable autoclose if configured
    if(config.get("autoclose.enabled") && config.get("autoclose.timeouts.currency.enabled")) {
      super.enableAutoClose(config.get("autoclose.timeouts.currency.value"));
    }
  }

  _buildReplacements() {
    console.log(this.parser);

    var stackSize = this.parser.getStackSize();
    var chaosDetails = ninjaAPI.getCurrencyDetails("Chaos Orb");
    var currencyDetails = ninjaAPI.getCurrencyDetails(this.item.currencyTypeName);

    var pay = {
      trend: this._formatTrendData(this.item.paySparkLine),
      value: "N/A",
      calculated: "N/A",
      confidence: "red"
    };

    var receive = {
      trend: this._formatTrendData(this.item.receiveSparkLine),
      value: "N/A",
      calculated: "N/A",
      confidence: "red"
    };

    // Set the receive value and calculate others
    if(this.item.receive !== null) {
      receive.value = this.item.receive.value;
      receive.calculated = receive.value * stackSize;
      receive.confidence = this._getConfidenceColor(this.item.receive.count);
      pay.calculated = 1 / receive.value;
    }

    // Set the pay value
    if(this.item.pay !== null) {
      pay.value = this.item.pay.value;
      pay.confidence = this._getConfidenceColor(this.item.pay.count);
    }

    return [
      { find: "currency-name", replace: this.item.currencyTypeName },
      { find: "currency-icon", replace: currencyDetails.icon },
      { find: "receive", replace: receive.value },
      { find: "pay", replace: pay.value },
      { find: "stacksize", replace: stackSize },
      { find: "calculated-receive", replace: receive.calculated },
      { find: "calculated-pay", replace: pay.calculated },
      { find: "conf-receive-color", replace: receive.confidence },
      { find: "conf-pay-color", replace: pay.confidence },
      { find: "chaos-icon", replace: chaosDetails.icon },
      { find: "pay-trend", replace: pay.trend },
      { find: "receive-trend", replace: receive.trend }
    ];
  }
}

module.exports = CurrencyEntry;
