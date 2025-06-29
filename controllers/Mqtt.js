const mqtt = require("mqtt");

class Mqtt {
  url = 'mqtt://192.168.4.6'; /*'mqtt://test.mosquitto.org'*/
  /** @param {import('../app')} app */
  constructor(app) {
    this.client = mqtt.connect(this.url);
    this.app = app;

    /** @type {Object.<string,(message:string)=>void>} */
    this.eventos = {
      /* 
        ================== motores ==================
      */
      "cortadora/motor/resReady": message => {
        let [MCS, MRS] = message.split(',')
        this.app.db.DATA.PROCESS.READY.MCS = Number(MCS);
        this.app.db.DATA.PROCESS.READY.MRS = Number(MRS);
        this.app.db.write();

        this.app.Socket.process_svr_ready();
        this.app.logger.log(`[res] termocupla lista`, 'danger');
      },
      "cortadora/motor/cutsFacts": message => {
        let CUTFACTS = Number(message);
        this.app.db.DATA.PROCESS.FACTS.CUTS = CUTFACTS
        this.app.db.DATA.PROCESS.FACTS.LENGTHTOTAL
          = CUTFACTS * this.app.db.DATA.PROCESS.INPUT.LENGTH;

        this.app.db.write();

        this.app.Socket.process_svr_update();
        this.app.logger.log(`[set] `, '');
      },

      /* 
        ================== termocupla ==================
      */
      "cortadora/termocupla/resReady": message => {
        this.app.db.DATA.PROCESS.READY.TCS = Number(message);
        this.app.db.write();

        this.app.Socket.process_svr_ready();
        this.app.logger.log(`[res] termocupla lista`, 'danger');
      },
      "cortadora/termocupla/fever": message => {
        let FEVER = Number(message)
        this.app.db.DATA.PROCESS.FACTS.FEVER = FEVER;
        this.app.db.DATA.PROCESS.FACTS.ADJUSTMENT
          = this.app.db.DATA.PROCESS.FACTS.TEMPERATURE - FEVER;
        this.app.db.write();

        this.app.Socket.process_svr_update();

        let tolerancia = FEVER / this.app.db.DATA.PROCESS.FACTS.TEMPERATURE;
        if (0.98 < tolerancia)
          return this.app.logger.log(`[init] temperatura actual: ${FEVER}`, 'success');

        if (0.50 < tolerancia)
          return this.app.logger.log(`[init] temperatura actual: ${FEVER}`, 'warning');

        this.app.logger.log(`[init] temperatura actual: ${FEVER}`, 'danger');
      },
      "cortadora/termocupla/start": message => {
        this.app.logger.log(`[init] temperatura lista: ${message}`, 'success');
      },
    }

    this.client.on('connect', () => {
      for (let even in this.eventos)
        this.client.subscribe(even, e => {
          if (e) throw e;
        })

      this.eventos["__default__"] = () => { }
      
      this.client.on("message", (topic, message) => {
        (this.eventos[topic] || this.eventos.__default__)(message.toString());
      })
    })
    
  }
  end() {
    this.client.end()
  }
  cortadora_state() {
    let state = {'-2':'detenido','-1': 'pausa', '0': 'no iniciado', '1': 'iniciado'}
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