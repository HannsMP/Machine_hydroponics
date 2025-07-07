const mqtt = require("mqtt");

/** @typedef {import('../types/types').Int} Int */
/** @typedef {import('../types/types').Int_1} Int_1 */
/** @typedef {import('../types/types').Int_8} Int_8 */
/** @typedef {import('../types/types').Int_12} Int_12 */
/** @typedef {import('../types/types').Int_16} Int_16 */
/** @typedef {import('../types/types').Percentage} Percentage */

/** @typedef {import('../types/types').DataGetMQTT} DataGetMQTT */
/** @typedef {import('../types/types').DataSetMQTT} DataSetMQTT */

class Mqtt {
  url = 'mqtt://192.168.200.100'; /*'mqtt://test.mosquitto.org'*/

  /**
   * @template {keyof DataSetMQTT} T
   * @param {T} topic 
   * @param {DataSetMQTT[T]} [value] 
   */
  #publish(topic, value = 0) {
    if (typeof value == 'number' && value != NaN)
      this.client.publish(topic, String(value));
  }

  /**
   * @param {number} val 
   * @param {number} min 
   * @param {number} max 
   */
  #intRange(val, min, max) {
    let value = Math.floor(+val);
    return Math.min(Math.max(value, min), max);
  }

  /** @param {import('../app')} app */
  constructor(app) {
    /** @type {MqttClientData} */
    this.client = mqtt.connect(this.url);
    this.app = app;

    /** @type {{[k in keyof DataGetMQTT]: (value: DataGetMQTT[k])=>void}} */
    this.eventos = {
      /* 
        ================== RES ==================
      */
      "control/REFRESH_DATA_CONFIG": data => {
        this.app.db.DATA.CONFIG = data;
        this.app.db.write();
        this.app.Socket.process_svr_config();
      },
      "control/REFRESH_DATA_STREAM": data => {
        this.app.db.DATA.STREAM = data;
        this.app.db.write();
        this.app.Socket.process_svr_stream();
      }
    }

    this.client.on('connect', () => {
      console.log(`[MQTT] conectado ${this.url}`);

      for (let even in this.eventos)
        this.client.subscribe(even, e => {
          if (e) throw e;
        })

      this.eventos["__default__"] = () => { }

      this.client.on("message", (topic, message) => {
        (this.eventos[topic] || this.eventos.__default__)(JSON.parse(message.toString()));
      })
    })

  }
  /* 
    ==========================================
    ================= getter =================
    ==========================================
  */
  REQ_DATA_STREAM() {
    this.#publish("control/REQ_DATA_STREAM");
  }

  /* 
    ==========================================
    ================= Setter =================
    ==========================================
  */
  /** @param {Int_1} value  */
  REQ_HREG_MODE(value) {
    this.#publish("control/HREG_MODE", value ? 1 : 0);
  }

  /** @param {Int_1} value  */
  COIL_LUX(value) {
    this.#publish("control/COIL_LUX", value ? 1 : 0);
  }
  /** @param {Int_1} value  */
  REQ_COIL_AIR_PUMP(value) {
    this.#publish("control/COIL_AIR_PUMP", value ? 1 : 0);
  }

  /** @param {Int_8} value  */
  HREG_LUX_PWM(value) {
    this.#publish("control/HREG_LUX_PWM", this.#intRange(value, 0, 255));
  }
  /** @param {Int_16} value  */
  HREG_LUX_SP(value) {
    this.#publish("control/HREG_LUX_SP", this.#intRange(value, 0, 65535));
  }
  /** @param {Int} value  */
  HREG_ON_MS_AIR(value) {
    this.#publish("control/HREG_ON_MS_AIR", Math.floor(value));
  }
  /** @param {Int} value  */
  HREG_OFF_MS_AIR(value) {
    this.#publish("control/HREG_OFF_MS_AIR", Math.floor(value));
  }

  /** @param {Int_1} value  */
  COIL_PUMP_0(value) {
    this.#publish("control/COIL_PUMP_0", value ? 1 : 0);
  }
  /** @param {Int_1} value  */
  COIL_PUMP_1(value) {
    this.#publish("control/COIL_PUMP_1", value ? 1 : 0);
  }
  /** @param {Int_1} value  */
  COIL_PUMP_2(value) {
    this.#publish("control/COIL_PUMP_2", value ? 1 : 0);
  }

  /** @param {Int_12} value  */
  HREG_DOPING_SP_0(value) {
    this.#publish("control/HREG_DOPING_SP_0", this.#intRange(value, 0, 4095));
  }
  /** @param {Int_12} value  */
  HREG_DOPING_SP_1(value) {
    this.#publish("control/HREG_DOPING_SP_1", this.#intRange(value, 0, 4095));
  }
  /** @param {Int_12} value  */
  HREG_DOPING_SP_2(value) {
    this.#publish("control/HREG_DOPING_SP_2", this.#intRange(value, 0, 4095));
  }

  /** @param {Int_8} value  */
  HREG_PUMP_0(value) {
    this.#publish("control/HREG_PUMP_0", this.#intRange(value, 0, 255));
  }
  /** @param {Int_8} value  */
  HREG_PUMP_1(value) {
    this.#publish("control/HREG_PUMP_1", this.#intRange(value, 0, 255));
  }
  /** @param {Int_8} value  */
  HREG_PUMP_2(value) {
    this.#publish("control/HREG_PUMP_2", this.#intRange(value, 0, 255));
  }

  /** @param {Int} value  */
  HREG_ON_MS_PUMP_0(value) {
    this.#publish("control/HREG_ON_MS_PUMP_0", Math.floor(value));
  }
  /** @param {Int} value  */
  HREG_ON_MS_PUMP_1(value) {
    this.#publish("control/HREG_ON_MS_PUMP_1", Math.floor(value));
  }
  /** @param {Int} value  */
  HREG_ON_MS_PUMP_2(value) {
    this.#publish("control/HREG_ON_MS_PUMP_2", Math.floor(value));
  }

  /** @param {Int} value  */
  HREG_OFF_MS_PUMP_0(value) {
    this.#publish("control/HREG_OFF_MS_PUMP_0", Math.floor(value));
  }
  /** @param {Int} value  */
  HREG_OFF_MS_PUMP_1(value) {
    this.#publish("control/HREG_OFF_MS_PUMP_1", Math.floor(value));
  }
  /** @param {Int} value  */
  HREG_OFF_MS_PUMP_2(value) {
    this.#publish("control/HREG_OFF_MS_PUMP_2", Math.floor(value));
  }
}

module.exports = Mqtt