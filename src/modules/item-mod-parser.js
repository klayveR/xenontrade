'use strict';

module.exports = class ItemModParser {
  constructor(...mods) {
    this.lines = [];
    this.modsPossible = mods;
    this.modsPossible.sort((a, b) => {
      let lineDiff = b.getRegExpCount() - a.getRegExpCount();
      let idAlphabetic = (a.modId < b.modId ? -1 : (a.modId > b.modId ? 1 : 0)); 
      return (lineDiff != 0 ? lineDiff : idAlphabetic);
    });
    this.modsFound = [];
  }
  addModsManually(...mods) {
    this.modsFound.push(...mods);
  }
  getMods() {
    return this.modsFound;
  }
  getLines() {
    return this.lines;
  }
  setLines(lines) {
    this.lines = lines;
  }
  match(lines) {
    this.lines = lines.slice(0);
    this.modsFound = [];
    for (let i = 0; i < this.modsPossible.length; i++) {
      let modCurrent = this.modsPossible[i];
      let modCurrentLines = [];
      let modCurrentMatches = [];
      let modCurrentRegExps = modCurrent.getRegExpList();
      for (let r = 0; r < modCurrentRegExps.length; r++) {
        for (let l = 0; l < this.lines.length; l++) {
          let match = this.lines[l].match(modCurrentRegExps[r]);
          if (match) {
            modCurrentLines.push(l);
            modCurrentMatches.push(match);
            break;
          }
        }
      }
      if (modCurrentMatches.length == modCurrentRegExps.length) {
        // Mod matched completely, add to matches
        modCurrent = modCurrent.clone();
        for (let r = 0; r < modCurrentMatches.length; r++) {
          modCurrent.setValuesByMatch(modCurrentMatches[r], r);
        }
        if (modCurrent.validateValues()) {
          // Add mod to result
          this.modsFound.push(modCurrent);
          // Remove matched lines
          for (let l = this.lines.length - 1; l >= 0; l--) {
            if (modCurrentLines.indexOf(l) >= 0) {
              this.lines.splice(l, 1);
            }
          }
        }
      }
    }
    return (this.lines.length == 0);
  }
};
