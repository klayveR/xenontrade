const electron = require("electron");
const remote = require("electron").remote;
let { ipcRenderer } = electron;

const Templates = require("./templates.js");
const Entry = require("./entry.js");

class GUI {
  // TODO: jsdocs
  constructor(app, width) {
    this.app = app;
    this.templates = new Templates();
    this.templatesLoaded = false;
    this.width = width || 300;
    this.window = remote.getCurrentWindow();
    this.entryContainer = $(".entries");
    this.entryCount = 0;

    this.initialize();
  }

  initialize() {
    this.initializeButtons();
    this.loadTemplates();
    this.updateWindowHeight();
  }

  addCurrencyEntry(currency, stackSize) {
    var template = this.templates.get("currency.html");
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

    return this.addEntry(template, replacements, {switchable: true, expandable: true, trend: hasTrend});
  }

  addItemEntry(item) {
    var template = this.templates.get("item.html");
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

    return this.addEntry(template, replacements, {switchable, expandable, trend: hasTrend});
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

  addTextEntry(title, text, icon = "fa-info-circle grey") {
    var template = this.templates.get("text.html");

    var replacements = [
      { find: "title", replace: title },
      { find: "text", replace: text },
      { find: "icon", replace: icon }
    ];

    return this.addEntry(template, replacements);
  }

  addEntry(template, replacements, options) {
    options = options || {};

    var timeout = options.timeout || 0;
    var isCloseable = options.closeable || true;
    var isExpandable = options.expandable || false;
    var isSwitchable = options.switchable || false;
    var hasTrend = options.trend || false;

    var entry = new Entry(this, this.entryCount);
    entry.setTemplate(template);
    entry.setReplacements(replacements);
    entry.add();

    if(timeout > 0) {
      entry.enableAutoClose(timeout);
    }

    if(isCloseable) {
      entry.enableClose();
    }

    if(isExpandable) {
      entry.enableExpand();
    }

    if(isSwitchable) {
      entry.enableSwitch();
    }

    if(hasTrend) {
      entry.enableTrend();
      entry.visualizeTrend();
    }

    this.entryCount++;
    return entry;
  }

  initializeButtons() {
    var self = this;

    $("#minimizeButton").click(function(e) {
      e.preventDefault();
      self.window.minimize();
    });

    $("#closeButton").click(function(e) {
      e.preventDefault();
      self.window.close();
    });

    $("#updateButton").click(function(e) {
      e.preventDefault();
      self.app.updateNinja();
    });
  }

  loadTemplates() {
    this.templates.loadTemplates()
    .then((templates) => {
      this.templatesLoaded = true;
      this.app.loadNinja();
    })
    .catch((error) => {
      console.error("Couldn't load templates:", error);
      this.templatesLoaded = false;
    });
  }

  updateWindowHeight() {
    var height = $(".main").height();
    ipcRenderer.send("resize", this.width, height);
  }
}

module.exports = GUI;
