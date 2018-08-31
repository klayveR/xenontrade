const fs = require("promise-fs");

class Templates {
  /**
  * Creates a new Templates object
  *
  * @constructor
  * @param {string} path Path to the folder that contains the templates
  */
  constructor(path) {
    this.path = path || "./resource/templates";
    this.templates = {};
  }

  /**
  * Returns a template by file name
  *
  * @param {string} template File name of the template
  * @return {string}
  */
  get(template) {
    if(this.templates.hasOwnProperty(template)) {
      return this.templates[template];
    }

    return "";
  }

  /**
  * Loads templates in path
  *
  * // TODO: Add return promise
  */
  loadTemplates() {
    var self = this;

    return new Promise(function(resolve, reject) {
      fs.readdir(self.path, (error, files) => {
        if(error) { return reject(error); }

        self._processTemplateFiles(files)
        .then((templates) => {
          resolve(templates);
        })
        .catch((error) => {
          reject(error);
        });
      });
    });
  }

  /**
  * Loads template file contents and adds them to the templates variable
  *
  * @param {Array} files Array containing template file names
  * @returns {Promise}
  * @fulfil {Array} - An object containing the templates
  * @reject {Error} - The `error.message` contains information about why the promise was rejected
  */
  _processTemplateFiles(files) {
    var self = this;
    var filesProcessed = 0;

    return new Promise(function(resolve, reject) {
      if(files.length > 0) {
        files.forEach((file) => {
          fs.readFile(self.path + "/" + file, "utf8")
          .then((result) => {
            self.templates[file] = result;
          })
          .catch((error) => {
            return reject(error);
          })
          .then(() => {
            filesProcessed++;

            if(filesProcessed === files.length) {
              return resolve(self.templates);
            }
          });
        });
      } else {
        return resolve(self.templates);
      }
    });
  }
}

module.exports = Templates;
