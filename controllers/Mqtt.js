const mqtt = require("mqtt");

/** @typedef {import('../types/types').DataResMQTT} DataResMQTT */

class Mqtt {
  url = 'mqtt://192.168.4.100'; /*'mqtt://test.mosquitto.org'*/
  /** @param {import('../app')} app */
  constructor(app) {
    this.client = mqtt.connect(this.url);
    this.app = app;

    /** @type {{[k in keyof DataResMQTT]: (data: DataResMQTT[k])=>void}} */
    this.eventos = {
      /* 
        ================== RES ==================
      */
      "control/RES_ALL_DATA": message => {
        console.log(message);
        
        // let [MCS, MRS] = message.split(',')
        // this.app.db.DATA.PROCESS.READY.MCS = Number(MCS);
        // this.app.db.DATA.PROCESS.READY.MRS = Number(MRS);
        // this.app.db.write();

        // this.app.Socket.process_svr_ready();
        // this.app.logger.log(`[res] termocupla lista`, 'danger');
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
  end() {
    this.client.end()
  }
  cortadora_state() {
    let state = { '-2': 'detenido', '-1': 'pausa', '0': 'no iniciado', '1': 'iniciado' }
    let data = String(this.app.db.DATA.PROCESS.STATE);
    this.client.publish('cortadora/state', data);
    this.app.logger.log(`[set] estado actualizado como: ${state[data]}`, 'success');
  }
  /* 
    ================== motores ==================
  */
  cortadora_motor_reqReady() {
    this.client.publish('cortadora/motor/reqReady', "1");
    this.app.logger.log(`[req] esperando motores`, 'success');
  }
  cortadora_motor_length() {
    let data = String(this.app.db.DATA.PROCESS.INPUT.LENGTH);
    this.client.publish('cortadora/motor/length', data);
    this.app.logger.log(`[set] Largo del corte: ${data} mm`, 'success');
  }
  cortadora_motor_cuts() {
    let data = String(this.app.db.DATA.PROCESS.INPUT.CUTS);
    this.client.publish('cortadora/motor/cuts', data);
    this.app.logger.log(`[set] Cantidad de cortes: ${data} unit`, 'success');
  }
  cortadora_motor_start() {
    this.client.publish('cortadora/motor/start', '1');
    this.app.logger.log(`[set] iniciando motores`, 'success');
  }
  /* 
    ================== termocupla ==================
  */
  cortadora_termocupla_reqReady() {
    this.client.publish('cortadora/termocupla/reqReady', "1");
    this.app.logger.log(`[req] consultando termocupla`, 'success');
  }
  cortadora_termocupla_temperatura() {
    let data = String(this.app.db.DATA.PROCESS.FACTS.TEMPERATURE);
    this.client.publish('cortadora/termocupla/temperatura', data);
    this.app.logger.log(`[set] Temperatura: ${data} C°`, 'success');
  }
}

module.exports = Mqtt