const PoeData = require("poedata").PoeData;
const PoePrices = require("./poeprices.js");
const PoeTrade = require("./poetrade.js");
const Parser = require("./parser.js");

const ItemEntry = require("./entries/item-entry.js");
const CurrencyEntry = require("./entries/currency-entry.js");
const TextEntry = require("./entries/text-entry.js");
const RareItemEntry = require("./entries/rare-item-entry.js");
const PoeTradeEntry = require("./entries/poe-trade-entry.js");

const priceProviders = require("../resource/priceProviders");

class Pricecheck {
  /**
  * Gets the item based on the parsed data
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static getPrice(itemText) {
    var parser = new Parser(itemText);
    var itemType = parser.getItemType();

    // If identified and Path of Exile item data...
    if(parser.isPathOfExileData() && parser.isIdentified() === true) {
      if(itemType === "Rare") {
        Pricecheck._getRarePrice(parser, Pricecheck.getPriceProviderQueue("rare"));
      } else if (itemType === "Currency" || itemType === "Fragment") {
        Pricecheck._getCurrencyPrice(parser, Pricecheck.getPriceProviderQueue("currency"));
      } else if (itemType === "Unique") {
        Pricecheck._getUniquePrice(parser, Pricecheck.getPriceProviderQueue("unique"));
      } else if (itemType !== "Magic") {
        Pricecheck._getOtherPrice(parser, Pricecheck.getPriceProviderQueue("others"));
      }
    }
  }
  
  static getPriceProviderQueue(type) {
    let providers = [ config.get("provider_"+type) ];
    for (let providerIdent in priceProviders[type]) {
      if (providers.indexOf(providerIdent) >= 0) {
        continue;
      }
      providers.push(providerIdent);
    }
    return providers;
  }

  /**
  * Gets the item price from the given provider
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {Array} providers Providers used for checking the price
  */
  static _getRarePrice(parser, providers) {
    
    if (providers.length === 0) {
      return;
    }
    let provider = providers.shift();
    
    switch (provider) {
      case "poeprices":
        // poeprices.info
        var entry = new TextEntry("Getting price prediction...", {closeable: false});
        entry.add();
        PoePrices.request(parser.getItemText())
        .then((result) => {
          entry.close();
          new RareItemEntry(result, parser).add();
        })
        .catch((error) => {
          entry.setTitle("Failed to get price prediction");
          entry.setText(error.message);
          entry.setIcon("fa-exclamation-triangle yellow");
          entry.setCloseable(true);
          entry.addLogfileButton();
          // Fallback
          Pricecheck._getRarePrice(parser, providers);
        });
        break;
      case "poetrade":
        // pathofexile.com/trade
        if (ninjaAPI.isUpdating() || PoeData.isUpdating()) {
          GUI.flashIcon("fas fa-exclamation-circle red");
          return;
        }
        Pricecheck._getPoeTradePrice(parser, () => {
          // Fallback
          Pricecheck._getRarePrice(parser, providers);
        });
        break;
    }

  }

  /**
  * Gets the item price from the given provider
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {Array} providers Providers used for checking the price
  */
  static _getCurrencyPrice(parser, providers) {

    if (providers.length === 0) {
      return;
    }
    let provider = providers.shift();

    switch (provider) {
      case "poeninja":
        // poe.ninja
        if (ninjaAPI.isUpdating()) {
          GUI.flashIcon("fas fa-exclamation-circle red");
          return;
        }
        Pricecheck._getNinjaPrice(parser, () => {
          // Fallback
          Pricecheck._getCurrencyPrice(parser, providers);
        });
        break;
    }
  }

  /**
  * Gets the item price from the given provider
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {Array} providers Providers used for checking the price
  */
  static _getUniquePrice(parser, providers) {
    
    if (providers.length === 0) {
      return;
    }
    let provider = providers.shift();

    switch (provider) {
      case "poeninja":
        // poe.ninja
        if (ninjaAPI.isUpdating()) {
          GUI.flashIcon("fas fa-exclamation-circle red");
          return;
        }
        Pricecheck._getNinjaPrice(parser, () => {
          // Fallback
          Pricecheck._getUniquePrice(parser, providers);
        });
        break;
      case "poetrade":
        // pathofexile.com/trade
        if (ninjaAPI.isUpdating() || PoeData.isUpdating()) {
          GUI.flashIcon("fas fa-exclamation-circle red");
          return;
        }
        Pricecheck._getPoeTradePrice(parser, () => {
          // Fallback
          Pricecheck._getUniquePrice(parser, providers);
        });
        break;
    }
  }

  /**
  * Gets the item price from the given provider
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {Array} providers Providers used for checking the price
  */
  static _getOtherPrice(parser, providers) {
    
    if (providers.length === 0) {
      return;
    }
    let provider = providers.shift();

    switch (provider) {
      case "poeninja":
        // poe.ninja
        if (ninjaAPI.isUpdating()) {
          GUI.flashIcon("fas fa-exclamation-circle red");
          return;
        }
        Pricecheck._getNinjaPrice(parser, () => {
          // Fallback
          Pricecheck._getOtherPrice(parser, providers);
        });
        break;
      case "poetrade":
        // pathofexile.com/trade
        if (ninjaAPI.isUpdating() || PoeData.isUpdating()) {
          GUI.flashIcon("fas fa-exclamation-circle red");
          return;
        }
        Pricecheck._getPoeTradePrice(parser, () => {
          // Fallback
          Pricecheck._getOtherPrice(parser, providers);
        });
        break;
    }
  }

