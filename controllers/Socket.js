const { Server } = require('socket.io');

class Socket {
  /** @param {import('../app')} app */
  constructor(app) {
    this.app = app;
    this.DATA = app.db.DATA

    this.io = new Server(this.app.server);

    this.io.on('connection', (socket) => {
      console.log('usuario conectado');

      this.DATA.PROCESS.READY.MCS = 0;
      this.DATA.PROCESS.READY.MRS = 0;
      this.DATA.PROCESS.READY.TCS = 0;
      this.app.db.write();

      this.process_svr_init();

      socket.on('process_clt_play', d => this.process_clt_play(d));
      socket.on('process_clt_pause', d => this.process_clt_pause(d));
      socket.on('process_clt_stop', d => this.process_clt_stop(d));
      socket.on('process_clt_reset', d => this.process_clt_reset(d));
      socket.on('process_clt_motor_cortadora', _ => this.process_clt_motor_cortadora());
      socket.on('process_clt_motor_rodillo', _ => this.process_clt_motor_rodillo());
      socket.on('process_clt_termo_cupla', _ => this.process_clt_termo_cupla());
    });
  }
  /* 
    ==========================================
    ================= server =================
    ==========================================
  */
  process_clt_play({ temperatura, longitud, cortes }) {
    this.DATA.PROCESS.STATE = 1;

    this.DATA.PROCESS.INPUT.CUTS = parseInt(cortes);
    this.DATA.PROCESS.INPUT.LENGTH = parseInt(longitud) * 100;
    this.DATA.PROCESS.INPUT.TEMPERATURE = Number(temperatura);
    this.DATA.PROCESS.FACTS.TEMPERATURE = 250 + (parseInt(temperatura) * 25);

    this.app.db.write();
    this.process_svr_init();
    this.process_svr_update();
    this.process_svr_play();

    // mqtt
    this.app.mqtt.cortadora_state();
    this.app.mqtt.cortadora_motor_cuts();
    this.app.mqtt.cortadora_motor_length();
    this.app.mqtt.cortadora_termocupla_temperatura();
  }
  process_clt_pause() {
    this.DATA.PROCESS.STATE = -1;

    this.app.db.write();
    this.process_svr_pause();
    this.app.mqtt.cortadora_state();
  }
  process_clt_stop() {
    this.DATA.PROCESS.STATE = -2;

    this.app.db.write();
    this.process_svr_stop()
    this.app.mqtt.cortadora_state();
  }
  process_clt_reset() {
    this.DATA.PROCESS.STATE = 0;
    this.DATA.PROCESS.INPUT.CUTS = 0;
    this.DATA.PROCESS.INPUT.LENGTH = 0;
    this.DATA.PROCESS.INPUT.LENGTHTOTAL = 0;
    this.DATA.PROCESS.INPUT.TEMPERATURE = 0;
    this.DATA.PROCESS.INPUT.CHARGE = 0;

    this.DATA.PROCESS.FACTS.CUTS = 0;
    this.DATA.PROCESS.FACTS.LENGTH = 0;
    this.DATA.PROCESS.FACTS.LENGTH = 0;
    this.DATA.PROCESS.FACTS.LENGTHTOTAL = 0;
    this.DATA.PROCESS.FACTS.TEMPERATURE = 0;
    this.DATA.PROCESS.FACTS.ADJUSTMENT = 0;
    this.DATA.PROCESS.FACTS.FEVER = 0;

    this.app.db.write();
    this.process_svr_reset()
    this.app.logger.reset()
  }
  process_clt_motor_cortadora() {
    this.app.mqtt.cortadora_motor_reqReady();
  }
  process_clt_motor_rodillo() {
    this.app.mqtt.cortadora_motor_reqReady();
  }
  process_clt_termo_cupla() {
    this.app.mqtt.cortadora_termocupla_reqReady();
  }
  /* 
    ==========================================
    ================= client =================
    ==========================================
  */
  process_svr_ready() {
    this.io.emit('process_svr_ready', this.DATA.PROCESS.READY)
  }
  process_svr_init() {
    this.io.emit('process_svr_init', {
      STATE: this.DATA.PROCESS.STATE,
      INPUT: this.DATA.PROCESS.INPUT,
      FACTS: this.DATA.PROCESS.FACTS,
      READY: this.DATA.PROCESS.READY,
      LOGGER: this.app.logger.DATA
    });
  }
  process_svr_update() {
    this.io.emit('process_svr_update', this.DATA.PROCESS);
  }
  process_svr_play() {
    this.io.emit('process_svr_play');
  }
  process_svr_pause() {
    this.io.emit('process_svr_pause');
  }
  process_svr_stop() {
    this.io.emit('process_svr_stop');
  }
  process_svr_reset() {
    this.io.emit('process_svr_reset');
  }
  process_svr_logger({ time, text, type }) {
    this.io.emit('process_svr_logger', { time, text, type });
  }
}

module.exports = Socket