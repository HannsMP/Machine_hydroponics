/** @typedef {import('../types/types').ServerSocketData} ServerSocketData */

/** @typedef {import('../types/types').control_config} control_config */
/** @typedef {import('../types/types').luminary_config} luminary_config */
/** @typedef {import('../types/types').oxygenator_config} oxygenator_config */
/** @typedef {import('../types/types').phosphoricAcid_config} phosphoricAcid_config */
/** @typedef {import('../types/types').nutrientSolutionA_config} nutrientSolutionA_config */
/** @typedef {import('../types/types').nutrientSolutionB_config} nutrientSolutionB_config */
/** @typedef {import('../types/types').ph_config} ph_config */
/** @typedef {import('../types/types').ec_config} ec_config */
/** @typedef {import('../types/types').luminary_state} luminary_state */
/** @typedef {import('../types/types').oxygenator_state} oxygenator_state */
/** @typedef {import('../types/types').phosphoricAcid_state} phosphoricAcid_state */
/** @typedef {import('../types/types').nutrientSolutionA_state} nutrientSolutionA_state */
/** @typedef {import('../types/types').nutrientSolutionB_state} nutrientSolutionB_state */
/** @typedef {import('../types/types').update_data} update_data */

const { Server } = require('socket.io');

class Socket {
  /** @param {import('../app')} app */
  constructor(app) {
    this.app = app;

    /** @type {ServerSocketData} */
    this.io = new Server(this.app.server);

    this.io.on('connection', (socket) => {
      console.log('usuario conectado');

      socket.on('control-config', d => this.control_config(d));
      socket.on('luminary-config', d => this.luminary_config(d));
      socket.on('oxygenator-config', d => this.oxygenator_config(d));
      socket.on('phosphoricAcid-config', d => this.phosphoricAcid_config(d));
      socket.on('nutrientSolutionA-config', d => this.nutrientSolutionA_config(d));
      socket.on('nutrientSolutionB-config', d => this.nutrientSolutionB_config(d));
      socket.on('tankPH-config', d => this.tankPH_config(d));
      socket.on('tankEC-config', d => this.tankEC_config(d));
      socket.on('luminary-state', d => this.luminary_state(d));
      socket.on('oxygenator-state', d => this.oxygenator_state(d));
      socket.on('phosphoricAcid-state', d => this.phosphoricAcid_state(d));
      socket.on('nutrientSolutionA-state', d => this.nutrientSolutionA_state(d));
      socket.on('nutrientSolutionB-state', d => this.nutrientSolutionB_state(d));
    });
  }
  /** @param {control_config} data */
  control_config(data) {
    let { mode } = data;
    if (mode == 1)
      this.app.mqtt.REQ_HREG_MODE(1);
    if (mode == 0)
      this.app.mqtt.REQ_HREG_MODE(0);

  }
  /** @param {luminary_config} data */
  luminary_config(data) {
    let { sp } = data;
    let scale = this.app.scale(sp, 0, 100, 0, 65535);
    console.log(sp, scale);

    this.app.mqtt.REQ_HREG_LUX_SP(scale);
  }
  /** @param {oxygenator_config} data */
  oxygenator_config(data) {
    let { timeOn, timeOff } = data;

    this.app.mqtt.REQ_HREG_AIR_ON_TIME(timeOn);
    this.app.mqtt.REQ_HREG_AIR_OFF_TIME(timeOff);
  }
  /** @param {phosphoricAcid_config} data */
  phosphoricAcid_config(data) {
    let { timeOn, timeOff, speed } = data;

    this.app.mqtt.REQ_HREG_B1_ON_TIME(timeOn);
    this.app.mqtt.REQ_HREG_B1_OFF_TIME(timeOff);

    let scale = this.app.scale(speed, 0, 100, 0, 255);

    this.app.mqtt.REQ_HREG_B1_SP(scale);
  }
  /** @param {nutrientSolutionA_config} data */
  nutrientSolutionA_config(data) {
    let { timeOn, timeOff, speed } = data;

    this.app.mqtt.REQ_HREG_B2_ON_TIME(timeOn);
    this.app.mqtt.REQ_HREG_B2_OFF_TIME(timeOff);

    let scale = this.app.scale(speed, 0, 100, 0, 255);

    this.app.mqtt.REQ_HREG_B2_SP(scale);
  }
  /** @param {nutrientSolutionB_config} data */
  nutrientSolutionB_config(data) {
    let { timeOn, timeOff, speed } = data;

    this.app.mqtt.REQ_HREG_B3_ON_TIME(timeOn);
    this.app.mqtt.REQ_HREG_B3_OFF_TIME(timeOff);

    let scale = this.app.scale(speed, 0, 100, 0, 255);

    this.app.mqtt.REQ_HREG_B3_SP(scale);
  }
  /** @param {ph_config} data */
  tankPH_config(data) {

  }
  /** @param {ec_config} data */
  tankEC_config(data) {

  }
  /** @param {luminary_state} data */
  luminary_state(data) {
    let { state } = data;

    this.app.mqtt.REQ_COIL_LIGHT(state == 1 ? 1 : 0)
  }
  /** @param {oxygenator_state} data */
  oxygenator_state(data) {
    let { state } = data;
    this.app.mqtt.REQ_COIL_AIR_PUMP(state == 1 ? 1 : 0);
  }
  /** @param {phosphoricAcid_state} data */
  phosphoricAcid_state(data) {
    let { state } = data;
    this.app.mqtt.REQ_COIL_BOMBA_3(state == 1 ? 1 : 0);
  }
  /** @param {nutrientSolutionA_state} data */
  nutrientSolutionA_state(data) {
    let { state } = data;
    this.app.mqtt.REQ_COIL_BOMBA_0(state == 1 ? 1 : 0);
  }
  /** @param {nutrientSolutionB_state} data */
  nutrientSolutionB_state(data) {
    let { state } = data;
    this.app.mqtt.REQ_COIL_BOMBA_2(state == 1 ? 1 : 0);
  }
  /* 
    ==========================================
    ================= server =================
    ==========================================
  */
  process_svr_update() {
    this.io.emit('/update-data', this.app.db.DATA);
  }
}

module.exports = Socket