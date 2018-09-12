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
  }

  _getTemplate() {
    if(typeof this.text !== "undefined" && this.text !== "") {
      return templates.get("text.html");
    }

    return templates.get("title.html");
  }

  _buildReplacements() {
    var replacements = [
      { find: "title", replace: this.title },
      { find: "icon", replace: this.options.icon }
    ];

    if(typeof this.text !== "undefined" && this.text !== "") {
      replacements.push({ find: "text", replace: this.text })
    }

    return replacements;
  }
}

module.exports = TextEntry;
