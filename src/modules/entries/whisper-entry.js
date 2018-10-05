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
      { find: "stash-top", replace: tradeInfo.stash.top },
      { find: "user-name", replace: config.get("characterName") }
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

      // Only enable leave when a character name is specified, otherwise the button can't work
      if(config.get("characterName") !== "") {
        this._enableTradeButton("leave");
      }
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
    var firstButton = true;
    var buttons = config.get("tradehelper.buttons");
    var direction = this.whisper.getMessage().direction;

    // For each button in config
    for(var index in buttons) {
      var button = buttons[index];

      // Add only buttons that match the direction of the whisper and are not empty
      if(button.direction === direction && button.label !== "" && button.message !== "") {
        var buttonLabel = button.label;

        // Font awesome icon support for button labels
        if(buttonLabel.substring(0, 3) === "fa-") {
          buttonLabel = "<i class='fas " + buttonLabel + "'></i>"
        }

        // Replace placeholders in message
        let text = "@%player-name% " + button.message;
        text = Entry.getReplacedString(text, this.replacements);

        // Add button
        var html = "<div class='cell option' style='border-top: 0px' data-button='" + index + "'>" + buttonLabel + "</div>";
        if(firstButton) {
          firstButton = false;
          container.html(html);
          container.find("[data-button='" + index + "']").addClass("no-border-left");
          container.css("height", "20px");
        } else {
          container.find(".cell:last").after(html);
        }

        container.find("[data-button='" + index + "']").css("width", (100 / Object.keys(buttons).length) + "%")
        container.find("[data-button='" + index + "']").click(function() {
          PathOfExile.chat(text);
        });
      }
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

      // Show league if whisper message has it and it's different from the currently selected league
      if(this.whisper.hasLeague() && this.whisper.getTradeInfo().league != config.get("league")) {
        this.getJQueryObject().find(".explanation-table").find("[table-league]").show();
        showData = true;
      }
    }

    // Bulk ratio
    if(this.whisper.getTradeType() === "bulk") {
      this.getJQueryObject().find(".explanation-table").find("[table-ratio]").show();
      showData = true;
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
