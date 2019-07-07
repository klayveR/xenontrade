'use strict';

module.exports = class ItemMod {
  constructor(modData, modTrade, modType, values) {
    this.modId = (typeof modData != "undefined" ? modData.id : null);
    this.modBase = (typeof modData != "undefined" ? modData : null);
    this.modTrade = (typeof modTrade != "undefined" ? modTrade : null);
    this.modType = (typeof modType != "undefined" ? modType : null);
    this.regExp = null;
    this.values = (typeof values != "undefined" ? values : null);
  }
  clone() {
    return new ItemMod(this.modBase, this.modTrade, this.values);
  }
  escapeRegExpString(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  getRegExp(index) {
    return this.getRegExpList()[index];
  }
  getRegExpList() {
    if (this.regExp === null) {
      let modText = null;
      if (this.modBase !== null) {
        modText = this.modBase['trade text'];
      } else if (this.modTrade !== null) {
        modText = this.modTrade.text;
      }
      if (modText !== null ) {
        this.regExp = [];
        let modRegExpLines = modText.split("\n");
        for (let i = 0; i < modRegExpLines.length; i++) {
          if (this.modType == "Crafted") {
            modRegExpLines[i] += " (crafted)";
          }
          let modRegExpSplit = this.escapeRegExpString(modRegExpLines[i]).split("#");
          this.regExp.push( new RegExp("^"+modRegExpSplit.join("([\\+\\-]?[0-9\\.]+)( to ([\\+\\-]?[0-9\\.]+))?")+"$", "i") );
        }
      }
    }
    return this.regExp;
  }
  getRegExpCount() {
    return this.getRegExpList().length;
  }
  getGroup() {
    if (this.modBase !== null) {
      return this.modBase["mod group"];
    }
    return null;
  }
  getRequiredLevel() {
    if (this.modBase !== null) {
      return parseInt(this.modBase["required level"]);
    }
    return 0;
  }
  getTradeIds() {
    let tradeIds = [];
    for (let i = 0; i < this.modTrade.length; i++) {
      tradeIds.push(this.modTrade[i] !== null ? this.modTrade[i].id : null);
    }
    return tradeIds;
  }
  getValueMin(index) {
    let result = null;
    let limits = this.modBase['trade limits'];
    if (typeof index == "undefined") {
      for (let i = 0; i < limits.length; i++) {
        let value = this.getValueMin(i);
        if ((result === null) || (value < result)) {
          result = value;
        }
      }
    } else {      
      for (let v = 0; v < limits[index].length; v++) {
        let value = parseFloat(limits[index][v]);
        if ((result === null) || (value < result)) {
          result = value;
        }
      }
    }
    return result;
  }
  getValueMax(index) {
    let result = null;
    let limits = this.modBase['trade limits'];
    if (typeof index == "undefined") {
      for (let i = 0; i < limits.length; i++) {
        let value = this.getValueMax(i);
        if ((result === null) || (value > result)) {
          result = value;
        }
      }
    } else {      
      for (let i = 0; i < limits[index].length; i++) {
        for (let v = 0; v < limits[index][i].length; v++) {
          let value = parseFloat(limits[index][i][v]);
          if ((result === null) || (value > result)) {
            result = value;
          }
        }
      }
    }
    return result;
  }
  getValueAvg(index) {
    let result = 0;
    let resultCount = 0;
    if (typeof index == "undefined") {
      for (let i in this.values) {
        let value = this.getValueAvg(i);
        result += value;
        resultCount++;
      }
    } else {      
      for (let v = 0; v < this.values[index].length; v++) {
        let value = parseFloat(this.values[index][v]);
        result += value;
        resultCount++;
      }
    }
    return result;
  }
  hasTag(tag) {
    if (this.modBase === null) {
      return false;
    }
    return (this.modBase.tags.indexOf(tag) >= 0)
  }
  setValuesByMatch(matchResult, index) {
    if (this.values === null) {
      this.values = {};
    }
    if (typeof this.values[index] == "undefined") {
      this.values[index] = [];
    }
    for (let i = 1; i < matchResult.length; i++) {
      if (typeof matchResult[i] == "undefined") {
        continue;
      }
      if (!matchResult[i].match(/^[\+\-]?[0-9\\.]+$/)) {
        continue;
      }
      this.values[index].push( parseFloat(matchResult[i]) );
    }
  }
  validateValues() {
    let limits = this.modBase['trade limits'];
    for (let l = 0; l < limits.length; l++) {
      for (let i = 0; i < limits[l].length; i++) {
        if (typeof limits[l] == "undefined") {
          return false;
        }
        if ((parseFloat(limits[l][i][0]) > this.values[l][i]) || (parseFloat(limits[l][i][1]) < this.values[l][i])) {
          return false;
        }
      }
    }
    return true;
  }
};
