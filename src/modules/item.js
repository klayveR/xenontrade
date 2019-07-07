const parserBlockTypes = require("../resource/parserBlockTypes");

const ItemSockets = require('./item-sockets.js');
const ItemMod = require('./item-mod.js');
const ItemModParser = require('./item-mod-parser.js');

class Item {
  /**
  * Creates a new Item object
  *
  * @constructor
  * @param {string} parser Parser object containing the item text
  */
  constructor(parser) {
    this.parser = parser;
    this.itemName = null;
    this.itemRarity = null;
    this.itemLevel = null;
    this.itemBase = null;
    this.requirements = {};
    this.properties = {};
    this.sockets = new ItemSockets();
    this.modsImplicit = [];
    this.modsImplicitParser = null;
    this.modsImplicitPossible = null;
    this.modsExplicit = [];
    this.modsExplicitParser = null;
    this.modsExplicitPossible = null;
    this.modsCraftedPossible = null;
    this.corrupted = false;
    this.description = "";
    this.helpText = "";
    this.flavourText = "";
    this.note = "";
    this.analyse();
  }
  analyse() {
    // Split lines by blocks and analyse those
    let itemLines = this.parser.getClipboardLines();
    let textBlock = [];
    let textBlockIndex = 0;
    let textBlockType = "unknown";
    let textBlocksUnknown = [];
    let textBlockDone = false;
    for (let i = 0; i < itemLines.length; i++) {
      let lineCurrent = itemLines[i];
      // End of block?
      if (lineCurrent == "--------") {
        textBlockDone = true;
      } else {
        textBlock.push(lineCurrent);
      }
      if (textBlockDone || (i == itemLines.length-1)) {
        textBlockType = this.detectBlockType(textBlock);
        if (textBlockType != "unknown") {
          this.analyseBlock(textBlock, textBlockType);
        } else {
          textBlocksUnknown.push(textBlock);
        }
        // Reset current block
        textBlock = [];
        textBlockIndex++;
        textBlockType = "unknown";
        textBlockDone = false;
      }
    }
    // Try to detect the mod blocks within the remaining unknown blocks
    for (let i = 0; i < textBlocksUnknown.length; i++) {
      textBlock = textBlocksUnknown[i];
      textBlockType = this.detectBlockTypeMods(textBlock);
      this.analyseBlock(textBlock, textBlockType);
    }
    // Debug output
    /*
    console.log( "itemName: "+util.inspect(this.itemName, {depth: null}) );
    console.log( "itemRarity: "+util.inspect(this.itemRarity, {depth: null}) );
    console.log( "itemLevel: "+util.inspect(this.itemLevel, {depth: null}) );
    console.log( "itemBase: "+util.inspect(this.itemBase, {depth: null}) );
    console.log( "requirements: "+util.inspect(this.requirements, {depth: null}) );
    console.log( "properties: "+util.inspect(this.properties, {depth: null}) );
    console.log( "sockets: "+util.inspect(this.sockets, {depth: null}) );
    console.log( "modsImplicit: "+util.inspect(this.modsImplicit, {depth: null}) );
    console.log( "modsImplicitPossible: "+util.inspect(this.modsImplicitPossible.length, {depth: 1}) );
    console.log( "modsExplicit: "+util.inspect(this.modsExplicit, {depth: null}) );
    console.log( "modsExplicitPossible: "+util.inspect(this.modsExplicitPossible.length, {depth: 1}) );
    console.log( "modsCraftedPossible: "+util.inspect(this.modsCraftedPossible.length, {depth: 1}) );
    console.log( "corrupted: "+util.inspect(this.corrupted, {depth: null}) );
    console.log( "helpText: "+util.inspect(this.helpText, {depth: null}) );
    console.log( "flavourText: "+util.inspect(this.flavourText, {depth: null}) );
    console.log( "note: "+util.inspect(this.note, {depth: null}) );
    */
  }
  analyseBlock(lines, type) {
    switch (type) {
      case "name":
        this.analyseName(lines);
        break;
      case "requirements":
        this.analyseRequirements(lines);
        break;
      case "properties":
        this.analyseProperties(lines);
        break;
      case "sockets":
        this.analyseSockets(lines);
        break;
      case "itemLevel":
        this.analyseItemLevel(lines);
        break;
      case "description":
        this.analyseDescription(lines);
        break;
      case "helpText":
        this.analyseHelpText(lines);
        break;
      case "flavourText":
        this.analyseFlavourText(lines);
        break;
      case "corrupted":
        this.analyseCorrupted(lines);
        break;
      case "note":
        this.analyseNote(lines);
        break;
      case "modsImplicit":
        this.analyseModsImplicit(lines);
        break;
      case "modsExplicit":
        this.analyseModsExplicit(lines);
        break;
      default:
        //throw new Error("[Item] Unknown block of type '"+type+"':\n"+lines.join("\n"));
        break;
    }
  }
  analyseName(lines) {
    // Parse rarity and item name
    let rarityMatch = lines[0].match(/^Rarity: (.+)$/i);
    if (rarityMatch) {
      this.itemRarity = rarityMatch[1];
    }
    this.itemName = (this.itemRarity == "Unique" ? lines[ lines.length-2 ] : lines[ lines.length-1 ]);
    this.itemBase = poeData.getItemBase(this.itemName, this.getArmourTag());
  }
  analyseRequirements(lines) {
    lines.shift();
    for (let l = 0; l < lines.length; l++) {
      let match = lines[l].match(/^(.+?)(: (.+))?$/i);
      if (match) {
        let name = match[1];
        let value = (typeof match[3] == "undefined" ? true : match[3]);
        this.requirements[name] = value;
      } else {
        throw new Error("[Item] Unexpected requirement property:\n"+lines[l]);
      }
    }
    // Reevaluate the correct base item with the additional information available
    this.itemBase = poeData.getItemBase(this.itemName, this.getArmourTag());
  }
  analyseProperties(lines) {
    let propertyPrefix = "";
    if (this.hasTag("gem")) {
      if (typeof this.properties["Gem Tags"] == "undefined") {
        this.properties["Gem Tags"] = {
          value: lines.shift().split(", "),
          augmented: false
        }
      } else if (this.properties["Gem Tags"].value.indexOf("Vaal") >= 0) {
        propertyPrefix = "Vaal ";
      }
    }
    for (let l = 0; l < lines.length; l++) {
      let match = lines[l].match(/^(.+?)(: (.+))?$/i);
      if (match) {
        let name = propertyPrefix+match[1];
        let value = (typeof match[3] == "undefined" ? true : match[3]);
        let augmented = false;
        if (value !== true) {
          // Check if augmented
          let matchAugmented = value.match(/^(.+?) \(augmented\)/);
          if (matchAugmented) {
            value = matchAugmented[1];
            augmented = true;
          }
          // Split values (min-max)
          value = value.split("-");
        }
        this.properties[name] = {
          value: value,
          augmented: augmented
        };
      } else {
        throw new Error("[Item] Unexpected item property:\n"+lines[l]);
      }
    }
  }
  analyseSockets(lines) {
    let socketRegExp = new RegExp(parserBlockTypes["sockets"].regex);
    let socketMatch = lines[0].match(socketRegExp);
    if (socketMatch) {
      let socketLinks = socketMatch[1].trim().split(" ");
      for (let l = 0; l < socketLinks.length; l++) {
        this.sockets.addLink( socketLinks[l].split("-") );
      }
    }
  }
  analyseItemLevel(lines) {
    let itemLevelRegExp = new RegExp(parserBlockTypes["itemLevel"].regex);
    let itemLevelMatch = lines[0].match(itemLevelRegExp);
    if (itemLevelMatch) {
      this.itemLevel = parseInt(itemLevelMatch[1]);
    }
  }
  analyseFlavourText(lines) {
    if (this.flavourText != "") {
      this.flavourText += "\n";
    }
    this.flavourText += lines.join("\n");
  }
  analyseDescription(lines) {
    if (this.description != "") {
      this.description += "\n";
    }
    this.description += lines.join("\n");
  }
  analyseHelpText(lines) {
    if (this.helpText != "") {
      this.helpText += "\n";
    }
    this.helpText += lines.join("\n");
  }
  analyseCorrupted(lines) {
    this.corrupted = true;
  }
  analyseNote(lines) {
    let noteRegExp = new RegExp(parserBlockTypes["itemLevel"].regex);
    let noteMatch = lines[0].match(noteRegExp);
    if (noteMatch) {
      this.note = noteMatch[1];
    }
  }
  analyseModsImplicit(lines) {
    this.modsImplicit.push( ...this.getImplicitModsParser().getMods() );
  }
  analyseModsExplicit(lines) {
    this.modsExplicit.push( ...this.getExplicitModsParser().getMods() );
  }
  detectBlockType(lines) {
    let type = "unknown";
    // Check for item specific blocks
    if (this.itemBase !== null) {
      if (this.itemBase['flavour text'].replace(/\s*/g, " ") == lines.join("\n").replace(/\s*/g, " ")) {
        return "flavourText";
      }
      if (this.itemBase['description'].replace(/\s*/g, " ") == lines.join("\n").replace(/\s*/g, " ")) {
        return "description";
      }
      if (this.itemBase['help text'].replace(/\s*/g, " ") == lines.join("\n").replace(/\s*/g, " ")) {
        return "helpText";
      }
      if (this.hasTag("gem") && (lines[0] == "Vaal "+this.itemName)) {
        return "name";
      }
    }
    // Check simple type detection as defined in "resource/parserBlockTypes.json"
    for (let typeIndicator in parserBlockTypes) {
      for (let l = 0; l < lines.length; l++) {
        var regex = new RegExp(parserBlockTypes[typeIndicator].regex);
        var match = lines[l].match(regex);
        if(match) {
          return parserBlockTypes[typeIndicator].type;
        }
      }
    }
    return type;
  }
  detectBlockTypeMods(lines) {
    if (this.getImplicitModsParser().match(lines)) {
      return "modsImplicit";
    }
    if (this.getExplicitModsParser().match(lines)) {
      return "modsExplicit";
    }
    if (this.getExplicitModsParser().getMods().length > 0) {
      let remainingLines = this.getExplicitModsParser().getLines();
      console.log("Warning: Some mods were not detected:\n"+remainingLines.join("\n"));
      // Try to match the remaining mods ignoring spawn weights
      let anyMods = poeData.getModsByParams({
        domains: [ this.getModDomain() ],
        generations: [ poeData.MOD_GEN_TYPE_PREFIX, poeData.MOD_GEN_TYPE_SUFFIX ]
      });
      let anyModObjects = [];
      for (let i = 0; i < anyMods.length; i++) {
        let modDetail = anyMods[i];
        let modObject = this.getModObject(modDetail, "Explicit");
        if (modObject.getRequiredLevel() <= this.itemLevel) {
          anyModObjects.push(modObject);
        }
      }
      let anyModParser = new ItemModParser(...anyModObjects);
      if (anyModParser.match(remainingLines)) {
        this.getExplicitModsParser().addModsManually(...anyModParser.getMods());
        this.getExplicitModsParser().setLines( anyModParser.getLines() );
        console.log("Info: Detected remaining mods ignoring spawn weights.");
      }
      return "modsExplicit";
    }
    return "unknown";
  }
  getModObject(modDetail, type) {
    let modTradeList = [];
    for (let l = 0; l < modDetail['trade ids'].length; l++) {
      let modTradeId = null;
      for (let t = 0; t < modDetail['trade ids'][l].length; t++) {
        if (modDetail['trade ids'][l][t].indexOf(type.toLowerCase()+".") == 0) {
          modTradeId = modDetail['trade ids'][l][t];
          break;
        }
      }
      let modTrade = (modTradeId !== null ? poeData.getModTradeById(modTradeId, type) : null);
      modTradeList.push(modTrade);
    }
    return new ItemMod(modDetail, modTradeList, type);
  }
  getImplicitMods() {
    return this.modsImplicit;
  }
  getImplicitModsParser() {
    if (this.modsImplicitParser === null) {
      this.modsImplicitParser = new ItemModParser( ...this.getImplicitModsPossible() );
    }
    return this.modsImplicitParser;
  }
  getImplicitModsPossible() {
    if (this.modsImplicitPossible === null) {
      this.modsImplicitPossible = [];
      if (this.itemBase !== null) {
        // Get implicits from base item
        for (let i = 0; i < this.itemBase['mods'].length; i++) {
          let itemMod = this.itemBase['mods'][i];
          if (itemMod['is implicit'] != 1) {
            continue;
          }
          let modDetail = poeData.getModByIdent(itemMod['id']);
          let modObject = this.getModObject(modDetail, "Implicit");
          if (modObject.getRequiredLevel() <= this.itemLevel) {
            this.modsImplicitPossible.push(modObject);
          }
        }
        // Get enchantments
        let enchantmentMods = poeData.getModsByParams({
          domains: [ this.getModDomain() ],
          generations: [ poeData.MOD_GEN_TYPE_ENCHANTMENT ],
          spawnTags: this.itemBase.tags
        });
        for (let i = 0; i < enchantmentMods.length; i++) {
          let modDetail = enchantmentMods[i];
          let modObject = this.getModObject(modDetail, "Enchant");
          if (modObject.getRequiredLevel() <= this.itemLevel) {
            this.modsImplicitPossible.push(modObject);
          }
        }
        // Get corrupted mods
        if (this.corrupted) {
          let corruptedMods = poeData.getModsByParams({
            domains: [ this.getModDomain() ],
            generations: [ poeData.MOD_GEN_TYPE_CORRUPTED ],
            spawnTags: this.itemBase.tags
          });
          for (let i = 0; i < corruptedMods.length; i++) {
            let modDetail = corruptedMods[i];
            let modObject = this.getModObject(modDetail, "Implicit");
            if (modObject.getRequiredLevel() <= this.itemLevel) {
              this.modsImplicitPossible.push(modObject);
            }
          }
        }
      }
    }
    return this.modsImplicitPossible;
  }
  getExplicitMods() {
    return this.modsExplicit;
  }
  getExplicitModsParser() {
    if (this.modsExplicitParser === null) {
      this.modsExplicitParser = new ItemModParser( ...this.getExplicitModsPossible(), ...this.getCraftedModsPossible() );
    }
    return this.modsExplicitParser;
  }
  getExplicitModsPossible() {
    if (this.modsExplicitPossible === null) {
      this.modsExplicitPossible = [];
      // Get explicits from base item
      for (let i = 0; i < this.itemBase['mods'].length; i++) {
        let itemMod = this.itemBase['mods'][i];
        if (itemMod['is implicit']) {
          continue;
        }
        let modDetail = poeData.getModByIdent(itemMod['id']);
        let modObject = this.getModObject(modDetail, "Explicit");
        if (modObject.getRequiredLevel() <= this.itemLevel) {
          this.modsExplicitPossible.push(modObject);
        }
      }
      // Get regular explicits for the item
      let baselineMods = poeData.getModsByParams({
        domains: [ this.getModDomain() ],
        generations: [ poeData.MOD_GEN_TYPE_PREFIX, poeData.MOD_GEN_TYPE_SUFFIX ],
        spawnTags: this.itemBase.tags
      });
      for (let i = 0; i < baselineMods.length; i++) {
        let modDetail = baselineMods[i];
        let modObject = this.getModObject(modDetail, "Explicit");
        if (modObject.getRequiredLevel() <= this.itemLevel) {
          this.modsExplicitPossible.push(modObject);
        }
      }
      // Get corrupted mods
      if (this.corrupted) {
        let corruptedMods = poeData.getModsByParams({
          domains: [ this.getModDomain() ],
          generations: [ poeData.MOD_GEN_TYPE_CORRUPTED ],
          spawnTags: this.itemBase.tags
        });
        for (let i = 0; i < corruptedMods.length; i++) {
          let modDetail = corruptedMods[i];
          let modObject = this.getModObject(modDetail, "Explicit");
          if (modObject.getRequiredLevel() <= this.itemLevel) {
            this.modsExplicitPossible.push(modObject);
          }
        }
      }
    }
    return this.modsExplicitPossible;
  }
  getCraftedModsPossible() {
    if (this.modsCraftedPossible === null) {
      this.modsCraftedPossible = [];
      // Get crafted explicits for the item
      let craftedMods = poeData.getModsByParams({
        domains: [ poeData.MOD_GEN_TYPE_PREFIX, poeData.MOD_GEN_TYPE_SUFFIX, poeData.MOD_DOMAIN_CRAFTED ],
        spawnTags: this.itemBase.tags
      });
      for (let i = 0; i < craftedMods.length; i++) {
        let modDetail = craftedMods[i];
        let modObject = this.getModObject(modDetail, "Crafted");
        if (modObject.getRequiredLevel() <= this.itemLevel) {
          this.modsCraftedPossible.push(modObject);
        }
      }
    }
    return this.modsCraftedPossible;
  }
  getModDomain() {
    if (this.itemBase !== null) {
      if (this.itemBase['class id'] == "Leaguestone") {
        return poeData.MOD_DOMAIN_LEAGUESTONE;
      }
      if (this.hasTag("flask")) {
        return poeData.MOD_DOMAIN_FLASK;
      }
      if (this.hasTag("abyss_jewel")) {
        return poeData.MOD_DOMAIN_ABYSS_JEWEL;
      }
      if (this.hasTag("jewel")) {
        return poeData.MOD_DOMAIN_JEWEL;
      }
    }
    return poeData.MOD_DOMAIN_ITEM;
  }
  getName() {
    return this.itemName;
  }
  getRarity() {
    return this.itemRarity;
  }
  getArmour() {
    let prop = this.getProperty("Armour");
    return parseInt(prop.value[0]);
  }
  getEnergyShield() {
    let prop = this.getProperty("Energy Shield");
    return parseInt(prop.value[0]);
  }
  getEvasion() {
    let prop = this.getProperty("Evasion Rating");
    return parseInt(prop.value[0]);
  }
  getBlock() {
    let prop = this.getProperty("Chance to Block");
    return Math.round(parseFloat(prop.value[0]) * 100) / 100;
  }
  getQuality() {
    let prop = this.getProperty("Quality");
    return parseFloat(prop.value[0]);
  }
  getProperty(name) {
    if (typeof this.properties[name] != "undefined") {
      return this.properties[name];
    } else {
      return { value: [ 0 ], augmented: false };
    }
  }
  getRequirement(name) {
    if (typeof this.requirements[name] != "undefined") {
      return parseInt(this.requirements[name]);
    } else {
      return 0;
    }
  }
  getSocketCount() {
    return this.sockets.getSocketCount();
  }
  getSocketCountMax() {
    if (this.hasTag("weapon") || this.hasTag("armour")) {
      if (!this.isFourSocket() && !this.isThreeSocket()) {
        if (this.itemLevel >= 50) {
          return 6;
        }
        if (this.itemLevel >= 35) {
          return 5;
        }
      }
      if (!this.isThreeSocket()) {
        if (this.itemLevel >= 25) {
          return 4;
        }
      }
      if (this.itemLevel >= 1) {
        return 3;
      }
      return 2;
    }
    return (this.isSingleSocket() ? 1 : 0);
  }
  getMinLinkLength() {
    return this.sockets.getMinLinkLength();
  }
  getMaxLinkLength() {
    return this.sockets.getMaxLinkLength();
  }
  getArmourTag() {
    if ((this.getArmour() == 0) && (this.getEvasion() == 0) && (this.getEnergyShield() == 0)) {
      // Not an armour
      return null;
    }
    let reqStr = this.getRequirement("Str");
    let reqDex = this.getRequirement("Dex");
    let reqInt = this.getRequirement("Int");
    if ((reqStr > 0) && (reqDex > 0)) {
      return "str_dex_armour";
    }
    if ((reqStr > 0) && (reqInt > 0)) {
      return "str_int_armour";
    }
    if ((reqDex > 0) && (reqInt > 0)) {
      return "dex_int_armour";
    }
    if (reqStr > 0) {
      return "str_armour";
    }
    if (reqDex > 0) {
      return "dex_armour";
    }
    if (reqInt > 0) {
      return "int_armour";
    }
    return "armour";
  }
  getTags() {
    if (this.itemBase === null) {
      return [];
    }
    return this.itemBase.tags;
  }
  getDPS() {
    return this.getPhysicalDPS() + this.getElementalDPS(); 
  }
  getPhysicalDPS() {
    let aps = this.getProperty("Attacks per Second");
    let damage = this.getProperty("Physical Damage");
    let damageAvg = 0;
    for (let i = 0; i < damage.value.length; i++) {
      damageAvg += parseFloat(damage.value[i]);
    }
    damageAvg /= damage.value.length;
    return damageAvg * aps.value[0];
  }
  getElementalDPS() {
    let aps = this.getProperty("Attacks per Second");
    let damage = this.getProperty("Elemental Damage");
    let damageAvg = 0;
    for (let i = 0; i < damage.value.length; i++) {
      damageAvg += parseFloat(damage.value[i]);
    }
    damageAvg /= damage.value.length;
    return damageAvg * aps.value[0];
  }
  isFourSocket() {
    if (this.hasTag("gloves") || this.hasTag("boots") || this.hasTag("helmet")) {
      return true;
    }
    return false;
  }
  isThreeSocket() {
    if (this.hasTag("one_hand_weapon") || this.hasTag("shield") || this.hasTag("quiver")) {
      return true;
    }
    return false;
  }
  isSingleSocket() {
    if (this.hasTag("ring")) {
      return true;
    }
    return false;
  }
  isCorrupted() {
    return this.corrupted;
  }
  hasTag(tag) {
    if (this.itemBase === null) {
      return false;
    }
    return (this.itemBase.tags.indexOf(tag) >= 0)
  }
}

module.exports = Item;
