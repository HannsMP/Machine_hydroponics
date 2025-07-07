/** @typedef {import('../types/types').ServerSocketData} ServerSocketData */

/** @typedef {import('../types/types').cnfg_mode} cnfg_mode */
/** @typedef {import('../types/types').cnfg_lux} cnfg_lux */
/** @typedef {import('../types/types').cnfg_doping} cnfg_doping */

/** @typedef {import('../types/types').cnfg_air} cnfg_air */
/** @typedef {import('../types/types').cnfg_pump_0} cnfg_pump_0 */
/** @typedef {import('../types/types').cnfg_pump_1} cnfg_pump_1 */
/** @typedef {import('../types/types').cnfg_pump_2} cnfg_pump_2 */

/** @typedef {import('../types/types').state_lux} state_lux */
/** @typedef {import('../types/types').state_air} state_air */
/** @typedef {import('../types/types').state_pump_0} state_pump_0 */
/** @typedef {import('../types/types').state_pump_1} state_pump_1 */
/** @typedef {import('../types/types').state_pump_2} state_pump_2 */

const { Server } = require('socket.io');

class Socket {
  /** @param {import('../app')} app */
  constructor(app) {
    this.app = app;

    /** @type {ServerSocketData} */
    this.io = new Server(this.app.server);

    this.io.on('connection', (socket) => {
      // console.log('usuario conectado');

      socket.on('/cnfg_mode', d => this.cnfg_mode(d));
      socket.on('/cnfg_lux', d => this.cnfg_lux(d));
      socket.on('/cnfg_doping', d => this.cnfg_doping(d));
      socket.on('/cnfg_air', d => this.cnfg_air(d));
      socket.on('/cnfg_pump_0', d => this.cnfg_pump_0(d));
      socket.on('/cnfg_pump_1', d => this.cnfg_pump_1(d));
      socket.on('/cnfg_pump_2', d => this.cnfg_pump_2(d));

      socket.on('/state_lux', d => this.state_lux(d));
      socket.on('/state_air', d => this.state_air(d));
      socket.on('/state_pump_0', d => this.state_pump_0(d));
      socket.on('/state_pump_1', d => this.state_pump_1(d));
      socket.on('/state_pump_2', d => this.state_pump_2(d));

      socket.on('update_config', r => r(this.app.db.DATA.CONFIG));
    });
  }
  /* 
    ==========================================
    ================= getter =================
    ==========================================
  */
  process_svr_config() {
    this.io.emit('update_config', this.app.db.DATA.CONFIG);
  }
  process_svr_stream() {
    this.io.emit('update_stream', this.app.db.DATA.STREAM);
  }
  /* 
    ==========================================
    ================= Setter =================
    ==========================================
  */
  /* ========== FORM ========== */
  /** @param {cnfg_mode} data */
  cnfg_mode(data) {
    let { mode } = data;

    this.app.mqtt.REQ_HREG_MODE(mode);
  }
  /** @param {cnfg_lux} data */
  cnfg_lux(data) {
    let { setpoint } = data;

    let scale_8 = this.app.scale(setpoint, 0, 100, 0, 255);
    let scale_16 = this.app.scale(setpoint, 0, 100, 0, 65535);

    this.app.mqtt.HREG_LUX_PWM(scale_8);
    this.app.mqtt.HREG_LUX_SP(scale_16);
  }
  /** @param {cnfg_air} data */
  cnfg_air(data) {
    let { on_s, off_s } = data;

    this.app.mqtt.HREG_ON_MS_AIR(on_s);
    this.app.mqtt.HREG_OFF_MS_AIR(off_s);
  }
  /** @param {cnfg_doping} data */
  cnfg_doping(data) {
    let { doping_0, doping_1, doping_2 } = data;

    let scale_ph = this.app.scale(doping_0, 0, 14, 0, 4095);

    this.app.mqtt.HREG_DOPING_SP_0(scale_ph);
    this.app.mqtt.HREG_DOPING_SP_1(doping_1);
    this.app.mqtt.HREG_DOPING_SP_2(doping_2);
  }
  /** @param {cnfg_pump_0} data */
  cnfg_pump_0(data) {
    let { on_s, off_s, setpoint } = data;

    let scale_8 = this.app.scale(setpoint, 0, 100, 0, 255);

    this.app.mqtt.HREG_ON_MS_PUMP_0(on_s);
    this.app.mqtt.HREG_OFF_MS_PUMP_0(off_s);
    this.app.mqtt.HREG_PUMP_0(scale_8);
  }
  /** @param {cnfg_pump_1} data */
  cnfg_pump_1(data) {
    let { on_s, off_s, setpoint } = data;

    let scale_8 = this.app.scale(setpoint, 0, 100, 0, 255);

    this.app.mqtt.HREG_ON_MS_PUMP_1(on_s);
    this.app.mqtt.HREG_OFF_MS_PUMP_1(off_s);
    this.app.mqtt.HREG_PUMP_1(scale_8);
  }
  /** @param {cnfg_pump_2} data */
  cnfg_pump_2(data) {
    let { on_s, off_s, setpoint } = data;

    let scale_8 = this.app.scale(setpoint, 0, 100, 0, 255);

    this.app.mqtt.HREG_ON_MS_PUMP_2(on_s);
    this.app.mqtt.HREG_OFF_MS_PUMP_2(off_s);
    this.app.mqtt.HREG_PUMP_2(scale_8);
  }

  /* ========== STATE ========== */
  /** @param {state_lux} state */
  state_lux(state) {
    this.app.mqtt.COIL_LUX(state);
  }
  /** @param {state_air} state */
  state_air(state) {
    this.app.mqtt.REQ_COIL_AIR_PUMP(state);
  }
  /** @param {state_pump_0} state */
  state_pump_0(state) {
    this.app.mqtt.COIL_PUMP_0(state);
  }
  /** @param {state_pump_1} state */
  state_pump_1(state) {
    this.app.mqtt.COIL_PUMP_1(state);
  }
  /** @param {state_pump_2} state */
  state_pump_2(state) {
    this.app.mqtt.COIL_PUMP_2(state);
  }
}

module.exports = Socket