  /**
  * Gets the item based on the parsed data from pathofexile.com/trade
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static _getPoeTradePrice(parser, cbFallback) {
    var entry = new TextEntry("Getting price prediction...", {closeable: false});
    entry.add();
    PoeTrade.request(parser.item)
      .then((result) => {
        entry.close();
        if (result.price.avg > 0) {
          new PoeTradeEntry(result, parser).add();
        } else {
          // Fallback
          cbFallback();
        }
      })
      .catch((error) => {
        console.error(error.message);
        console.log(error.stack);
        entry.setTitle("Failed to get price prediction");
        entry.setText(error.message);
        entry.setIcon("fa-exclamation-triangle yellow");
        entry.setCloseable(true);
        entry.addLogfileButton();
        // Fallback
        cbFallback();
      });
  }

  /**
  * Gets the item based on the parsed data from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static _getNinjaPrice(parser, cbFallback) {
    if(ninjaAPI.hasData(config.get("league"))) {
      ninjaAPI.getItem(parser.getName(), {league: config.get("league"), links: parser.getLinks(), variant: parser.getVariant(), fallbackVariant: parser.getDefaultVariant(), relic: parser.isRelic(), baseType: parser.getBaseType()})
      .then((itemArray) => {
        return Pricecheck._handleNinjaPrice(parser, itemArray[0]);
      })
      .catch((error) => {
        // Fallback
        cbFallback();
        // Warning idicator
        return GUI.flashIcon("fas fa-exclamation-circle yellow");
      });
    } else {
      new TextEntry("No data", "There's no data for " + config.get("league") + ". You should update before attempting to price check another item.", {icon: "fa-exclamation-triangle yellow", timeout: 10}).add();
    }
  }

  /**
  * Adds a new entry for the item that has been received from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {Object} item Item object from poe.ninja
  */
  static _handleNinjaPrice(parser, item) {
    var itemType = parser.getItemType();

    if(itemType === "Currency" || itemType === "Fragment") {
      new CurrencyEntry(item, parser).add();
    } else {
      new ItemEntry(item, parser).add();
    }
  }

  /**
  * Updates poe.ninja data
  */
  static updateNinja() {
    if(!ninjaAPI.isUpdating()) {
      GUI.toggleMenuButtonColor("update", false);

      var ninjaUpdateEntry = new TextEntry("Updating price data...");
      ninjaUpdateEntry.add();
      ninjaUpdateEntry.setCloseable(false);
      ninjaUpdateEntry.setTitleInfo(config.get("league"));

      ninjaAPI.update({league: config.get("league")})
      .then((result) => {
        ninjaUpdateEntry.setTitle("Update successful!");
        ninjaUpdateEntry.setIcon("fa-check-circle green");
        ninjaUpdateEntry.setCloseable(true);
        ninjaUpdateEntry.enableAutoClose(10);
      })
      .catch((error) => {
        log.warn("Failed updating poe.ninja prices, " + error);
        ninjaUpdateEntry.setTitle("Update failed!");
        ninjaUpdateEntry.setText("Please check the log file for more information.");
        ninjaUpdateEntry.setCloseable(true);
        ninjaUpdateEntry.setIcon("fa-exclamation-circle red");
        ninjaUpdateEntry.addLogfileButton();
      })
      .then(() => {
        GUI.toggleMenuButtonColor("update", true);
      });
    }
  }

  /**
  * Updates poe.ninja data
  */
  static updatePoeData() {
    if(!PoeData.isUpdating()) {
      GUI.toggleMenuButtonColor("update", false);

      var poeDataUpdateEntry = new TextEntry("Updating poe data...");
      poeDataUpdateEntry.add();
      poeDataUpdateEntry.setCloseable(false);
      
      var progressTextBase = "Checking locally cached data";
      var progressTextDots = "..."
      var cacheOnly = true;
      var animateProgress = () => {
        progressTextDots += ".";
        if (progressTextDots.length > 8) {
          progressTextDots = ".";
        }
        poeDataUpdateEntry.setText(progressTextBase+progressTextDots);
      };
      var cbUpdateStart = (module) => {
        cacheOnly = false;
        progressTextBase = "Downloading "+module;
        animateProgress();
      };
      var cbUpdateStatus = (module, subType, index) => {
        cacheOnly = false;
        progressTextBase = "Downloading "+module+" "+subType;
        animateProgress();
      };
      
      PoeData.registerCallback("update-start", cbUpdateStart);
      PoeData.registerCallback("update-status", cbUpdateStatus);

      PoeData.refresh()
      .then((result) => {
        if (cacheOnly) {
          // Only validated that cache is still up to date, hide instantly
          poeDataUpdateEntry.close();
        } else {
          // Actually downloaded data, show success message for a few seconds
          poeDataUpdateEntry.setTitle("Updated poe data!");
          poeDataUpdateEntry.setIcon("fa-check-circle green");
          poeDataUpdateEntry.setText("Update completed!");
          poeDataUpdateEntry.setCloseable(true);
          poeDataUpdateEntry.enableAutoClose(10);
        }
      })
      .catch((error) => {
        log.warn("Failed updating poe data, " + error);
        log.info(error.stack);
        poeDataUpdateEntry.setTitle("Update failed!");
        poeDataUpdateEntry.setText("Please check the log file for more information.");
        poeDataUpdateEntry.setCloseable(true);
        poeDataUpdateEntry.setIcon("fa-exclamation-circle red");
        poeDataUpdateEntry.addLogfileButton();
      })
      .then(() => {
        GUI.toggleMenuButtonColor("update", true);
        PoeData.unregisterCallback("update-start", cbUpdateStart);
        PoeData.unregisterCallback("update-status", cbUpdateStatus);
      });
    }
  }
}

module.exports = Pricecheck;
