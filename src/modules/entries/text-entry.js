const Entry = require("../entry.js");
const _ = require("underscore");

class TextEntry extends Entry {
  /**
  * Creates a new TextEntry object
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
      super.enableClose();
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
      { find: "icon", replace: this.options.icon },
      { find: "text", replace: text }
    ];
  }

  _collapseIfEmptyText() {
    if(typeof this.text === "undefined" || this.text === "") {
      $(".entry[data-id='" + this.id + "']").find(".text").toggleClass("text empty");
    }
  }
}

module.exports = TextEntry;
