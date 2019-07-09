const PriceCheckEntry = require("./pricecheck-entry.js");
const CurrencyIcons = require("../../resource/icons/currencyIcons");
const BaseTypeIcons = require("../../resource/icons/baseTypeIcons");
const querystring = require("querystring");
const https = require("https");

class RareItemEntry extends PriceCheckEntry {
  /**
  * Creates a new RareItemEntry object
  *
  * @constructor
  * @param {Object} poePrices poeprices.info result, including item text in base 64
  * @param {Parser} parser Parser object
  */
  constructor(poePrices, parser) {
    super();
    this.poePrices = poePrices;
    this.parser = parser;
    this.selectedFeedback = "";
  }

  add() {
    var template = templates.get("rare.html");
    var replacements = this._buildReplacements();

    // Set template, replacements and add
    super.setTemplate(template);
    super.setReplacements(replacements);
    super.add();

    // Set buttons, links, prediction explanation and feedback elements
    super.addMaxRolls(this.parser.item);
    super.setCloseable(true);
    super.enableToggle("expand");
    super.enableExternalLinks();
    this._addExplanationTable();
    this._enableFeedbackElements();

    // Enable autoclose if configured
    if(config.get("autoclose.enabled") && config.get("autoclose.timeouts.rare.enabled")) {
      if(!(config.get("autoclose.threshold.enabled")
        && (this.poePrices.price.min > config.get("autoclose.threshold.value") || this.poePrices.price.currency === "exalt"))) {
        super.enableAutoClose(config.get("autoclose.timeouts.rare.value"));
      }
    }
  }

  _buildReplacements() {
    var baseType = this.parser.getBaseType();
    var url = "https://www.poeprices.info/api?l=" + config.get("league") + "&i=" + this.poePrices.encodedItemText + "&w=1";
    var currencyIcon = "", currencyName = "";

    if(this.poePrices.price.currency === "chaos") {
      currencyName = "Chaos Orb";
    } else {
      currencyName = "Exalted Orb";
    }

    currencyIcon = CurrencyIcons[currencyName];

    var replacements = [
      { find: "item-name", replace: this.parser.getName() },
      { find: "item-baseType", replace: baseType },
      { find: "item-value-min", replace: this.poePrices.price.min },
      { find: "item-value-max", replace: this.poePrices.price.max },
      { find: "currency-name", replace: currencyName },
      { find: "currency-icon", replace: currencyIcon },
      { find: "link", replace: url}
    ];

    if(BaseTypeIcons.hasOwnProperty(baseType)) {
      replacements.push({ find: "item-icon", replace: BaseTypeIcons[baseType] });
    }

    return replacements;
  }

  _addExplanationTable() {
    for(var modIndex in this.poePrices.price.pred_explanation) {
      var mod = this.poePrices.price.pred_explanation[modIndex];
      var percentage = (mod[1] * 100).toFixed(2);

      $(".entry[data-id='" + this.id + "']").find("tbody:last-child").append(
        "<tr><td class='percentage grey'>" + percentage + "%</td><td class='mod'>" + mod[0] + "</td></tr>"
      );
    }
  }

  _enableFeedbackElements() {
    var self = this;
    var textarea = $(".entry[data-id='" + this.id + "']").find("[data-comment]").find("textarea");

    textarea.focusout(function() {
      GUI.onFocus();
    });

    // Send feedback button
    $(".entry[data-id='" + this.id + "']").find("[data-feedback-send]").click(function() {
      self._sendFeedback();
    });

    // Feedback buttons (fair, high, low)
    $(".entry[data-id='" + this.id + "']").find("[data-feedback]").each(function() {
      $(this).click(function() {
        self._feedbackButtonClick($(this));
      });
    });
  }

  _removeFeedbackButtons() {
    $(".entry[data-id='" + this.id + "']").find("[data-feedback]").each(function() {
      $(this).remove();
    });
  }

  _feedbackButtonClick(selector) {
    var feedback = selector.attr("data-feedback")

    // Cancel auto-close if feedback button is pressed
    if(this.timeout != null) {
      this.cancelAutoClose();
    }

    if(feedback !== this.selectedFeedback) {
      $(".entry[data-id='" + this.id + "']").find("[data-feedback]").each(function() {
        $(this).removeClass("active");
      });

      selector.addClass("active");
      this._toggleCommentBox(true);
      this.selectedFeedback = feedback;
    } else {
      selector.removeClass("active");
      this._toggleCommentBox(false);
      this.selectedFeedback = "";
    }
  }

  _toggleCommentBox(toggle) {
    var selector = $(".entry[data-id='" + this.id + "']").find("[data-comment]");
    selector.toggle(toggle);

    GUI.updateWindowHeight();
  }

  _sendFeedback() {
    if(["fair", "low", "high"].includes(this.selectedFeedback)) {
      var text = $(".entry[data-id='" + this.id + "']").find("[data-comment]").find("textarea").val();
      this._toggleCommentBox(false);
      this._removeFeedbackButtons();

      var postData = querystring.stringify({
        selector: this.selectedFeedback,
        feedbacktxt: text,
        qitem_txt: this.poePrices.encodedItemText,
        source: "xenontrade",
        min: this.poePrices.price.min,
        max: this.poePrices.price.max,
        currency: this.poePrices.price.currency,
        debug: 0
      });

      var options = {
        hostname: "poeprices.info",
        port: 443,
        path: "/send_feedback",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": postData.length
        }
      };

      var infoText = $(".entry[data-id='" + this.id + "']").find("[data-feedback-info]");
      infoText.html("Sending feedback...");

      var req = https.request(options, (res) => {
        res.on("data", (d) => {
          infoText.html("Thank you for your feedback!");
        });
      });

      req.on("error", (e) => {
        infoText.html("An error occured while sending your feedback.");
      });

      req.write(postData);
      req.end();
    }
  }
}

module.exports = RareItemEntry;
