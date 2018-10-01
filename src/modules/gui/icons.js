const BaseIcons = require("../../resource/icons/baseIcons");
const UniqueIcons = require("../../resource/icons/uniqueIcons");

class Icons {
  static getIconByName(name) {
    if(BaseIcons.hasOwnProperty(name)) {
      return BaseIcons[name];
    }

    if(UniqueIcons.hasOwnProperty(name))  {
      return UniqueIcons[name];
    }

    return null;
  }

  static findIconByName(name) {
    var uniqueIcon = Icons.findUniqueIconByName(name);
    if(uniqueIcon != null) {
      return uniqueIcon;
    }

    var baseIcon = Icons.findBaseIconByName(name);
    if(baseIcon != null) {
      return baseIcon;
    }

    return null;
  }

  static findBaseIconByName(name) {
    var icon = Icons._find(name, BaseIcons);

    if(icon != null) {
      return icon;
    }

    return null;
  }

  static findUniqueIconByName(name) {
    var icon = Icons._find(name, UniqueIcons);

    if(icon != null) {
      return icon;
    }

    return null;
  }

  static _find(name, icons) {
    for(var item in icons) {
      var icon = icons[item];

      if(name.includes(item)) {
        return icon;
      }
    }

    return null;
  }
}

module.exports = Icons;
