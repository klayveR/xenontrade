const PoePrices = require("./poeprices.js");
const PoeTrade = require("./poetrade.js");
const Parser = require("./parser.js");

const ItemEntry = require("./entries/item-entry.js");
const CurrencyEntry = require("./entries/currency-entry.js");
const TextEntry = require("./entries/text-entry.js");
const RareItemEntry = require("./entries/rare-item-entry.js");
const PoeTradeEntry = require("./entries/poe-trade-entry.js");

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
        Pricecheck._getRarePrice(parser, config.get("provider_rare"));
      } else if (itemType === "Currency" || itemType === "Fragment") {
        Pricecheck._getCurrencyPrice(parser, config.get("provider_currency"));
      } else if (itemType !== "Magic") {
        Pricecheck._getOtherPrice(parser, config.get("provider_others"));
      }
    }
  }

  /**
  * Gets the item price from the given provider
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {string} provider Provider used for checking the price
  */
  static _getRarePrice(parser, provider) {

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
        });
        break;
      case "poetrade":
        // pathofexile.com/trade
        if (ninjaAPI.isUpdating() || poeData.isUpdating()) {
          GUI.flashIcon("fas fa-exclamation-circle red");
          return;
        }
        Pricecheck._getPoeTradePrice(parser)
        break;
    }

  }

  /**
  * Gets the item price from the given provider
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {string} provider Provider used for checking the price
  */
  static _getCurrencyPrice(parser, provider) {
      switch (provider) {
        case "poeninja":
          // poe.ninja
          if (ninjaAPI.isUpdating()) {
            GUI.flashIcon("fas fa-exclamation-circle red");
            return;
          }
          Pricecheck._getNinjaPrice(parser)
          break;
      }
  }

  /**
  * Gets the item price from the given provider
  *
  * @param {Parser} parser Parser containing the item clipboard
  * @param {string} provider Provider used for checking the price
  */
  static _getOtherPrice(parser, provider) {
      switch (provider) {
        case "poeninja":
          // poe.ninja
          if (ninjaAPI.isUpdating()) {
            GUI.flashIcon("fas fa-exclamation-circle red");
            return;
          }
          Pricecheck._getNinjaPrice(parser)
          break;
        case "poetrade":
          // pathofexile.com/trade
          if (ninjaAPI.isUpdating() || poeData.isUpdating()) {
            GUI.flashIcon("fas fa-exclamation-circle red");
            return;
          }
          Pricecheck._getPoeTradePrice(parser)
          break;
      }
  }

  /**
  * Gets the item based on the parsed data from pathofexile.com/trade
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static _getPoeTradePrice(parser) {
    var entry = new TextEntry("Getting price prediction...", {closeable: false});
    entry.add();
    PoeTrade.request(parser.item)
      .then((result) => {
        entry.close();
        new PoeTradeEntry(result, parser).add();
      })
      .catch((error) => {
        console.error(error.message);
        console.log(error.stack);
        entry.setTitle("Failed to get price prediction");
        entry.setText(error.message);
        entry.setIcon("fa-exclamation-triangle yellow");
        entry.setCloseable(true);
        entry.addLogfileButton();
      });
  }

  /**
  * Gets the item based on the parsed data from poe.ninja
  *
  * @param {Parser} parser Parser containing the item clipboard
  */
  static _getNinjaPrice(parser) {
    if(ninjaAPI.hasData(config.get("league"))) {
      ninjaAPI.getItem(parser.getName(), {league: config.get("league"), links: parser.getLinks(), variant: parser.getVariant(), fallbackVariant: parser.getDefaultVariant(), relic: parser.isRelic(), baseType: parser.getBaseType()})
      .then((itemArray) => {
        return Pricecheck._handleNinjaPrice(parser, itemArray[0]);
      })
      .catch((error) => {
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
}

module.exports = Pricecheck;
