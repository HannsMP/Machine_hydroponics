/** @typedef {import('../../types/types').DataConfig} DataConfig */
/** @typedef {import('../../types/types').DataStream} DataStream */
/** @typedef {import('../../types/types').DataEvent} DataEvent */
/** @typedef {import('../../types/types').SocketData} SocketData */

/** @typedef {import('../../types/types').cnfg_lux} cnfg_lux */
/** @typedef {import('../../types/types').cnfg_doping} cnfg_doping */
/** @typedef {import('../../types/types').cnfg_air} cnfg_air */
/** @typedef {import('../../types/types').cnfg_pump_0} cnfg_pump_0 */
/** @typedef {import('../../types/types').cnfg_pump_1} cnfg_pump_1 */
/** @typedef {import('../../types/types').cnfg_pump_2} cnfg_pump_2 */

class HidroponiaUI {

  /** @param {number} val */
  #intRange(val, min = 0, max = 0) {
    let value = Math.floor(+val);
    return Math.min(Math.max(value, min), max);
  }

  /** @param {number} ph */
  #parse_ph(ph) {
    return (-0.002273 * ph) + 13.431818 // this.#scale(ph, 0, 4095, 0, 14);
  }

  /** @param {number} temp */
  #parse_temp(temp) {
    return 20 + ((temp - 1752) / 125) // this.#scale(temp, 1752, 2002, 20, 22);
  }

  /** @param {number} value */
  #scale(value, a_min = 0, a_max = 0, b_min = 0, b_max = 0) {
    if (value < a_min) value = a_min;
    if (value > a_max) value = a_max;
    let res = ((value - a_min) / (a_max - a_min)) * (b_max - b_min) + b_min;
    return res || 0;
  }

  /* ========== DataConfig ========== */
  /** @type {DataConfig} */
  #dataConfig = {
    HREG_MODE: 0, // 0-1

    COIL_LUX: 0, // 0-1
    COIL_AIR_PUMP: 0, // 0-1

    HREG_LUX_PWM: 0, // 0-100
    HREG_LUX_SP: 0, // 0-65535
    HREG_ON_MS_AIR: 0, // 0-inf
    HREG_OFF_MS_AIR: 0, // 0-inf

    COIL_PUMP_0: 0, // 0-1
    COIL_PUMP_1: 0, // 0-1
    COIL_PUMP_2: 0, // 0-1

    HREG_DOPING_SP_0: 0, // 0-4095
    HREG_DOPING_SP_1: 0, // 0-4095
    HREG_DOPING_SP_2: 0, // 0-4095

    HREG_PUMP_0: 0, // 0-4095
    HREG_PUMP_1: 0, // 0-4095
    HREG_PUMP_2: 0, // 0-4095

    HREG_ON_MS_PUMP_0: 0, // 0-inf
    HREG_ON_MS_PUMP_1: 0, // 0-inf
    HREG_ON_MS_PUMP_2: 0, // 0-inf

    HREG_OFF_MS_PUMP_0: 0, // 0-inf
    HREG_OFF_MS_PUMP_1: 0, // 0-inf
    HREG_OFF_MS_PUMP_2: 0, // 0-inf
  }
  /* ========== DataStream ========== */
  /** @type {DataStream} */
  #dataStream = {
    IREG_LSL: 0, // 0-1
    IREG_LSH: 0, // 0-1

    IREG_TDS_RAW: 0, // 0-4095
    IREG_PH_RAW: 0, // 0-4095
    IREG_TEMP_RAW: 0, // 0-4095

    IREG_LUX: 0, // 0-65535
    PWM_LUX: 0, // 0-255

    STATUS_LUX: 0,
    STATUS_AIR: 0,

    STATUS_PUMP_0: 0, // 0-1
    STATUS_PUMP_1: 0, // 0-1
    STATUS_PUMP_2: 0, // 0-1

    LAST_MS_AIR: 0,
    LAST_MS_PUMP_0: 0,
    LAST_MS_PUMP_1: 0,
    LAST_MS_PUMP_2: 0,

    CURRENT_TIME: 0,

    IREG_DOPING_LEVEL_0: 70, // 0-100
    IREG_DOPING_LEVEL_1: 70, // 0-100
    IREG_DOPING_LEVEL_2: 70, // 0-100
  }

  #updateControl() {
    let { HREG_MODE } = this.#dataConfig;

    this.btnControlAutomatico.disabled = HREG_MODE;
    this.btnControlManual.disabled = !HREG_MODE;

    this.allSystems.forEach(sys => {
      sys.hitbox.classList.toggle('active', !HREG_MODE);
    });
  }

  #updateBtnHitbox1() {
    let { COIL_LUX } = this.#dataConfig;
    let { STATUS_LUX } = this.#dataStream;

    this.lux.btnOn.disabled = COIL_LUX;
    this.lux.btnOff.disabled = !COIL_LUX;

    this.lux.showPointFocus.classList.toggle('active', STATUS_LUX);
  }

  #updateBtnHitbox2() {
    let { COIL_AIR_PUMP } = this.#dataConfig;
    let { STATUS_AIR } = this.#dataStream;

    this.air.btnOn.disabled = COIL_AIR_PUMP;
    this.air.btnOff.disabled = !COIL_AIR_PUMP;

    this.air.showPointState.classList.toggle('active', STATUS_AIR);
  }

  #updateBtnHitbox3() {
    let { COIL_PUMP_0 } = this.#dataConfig;
    let { STATUS_PUMP_0 } = this.#dataStream;

    this.pump_0.btnOn.disabled = COIL_PUMP_0;
    this.pump_0.btnOff.disabled = !COIL_PUMP_0;

    this.pump_0.showPointBombState.classList.toggle('active', STATUS_PUMP_0);
  }

  #updateBtnHitbox4() {
    let { COIL_PUMP_1 } = this.#dataConfig;
    let { STATUS_PUMP_1 } = this.#dataStream;

    this.pump_1.btnOn.disabled = COIL_PUMP_1;
    this.pump_1.btnOff.disabled = !COIL_PUMP_1;

    this.pump_1.showPointBombState.classList.toggle('active', STATUS_PUMP_1);
  }

  #updateBtnHitbox5() {
    let { COIL_PUMP_2 } = this.#dataConfig;
    let { STATUS_PUMP_2 } = this.#dataStream;

    this.pump_2.btnOn.disabled = COIL_PUMP_2;
    this.pump_2.btnOff.disabled = !COIL_PUMP_2;

    this.pump_2.showPointBombState.classList.toggle('active', STATUS_PUMP_2);
  }

  constructor(data = {}) {
    this.#dataStream = { ...this.#dataStream, ...data };

    /** @type {SocketData} */
    this.socket = io();

    this.lux = {
      showPointFocus: document.querySelector('#luminaria .foco .luz'),
      showPointIntensity: document.getElementById('luminaria-value'),
      setPoint: document.getElementById('luminaria-sp'),
      btnSave: document.getElementById('guardar-luminaria-sp'),
      btnOn: document.getElementById('luminaria-on'),
      btnOff: document.getElementById('luminaria-off'),
      hitbox: document.getElementById('hitbox-1'),
      dashboard: document.querySelector('#hitbox-1 .dashboard')
    }

    this.air = {
      showPointState: document.getElementById('oxigenador'),
      setPointTimeOn: document.getElementById('oxigenador-t-on'),
      setPointTimeOff: document.getElementById('oxigenador-t-off'),
      btnSave: document.getElementById('guardar-oxigenador-t'),
      btnOn: document.getElementById('oxigenador-btn-on'),
      btnOff: document.getElementById('oxigenador-btn-off'),
      hitbox: document.getElementById('hitbox-2'),
      dashboard: document.querySelector('#hitbox-2 .dashboard')
    }

    this.pump_0 = {
      showPointLevel: document.querySelector('#tanque-1 .nivel'),
      showPointBombState: document.getElementById('bomba-1'),
      setPointTimeOn: document.getElementById('bomba-1-t-on'),
      setPointTimeOff: document.getElementById('bomba-1-t-off'),
      setPointBombspeed: document.getElementById('bomba-1-speed'),
      showPointBombSpeed: document.getElementById('bomba-1-speed-value'),
      btnSave: document.getElementById('guardar-bomba-1-speed'),
      btnOn: document.getElementById('bomba-1-on'),
      btnOff: document.getElementById('bomba-1-off'),
      hitbox: document.getElementById('hitbox-3'),
      dashboard: document.querySelector('#hitbox-3 .dashboard')
    }

    this.pump_1 = {
      showPointLevel: document.querySelector('#tanque-2 .nivel'),
      showPointBombState: document.getElementById('bomba-2'),
      setPointTimeOn: document.getElementById('bomba-2-t-on'),
      setPointTimeOff: document.getElementById('bomba-2-t-off'),
      setPointBombspeed: document.getElementById('bomba-2-speed'),
      showPointBombSpeed: document.getElementById('bomba-2-speed-value'),
      btnSave: document.getElementById('guardar-bomba-2-speed'),
      btnOn: document.getElementById('bomba-2-on'),
      btnOff: document.getElementById('bomba-2-off'),
      hitbox: document.getElementById('hitbox-4'),
      dashboard: document.querySelector('#hitbox-4 .dashboard')
    }

    this.pump_2 = {
      showPointLevel: document.querySelector('#tanque-3 .nivel'),
      showPointBombState: document.getElementById('bomba-3'),
      setPointTimeOn: document.getElementById('bomba-3-t-on'),
      setPointTimeOff: document.getElementById('bomba-3-t-off'),
      setPointBombspeed: document.getElementById('bomba-3-speed'),
      showPointBombSpeed: document.getElementById('bomba-3-speed-value'),
      btnSave: document.getElementById('guardar-bomba-3-speed'),
      btnOn: document.getElementById('bomba-3-on'),
      btnOff: document.getElementById('bomba-3-off'),
      hitbox: document.getElementById('hitbox-5'),
      dashboard: document.querySelector('#hitbox-5 .dashboard')
    }

    this.doping = {
      setPointPH: document.getElementById('ph-sp'),
      setPointEC: document.getElementById('ec-sp'),
      showPointPH: document.getElementById('ph-value'),
      showPintEC: document.getElementById('ec-value'),
      showPointLevel: document.querySelector('#tanque-0 .nivel'),
      showPointTEMP: document.getElementById('temp-value'),
      btnSave: document.getElementById('guardar-tanque-hidroponico'),
      hitbox: document.getElementById('hitbox-6'),
      dashboard: document.querySelector('#hitbox-6 .dashboard')
    }

    this.btnControlManual = document.getElementById('control-manual');
    this.btnControlAutomatico = document.getElementById('control-automatico');

    this.allSystems = [
      this.lux,
      this.air,
      this.pump_0,
      this.pump_1,
      this.pump_2,
      this.doping
    ];

    this.#updateInterface();
    this.setupListeners();
    this.setupSocket();
  }

  #updateInterface() {
    this.#updateControl();
    this.#updateBtnHitbox1();
    this.#updateBtnHitbox2();
    this.#updateBtnHitbox3();
    this.#updateBtnHitbox4();
    this.#updateBtnHitbox5();
  }

  setupListeners() {
    this.btnControlManual.addEventListener('click', () => {
      this.#dataStream.HREG_MODE = 0;
      this.#updateControl();
      this.socket.emit('/cnfg_mode', { mode: 0 });
    });
    this.btnControlAutomatico.addEventListener('click', () => {
      this.#dataStream.HREG_MODE = 'AUTOMATICO';
      this.#updateControl();
      this.socket.emit('/cnfg_mode', { mode: 1 });
    });

    // cerrar dashboards si clic fuera
    document.addEventListener('click', e => {
      if (this.#dataStream.HREG_MODE !== 0)
        return;

      // Si el clic fue dentro de un dashboard o hitbox, NO cerrar nada
      if (e.target.closest('.dashboard') || e.target.closest('.hitbox'))
        return;

      // Si fue fuera, cerrar todos
      this.allSystems.forEach(sys => sys.hitbox.classList.remove('show'));
    });

    // click en hitbox
    this.allSystems.forEach(sys => {
      sys.hitbox.addEventListener('click', e => {
        e.stopPropagation();

        if (!sys.hitbox.classList.contains('active'))
          return;

        if (!sys.hitbox.classList.contains('show'))
          return sys.hitbox.classList.add('show');

        if (e.target.tagName == "INPUT" && e.target.getAttribute("type") == "button")
          return sys.hitbox.classList.remove('show');

        if (e.target == sys.hitbox)
          return sys.hitbox.classList.remove('show');
      });
    });

    /* click save */

    this.lux.btnSave.addEventListener("click", () => {
      let setpoint = parseInt(this.lux.setPoint.value);
      this.socket.emit('/cnfg_lux', { setpoint });
    })

    this.air.btnSave.addEventListener("click", () => {
      let on_s = parseInt(this.air.setPointTimeOn.value)
      let off_s = parseInt(this.air.setPointTimeOff.value)
      this.socket.emit('/cnfg_air', { on_s, off_s });
    })

    this.pump_0.btnSave.addEventListener("click", () => {
      let on_s = parseInt(this.pump_0.setPointTimeOn.value);
      let off_s = parseInt(this.pump_0.setPointTimeOff.value);
      let setpoint = parseInt(this.pump_0.setPointBombspeed.value);
      this.socket.emit('/cnfg_pump_0', { on_s, off_s, setpoint });
    })

    this.pump_1.btnSave.addEventListener("click", () => {
      let on_s = parseInt(this.pump_1.setPointTimeOn.value);
      let off_s = parseInt(this.pump_1.setPointTimeOff.value);
      let setpoint = parseInt(this.pump_1.setPointBombspeed.value);
      this.socket.emit('/cnfg_pump_1', { on_s, off_s, setpoint });
    })

    this.pump_2.btnSave.addEventListener("click", () => {
      let on_s = parseInt(this.pump_2.setPointTimeOn.value);
      let off_s = parseInt(this.pump_2.setPointTimeOff.value);
      let setpoint = parseInt(this.pump_2.setPointBombspeed.value);
      this.socket.emit('/cnfg_pump_2', { on_s, off_s, setpoint });
    })

    this.doping.btnSave.addEventListener("click", () => {
      let doping_0 = parseInt(this.doping.setPointPH.value);
      let doping_1 = parseInt(this.doping.setPointEC.value);
      this.socket.emit('/cnfg_doping', { doping_0, doping_1, doping_2: doping_1 });
    })

    /* click on */

    this.lux.btnOn.addEventListener("click", () => {
      this.socket.emit('/state_lux', 1);
    });

    this.air.btnOn.addEventListener("click", () => {
      this.socket.emit('/state_air', 1);
    });

    this.pump_0.btnOn.addEventListener("click", () => {
      this.socket.emit('/state_pump_0', 1);
    });

    this.pump_1.btnOn.addEventListener("click", () => {
      this.socket.emit('/state_pump_1', 1);
    });

    this.pump_2.btnOn.addEventListener("click", () => {
      this.socket.emit('/state_pump_2', 1);
    });

    /* click off */

    this.lux.btnOff.addEventListener("click", () => {
      this.socket.emit('/state_lux', 0);
    });
    this.air.btnOff.addEventListener("click", () => {
      this.socket.emit('/state_air', 0);
    });
    this.pump_0.btnOff.addEventListener("click", () => {
      this.socket.emit('/state_pump_0', 0);
    });
    this.pump_1.btnOff.addEventListener("click", () => {
      this.socket.emit('/state_pump_1', 0);
    });
    this.pump_2.btnOff.addEventListener("click", () => {
      this.socket.emit('/state_pump_2', 0);
    });
  }

  setupSocket() {
    this.socket.on('update_stream', data => this.#refreshStream(data));
    this.socket.on('update_config', data => this.#refreshConfig(data));

    this.socket.emit('update_config', data => this.#refreshConfig(data));
    this.#refreshConfig(this.#dataConfig);
  }

  /** @param {DataStream} data  */
  #refreshStream(data) {
    this.#dataStream = data;

    this.doping.showPointLevel.style.height = (data.IREG_LSL ? 90 : 30) + '%';
    this.doping.showPointPH.textContent = this.#parse_ph(data.IREG_PH_RAW).toFixed(2);

    this.doping.showPintEC.textContent = data.IREG_TDS_RAW.toFixed(2);
    this.doping.showPointTEMP.textContent = this.#parse_temp(data.IREG_TEMP_RAW).toFixed(2);

    this.lux.showPointFocus.style.boxShadow = `0 0 30px ${this.#scale(data.IREG_LUX, 0, 65535, 5, 20)}px #fff783`;
    this.lux.showPointIntensity.textContent = data.IREG_LUX.toFixed(2);

    this.pump_0.showPointLevel.style.height = data.IREG_DOPING_LEVEL_0 + '%';
    this.pump_1.showPointLevel.style.height = data.IREG_DOPING_LEVEL_1 + '%';
    this.pump_2.showPointLevel.style.height = data.IREG_DOPING_LEVEL_2 + '%';

    this.#updateInterface();
  }

  /** @param {DataConfig} data  */
  #refreshConfig(data) {

    let {
      HREG_LUX_SP,
      HREG_ON_MS_AIR,
      HREG_OFF_MS_AIR,
      HREG_DOPING_SP_0,
      HREG_DOPING_SP_1,
      HREG_PUMP_0,
      HREG_PUMP_1,
      HREG_PUMP_2,
      HREG_ON_MS_PUMP_0,
      HREG_ON_MS_PUMP_1,
      HREG_ON_MS_PUMP_2,
      HREG_OFF_MS_PUMP_0,
      HREG_OFF_MS_PUMP_1,
      HREG_OFF_MS_PUMP_2
    } = this.#dataConfig;

    if (HREG_LUX_SP !== data.HREG_LUX_SP)
      this.lux.setPoint.value = Math.floor(this.#scale(data.HREG_LUX_SP, 0, 65535, 0, 100));

    // AIR-T-ON
    if (HREG_ON_MS_AIR !== data.HREG_ON_MS_AIR)
      this.air.setPointTimeOn.value = Math.floor(data.HREG_ON_MS_AIR / 1000);
    // AIR-T-OFF
    if (HREG_OFF_MS_AIR !== data.HREG_OFF_MS_AIR)
      this.air.setPointTimeOff.value = Math.floor(data.HREG_OFF_MS_AIR / 1000);

    // PH-SP
    if (HREG_DOPING_SP_0 !== data.HREG_DOPING_SP_0)
      this.doping.setPointPH.value = this.#parse_ph(data.HREG_DOPING_SP_0).toFixed(2);
    // EC-SP
    if (HREG_DOPING_SP_1 !== data.HREG_DOPING_SP_1)
      this.doping.setPointEC.value = Math.floor(data.HREG_DOPING_SP_1);

    // PUMP-1-SPEED
    if (HREG_PUMP_0 !== data.HREG_PUMP_0)
      this.pump_0.setPointBombspeed.value = Math.floor(this.#scale(data.HREG_PUMP_0, 0, 255, 0, 100));
    // PUMP-2-SPEED
    if (HREG_PUMP_1 !== data.HREG_PUMP_1)
      this.pump_1.setPointBombspeed.value = Math.floor(this.#scale(data.HREG_PUMP_1, 0, 255, 0, 100));
    // PUMP-3-SPEED
    if (HREG_PUMP_2 !== data.HREG_PUMP_2)
      this.pump_2.setPointBombspeed.value = Math.floor(this.#scale(data.HREG_PUMP_2, 0, 255, 0, 100));

    // PUMP-1-T-ON
    if (HREG_ON_MS_PUMP_0 !== data.HREG_ON_MS_PUMP_0)
      this.pump_0.setPointTimeOn.value = Math.floor(data.HREG_ON_MS_PUMP_0 / 1000);
    // PUMP-2-T-ON
    if (HREG_ON_MS_PUMP_1 !== data.HREG_ON_MS_PUMP_1)
      this.pump_1.setPointTimeOn.value = Math.floor(data.HREG_ON_MS_PUMP_1 / 1000);
    // PUMP-3-T-ON
    if (HREG_ON_MS_PUMP_2 !== data.HREG_ON_MS_PUMP_2)
      this.pump_2.setPointTimeOn.value = Math.floor(data.HREG_ON_MS_PUMP_2 / 1000);

    // PUMP-1-T-OFF
    if (HREG_OFF_MS_PUMP_0 !== data.HREG_OFF_MS_PUMP_0)
      this.pump_0.setPointTimeOff.value = Math.floor(data.HREG_OFF_MS_PUMP_0 / 1000);
    // PUMP-2-T-OFF
    if (HREG_OFF_MS_PUMP_1 !== data.HREG_OFF_MS_PUMP_1)
      this.pump_1.setPointTimeOff.value = Math.floor(data.HREG_OFF_MS_PUMP_1 / 1000);
    // PUMP-3-T-OFF
    if (HREG_OFF_MS_PUMP_2 !== data.HREG_OFF_MS_PUMP_2)
      this.pump_2.setPointTimeOff.value = Math.floor(data.HREG_OFF_MS_PUMP_2 / 1000);

    this.pump_0.showPointBombSpeed.textContent = Math.floor(this.#scale(data.HREG_PUMP_0, 0, 255, 0, 100));
    this.pump_1.showPointBombSpeed.textContent = Math.floor(this.#scale(data.HREG_PUMP_1, 0, 255, 0, 100));
    this.pump_2.showPointBombSpeed.textContent = Math.floor(this.#scale(data.HREG_PUMP_2, 0, 255, 0, 100));

    this.#dataConfig = data;
    this.#updateInterface();
  }
}