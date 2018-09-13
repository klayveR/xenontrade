const Base64 = require('js-base64').Base64;
const request = require("request-promise-native");

class PoePrices {
  static request(itemText) {
    return new Promise(function(resolve, reject) {
      var itemBase64 = Base64.encode(itemText);
      var url = "https://www.poeprices.info/api?l=" + config.get("league") + "&i=" + itemBase64;

      request(url, {json: true})
      .then((price) => {
        resolve({itemBase64, price});
      })
      .catch((error) => {
        reject(error);
      });
    });
  }
}

module.exports = PoePrices;
