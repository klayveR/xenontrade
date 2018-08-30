const fs = require("promise-fs");

class Templates {
  /**
  * Creates a new Templates object
  *
  * @constructor
  */
  constructor(path) {
    this.path = path || "./resource/templates";
    this.templates = {};
  }

  get(template) {
    if(this.templates.hasOwnProperty(template)) {
      return this.templates[template];
    }

    return '';
  }

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
            return resolve(error);
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
