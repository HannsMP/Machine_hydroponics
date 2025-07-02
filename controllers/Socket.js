/** @typedef {import('../types/types').ServerSocketData} ServerSocketData */

/** @typedef {import('../types/types').control_config} control_config */
/** @typedef {import('../types/types').luminary_config} luminary_config */
/** @typedef {import('../types/types').oxygenator_config} oxygenator_config */
/** @typedef {import('../types/types').phosphoricAcid_config} phosphoricAcid_config */
/** @typedef {import('../types/types').nutrientSolutionA_config} nutrientSolutionA_config */
/** @typedef {import('../types/types').nutrientSolutionB_config} nutrientSolutionB_config */
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
      socket.on('luminary-state', d => this.luminary_state(d));
      socket.on('oxygenator-state', d => this.oxygenator_state(d));
      socket.on('phosphoricAcid-state', d => this.phosphoricAcid_state(d));
      socket.on('nutrientSolutionA-state', d => this.nutrientSolutionA_state(d));
      socket.on('nutrientSolutionB-state', d => this.nutrientSolutionB_state(d));
    });
  }
  /** @param {control_config} data */
  control_config(data) {
    console.log(data);

  }
  /** @param {luminary_config} data */
  luminary_config(data) {
    console.log(data);

  }
  /** @param {oxygenator_config} data */
  oxygenator_config(data) {
    console.log(data);

  }
  /** @param {phosphoricAcid_config} data */
  phosphoricAcid_config(data) {
    console.log(data);

  }
  /** @param {nutrientSolutionA_config} data */
  nutrientSolutionA_config(data) {
    console.log(data);

  }
  /** @param {nutrientSolutionB_config} data */
  nutrientSolutionB_config(data) {
    console.log(data);

  }
  /** @param {luminary_state} data */
  luminary_state(data) {
    console.log(data);

  }
  /** @param {oxygenator_state} data */
  oxygenator_state(data) {
    console.log(data);

  }
  /** @param {phosphoricAcid_state} data */
  phosphoricAcid_state(data) {
    console.log(data);

  }
  /** @param {nutrientSolutionA_state} data */
  nutrientSolutionA_state(data) {
    console.log(data);

  }
  /** @param {nutrientSolutionB_state} data */
  nutrientSolutionB_state(data) {
    console.log(data);

  } update_data
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