const CurrencyAbbreviations = require("../resource/currencyAbbreviations");

class Whisper {
  /**
  * Creates a new Whisper object
  * // TODO: JSDocs
  *
  * @constructor
  */
  constructor(message) {
    this.message = message;
    this.tradeInfo = this._getItemTradeInfo() || this._getBulkTradeInfo();
  }

  _getItemTradeInfo() {
    var message = this.message.message;
    var stashInfo = this._getStashInfo();
    var tradeInfo = this.getDefaultTradeInfo();

    tradeInfo.type = "item";

    // Stash
    if(stashInfo != null) {
      // Remove stash information from message
      message = message.replace(stashInfo.message, "");
      delete(stashInfo.message);
    }

    tradeInfo.stash = stashInfo;

    // Trade
    var pattern = /(?:Hi, I would like to buy your|wtb) (.+) listed for ([0-9.]+) (.+) in (.+)/;
    var match = message.match(pattern);

    if(match) {
      tradeInfo.receive.amount = "";
      tradeInfo.receive.name = match[1];
      tradeInfo.pay.amount = parseFloat(match[2]);
      tradeInfo.pay.name = this.formatCurrencyName(match[3]);
      tradeInfo.league = match[4];
      tradeInfo.trade = match[1] + " for " + match[2] + " " + match[3];

      return tradeInfo;
    }

    return null;
  }

  _getBulkTradeInfo() {
    var message = this.message.message;
    var tradeInfo = this.getDefaultTradeInfo();

    tradeInfo.type = "bulk";

    // Trade
    var pattern = /I'd like to buy your ([0-9.]+) (.+) for my ([0-9.]+) (.+) in (.+)\./;
    var match = message.match(pattern);

    if(match) {
      tradeInfo.receive.amount = parseFloat(match[1]);
      tradeInfo.receive.name = this.formatCurrencyName(match[2]);
      tradeInfo.pay.amount = parseFloat(match[3]);
      tradeInfo.pay.name = this.formatCurrencyName(match[4]);
      tradeInfo.league = match[5];
      tradeInfo.trade = match[1] + " " + match[2] + " for " + match[3] + " " + match[4];

      return tradeInfo;
    }

    return null;
  }

  _getStashInfo() {
    var pattern = / \(stash(?: tab)? "(.+)";(?: position:)? left ([0-9]+), top ([0-9]+)\)/;
    var match = this.message.message.match(pattern);

    if(match) {
      return {
        message: match[0],
        tab: match[1],
        left: match[2],
        top: match[3]
      };
    }

    return null;
  }

  formatCurrencyName(currencyName) {
    for(var currency in CurrencyAbbreviations) {
      for(var abbrIndex in CurrencyAbbreviations[currency]) {
        var abbr = CurrencyAbbreviations[currency][abbrIndex];

        if(currencyName.toLowerCase().includes(abbr.toLowerCase())) {
          return currency;
        }
      }
    }

    return currencyName;
  }

  getDefaultTradeInfo() {
    return {
      type: null,
      pay: {
        amount: 0,
        name: null
      },
      receive: {
        amount: 0,
        name: null
      },
      stash: {
        tab: null,
        top: 0,
        left: 0
      },
      league: null,
      trade: null
    }
  }

  isTradeMessage() {
    if(this.tradeInfo != null) {
      return true;
    }

    return false;
  }

  hasStashData() {
    if(this.tradeInfo.stash.tab != null) {
      return true;
    }

    return false;
  }

  hasLeague() {
    if(this.tradeInfo.league != null) {
      return true;
    }

    return false;
  }

  getTradeInfo() {
    return this.tradeInfo;
  }

  getMessage() {
    return this.message;
  }

  getDirection() {
    return this.message.direction;
  }

  getTradeType() {
    return this.tradeInfo.type;
  }
}

module.exports = Whisper;
