const Entry = require("../entry.js");
const Icons = require("../gui/icons.js");
const PathOfExile = require("../poe.js");

class WhisperEntry extends Entry {
  /**
  * Creates a new WhisperEntry object
  * // TODO: JSDocs
  *
  * @constructor
  */
  constructor(whisper) {
    super();

    this.whisper = whisper;
  }

  add() {
    var template = templates.get("whisper.html");
    var replacements = this._buildReplacements();

    // Set template, replacements and add
    super.setTemplate(template);
    super.setReplacements(replacements);
    super.add();

    // Set buttons
    super.setCloseable(true);
    super.enableTimer();
    this._enableTradeButtons();
    this._addChatButtons();
    this._setDirectionElements();
    this._showTableData();
  }

  _buildReplacements() {
    var tradeInfo = this.whisper.getTradeInfo();
    var message = this.whisper.getMessage();

    var replacements = [
      { find: "player-name", replace: message.player.name },
      { find: "league", replace: tradeInfo.league },
      { find: "trade", replace: tradeInfo.trade },
      { find: "pay-amount", replace: tradeInfo.pay.amount },
      { find: "pay-name", replace: tradeInfo.pay.name },
      { find: "pay-icon", replace: Icons.findIconByName(tradeInfo.pay.name) },
      { find: "receive-amount", replace: tradeInfo.receive.amount },
      { find: "receive-name", replace: tradeInfo.receive.name },
      { find: "receive-icon", replace: Icons.findIconByName(tradeInfo.receive.name) },
      { find: "ratio", replace: tradeInfo.pay.amount / tradeInfo.receive.amount },
      { find: "stash", replace: tradeInfo.stash.tab },
      { find: "stash-left", replace: tradeInfo.stash.left },
      { find: "stash-top", replace: tradeInfo.stash.top }
    ];

    return replacements;
  }

  _setDirectionElements() {
    var direction = this.whisper.getMessage().direction;

    // Arrow in title
    var arrow = this.getJQueryObject().find(".title").find(".trade").find("i");
    arrow.removeClass();

    // Item name color
    var itemName = this.getJQueryObject().find(".content").find(".item");

    if(direction === "To") {
      itemName.addClass("green");
      arrow.addClass("fas fa-arrow-left green");
    } else {
      itemName.addClass("red");
      arrow.addClass("fas fa-arrow-right red");
    }
  }

  _enableTradeButtons() {
    var direction = this.whisper.getMessage().direction;

    if(direction === "To") {
      this._enableTradeButton("hideout");
      this._enableTradeButton("leave");
    } else {
      this._enableTradeButton("kick");
      this._enableTradeButton("invite");
    }

    this._enableTradeButton("trade");
  }

  _enableTradeButton(button) {
    var self = this;
    var button = this.getJQueryObject().find("[data-button='" + button + "']");
    var command = button.attr("data-command");
    button.show();
    super.updateMiddleWidth();

    button.click(function() {
      PathOfExile.chat(command);
    });
  }

  _addChatButtons() {
    var container = this.getJQueryObject().find(".chat-buttons");
    var buttonCount = 0;
    var buttons = null;

    if(this.whisper.getMessage().direction === "To") {
      buttons = config.get("whisperhelper.buttons.out");
    } else {
      buttons = config.get("whisperhelper.buttons.in");
    }

    // For each button in config
    for(var button in buttons) {
      var buttonLabel = button;

      // Font awesome icon support for button labels
      if(buttonLabel.substring(0, 3) === "fa-") {
        buttonLabel = "<i class='fas " + button + "'></i>"
      }

      // Replace placeholders in message
      let text = "@%player-name% " + buttons[button];
      text = Entry.getReplacedString(text, this.replacements);

      // Add button
      var html = "<div class='cell option' style='border-bottom: 1px solid #202630;border-top:0px' data-button='" + button + "'>" + buttonLabel + "</div>";
      if(buttonCount === 0) {
        container.html(html);
        container.find("[data-button='" + button + "']").addClass("no-border-left");
      } else {
        container.find(".cell:last").after(html);
      }

      container.find("[data-button='" + button + "']").css("width", (100 / Object.keys(buttons).length) + "%")
      container.find("[data-button='" + button + "']").click(function() {
        PathOfExile.chat(text);
      });

      buttonCount++;
    }
  }

  _enableStash(enabled) {
    var stashRow = this.getJQueryObject().find(".content").find("[data-stash]");
    stashRow.toggle(enabled);
  }

  _showTableData() {
    var showData = false;

    // If it's an incoming trade
    if(this.whisper.getDirection() === "From") {
      // Stash
      if(this.whisper.hasStashData()) {
        this.getJQueryObject().find(".explanation-table").find("[table-stash]").show();
        showData = true;
      }

      // League
      if(this.whisper.hasLeague()) {
        this.getJQueryObject().find(".explanation-table").find("[table-league]").show();
        showData = true;
      }
    }

    // Bulk ratio
    if(this.whisper.getTradeType() === "bulk") {
      this.getJQueryObject().find(".explanation-table").find("[table-ratio]").show();
    }

    if(showData) {
      this._showTable();
    }
  }

  _showTable(show) {
    var table = this.getJQueryObject().find(".explanation-table");
    table.toggle(show);
  }
}

module.exports = WhisperEntry;
