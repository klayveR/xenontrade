const Entry = require("./entry.js");
const _ = require("underscore");

class Entries {
  constructor(app) {
    this.app = app;
    this.entryCount = 0;
  }

  addText(title, text, icon = "fa-info-circle grey", options) {
    var template = this.app.templates.get("text.html");

    var replacements = [
      { find: "title", replace: title },
      { find: "text", replace: text },
      { find: "icon", replace: icon }
    ];

    return this._add(template, replacements, options);
  }

  addCurrency(currency, stackSize) {
    var template = this.app.templates.get("currency.html");
    var chaosDetails = this.app.ninjaAPI.getCurrencyDetails("Chaos Orb");
    var currencyDetails = this.app.ninjaAPI.getCurrencyDetails(currency.currencyTypeName);
    var hasTrend = false;

    var pay = {
      trend: this._formatTrendData(currency.paySparkLine),
      value: "N/A",
      calculated: "N/A",
      confidence: "red"
    };

    var receive = {
      trend: this._formatTrendData(currency.receiveSparkLine),
      value: "N/A",
      calculated: "N/A",
      confidence: "red"
    };

    // Set the receive value and calculate others
    if(currency.receive !== null) {
      receive.value = currency.receive.value;
      receive.calculated = receive.value * stackSize;
      receive.confidence = this._getConfidenceColor(currency.receive.count);
      pay.calculated = 1 / receive.value;
    }

    // Set the pay value
    if(currency.pay !== null) {
      pay.value = currency.pay.value;
      pay.confidence = this._getConfidenceColor(currency.pay.count);
    }

    // Show trend if either the pay or the receive trend have values !== 0
    if(pay.trend.some((el) => el !== 0) || receive.trend.some((el) => el !== 0)) {
      hasTrend = true;
    }

    var replacements = [
      { find: "currency-name", replace: currency.currencyTypeName },
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

    return this._add(template, replacements, {switchable: true, expandable: true, trend: hasTrend});
  }

  addItem(item) {
    var chaosDetails = this.app.ninjaAPI.getCurrencyDetails("Chaos Orb");
    var exaltedDetails = this.app.ninjaAPI.getCurrencyDetails("Exalted Orb");
    var template = this.app.templates.get("item.html");
    var switchable = false;
    var expandable = false;
    var trend = this._formatTrendData(item.sparkline);
    var name = item.name;

    var hasTrend = false;
    var confidence = this._getConfidenceColor(item.count);

    // Append variant to item name if it is a variant, not on maps
    if(item.variant !== null && item.variant !== "Atlas2") {
      name = item.name + " (" + item.variant + ")";
    }

    // Prepend links to item name if links > 0
    if(item.links > 0) {
      name = item.links + "-link " + item.name;
    }

    // Enable switch button if exalted value is > 1
    if(item.exaltedValue >= 1) {
      switchable = true;
    }

    // Enable expand button if any trend value is !== 0
    if(trend.some((el) => el !== 0)) {
      hasTrend = true;
    }

    var replacements = [
      { find: "item-name", replace: name },
      { find: "item-icon", replace: item.icon },
      { find: "item-value-chaos", replace: item.chaosValue },
      { find: "item-value-exalted", replace: item.exaltedValue },
      { find: "chaos-icon", replace: chaosDetails.icon },
      { find: "exalted-icon", replace: exaltedDetails.icon },
      { find: "conf-color", replace: confidence },
      { find: "trend", replace: trend }
    ];

    return this._add(template, replacements, {switchable, expandable, trend: true});
  }

  _add(template, replacements, options) {
    var defaultOptions = {
        timeout: 0,
        closeable: true,
        expandable: false,
        switchable: false,
        trend: false
    };

    options = _.extend(defaultOptions, options);

    var entry = new Entry(this.app, this.entryCount);
    entry.setTemplate(template);
    entry.setReplacements(replacements);
    entry.add();

    if(options.timeout > 0) {
      entry.enableAutoClose(options.timeout);
    }

    if(options.closeable) {
      entry.enableClose();
    }

    if(options.expandable) {
      entry.enableToggle("expand");
    }

    if(options.switchable) {
      entry.enableToggle("switch");
    }

    if(options.trend) {
      entry.enableToggle("trend");
      entry.visualizeTrend();
    }

    this.entryCount++;
    return entry;
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
        trend = trend.filter(function(e) { return e === 0 || e; });
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
