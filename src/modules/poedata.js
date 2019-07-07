'use strict';

// Nodejs dependencies
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('request');
const zlib = require('zlib');
const htmlEntities = require('html-entities').XmlEntities;

class PoeData {
  constructor() {
    // Constants
    this.constantsInit();
    // Wiki session
    this.wikiLoginToken = null;
    this.wikiLimit = 5000;
    // https://pathofexile.gamepedia.com/Special:CargoTables
    this.wikiData = {
      items: {},
      mods: {}
    };
    this.tradeData = {
      // https://www.pathofexile.com/api/trade/data/leagues
      leagues: null,
      // https://www.pathofexile.com/api/trade/data/static
      cards: null,
      currency: null,
      mapsBase: null,
      mapsElder: null,
      essences: null,
      fossils: null,
      fragments: null,
      incubators: null,
      leaguestones: null,
      resonators: null,
      scarabs: null,
      vials: null,
      // https://www.pathofexile.com/api/trade/data/stats
      stats: null
    };
    // Flag for checking if an update is pending
    this.updateActive = false;
    // Read values from cache
    this.readCache();
  }
  constantsInit() {
    // Mod domains
    this.MOD_DOMAIN_ITEM = 1;
    this.MOD_DOMAIN_FLASK = 2;
    this.MOD_DOMAIN_MONSTER = 3;
    this.MOD_DOMAIN_CHEST = 4;
    this.MOD_DOMAIN_AREA = 5;
    this.MOD_DOMAIN_UNKNOWN6 = 6;
    this.MOD_DOMAIN_UNKNOWN7 = 7;
    this.MOD_DOMAIN_UNKNOWN8 = 8;
    this.MOD_DOMAIN_CRAFTED = 9;
    this.MOD_DOMAIN_JEWEL = 10;
    this.MOD_DOMAIN_ATLAS = 11;
    this.MOD_DOMAIN_LEAGUESTONE = 12;
    this.MOD_DOMAIN_ABYSS_JEWEL = 13;
    this.MOD_DOMAIN_MAP_DEVICE = 14;
    this.MOD_DOMAIN_UNKNOWN15 = 15;
    this.MOD_DOMAIN_DELVE = 16;
    this.MOD_DOMAIN_DELVE_AREA = 17;
    this.MOD_DOMAIN_SYNTHESIS18 = 18;
    this.MOD_DOMAIN_SYNTHESIS19 = 19;
    this.MOD_DOMAIN_SYNTHESIS20 = 20;
    // Mod generation types
    this.MOD_GEN_TYPE_PREFIX = 1;
    this.MOD_GEN_TYPE_SUFFIX = 2;
    this.MOD_GEN_TYPE_UNIQUE = 3;
    this.MOD_GEN_TYPE_NEMESIS = 4;
    this.MOD_GEN_TYPE_CORRUPTED = 5;
    this.MOD_GEN_TYPE_BLOODLINES = 6;
    this.MOD_GEN_TYPE_TORMENT = 7;
    this.MOD_GEN_TYPE_TEMPEST = 8;
    this.MOD_GEN_TYPE_TALISMAN = 9;
    this.MOD_GEN_TYPE_ENCHANTMENT = 10;
    this.MOD_GEN_TYPE_ESSENCE = 11;
    this.MOD_GEN_TYPE_UNKNOWN12 = 12;
    this.MOD_GEN_TYPE_BESTIARY = 13;
    this.MOD_GEN_TYPE_DELVE = 14;
    this.MOD_GEN_TYPE_SYNTHESIS15 = 15;
    this.MOD_GEN_TYPE_SYNTHESIS16 = 16;
    this.MOD_GEN_TYPE_SYNTHESIS17 = 17;
  }
  decodeHtml(text) {
    return htmlEntities.decode(text).replace(/<br\s*\/?>/g, "\n");
  }
  escapeRegExpString(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  getMaps(mapType) {
    if (typeof mapType == "undefined") {
      mapType = "Base";
    }
    switch (mapType) {
      default:
      case "Base":
        return this.tradeData.mapsBase;
      case "Elder":
        return this.tradeData.mapsElder;
    }
  }
  getItemBase(itemBaseName, armourTag) {
    let itemBaseIds = this.wikiData.items.byName[itemBaseName];
    if (typeof itemBaseIds == "undefined") {
      // Item most likely has a prefix and/or suffix attached to the name, find the best match
      let itemSearchBestName = "";
      let itemSearchBestId = null;
      for (let itemSearchName in this.wikiData.items.byName) {
        if ((itemBaseName.indexOf(itemSearchName) >= 0) && (itemSearchName.length > itemSearchBestName.length)) {
          itemSearchBestName = itemSearchName;
          itemSearchBestId = this.wikiData.items.byName[itemSearchName];
        }
      }
      itemBaseIds = itemSearchBestId;
    }
    if (itemBaseIds.length == 1) {
      return this.wikiData.items.byId[itemBaseIds[0]];
    } else if (itemBaseIds.length > 1) {
      let itemBaseResult = null;
      // Multiple items found! Pick the matching one.
      for (let i = 0; i < itemBaseIds.length; i++) {
        let itemBase = this.wikiData.items.byId[itemBaseIds[i]];
        if (armourTag !== null) {
          if (itemBase.tags.indexOf(armourTag) == -1) {
            // Item does not match the expected type of armour, ignore this one.
            continue;
          }
        }
        itemBaseResult = itemBase;
        break;
      }
      return itemBaseResult;
    }
    return null;
  }
  getModById(modId) {
    let mod = this.wikiData.mods.byId[ modId ];
    return (typeof mod == "undefined" ? null : mod);
  }
  getModByIdent(modIdent) {
    let modId = this.wikiData.mods.byModIdent[ modIdent ];
    return this.getModById(modId);
  }
  getModsById(modIds) {
    // Resolve ids into mods
    let mods = [];
    for (let m = 0; m < modIds.length; m++) {
      mods.push( this.getModById(modIds[m]) );
    }
    return mods;
  }
  getModsByParams(params) {
    let modIds = null;
    if (typeof params.domains != "undefined") {
      // Get mods by domains
      // https://pathofexile.gamepedia.com/Modifiers#Mod_Domain
      let modsByDomains = [];
      for (let i = 0; i < params.domains.length; i++) {
        modsByDomains.push(...this.wikiData.mods.byDomain[ params.domains[i] ]);
      }
      // Remove duplicates
      modsByDomains = [...new Set(modsByDomains)];
      // Set or filter result list
      modIds = (modIds === null ? modsByDomains : modsByDomains.filter(value => modIds.includes(value)));
    }
    if (typeof params.generations != "undefined") {
      // Get mods by generation types
      // https://pathofexile.gamepedia.com/Modifiers#Mod_Generation_Type
      let modsByGenerations = [];
      for (let i = 0; i < params.generations.length; i++) {
        modsByGenerations.push(...this.wikiData.mods.byGeneration[ params.generations[i] ]);
      }
      // Remove duplicates
      modsByGenerations = [...new Set(modsByGenerations)];
      // Set or filter result list
      modIds = (modIds === null ? modsByGenerations : modsByGenerations.filter(value => modIds.includes(value)));
    }
    if (typeof params.spawnTags != "undefined") {
      // Get mods by spawn tags
      // https://pathofexile.gamepedia.com/Modifiers#Tags
      let modsBySpawnTags = [];
      for (let i = 0; i < params.spawnTags.length; i++) {
        if (typeof this.wikiData.mods.bySpawnTags[ params.spawnTags[i] ] == "undefined") {
          // Skip unknown tags
          continue;
        }
        for (let m = 0; m < this.wikiData.mods.bySpawnTags[ params.spawnTags[i] ].length; m++) {
          modsBySpawnTags.push(this.wikiData.mods.bySpawnTags[ params.spawnTags[i] ][m].modId);
        }
      }
      // Remove duplicates
      modsBySpawnTags = [...new Set(modsBySpawnTags)];
      // Set or filter result list
      modIds = (modIds === null ? modsBySpawnTags : modsBySpawnTags.filter(value => modIds.includes(value)));
    }
    return this.getModsById(modIds);
  }
  getModTradeById(modTradeId, statType) {
    let modTrade = this.tradeData.stats[statType][modTradeId];
    return (typeof modTrade != "undefined" ? { id: modTradeId, text: modTrade } : null);
  }
  getCurrencyName(currencyIdent) {
    let currencyName = this.tradeData.currency[currencyIdent];
    return (typeof currencyName != "undefined" ? currencyName : null);
  }
  getCurrencyItemText(currencyIdent, amount) {
    let currencyName = this.getCurrencyName(currencyIdent);
    let currencyItem = this.getItemBase(currencyName);
    let currencyText = [];
    currencyText.push("Rarity: Currency");
    currencyText.push(currencyName);
    currencyText.push("--------");
    currencyText.push("Stack Size: "+amount+"/10");
    currencyText.push("--------");
    currencyText.push(this.decodeHtml(currencyItem['description']));
    currencyText.push("--------");
    currencyText.push(this.decodeHtml(currencyItem['help text']));
    return currencyText.join("\n");
  }
  handleLeagues(apiData) {
    // Leagues
    this.tradeData.leagues = {};
    for (let leagueIndex = 0; leagueIndex < apiData.result.length; leagueIndex++) {
      let leagueData = apiData.result[leagueIndex];
      this.tradeData.leagues[leagueData.id] = leagueData.text;
    }
  }
  handleStatic(apiData) {
    // Cards
    this.tradeData.cards = {};
    for (let cardIndex = 0; cardIndex < apiData.result.cards.length; cardIndex++) {
      let cardData = apiData.result.cards[cardIndex];
      this.tradeData.cards[cardData.id] = cardData.text;
    }
    // Currency
    this.tradeData.currency = {};
    for (let currencyIndex = 0; currencyIndex < apiData.result.currency.length; currencyIndex++) {
      let currencyData = apiData.result.currency[currencyIndex];
      this.tradeData.currency[currencyData.id] = currencyData.text;
    }
    // Maps
    this.tradeData.mapsBase = {};
    this.tradeData.mapsElder = {};
    for (let mapIndex = 0; mapIndex < apiData.result.maps.length; mapIndex++) {
      let mapData = apiData.result.maps[mapIndex];
      this.tradeData.mapsBase[mapData.id] = mapData.text;
    }
    for (let mapIndex = 0; mapIndex < apiData.result.elder_maps.length; mapIndex++) {
      let mapData = apiData.result.elder_maps[mapIndex];
      this.tradeData.mapsElder[mapData.id] = mapData.text;
    }
    // Essences
    this.tradeData.essences = {};
    for (let essenceIndex = 0; essenceIndex < apiData.result.essences.length; essenceIndex++) {
      let essenceData = apiData.result.essences[essenceIndex];
      this.tradeData.essences[essenceData.id] = essenceData.text;
    }
    // Fossils
    this.tradeData.fossils = {};
    for (let fossilIndex = 0; fossilIndex < apiData.result.fossils.length; fossilIndex++) {
      let fossilData = apiData.result.fossils[fossilIndex];
      this.tradeData.fossils[fossilData.id] = fossilData.text;
    }
    // Fragments
    this.tradeData.fragments = {};
    for (let fragmentIndex = 0; fragmentIndex < apiData.result.fragments.length; fragmentIndex++) {
      let fragmentData = apiData.result.fragments[fragmentIndex];
      this.tradeData.fragments[fragmentData.id] = fragmentData.text;
    }
    // Incubators
    this.tradeData.incubators = {};
    for (let incubatorIndex = 0; incubatorIndex < apiData.result.incubators.length; incubatorIndex++) {
      let incubatorData = apiData.result.incubators[incubatorIndex];
      this.tradeData.incubators[incubatorData.id] = incubatorData.text;
    }
    // Leaguestones
    this.tradeData.leaguestones = {};
    for (let leaguestoneIndex = 0; leaguestoneIndex < apiData.result.leaguestones.length; leaguestoneIndex++) {
      let leaguestoneData = apiData.result.leaguestones[leaguestoneIndex];
      this.tradeData.leaguestones[leaguestoneData.id] = leaguestoneData.text;
    }
    // Resonators
    this.tradeData.resonators = {};
    for (let resonatorIndex = 0; resonatorIndex < apiData.result.resonators.length; resonatorIndex++) {
      let resonatorData = apiData.result.resonators[resonatorIndex];
      this.tradeData.resonators[resonatorData.id] = resonatorData.text;
    }
    // Scarabs
    this.tradeData.scarabs = {};
    for (let scarabIndex = 0; scarabIndex < apiData.result.scarabs.length; scarabIndex++) {
      let scarabData = apiData.result.scarabs[scarabIndex];
      this.tradeData.scarabs[scarabData.id] = scarabData.text;
    }
    // Vials
    this.tradeData.vials = {};
    for (let vialIndex = 0; vialIndex < apiData.result.vials.length; vialIndex++) {
      let vialData = apiData.result.vials[vialIndex];
      this.tradeData.vials[vialData.id] = vialData.text;
    }
  }
  handleStats(apiData) {
    // Leagues
    this.tradeData.stats = {};
    for (let statTypeIndex = 0; statTypeIndex < apiData.result.length; statTypeIndex++) {
      let statTypeData = apiData.result[statTypeIndex];
      this.tradeData.stats[statTypeData.label] = {};
      for (let entryIndex = 0; entryIndex < statTypeData.entries.length; entryIndex++) {
        let entryData = statTypeData.entries[entryIndex];
        this.tradeData.stats[statTypeData.label][entryData.id] = entryData.text;
      }
    }
  }
  async wikiGetLoginToken() {
    let params = {
      action: "query",
      meta: "tokens",
      type: "login",
      format: "json"
    }
    let reply = await this.wikiSendRequest(params);
    this.wikiLoginToken = reply.query.tokens.logintoken;
    return true;
  }
  async wikiSendLogin(username, password) {
    if (this.wikiLoginToken === null) {
      // Ensure there is a login token available
      await this.wikiGetLoginToken();
    }
    let params = {
      action: "login",
      lgname: username,
      lgpassword: password,
      lgtoken: this.wikiLoginToken,
      format: "json"
    }
    let reply = await this.wikiSendRequest(params);
    return (reply.result == "Success");
  }
  async wikiSendCargoQuery(params) {
    params.action = "cargoquery";
    params.format = "json";
    let reply = await this.wikiSendRequest(params);
    if (typeof reply.warnings != "undefined") {
      if (typeof reply.warnings.cargoquery != "undefined") {
        if ((typeof reply.warnings.cargoquery['*'] != "undefined")
            && reply.warnings.cargoquery['*'].match(/may not be over 500/i)) {
          // Limited by 500 rows per query.
          this.wikiLimit = 500;
        }
      }
    }
    if (typeof reply.error != "undefined") {
      throw (reply.error.code+": "+reply.error.info);
    }
    return reply.cargoquery;
  }
  async wikiSendRequest(params) {
    let url = "https://pathofexile.gamepedia.com/api.php";
    let promise = new Promise((resolve, reject) => {
      request({
        'method': 'POST',
        'uri': url,
        'form': params,
        'jar': true,
        'json': true,
      }, (error, response, body) => {
          if (error) reject(error);
          if (response.statusCode != 200) {
              reject('Invalid status code <' + response.statusCode + '>');
          }
          resolve(body);
      });
    });
    return promise;
  }
  async fetchWikiTable(params, callback, ...callbackParams) {
    let queryResult = null;
    params.offset = 0;
    params.limit = this.wikiLimit;
    while (true) {
      // Send query
      queryResult = await this.wikiSendCargoQuery(params);
      // Process results
      for (let i = 0; i < queryResult.length; i++) {
        callback(queryResult[i].title, params.offset + i, ...callbackParams);
      }
      // Update offset and limit
      params.offset += queryResult.length;
      params.limit = this.wikiLimit;
      if (queryResult.length < this.wikiLimit) {
        // Exit when all entries have been processed
        break;
      } else {
        // Throttle a bit.
        await this.wait(200);
      }
    }
  }
  async fetchItems(callback, ...callbackParams) {
    return await this.fetchWikiTable({
      fields: [
        '_pageID=page_id',
        'alternate_art_inventory_icons',
        'base_item', 'base_item_id', 'base_item_page',
        'cannot_be_traded_or_modified',
        'class', 'class_id',
        'description',
        'drop_areas', 'drop_enabled', 'drop_leagues', 'drop_level', 'drop_level_maximum',
        'drop_rarities', 'drop_rarities_ids', 'drop_text',
        'explicit_stat_text', 'flavour_text', 'frame_type', 'help_text', 'icon',
        'implicit_stat_text', 'inventory_icon', 'is_corrupted', 'is_corrupted', 'is_relic', 'metadata_id',
        'name', 'name_list', 'quality', 'rarity', 'rarity_id', 'release_version', 'removal_version',
        /*
        'required_dexterity', 'required_dexterity_range_average', 'required_dexterity_range_colour',
        'required_dexterity_range_maximum', 'required_dexterity_range_minimum', 'required_dexterity_range_text',
        'required_intelligence', 'required_intelligence_range_average', 'required_intelligence_range_colour',
        'required_intelligence_range_maximum', 'required_intelligence_range_minimum', 'required_intelligence_range_text',
        'required_level', 'required_level_base', 'required_level_range_average', 'required_level_range_colour',
        'required_level_range_maximum', 'required_level_range_minimum',  'required_level_range_text',
        'required_strength', 'required_strength_range_average', 'required_strength_range_colour',
        'required_strength_range_maximum', 'required_strength_range_minimum',  'required_strength_range_text',
        */
        'size_x', 'size_y', 'stat_text', 'supertype', 'tags'
      ].join(","),
      tables: 'items'
    }, callback, ...callbackParams);
  }
  async fetchItemMods(callback, ...callbackParams) {
    return await this.fetchWikiTable({
      fields: [
        '_pageID=page_id',
        'id',
        'is_implicit', 'is_random',
        'text'
      ].join(","),
      tables: 'item_mods'
    }, callback, ...callbackParams);
  }
  async fetchItemStats(callback, ...callbackParams) {
    return await this.fetchWikiTable({
      fields: [
        '_pageID=page_id',
        'id',
        'is_implicit', 'is_random',
        'avg', 'min', 'max'
      ].join(","),
      tables: 'item_stats'
    }, callback, ...callbackParams);
  }
  async fetchMods(callback, ...callbackParams) {
    return await this.fetchWikiTable({
      fields: [
        '_pageID=page_id',
        'id', 'domain', 'generation_type',
        'granted_buff_id', 'granted_buff_value', 'granted_skill',
        'mod_group', 'mod_type',
        'name', 'required_level', 'stat_text', 'stat_text_raw', 'tags', 'tier_text'
      ].join(","),
      tables: 'mods'
    }, callback, ...callbackParams);
  }
  async fetchModStats(callback, ...callbackParams) {
    return await this.fetchWikiTable({
      fields: [
        '_pageID=page_id',
        'id', 'min', 'max'
      ].join(","),
      tables: 'mod_stats'
    }, callback, ...callbackParams);
  }
  async fetchSpawnWeights(callback, ...callbackParams) {
    return await this.fetchWikiTable({
      fields: [
        '_pageID=page_id',
        'ordinal',
        'tag',
        'weight'
      ].join(","),
      tables: 'spawn_weights'
    }, callback, ...callbackParams);
  }
  async updateApiData(dataType) {
    let url = "https://www.pathofexile.com/api/trade/data/"+dataType;
    let promise = new Promise((resolve, reject) => {
      request({
        'method': 'GET',
        'uri': url,
        'json': true,
      }, (error, response, body) => {
          if (error) reject(error);
          if (response.statusCode != 200) {
              reject('Invalid status code <' + response.statusCode + '>');
          }
          resolve(body);
      });
    });
    return promise;
  }
  async updateWikiLogin(entry) {
    let loginName = config.get("poe-data-login");
    let loginPass = config.get("poe-data-pass");
    // Login if login information was provided
    if ((loginName != "") && (loginPass != "") && (this.wikiLoginToken === null)) {
      let updateText = "Updating poe data (login)";
      // Update status text
      entry.setTitle(updateText+".");
      // Send login
      await this.wikiSendLogin(loginName, loginPass);
      // Update status text
      entry.setTitle(updateText+"..");
    }
  }
  async updateWikiItems(entry) {
    // Check login
    await this.updateWikiLogin(entry);
    // Prepare update text
    let updateText = "Updating poe data (items)";
    let updateTextProgress = "";
    let updateTextAnimation = (entry) => {
      updateTextProgress += ".";
      if (updateTextProgress.length > 5) {
        updateTextProgress = "";
      }
      entry.setTitle(updateText+updateTextProgress);
    };
    // Query data
    this.wikiData.items = {
      byName: {},
      byId: {}
    };
    // -> Items
    await this.fetchItems((item, index, entry, poedata) => {
      // Add mod
      let itemPageId = item.page_id;
      delete item.page_id;
      item['description'] = this.decodeHtml(item['description']);
      item['stat text'] = this.decodeHtml(item['stat text']);
      item['help text'] = this.decodeHtml(item['help text']);
      item['flavour text'] = this.decodeHtml(item['flavour text']);
      item['tags'] = (item['tags'] == "" ? [] : item['tags'].split(","));
      item['mods'] = [];
      item['stats'] = [];
      if (typeof poedata.wikiData.items.byName[item.name] == "undefined") {
        poedata.wikiData.items.byName[item.name] = [];
      }
      poedata.wikiData.items.byName[item.name].push(itemPageId);
      poedata.wikiData.items.byId[itemPageId] = item;
      // Loading "animation"
      if ((index % poedata.wikiLimit) == 0) {
        updateTextAnimation(entry);
      }
    }, entry, this);
    // -> Item mods
    await this.fetchItemMods((mod, index, entry, poedata) => {
      // Add mod
      let itemPageId = mod.page_id;
      delete mod.page_id;
      if (typeof poedata.wikiData.items.byId[itemPageId] != "undefined") {
        poedata.wikiData.items.byId[itemPageId].mods.push(mod);
      } else {
        // Debug code
        //console.log("Found mod without matching item: "+itemPageId+" -> "+util.inspect(mod));
      }
      // Loading "animation"
      if ((index % poedata.wikiLimit) == 0) {
        updateTextAnimation(entry);
      }
    }, entry, this);
    // -> Item stats
    await this.fetchItemStats((stat, index, entry, poedata) => {
      // Add stat
      let itemPageId = stat.page_id;
      delete stat.page_id;
      if (typeof poedata.wikiData.items.byId[itemPageId] != "undefined") {
        poedata.wikiData.items.byId[itemPageId].stats.push(stat);
      } else {
        // Debug code
        //console.log("Found stat without matching item: "+itemPageId+" -> "+util.inspect(stat));
      }
      // Loading "animation"
      if ((index % poedata.wikiLimit) == 0) {
        updateTextAnimation(entry);
      }
    }, entry, this);
  }
  async updateWikiMods(entry) {
    // Check login
    await this.updateWikiLogin(entry);
    // Prepare update text
    let updateText = "Updating poe data (mods)";
    let updateTextProgress = "";
    let updateTextAnimation = (entry) => {
      updateTextProgress += ".";
      if (updateTextProgress.length > 5) {
        updateTextProgress = "";
      }
      entry.setTitle(updateText+updateTextProgress);
    };
    // Query data
    this.wikiData.mods = {
      byModIdent: {},
      byDomain: {},
      byGeneration: {},
      bySpawnTags: {},
      byId: {}
    };
    // -> Mods
    await this.fetchMods((mod, index, entry, poedata) => {
      // Add mod
      let modPageId = mod.page_id;
      delete mod.page_id;
      mod['trade text'] = poedata.getTradeText(mod['stat text raw']);
      mod['trade limits'] = poedata.getTradeLimits(mod['stat text raw']);
      mod['trade ids'] = poedata.getTradeIds(mod['trade text']);
      mod['tags'] = (mod['tags'] == "" ? [] : mod['tags'].split(","));
      mod['stats'] = [];
      mod['spawnWeights'] = [];
      poedata.wikiData.mods.byId[modPageId] = mod;
      poedata.wikiData.mods.byModIdent[mod.id] = modPageId;
      // Domain lookup
      if (typeof poedata.wikiData.mods.byDomain[mod['domain']] == "undefined") {
        poedata.wikiData.mods.byDomain[mod['domain']] = [];
      }
      poedata.wikiData.mods.byDomain[mod['domain']].push(modPageId);
      // Generation lookup
      if (typeof poedata.wikiData.mods.byGeneration[mod['generation type']] == "undefined") {
        poedata.wikiData.mods.byGeneration[mod['generation type']] = [];
      }
      poedata.wikiData.mods.byGeneration[mod['generation type']].push(modPageId);
      // Loading "animation"
      if ((index % poedata.wikiLimit) == 0) {
        updateTextAnimation(entry);
      }
    }, entry, this);
    // -> Mod stats
    updateText = "Updating poe data (mod stats)";
    await this.fetchModStats((stat, index, entry, poedata) => {
      // Add mod
      let modPageId = stat.page_id;
      delete stat.page_id;
      if (typeof poedata.wikiData.mods.byId[modPageId] != "undefined") {
        poedata.wikiData.mods.byId[modPageId].stats.push(stat);
      } else {
        //console.log("Found stat without matching mod: "+modPageId+" -> "+util.inspect(stat));
      }
      // Loading "animation"
      if ((index % poedata.wikiLimit) == 0) {
        updateTextAnimation(entry);
      }
    }, entry, this);
    // -> Mod spawn weights
    updateText = "Updating poe data (mod spawns)";
    await this.fetchSpawnWeights((spawnWeight, index, entry, poedata) => {
      // Add mod
      let modPageId = spawnWeight.page_id;
      delete spawnWeight.page_id;
      if (typeof poedata.wikiData.mods.byId[modPageId] != "undefined") {
        poedata.wikiData.mods.byId[modPageId].spawnWeights.push(spawnWeight);
        if (spawnWeight.weight > 0) {
          if (typeof poedata.wikiData.mods.bySpawnTags[spawnWeight.tag] == "undefined") {
            poedata.wikiData.mods.bySpawnTags[spawnWeight.tag] = [];
          }
          poedata.wikiData.mods.bySpawnTags[spawnWeight.tag].push({
            modId: modPageId, ordinal: spawnWeight.ordinal, weight: spawnWeight.weight
          });
        }
      } else {
        //console.log("Found spawnWeight without matching mod: "+modPageId+" -> "+util.inspect(spawnWeight));
      }
      // Loading "animation"
      if ((index % poedata.wikiLimit) == 0) {
        updateTextAnimation(entry);
      }
    }, entry, this);
  }
  update() {
    var poeDataUpdateEntry = new TextEntry("Updating poe data (core)...");
    poeDataUpdateEntry.add();
    poeDataUpdateEntry.setCloseable(false);
    this.refresh(poeDataUpdateEntry).then(() => {
      poeDataUpdateEntry.setTitle("Updated poe-data successfully!");
      poeDataUpdateEntry.setIcon("fa-check-circle green");
      poeDataUpdateEntry.setCloseable(true);
      poeDataUpdateEntry.enableAutoClose(10);
    })
    .catch((error) => {
      log.warn("Failed updating poe-data, " + error);
      poeDataUpdateEntry.setTitle("Updating poe-data failed!");
      poeDataUpdateEntry.setText("Please check the log file for more information.");
      poeDataUpdateEntry.setCloseable(true);
      poeDataUpdateEntry.setIcon("fa-exclamation-circle red");
      poeDataUpdateEntry.addLogfileButton();
    })
    .then(() => {
      GUI.toggleMenuButtonColor("update", true);
    });
  }
  async refresh(entry) {
    this.updateActive = true;
    // Cache lifetime in minutes
    let cacheLifetime = 60 * 24 * config.get("poeDataInterval");
    // Check cache for trade data
    let cacheFileTrade = this.getCacheFilename("trade");
    if (!this.isCacheValid(cacheFileTrade, cacheLifetime)) {
      let promiseLeagues = this.updateApiData("leagues");
      let promiseStatic = this.updateApiData("static");
      let promiseStats = this.updateApiData("stats");
      this.handleLeagues(await promiseLeagues);
      this.handleStatic(await promiseStatic);
      this.handleStats(await promiseStats);
      this.writeCache("trade");
    }
    // Check cache for wiki data (items)
    let cacheFileWikiItems = this.getCacheFilename("wiki-items");
    if (!this.isCacheValid(cacheFileWikiItems, cacheLifetime)) {
      await this.updateWikiItems(entry);
      this.writeCache("wiki-items");
    }
    // Check cache for wiki data (mods)
    let cacheFileWikiMods = this.getCacheFilename("wiki-mods");
    if (!this.isCacheValid(cacheFileWikiMods, cacheLifetime)) {
      await this.updateWikiMods(entry);
      this.writeCache("wiki-mods");
    }
    this.updateActive = false;
  }
  wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve,ms)
    });
  }
  isCacheValid(cacheFile, cacheLifetime) {
    if (fs.existsSync(cacheFile)) {
      if (cacheLifetime == 0) {
        return true;
      } else {
        let now = Date.now();
        let cacheStat = fs.statSync(cacheFile);
        let cacheAge = (now - cacheStat.mtimeMs) / 1000 / 60; // File age in minutes
        if (cacheAge < cacheLifetime) {
          return true;
        }
      }
    }
    return false;
  }
  isUpdating() {
    return this.updateActive;
  }
  getCacheDirectory() {
    if(os.platform() === "linux") {
      return path.join(os.homedir(), "/.config/XenonTrade/poe-data");
    } else {
      return path.join(os.homedir(), "/AppData/Roaming/XenonTrade/poe-data");
    }
  }
  getCacheFilename(type) {
    switch (type) {
      default:
        return path.join(this.getCacheDirectory(), "poe-data-"+type+".json.gz");
    }
  }
  getTradeText(rawText) {
    return this.decodeHtml(rawText).replace(/\+?\([0-9\-\.]+\)/g, "#");
  }
  getTradeLimits(rawText) {
    let matchLimits = false;
    let lines = this.decodeHtml(rawText).split("\n");
    let result = [];
    for (let l = 0; l < lines.length; l++) {
      let resultLine = [];
      let regExpLimits = /\+?\(([0-9\-\.]+)\)/g;
      while (matchLimits = regExpLimits.exec(lines[l])) {
        resultLine.push(matchLimits[1].split("-"));
      }
      result.push(resultLine);
    }
    return result;
  }
  getTradeIds(text) {
    if (text == "") {
      return [];
    }
    let tradeIds = [];
    let lines = text.split("\n");
    for (let l = 0; l < lines.length; l++) {
      let lineTradeIds = [];
      // Look for exact matches
      for (let statType in this.tradeData.stats) {
        for (let statId in this.tradeData.stats[statType]) {
          if (lines[l] == this.tradeData.stats[statType][statId]) {
            lineTradeIds.push(statId);
          }
        }
      }
      if (lineTradeIds.length == 0) {
        // Check more tolerant matches
        let tradeRegExpText = this.escapeRegExpString(lines[l])
          .replace(/(\\\+)?([0-9]+)/g, "(\\+?#|\\+?$2)")
          .replace(/reduced/g, "(increased|reduced)")
          .replace(/seconds?/g, "seconds?");
        let tradeRegExp = new RegExp("^"+tradeRegExpText+"$", "i");
        for (let statType in this.tradeData.stats) {
          for (let statId in this.tradeData.stats[statType]) {
            if (this.tradeData.stats[statType][statId].match(tradeRegExp)) {
              lineTradeIds.push(statId);
            }
          }
        }
      }
      tradeIds.push(lineTradeIds);
    }
    return tradeIds;
  }
  readCache(type) {
    if (typeof type == "undefined") {
      // Read everything from cache
      this.readCache("trade");
      this.readCache("wiki-items");
      this.readCache("wiki-mods");
    } else {
      // Read specific type from cache
      let cacheFile = this.getCacheFilename(type);
      if (!fs.existsSync(cacheFile)) {
        // Cache file does not exist! Skip.
        return;
      }
      let cacheContent = this.readCacheRaw(cacheFile);
      switch (type) {
        case "trade":
          this.tradeData = JSON.parse(cacheContent);
          break;
        case "wiki-items":
          this.wikiData.items = JSON.parse(cacheContent);
          break;;
        case "wiki-mods":
          this.wikiData.mods = JSON.parse(cacheContent);
          break;
      }
    }
  }
  readCacheRaw(cacheFile) {
    let cacheContent = fs.readFileSync(cacheFile);
    return zlib.gunzipSync(cacheContent).toString();
  }
  writeCache(type) {
    if (typeof type == "undefined") {
      // Write everything into cache
      this.writeCache("trade");
      this.writeCache("wiki-items");
      this.writeCache("wiki-mods");
    } else {
      // Create cache directory if it does not exist
      let cacheDir = this.getCacheDirectory();
      if (!fs.existsSync( cacheDir )) {
        fs.mkdir(cacheDir, { recursive: true });
      }
      // Write specific type into cache
      let cacheFile = this.getCacheFilename(type);
      switch (type) {
        case "trade":
          this.writeCacheRaw( cacheFile, JSON.stringify(this.tradeData) );
          break;
        case "wiki-items":
          this.writeCacheRaw( cacheFile, JSON.stringify(this.wikiData.items) );
          break;
        case "wiki-mods":
          this.writeCacheRaw( cacheFile, JSON.stringify(this.wikiData.mods) );
          break;
      }
    }
  }
  writeCacheRaw(cacheFile, cacheContent) {
    let cacheContentBuffer = new Buffer(cacheContent, "utf-8");
    let cacheContentGzip = zlib.gzipSync(cacheContentBuffer);
    fs.writeFileSync( cacheFile, cacheContentGzip );
  }
}

module.exports = PoeData;
