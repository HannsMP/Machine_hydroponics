const { readFileSync, writeFileSync, existsSync } = require("fs");

/** @typedef {import('../types/types').DataConfig} DataConfig */
/** @typedef {import('../types/types').DataStream} DataStream */

class Jsoning {
  #path;

  /** @type {{CONFIG: DataConfig, STREAM: DataStream}} */
  DATA = {
    CONFIG: {
      "HREG_MODE": 0,

      "COIL_LUX": 0,
      "COIL_AIR_PUMP": 0,

      "HREG_LUX_PWM": 0,
      "HREG_LUX_SP": 100,
      "HREG_ON_MS_AIR": 180,
      "HREG_OFF_MS_AIR": 3420,

      "COIL_PUMP_0": 0,
      "COIL_PUMP_1": 0,
      "COIL_PUMP_2": 0,

      "HREG_DOPING_SP_0": 500,
      "HREG_DOPING_SP_1": 500,
      "HREG_DOPING_SP_2": 500,

      "HREG_PUMP_0": 0,
      "HREG_PUMP_1": 0,
      "HREG_PUMP_2": 0,

      "HREG_ON_MS_PUMP_0": 10,
      "HREG_ON_MS_PUMP_1": 10,
      "HREG_ON_MS_PUMP_2": 10,

      "HREG_OFF_MS_PUMP_0": 300,
      "HREG_OFF_MS_PUMP_1": 300,
      "HREG_OFF_MS_PUMP_2": 300,
    },
    STREAM: {}
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
