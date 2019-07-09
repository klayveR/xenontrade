const request = require("request-promise-native");
const modPseudoMappings = require("../resource/modPseudoMappings");

const PoeData = require("poedata").PoeData;

class PoeTrade {
  /**
  * Requests item price prediction from pathofexile.com/trade/
  *
  * @param {Item} itemData Item text copied from Path of Exile
  * @returns {Promise}
  * @fulfil {Object} - Object containing the requested item encoded in base64 and the result
  * @reject {Error} - The `error.message` contains information about why the promise was rejected
  */
  static request(itemData) {
    return new Promise(function(resolve, reject) {
      var url = "https://www.pathofexile.com/api/trade/search/"+config.get("league");
      var parameters = PoeTrade.getSearchQuery(itemData);
      var options = {
        method: 'POST',
        uri: url,
        body: parameters,
        json: true // Automatically stringifies the body to JSON
      };

      request(url, options)
        .then((response) => {
          PoeTrade.requestItems(response.id, response.result.slice(0, 10))
            .then((summary) => {
              resolve(summary);
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          log.warn("Request to pathofexile.com/trade/ failed. (Search submit)\n" + JSON.stringify(error, null, 4));
          reject(new Error("Request to <b>pathofexile.com/trade/</b> failed. (Search submit)" + error.error));
        });
    });
  }

  static requestItems(searchId, itemIds) {
    return new Promise(async function(resolve, reject) {
      if (itemIds.length == 0) {
        resolve( PoeTrade.getSearchResultSummary(searchId, null) );
        return;
      }
      let url = "https://www.pathofexile.com/api/trade/fetch/"+itemIds.join(",")+"?query="+searchId;
      var options = {
        method: 'GET',
        uri: url,
        json: true // Automatically stringifies the body to JSON
      };

      request(url, options)
        .then((response) => {
          try {
            resolve( PoeTrade.getSearchResultSummary(searchId, response) );
          } catch(error) {
            reject(error);
          }
        })
        .catch((error) => {
          log.warn("Request to pathofexile.com/trade/ failed. (Search fetch)\n" + JSON.stringify(error, null, 4));
          reject(new Error("Request to <b>pathofexile.com/trade/</b> failed. (Search fetch)" + error.error));
        });
    });
  }

  static getSearchResultSummary(searchId, response) {
    let result = {
      searchUrl: "https://www.pathofexile.com/trade/search/"+config.get("league")+"/"+searchId,
      priceList: [],
      price: { currency: "chaos", min: null, max: null, avg: 0 }
    };
    if (response === null) {
      result.price.min = "???";
      result.price.max = "???";
      return result;
    }
    let priceEx = PoeTrade.getCurrencyChaosValue("exa", 1);
    let priceSum = 0;
    for (let i = 0; i < response.result.length; i++) {
      let item = response.result[i];
      if ((typeof item.listing == "undefined") || (typeof item.listing.price == "undefined")
          || (item.listing.price == null) || (typeof item.listing.price.amount == "undefined")) {
        continue;
      }
      let priceChaos = PoeTrade.getCurrencyChaosValue(item.listing.price.currency, item.listing.price.amount);
      if (priceChaos !== null) {
        priceSum += priceChaos;
        if ((result.price.min === null) || (result.price.min > priceChaos)) {
          result.price.min = priceChaos;
        }
        if ((result.price.max === null) || (result.price.max < priceChaos)) {
          result.price.max = priceChaos;
        }
        result.priceList.push(priceChaos);
      }
    }
    if (result.priceList.length > 0) {
      result.price.avg = priceSum / result.priceList.length;
    } else {
      result.price.min = "???";
      result.price.max = "???";
      return result;
    }
    if (result.price.min >= priceEx) {
      result.price.currency = "exa";
      result.price.avg = Math.round(result.price.avg * 100 / priceEx) / 100;
      result.price.min = Math.round(result.price.min * 100 / priceEx) / 100;
      result.price.max = Math.round(result.price.max * 100 / priceEx) / 100;
    }
    return result;
  }

  static getCurrencyChaosValue(currency, amount) {
    if (currency == "chaos") {
      return amount;
    }
    let currencyName = PoeData.getCurrencyName(currency);
    let currencyList = ninjaAPI.data[config.get("league")]['Currency'];
    for (let i = 0; i < currencyList.length; i++) {
      if (currencyList[i].currencyTypeName == currencyName) {
        return currencyList[i].chaosEquivalent * amount;
      }
    }
    return null;
  }

  static getSearchQuery(itemData) {
    let request = {
      query: {
        filters: {},
        stats: [],
        status: { option: "online" }
      },
      sort: { price: "asc" }
    };
    let pseudoMods = {};
    // Search sockets and links
    if (itemData.getMaxLinkLength() > 3) {
      PoeTrade.addFilterToQuery(request, "socket_filters", "sockets", {
        min: itemData.getSocketCount(),
        max: itemData.getSocketCountMax()
      });
      PoeTrade.addFilterToQuery(request, "socket_filters", "links", {
        min: itemData.getMaxLinkLength()
      });
    }
    // Search for weapon values
    if (itemData.getDPS() > 30) {
      PoeTrade.addFilterToQuery(request, "weapon_filters", "dps", {
        min: (itemData.getDPS() - 30) * 0.9
      });
    }
    // Search for armour values
    if (itemData.getArmour() > 30) {
      PoeTrade.addFilterToQuery(request, "armour_filters", "ar", {
        min: (itemData.getArmour() - 30) * 0.9
      });
    }
    if (itemData.getEnergyShield() > 10) {
      PoeTrade.addFilterToQuery(request, "armour_filters", "es", {
        min: (itemData.getEnergyShield() - 10) * 0.9
      });
    }
    if (itemData.getEvasion() > 30) {
      PoeTrade.addFilterToQuery(request, "armour_filters", "ev", {
        min: (itemData.getEvasion() - 30) * 0.9
      });
    }
    if (itemData.getBlock() > 5) {
      PoeTrade.addFilterToQuery(request, "armour_filters", "block", {
        min: (itemData.getBlock() - 5) * 0.9
      });
    }
    // Search name
    let ignoreName = true;
    let itemRarity = null;
    switch (itemData.getRarity()) {
      case "Normal":
      case "Magic":
      case "Rare":
        itemRarity = itemData.getRarity();
        ignoreName = false;
        if (itemData.hasTag("weapon") || itemData.hasTag("armour") || itemData.hasTag("quiver")
            || itemData.hasTag("ring") || itemData.hasTag("belt") || itemData.hasTag("amulet")
            || itemData.hasTag("jewel")) {
          ignoreName = true;
        }
        break;
      case "Unique":
        itemRarity = itemData.getRarity();
        // Search unique items by name
        ignoreName = false;
        break;
    }
    if (!ignoreName) {
      request.query.term = itemData.getName();
    }
    // Special cases that ignore rarity
    if (itemData.hasTag("rusted_scarab")) {
      itemRarity = null;
    }
    // Add implicit if present
    let implicitMods = itemData.getImplicitMods();
    for (let i = 0; i < implicitMods.length; i++) {
      if (!PoeTrade.handleModSpecial(pseudoMods, implicitMods[i], itemData)) {
        PoeTrade.addModToQuery(request, implicitMods[i]);
      }
    }
    // Add explicits
    let explicitMods = itemData.getExplicitMods();
    for (let i = 0; i < explicitMods.length; i++) {
      if (!PoeTrade.handleModSpecial(pseudoMods, explicitMods[i], itemData)) {
        PoeTrade.addModToQuery(request, explicitMods[i]);
      }
    }
    // Add pseudo mods
    for (let pseudoId in pseudoMods) {
      PoeTrade.addRawModToQuery(request, pseudoMods[pseudoId]);
    }
    // Search for item type
    PoeTrade.addItemCategory(request, itemData);
    // Search for quality
    if (itemData.hasTag("gem")) {
      PoeTrade.addItemQuality(request, itemData);
    }
    // Search for rarity
    if (itemRarity !== null) {
      PoeTrade.addFilterToQuery(request, "type_filters", "rarity", {
        option: itemRarity.toLowerCase()
      });
    }
    // Search for corrupted / not corrupted query.filters.misc_filters.filters.corrupted
    PoeTrade.addFilterToQuery(request, "misc_filters", "corrupted", {
      option: itemData.isCorrupted()
    });

    //console.log(require('util').inspect(request, { depth: null }));
    return request;
  }
  static addItemCategory(request, itemData) {
    let itemCategory = null;
    if (itemData.hasTag("one_hand_weapon") && !itemData.hasTag("ranged")) {
      itemCategory = "weapon.onemelee";
    } else if (itemData.hasTag("two_hand_weapon") && !itemData.hasTag("ranged")) {
      itemCategory = "weapon.twomelee";
    } else if (itemData.hasTag("bow")) {
      itemCategory = "weapon.bow";
    } else if (itemData.hasTag("wand")) {
      itemCategory = "weapon.wand";
    } else if (itemData.hasTag("body_armour")) {
      itemCategory = "armour.chest";
    } else if (itemData.hasTag("boots")) {
      itemCategory = "armour.boots";
    } else if (itemData.hasTag("gloves")) {
      itemCategory = "armour.gloves";
    } else if (itemData.hasTag("helmet")) {
      itemCategory = "armour.helmet";
    } else if (itemData.hasTag("shield")) {
      itemCategory = "armour.shield";
    } else if (itemData.hasTag("quiver")) {
      itemCategory = "armour.quiver";
    } else if (itemData.hasTag("amulet")) {
      itemCategory = "accessory.amulet";
    } else if (itemData.hasTag("belt")) {
      itemCategory = "accessory.belt";
    } else if (itemData.hasTag("ring")) {
      itemCategory = "accessory.ring";
    }
    if (itemCategory !== null) {
      PoeTrade.addFilterToQuery(request, "type_filters", "category", {
        option: itemCategory
      });
    }
  }
  static addItemQuality(request, itemData) {
    PoeTrade.addFilterToQuery(request, "misc_filters", "quality", {
      min: Math.max(0, itemData.getQuality() - 1),
      max: (itemData.getQuality() > 0 ? itemData.getQuality() + 1 : 0)
    });
  }
  static addFilterToQuery(request, filterBase, filterField, filterValue) {
    if (typeof request.query.filters[filterBase] == "undefined") {
      request.query.filters[filterBase] = {};
    }
    if (typeof request.query.filters[filterBase].filters == "undefined") {
      request.query.filters[filterBase].filters = {};
    }
    request.query.filters[filterBase].filters[filterField] = filterValue;
  }
  static addModToQuery(request, itemMod, filterType, filterIndex) {
    let filters = PoeTrade.getModFilters(itemMod);
    for (let i = 0; i < filters.length; i++) {
      this.addRawModToQuery(request, filters[i], filterType, filterIndex);
    }
  }
  static addRawModToQuery(request, itemModFilter, filterType, filterIndex) {
    if (itemModFilter === null) {
      return;
    }
    // Default values
    if (typeof filterType == "undefined") {
      filterType = "and";
    }
    if (typeof filterIndex == "undefined") {
      filterIndex = 0;
    }
    // Add to form
    if ((filterIndex !== null) && (typeof request.query.stats[filterIndex] == "undefined")) {
      filterIndex = null;
    }
    if (filterIndex !== null) {
      request.query.stats[filterIndex].filters.push(itemModFilter);
    } else {
      request.query.stats.push({
        filters: [ itemModFilter ],
        type: filterType
      });
    }
  }
  static getModFilters(itemMod) {
    // Get filter values
    let statIds = itemMod.getTradeIds();
    let filters = [];
    for (let s = 0; s < statIds.length; s++) {
      if (statIds[s] === null) {
        continue;
      }
      let min = itemMod.getValueMin(s);
      let max = itemMod.getValueMax(s);
      let avg = itemMod.getValueAvg(s);
      // Build filter
      let filter = { id: statIds[s] };
      if ((min !== null) && (max !== null) && (avg !== null)) {
        if (avg == max) {
          filter.value = { min: avg };
        } else {
          let range = max - min;
          filter.value = { 
            min: Math.max(min, avg - range * 0.1)
          };
        }
      }      
      filters.push(filter);
    }
    return filters;
  }
  static handleModSpecial(pseudoMods, itemMod, item) {
    let modGroup = itemMod.getGroup();
    let itemTags = item.getTags();
    let pseudoId = false;
    if (typeof modPseudoMappings["mod group"][modGroup] != "undefined") {
      pseudoId = modPseudoMappings["mod group"][modGroup];
    }
    for (let t = 0; t < itemTags.length; t++) {
      let filterMods = modPseudoMappings["item tag"][ itemTags[t] ];
      if ((typeof filterMods != "undefined") && (typeof filterMods[modGroup] != "undefined")) {
        pseudoId = filterMods[modGroup];
      }
    }
    if (pseudoId !== false) {
      if (pseudoId !== null) {
        let pseudoIds = (typeof pseudoId == "string" ? [pseudoId] : pseudoId);
        for (let i = 0; i < pseudoIds.length; i++) {
          pseudoId = pseudoIds[i];
          if (pseudoId === null) {
            continue;
          }
          if (typeof pseudoMods[pseudoId] == "undefined") {
            pseudoMods[pseudoId] = { id: pseudoId, value: { min: 0 } };
          }
          if (itemMod.getValueAvg(i) == itemMod.getValueMax(i)) {
            pseudoMods[pseudoId].value.min += itemMod.getValueAvg(i);
          } else {
            pseudoMods[pseudoId].value.min += itemMod.getValueMin(i);
          }
        }
      }
      return true;
    }
    return false
  }
}

module.exports = PoeTrade;