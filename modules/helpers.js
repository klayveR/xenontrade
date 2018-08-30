class Helpers {
  static isFloat(n){
      return Number(n) === n && n % 1 !== 0;
  }

  static isEmpty(obj) {
      for(var key in obj) {
          if(obj.hasOwnProperty(key)) {
            return false;
          }
      }

      return true;
  }
}

module.exports = Helpers;
