const request = require("request-promise-native");
const _ = require("underscore");

class PoePrices {
  static request(itemText) {
    return new Promise(function(resolve, reject) {
      var itemBase64 = Buffer.from(itemText).toString('base64');
      var url = "https://www.poeprices.info/api?s=xenontrade&l=" + config.get("league") + "&i=" + itemBase64;

      request(url, {json: true})
      .then((result) => {
        if(!PoePrices.hasAllKeys(result)) {
          reject(new Error("Request to <b>poeprices.info</b> was unsuccessful. Received an empty response."));
        } else if(result.error !== 0) {
          reject(new Error("Request to <b>poeprices.info</b> returned error code " + result.error + "."));
        } else {
          resolve({itemBase64, price: result});
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  static hasAllKeys(result) {
    var requiredKeys = ["currency", "min", "max", "pred_explanation", "error"];

    return _.every(requiredKeys, _.partial(_.has, result));
  }
}

module.exports = PoePrices;
