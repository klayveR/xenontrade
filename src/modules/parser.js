const itemVariants = require("../resource/itemVariants");
const gemVariants = require("../resource/gemVariants");
const parserTypes = require("../resource/parserTypes");
const mapAffixes = require("../resource/mapAffixes");
const PoeData = require("poedata").PoeData;
const Item = require("poedata").Item;

class Parser {
  /**
  * Creates a new Parser object
  *
  * @constructor
  * @param {string} clipboard Content of the clipboard
  */
  constructor(clipboard) {
    this.clipboard = clipboard;
    this.fixCannotUseText();
    
    this.item = null;
    if (this.isPathOfExileData() && !PoeData.isUpdating()) {
      try {
        this.item = new Item(this.getClipboardLines());
      } catch (error) {
        console.error(error.message);
        console.log(error.stack);
      }
    }
  }

  /**
  * Removes the "You cannot use this item" text from the item text
  */
  fixCannotUseText() {
    var lines = this.getClipboardLines();

    var index = -1;
    for(var i in lines) {
      if(lines[i].includes("You cannot use this item. Its stats will be ignored")) {
        index = i;
        break;
      }
    }

    lines.splice(index, 2);
    this.clipboard = lines.join("\n");
  }

  /**
  * Returns `true` if clipboard content is item data from Path of Exile
  *
  * @returns {boolean}
  */
  isPathOfExileData() {
    if(this.clipboard.startsWith("Rarity: ")) {
      return true;
    }

    return false;
  }

  /**
  * Returns the item text
  *
  * @returns {string}
  */
  getItemText() {
    return this.clipboard;
  }

  /**
  * Returns the variant of the clipboard item
  *
  * @returns {string}
  */
  getVariant() {
    var variant = null;
    var itemType = this.getItemType();

    if(itemType === "SkillGem") {
      variant = this._getGemVariant();
    } else
    if(itemType === "Unique") {
      variant = this._getUniqueVariant();
    } else
    if(itemType === "Map") {
      variant = this._getMapVariant();
    }

    return variant;
  }

  /**
  * Returns the variant of a map
  *
  * @returns {string}
  */
  _getMapVariant() {
    return "Atlas2";
  }

  /**
  * Returns the variant of a unique item
  * A terrible function that really shouldn't be looked at
  * I can already hear Codacy cry "OI MATE YOUR METHOD IS WAY TOO COMPLEX"
  * It's just confusing because I'm bad at naming my stuff, thanks
  * It's not bad if it works
  * TODO: Fine, I'll redo this method at some point...
  *
  * @returns {string}
  */
  _getUniqueVariant() {
    var variant = null;
    var name = this.getName();

    if(itemVariants.hasOwnProperty(name)) {
      if(itemVariants[name].hasOwnProperty("regex")) {
        var match = this.clipboard.match(new RegExp(itemVariants[name].regex.pattern));

        if(match) {
          var value = match[1];
          variant = itemVariants[name].regex.matches[value];
        }
      } else if(itemVariants[name].hasOwnProperty("mods")) {
        for(var index in itemVariants[name].mods) {
          var mods = itemVariants[name].mods[index];
          var matchesRegex = true;

          for(var regexIndex in mods.regex) {
            var match = this.clipboard.match(new RegExp(mods.regex[regexIndex]));

            if(!match) {
              matchesRegex = false;
            }
          }

          if(matchesRegex) {
            variant = mods.variant;
            break;
          }
        }
      }
    }

    return variant;
  }

  /**
  * Returns the variant of a gem
  *
  * @returns {string}
  */
  _getGemVariant() {
    var variant = "20"; // Default is level 20 gem
    var name = this.getName();
    var data = this._getGemData();
    var corrupted = this.isCorrupted();

    for(var i = 0; i < gemVariants.length; i++) {
      if((name === gemVariants[i].name || gemVariants[i].name === null)
      && (corrupted === gemVariants[i].corrupted || gemVariants[i].corrupted === null)
      && data.level >= gemVariants[i].levelFrom
      && data.level <= gemVariants[i].levelTo
      && data.quality >= gemVariants[i].qualityFrom
      && data.quality <= gemVariants[i].qualityTo) {
        variant = gemVariants[i].variant;
        break;
      }
    }

    return variant;
  }

  /**
  * Returns the default variant of an item (gems)
  *
  * @returns {string}
  */
  getDefaultVariant() {
    var defaultVariant = null;

    if(this.getItemType() === "SkillGem") {
      defaultVariant = "20";

      if(this.isCorrupted()) {
        defaultVariant += "c";
      }
    }

    return defaultVariant;
  }

  /**
  * Returns an object containing level and quality of a gem
  *
  * @returns {Object}
  */
  _getGemData() {
    var levelRegex = /Level: ([0-9]*)(?: \(Max\))?/;
    var qualityRegex = /Quality: \+([0-9]*)%/;
    var levelMatch = this.clipboard.match(levelRegex);
    var qualityMatch = this.clipboard.match(qualityRegex);
    var data = {level: 1, quality: 0, vaal: false};

    if(levelMatch) {
      data.level = parseInt(levelMatch[1]);
    }

    if(qualityMatch) {
      data.quality = parseInt(qualityMatch[1]);
    }

    return data;
  }

