const itemVariants = require("./resource/itemVariants");
const gemVariants = require("./resource/gemVariants");
const parserTypes = require("./resource/parserTypes");
const mapAffixes = require("./resource/mapAffixes");

class Parser {
  /**
  * Creates a new Parser object
  *
  * @constructor
  * @param {string} clipboard Content of the clipboard
  */
  constructor(clipboard) {
    this.clipboard = clipboard;
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
  * Returns an object containing previously parsed data from the clipboard
  *
  * @returns {Object}
  */
  getData() {
    return this.data;
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
  *
  * @returns {string}
  */
  _getUniqueVariant() {
    var variant = null;
    var name = this.getName();

    if(itemVariants.hasOwnProperty(name)) {
      var match = this.clipboard.match(new RegExp(itemVariants[name].regex));

      if(match) {
        var value = match[1];
        variant = itemVariants[name].matches[value];
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
    var data = this.getGemData();
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

      if(rarity === "Rare") {
        index = 2;
      }

      var lines = this.getClipboardLines();
      var name = lines[index].replace("<<set:MS>><<set:M>><<set:S>>", "");
      name = name.replace(/[^0-9a-zA-ZäÄöÖüÜß ']/gi, ''); // Replace newline garbage

      if(type === "Map") {
        name = this._removeMapAffixes(name);
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
      var baseType = lines[2].replace(/[^0-9a-zA-ZäÄöÖüÜß ']/gi, ''); // Replace newline garbage

      // If the base type doesn't have letters return null because that's not a base type
      if(!/[a-z]/i.test(baseType)) {
        return null;
      }

      return baseType;
    }

    /**
    * Removes map affixes from normal and magic maps
    *
    * @returns {string}
    */
    _removeMapAffixes(name) {
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
            type = type.replace(/[^0-9a-zA-ZäÄöÖüÜß ']/gi, ''); // Replace newline garbage
            break;
          }
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
    * Returns an object containing level and quality of a gem
    *
    * @returns {Object}
    */
    getGemData() {
      var levelRegex = /Level: ([0-9]*)(?: \(Max\))?/;
      var qualityRegex = /Quality: \+([0-9]*)%/;
      var levelMatch = this.clipboard.match(levelRegex);
      var qualityMatch = this.clipboard.match(qualityRegex);
      var data = {level: 1, quality: 0};

      if(levelMatch) {
        data.level = parseInt(levelMatch[1]);
      }

      if(qualityMatch) {
        data.quality = parseInt(qualityMatch[1]);
      }

      return data;
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
      /*var lines = this.getClipboardLines();

      for(var i = 0; i < lines.length; i++) {
        if(lines[i].startsWith("Sockets:")) {
          sockets = lines[i].replace("Sockets: ", "");
        }
      }

      console.log("'" + sockets + "'");
      */

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
