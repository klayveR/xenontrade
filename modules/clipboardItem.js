const itemVariants = require('../resource/itemVariants');
const gemVariants = require('../resource/gemVariants');
const clipboardItemTypes = require('../resource/clipboardItemTypes');

class ClipboardItem {
  /**
  * Creates a new Item object
  *
  * @constructor
  */
  constructor(clipboard) {
    this.clipboard = clipboard;
    this.data = {};
  }

  isPathOfExileData() {
    if(this.clipboard.startsWith("Rarity: ")) {
      return true;
    }

    return false;
  }

  parseData() {
    var lines = this.getClipboardLines();

    this.data.rarity = this.getRarity();
    this.data.type = this.getItemType();
    this.data.name = this.getName();
    this.data.identified = this.isIdentified();
    this.data.links = this.getLinks();
    this.data.relic = this.isRelic();
    this.data.variant = this.getVariant();

    return this.data;
  }

  getData() {
    return this.data;
  }

  getVariant() {
    var variant = null;

    if(this.data.type === "SkillGem") {
      variant = this.getGemVariant();
    } else {
      variant = this.getItemVariant();
    }

    return variant;
  }

  getItemVariant() {
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

  getGemVariant() {
    var variant = "20"; // Default is level 20 gem
    var name = this.getName();
    var data = this.getGemData();
    var corrupted = this.isCorrupted();

    for(var i = 0; i < gemVariants.length; i++) {
      if(
        (name = gemVariants[i].name || gemVariants[i].name === null)
        (corrupted === gemVariants[i].corrupted || gemVariants[i].corrupted === null)
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

  getRarity() {
    var lines = this.getClipboardLines();
    return lines[0].replace("Rarity: ", "");
  }

  getName() {
    var index = 1;
    if(this.getRarity() === "Rare") {
      index = 2;
    }

    var lines = this.getClipboardLines();
    return lines[index].replace("<<set:MS>><<set:M>><<set:S>>", "");
  }

  getItemType() {
    var rarity = this.getRarity();
    var type = rarity;

    if(clipboardItemTypes.hasOwnProperty(rarity)) {
      for(var i = 0; i < clipboardItemTypes[rarity].length; i++) {
        var regex = new RegExp(clipboardItemTypes[rarity][i].regex);
        var match = this.clipboard.match(regex);

        if(match) {
          type = clipboardItemTypes[rarity][i].type;
          break;
        }
      }
    }

    return type;
  }

  getGemData() {
    var regex = /Level: ([0-9]*)(?: \(Max\))?\nMana Multiplier: (?:[0-9]*)%(?:\nQuality: \+([0-9]*)%)?/;
    var match = this.clipboard.match(regex);
    var data = {level: 1, quality: 0};

    if(match) {
      data.level = match[1];

      if(typeof match[2] !== 'undefined') {
        data.quality = match[2];
      }
    }

    return data;
  }

  getSocketString() {
    var lines = this.getClipboardLines();

    for(var i = 0; i < lines.length; i++) {
      if(lines[i].startsWith("Sockets:")) {
        return lines[i].replace("Sockets: ", "");
      }
    }

    return "";
  }

  getLinks() {
    var lines = this.getClipboardLines();
    var socketString = this.getSocketString();

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

  isIdentified() {
    if(this.clipboard.includes("Unidentified")) {
      return false;
    }

    return true;
  }

  isRelic() {
    if(this.clipboard.includes("Relic Unique")) {
      return true;
    }

    return false;
  }

  isCorrupted() {
    if(this.clipboard.includes("Corrupted")) {
      return true;
    }

    return false;
  }

  getClipboardLines() {
    return this.clipboard.split("\n");
  }
}

module.exports = ClipboardItem;