  /**
  * Returns the rarity of the clipboard item
  *
  * @returns {string}
  */
  getRarity() {
    var rarity = "";
    var regex = /Rarity: (.+)/;
    var match = this.clipboard.match(regex);

    if(match) {
      rarity = match[1];
    }

    return rarity;
  }

  /**
  * Returns the name of the clipboard item
  * For rare items, the base type is returned as the name
  *
  * @returns {string}
  */
  getName() {
    var type = this.getItemType();
    var rarity = this.getRarity();
    var index = 1;

    // If it's a map, the base type should be the name
    if(type === "Map" && rarity === "Rare") {
      index = 2;
    }

    var lines = this.getClipboardLines();
    var name = lines[index].replace(/<<.*?>>|<.*?>/g, "");
    name = name.replace(/[^0-9a-zA-ZäÄöÖüÜß\-, ']/gi, ""); // Replace newline garbage

    if(type === "Map") {
      name = this._removeMapAffixesFromName(name);
    }

    if(type === "SkillGem" && this.clipboard.includes("Souls Per Use") && !name.includes("Vaal")) {
      name = "Vaal " + name;
    }

    return name;
  }

  /**
  * Removes map affixes from normal and magic maps
  *
  * @returns {string}
  */
  _removeMapAffixesFromName(name) {
    // Remove prefixes and Superior
    for(var i = 0; i < mapAffixes.prefix.length; i++) {
      name = name.replace(mapAffixes.prefix[i] + " ", "");
    }

    // Remove suffixes
    for(var j = 0; j < mapAffixes.suffix.length; j++) {
      name = name.replace(" " + mapAffixes.suffix[j], "");
    }

    return name;
  }

  /**
  * Returns the base type of the clipboard item
  *
  * @returns {string}
  */
  getBaseType() {
    var lines = this.getClipboardLines();
    var baseType = lines[2].replace(/[^0-9a-zA-ZäÄöÖüÜß\-, ']/gi, ""); // Replace newline garbage

    // If the base type doesn't have letters return null because that's not a base type
    if(!/[a-z]/i.test(baseType)) {
      return null;
    }

    return baseType;
  }

  /**
  * Returns the item type of the clipboard item
  * Unique items are always returned as "Unique", regardless of base type
  *
  * @returns {string}
  */
  getItemType() {
    var rarity = this.getRarity();
    var type = rarity;

    if(parserTypes.hasOwnProperty(rarity)) {
      for(var i = 0; i < parserTypes[rarity].length; i++) {
        var regex = new RegExp(parserTypes[rarity][i].regex);
        var match = this.clipboard.match(regex);

        if(match) {
          type = parserTypes[rarity][i].type;
          break;
        }
      }
    }
    if (this.item !== null) {
      if (this.item.hasTag("rusted_scarab")) {
        // Will be parsed by "other" provider instead of currency provider
        // TODO: Find a better solution?
        type = "Scarab";
      }
    }

    return type;
  }

  /**
  * Returns the stack size of a currency item
  *
  * @returns {number}
  */
  getStackSize() {
    var stackSize = 1;
    var regex = /Stack Size: ([0-9,]*)\/[0-9,]*/;
    var stackSizeMatch = this.clipboard.match(regex);

    if(stackSizeMatch) {
      stackSize = stackSizeMatch[1].replace(",", "");
    }

    return stackSize;
  }

  /**
  * Returns the amount of connected links of the clipboard item
  * The returned value can only be 0, 5 or 6
  *
  * @returns {number}
  */
  getLinks() {
    var socketString = this._getSocketString();

    // If the item has sockets...
    if(socketString !== "") {
      var sockets = socketString.split(" ");
      var linkCount = (socketString.match(/-/g) || []).length;

      // Count of links can be 5 max, so it's a 6L
      if(linkCount === 5) {
        return 6;
      } else if(linkCount === 4) {
        // Check if first or last link is missing, sockets.length === 3 because there's an empty element at the end
        // Check if the length of the first or last string is 1, because if it was a 5l, one character (char) would be alone
        if(sockets.length === 3 && (sockets[0].length === 1 || sockets[1].length === 1)) {
          return 5;
        }
      }
    }

    return 0;
  }

  /**
  * Returns the socket string of the clipboard item
  *
  * @returns {string}
  */
  _getSocketString() {
    var sockets = "";
    var regex = /Sockets: (.+)/;
    var match = this.clipboard.match(regex);

    if(match) {
      sockets = match[1];
    }

    return sockets;
  }

  /**
  * Returns `true` if the item is identified
  *
  * @returns {boolean}
  */
  isIdentified() {
    if(this.clipboard.includes("Unidentified")) {
      return false;
    }

    return true;
  }

  /**
  * Returns `true` if the item is a relic
  *
  * @returns {boolean}
  */
  isRelic() {
    if(this.clipboard.includes("Relic Unique")) {
      return true;
    }

    return false;
  }

  /**
  * Returns `true` if the item is corrupted
  *
  * @returns {boolean}
  */
  isCorrupted() {
    if(this.clipboard.includes("Corrupted")) {
      return true;
    }

    return false;
  }

  /**
  * Returns an array containing each line of the clipboard
  *
  * @returns {Array}
  */
  getClipboardLines() {
    return this.clipboard.split("\n");
  }
}

module.exports = Parser;
