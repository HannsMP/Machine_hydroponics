const { readFileSync, writeFileSync, existsSync } = require("fs");

/** @typedef {import('../types/types').DataController} DataController */

class Jsoning {
  #path;

  /** @type {DataController} */
  DATA = {
    IREG_TDS_RAW: 0,
    IREG_PH_RAW: 0,
    IREG_TEMP_RAW: 0,
    IREG_LIGHT_LUX: 0,
    IREG_LSL: 0,
    IREG_LSH: 0,
    COIL_AIR_PUMP: 0,
    HREG_LIGHT_PWM: 0,
    HREG_MODE: 0,
    HREG_LUX_SP: 0,
    HREG_AIR_ON_TIME: 0,
    HREG_AIR_OFF_TIME: 0,
    COIL_BOMBA_0: 0,
    COIL_BOMBA_1: 0,
    COIL_BOMBA_2: 0,
    COIL_BOMBA_3: 0,
    HREG_BOMBA_0: 0,
    HREG_BOMBA_1: 0,
    HREG_BOMBA_2: 0,
    HREG_BOMBA_3: 0,
    HREG_B1_SP: 0,
    HREG_B1_ON_TIME: 0,
    HREG_B1_OFF_TIME: 0,
    HREG_B2_SP: 0,
    HREG_B2_ON_TIME: 0,
    HREG_B2_OFF_TIME: 0,
    HREG_B3_SP: 0,
    HREG_B3_ON_TIME: 0,
    HREG_B3_OFF_TIME: 0
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

  read() {
    return JSON.parse(readFileSync(this.#path, "utf-8"));
  }

  write() {
    writeFileSync(this.#path, JSON.stringify(this.DATA, null, 2), "utf-8");
  }
}

module.exports = Jsoning;
