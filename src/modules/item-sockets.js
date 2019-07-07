'use strict';

module.exports = class ItemSockets {
  constructor() {
    this.count = 0;
    this.links = [];
  }
  addLink(sockets) {
    this.count += sockets.length;
    this.links.push(sockets);
  }
  getMinLinkLength() {
    let result = 0;
    for (let l = 0; l < this.links.length; l++) {
      result = Math.min(result, this.links[l].length);
    }
    return result;
  }
  getMaxLinkLength() {
    let result = 0;
    for (let l = 0; l < this.links.length; l++) {
      result = Math.max(result, this.links[l].length);
    }
    return result;
  }
  getSocketCount(color) {
    let result = 0;
    for (let l = 0; l < this.links.length; l++) {
      if (typeof color == "undefined") {
        result += this.links[l].length;
      } else {
        for (let s = 0; s < this.links[l].length; s++) {
          if (this.links[l][s] == color) {
            result++;
          }
        }
      }
    }
    return result;
  }
  getRedCount() {
    return this.getSocketCount("R");
  }
  getGreenCount() {
    return this.getSocketCount("G");
  }
  getBlueCount() {
    return this.getSocketCount("B");
  }
  getWhiteCount() {
    return this.getSocketCount("W");
  }
};
