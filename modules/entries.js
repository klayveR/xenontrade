const Entry = require("./entry.js");

class Entries {
  constructor(app) {
    this.app = app;
    this.entryCount = 0;
  }

  add(template, replacements, options) {
    options = options || {};

    var timeout = 0;
    var closeable = true;
    var expandable = false;
    var switchable = false;
    var trend = false;

    if(options.hasOwnProperty("timeout")) { timeout = options.timeout; }
    if(options.hasOwnProperty("closeable")) { closeable = options.closeable; }
    if(options.hasOwnProperty("expandable")) { expandable = options.expandable; }
    if(options.hasOwnProperty("switchable")) { switchable = options.switchable; }
    if(options.hasOwnProperty("trend")) { trend = options.trend; }

    var entry = new Entry(this.app, this.entryCount);
    entry.setTemplate(template);
    entry.setReplacements(replacements);
    entry.add();

    if(timeout > 0) {
      entry.enableAutoClose(timeout);
    }

    if(closeable) {
      entry.enableClose();
    }

    if(expandable) {
      entry.enableToggle("expand");
    }

    if(switchable) {
      entry.enableToggle("switch");
    }

    if(trend) {
      entry.enableToggle("trend");
      entry.visualizeTrend();
    }

    this.entryCount++;
    return entry;
  }

  addText(title, text, icon = "fa-info-circle grey", options) {
    options = options || {};
    var template = this.app.gui.templates.get("text.html");

    var replacements = [
      { find: "title", replace: title },
      { find: "text", replace: text },
      { find: "icon", replace: icon }
    ];

    return this.add(template, replacements, options);
  }

  addCurrency(currency, stackSize) {
    var template = this.app.gui.templates.get("currency.html");
    var chaosDetails = this.app.ninjaAPI.getCurrencyDetails("Chaos Orb");
    var currencyDetails = this.app.ninjaAPI.getCurrencyDetails(currency.currencyTypeName);

    var payTrend = this._formatTrendData(currency.paySparkLine);
    var receiveTrend = this._formatTrendData(currency.receiveSparkLine);
    var hasTrend = false;

    var pay = "N/A", receive = "N/A";
    var calculatedReceive = "N/A", calculatedPay = "N/A";
    var confidencePay = "red", confidenceReceive = "red";

    // Set the receive value and calculate others
    if(currency.receive !== null) {
      receive = currency.receive.value;
      calculatedReceive = receive * stackSize;
      calculatedPay = 1 / receive;
      confidenceReceive = this._getConfidenceColor(currency.receive.count);
    }

    // Set the pay value
    if(currency.pay !== null) {
      pay = currency.pay.value;
      confidencePay = this._getConfidenceColor(currency.pay.count);
    }

    // Show trend if either the pay or the receive trend have values !== 0
    if(payTrend.some(el => el !== 0) || receiveTrend.some(el => el !== 0)) {
      hasTrend = true;
    }

    var replacements = [
      { find: "currency-name", replace: currency.currencyTypeName },
      { find: "currency-icon", replace: currencyDetails.icon },
      { find: "receive", replace: receive },
      { find: "pay", replace: pay },
      { find: "stacksize", replace: stackSize },
      { find: "calculated-receive", replace: calculatedReceive },
      { find: "calculated-pay", replace: calculatedPay },
      { find: "conf-receive-color", replace: confidenceReceive },
      { find: "conf-pay-color", replace: confidencePay },
      { find: "chaos-icon", replace: chaosDetails.icon },
      { find: "pay-trend", replace: payTrend },
      { find: "receive-trend", replace: receiveTrend }
    ];

    return this.add(template, replacements, {switchable: true, expandable: true, trend: hasTrend});
  }

  addItem(item) {
    var template = this.app.gui.templates.get("item.html");
    var chaosDetails = this.app.ninjaAPI.getCurrencyDetails("Chaos Orb");
    var exaltedDetails = this.app.ninjaAPI.getCurrencyDetails("Exalted Orb");
    var switchable = false;
    var expandable = false;
    var trend = this._formatTrendData(item.sparkline);
    var hasTrend = false;
    var confidence = this._getConfidenceColor(item.count);

    // Append variant to item name if it is a variant
    if(item.variant !== null) {
      item.name = item.name + " (" + item.variant + ")";
    }

    // Prepend links to item name if links > 0
    if(item.links > 0) {
      item.name = item.links + "-link " + item.name;
    }

    // Enable switch button if exalted value is > 1
    if(item.exaltedValue >= 1) {
      switchable = true;
    }

    // Enable expand button if any trend value is !== 0
    if(trend.some(el => el !== 0)) {
      hasTrend = true;
    }

    var replacements = [
      { find: "item-name", replace: item.name },
      { find: "item-icon", replace: item.icon },
      { find: "item-value-chaos", replace: item.chaosValue },
      { find: "item-value-exalted", replace: item.exaltedValue },
      { find: "chaos-icon", replace: chaosDetails.icon },
      { find: "exalted-icon", replace: exaltedDetails.icon },
      { find: "conf-color", replace: confidence },
      { find: "trend", replace: trend.toString() }
    ];

    return this.add(template, replacements, {switchable, expandable, trend: hasTrend});
  }

  /**
  * Removes null from sparkline data and returns the trend as an array
  *
  * @param {Object} sparkline Sparkline object that contains a sparkline data array
  * @return {Array}
  */
  _formatTrendData(sparkline) {
    var trend = [0];

    if(sparkline !== null && sparkline.hasOwnProperty("data")) {
      if(sparkline.data.length > 0) {
        trend = sparkline.data;
        trend = trend.filter(function(e){ return e === 0 || e });
      }
    }

    return trend;
  }

  /**
  * Removes null from sparkline data and returns the trend as an array
  *
  * @param {Object} sparkline Sparkline object that contains a sparkline data array
  * @return {Array}
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

module.exports = Entries;
