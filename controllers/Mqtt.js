const mqtt = require("mqtt");

/** @typedef {import('../types/types').DataResMQTT} DataResMQTT */
/** @typedef {import('../types/types').DataReqMQTT} DataReqMQTT */

class Mqtt {
  url = 'mqtt://192.168.200.100'; /*'mqtt://test.mosquitto.org'*/

  /**
   * @template {keyof DataReqMQTT} T
   * @param {T} topic 
   * @param {DataReqMQTT[T]} [data] 
   */
  publish(topic, data = "") {
    this.client.publish(topic, String(data));
  }

  /** @param {import('../app')} app */
  constructor(app) {
    /** @type {MqttClientData} */
    this.client = mqtt.connect(this.url);
    this.app = app;

    /** @type {{[k in keyof DataResMQTT]: (data: DataResMQTT[k])=>void}} */
    this.eventos = {
      /* 
        ================== RES ==================
      */
      "control/RES_ALL_DATA": message => {
        this.app.db.DATA = { ...this.app.db.DATA, ...message };
        this.app.db.write();
        this.app.Socket.process_svr_update();
      }
    }

    this.client.on('connect', () => {
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
  REQ_COIL_LIGHT(data) {
    this.publish("control/COIL_LIGHT",Math.floor(data));
  }
  REQ_COIL_BOMBA_0(data) {
    this.publish("control/COIL_BOMBA_0",Math.floor(data));
  }
  // REQ_COIL_BOMBA_1(data) {
  //   this.publish("control/COIL_BOMBA_1",Math.floor(data));
  // }
  REQ_COIL_BOMBA_2(data) {
    this.publish("control/COIL_BOMBA_2",Math.floor(data));
  }
  REQ_COIL_BOMBA_3(data) {
    this.publish("control/COIL_BOMBA_3",Math.floor(data));
  }
  // REQ_HREG_BOMBA_0(data) {
  //   this.publish("control/HREG_BOMBA_0",Math.floor(data));
  // }
  // REQ_HREG_BOMBA_1(data) {
  //   this.publish("control/HREG_BOMBA_1",Math.floor(data));
  // }
  // REQ_HREG_BOMBA_2(data) {
  //   this.publish("control/HREG_BOMBA_2",Math.floor(data));
  // }
  // REQ_HREG_BOMBA_3(data) {
  //   this.publish("control/HREG_BOMBA_3",Math.floor(data));
  // }
  REQ_COIL_AIR_PUMP(data) {
    this.publish("control/COIL_AIR_PUMP",Math.floor(data));
  }
  // REQ_HREG_LIGHT_PWM(data) {
  //   this.publish("control/HREG_LIGHT_PWM",Math.floor(data));
  // }
  REQ_HREG_MODE(data) {
    this.publish("control/HREG_MODE",Math.floor(data));
  }
  REQ_HREG_LUX_SP(data) {
    this.publish("control/HREG_LUX_SP",Math.floor(data));
  }
  REQ_HREG_AIR_ON_TIME(data) {
    this.publish("control/HREG_AIR_ON_TIME",Math.floor(data));
  }
  REQ_HREG_AIR_OFF_TIME(data) {
    this.publish("control/HREG_AIR_OFF_TIME",Math.floor(data));
  }
  REQ_HREG_B1_SP(data) {
    this.publish("control/HREG_B1_SP",Math.floor(data));
  }
  REQ_HREG_B1_ON_TIME(data) {
    this.publish("control/HREG_B1_ON_TIME",Math.floor(data));
  }
  REQ_HREG_B1_OFF_TIME(data) {
    this.publish("control/HREG_B1_OFF_TIME",Math.floor(data));
  }
  REQ_HREG_B2_SP(data) {
    this.publish("control/HREG_B2_SP",Math.floor(data));
  }
  REQ_HREG_B2_ON_TIME(data) {
    this.publish("control/HREG_B2_ON_TIME",Math.floor(data));
  }
  REQ_HREG_B2_OFF_TIME(data) {
    this.publish("control/HREG_B2_OFF_TIME",Math.floor(data));
  }
  REQ_HREG_B3_SP(data) {
    this.publish("control/HREG_B3_SP",Math.floor(data));
  }
  REQ_HREG_B3_ON_TIME(data) {
    this.publish("control/HREG_B3_ON_TIME",Math.floor(data));
  }
  REQ_HREG_B3_OFF_TIME(data) {
    this.publish("control/HREG_B3_OFF_TIME",Math.floor(data));
  }
  REQ_ALL_DATA() {
    this.publish("control/REQ_ALL_DATA");
  }
}

module.exports = Mqtt