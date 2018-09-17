const request = require("request-promise-native");
const _ = require("underscore");

class PoePrices {
  /**
  * Requests item price prediction from poeprices.info
  *
  * @param {string} itemText Item text copied from Path of Exile
  * @returns {Promise}
  * @fulfil {Object} - Object containing the requested item encoded in base64 and the result
  * @reject {Error} - The `error.message` contains information about why the promise was rejected
  */
  static request(itemText) {
    return new Promise(function(resolve, reject) {
      itemText = itemText.replace(/<<.*?>>|<.*?>/g, "");
      var itemBase64 = Buffer.from(itemText).toString('base64');
      var url = "https://www.poeprices.info/api?s=xenontrade&l=" + config.get("league") + "&i=" + itemBase64;

      request(url, {json: true})
      .then((response) => {
        if(!PoePrices.hasAllKeys(response)) {
          reject(new Error("Request to <b>poeprices.info</b> was unsuccessful. Received an empty response."));
        } else if(response.error !== 0) {
          reject(new Error("Request to <b>poeprices.info</b> returned error code " + response.error + "."));
        } else {
          resolve({itemBase64, price: response});
        }
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  /**
  * Returns `true` if the response from poeprices.info has all required key properties
  *
  * @param {Object} response Response from poeprices
  * @returns {boolean}
  */
  static hasAllKeys(response) {
    var requiredKeys = ["currency", "min", "max", "pred_explanation", "error"];

    return _.every(requiredKeys, _.partial(_.has, response));
  }
}

module.exports = PoePrices;
