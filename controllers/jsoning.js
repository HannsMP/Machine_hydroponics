const { readFileSync, writeFileSync, existsSync } = require("fs");

class Jsoning {
  #path;
  DATA = {
    "PROCESS": {
      "STATE": 0,
      "INPUT": {
        "CUTS": 0,
        "LENGTH": 0,
        "LENGTHTOTAL": 0,
        "TEMPERATURE": 0
      },
      "FACTS": {
        "CUTS": 0,
        "LENGTH": 0,
        "LENGTHTOTAL": 0,
        "TEMPERATURE": 0,
        "ADJUSTMENT": 0,
        "FEVER": 0
      },
      "READY":{
        "MRS": 0, 
        "MCS": 0, 
        "TCS": 0
      }
    }
  };

  constructor(path) {
    this.#path = path;

    try {
      if (!existsSync(path)) {
        this.write();
      } else {
        this.DATA = this.read();
      }
    } catch {
      this.write();
    }
  }

  read(){
    return JSON.parse(readFileSync(this.#path, "utf-8"));
  }

  write() {
    writeFileSync(this.#path, JSON.stringify(this.DATA, null, 2), "utf-8");
  }
}

module.exports = Jsoning;
