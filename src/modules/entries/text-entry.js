const Entry = require("../entry.js");
const _ = require("underscore");

class TextEntry extends Entry {
  /**
  * Creates a new TextEntry object
  * // TODO: JSDocs
  *
  * @constructor
  */
  constructor(title, text, options) {
    super();

    this.title = title;
    this.text = text;

    if(arguments.length === 2) {
      options = text;
      this.text = "";
    }

    var defaultOptions = {
      icon: "fa-info-circle grey",
      titleInfo: "",
      closeable: true,
      timeout: 0
    };

    this.options = _.extend(defaultOptions, options);
  }

  add() {
    var template = this._getTemplate();
    var replacements = this._buildReplacements();

    // Set template, replacements and add
    super.setTemplate(template);
    super.setReplacements(replacements);
    super.add();

    if(this.options.closeable) {
      super.setCloseable(true);
    }

    if(this.options.timeout !== 0) {
      super.enableAutoClose(this.options.timeout);
    }

    this._collapseIfEmptyText();
  }

  _getTemplate() {
    return templates.get("text.html");
  }

  _buildReplacements() {
    var text = "";
    if(typeof this.text !== "undefined" && this.text !== "") {
      text = this.text;
    }
    return [
      { find: "title", replace: this.title },
      { find: "title-info", replace: this.options.titleInfo },
      { find: "icon", replace: this.options.icon },
      { find: "text", replace: text }
    ];
  }

  _collapseIfEmptyText() {
    var selector = this.getJQueryObject().find(".text");

    if(typeof this.text === "undefined" || this.text === "") {
      selector.addClass("empty");
    } else {
      selector.removeClass("empty");
    }
  }

  setText(text) {
    this.text = text;
    this.getJQueryObject().find(".text").html(text);

    this._collapseIfEmptyText();
    GUI.updateWindowHeight();
  }

  setTitle(title) {
    this.title = title;
    this.getJQueryObject().find(".title-label").html(title);
  }

  setTitleInfo(titleInfo) {
    this.options.titleInfo = titleInfo;
    this.getJQueryObject().find(".title-info").html(titleInfo);
  }

  setIcon(icon) {
    var selector = this.getJQueryObject().find(".icon").find("i");
    selector.removeClass();
    selector.addClass("fas " + icon);
  }

  addLogfileButton() {
    if(this.added) {
      this.getJQueryObject().find(".text").append("<br /><i class='fas fa-arrow-right'></i> <span data-entry-link='openlog'>Check log file</span>");
      var link = this.getJQueryObject().find("[data-entry-link='openlog']");

      link.click(function() {
        Helpers.openFile("log.log");
      });
    }
  }
}

module.exports = TextEntry;
