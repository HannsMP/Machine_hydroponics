/** @typedef {import('../../types/types').DataClient} DataClient */
/** @typedef {import('../../types/types').DataEvent} DataEvent */
/** @typedef {import('../../types/types').SocketData} SocketData */

class HidroponiaUI {

  /** @type {DataClient} */
  #data = {
    IREG_LSL: 0, // 0-100
    IREG_TDS_RAW: 0, // 0-inf
    IREG_PH_RAW: 0, // 0-inf
    IREG_TEMP_RAW: 0, // 0-inf
    IREG_LIGHT_LUX: 0, // 0-100
    STATUS_LIGHT: 0,
    STATUS_AIR: 0,
    STATUS_BOMBA_0: 0, // 0-1
    STATUS_BOMBA_2: 0, // 0-1
    STATUS_BOMBA_3: 0, // 0-1
    HREG_BOMBA_0: 0, // 0-100
    HREG_BOMBA_2: 0, // 0-100
    HREG_BOMBA_3: 0, // 0-100
    nutrientSolutionAShowPointLevel: 70, // 0-100
    nutrientSolutionBShowPointLevel: 70, // 0-100
    phosphoricAcidShowPointLevel: 70, // 0-100

    HREG_MODE: 0, // 0-1
    COIL_LIGHT: 0, // 0-1
    COIL_AIR_PUMP: 0, // 0-1
    COIL_BOMBA_0: 0, // 0-1
    COIL_BOMBA_2: 0, // 0-1
    COIL_BOMBA_3: 0, // 0-1

    HREG_LIGHT_PWM: 0, // 0-100

    HREG_AIR_ON_TIME: 0, // 0-inf
    HREG_AIR_OFF_TIME: 0, // 0-inf

    HREG_LUX_SP: 0,
    HREG_B1_SP: 0, // 0-100
    HREG_B2_SP: 0, // 0-100
    HREG_B3_SP: 0, // 0-100

    HREG_B1_ON_TIME: 0, // 0-inf
    HREG_B1_OFF_TIME: 0, // 0-inf
    HREG_B2_ON_TIME: 0, // 0-inf
    HREG_B2_OFF_TIME: 0, // 0-inf
    HREG_B3_ON_TIME: 0, // 0-inf
    HREG_B3_OFF_TIME: 0, // 0-inf
  }

  #updateControl() {
    let manual = this.#data.HREG_MODE === 0;
    this.btnControlManual.disabled = manual;
    this.btnControlAutomatico.disabled = !manual;

    this.allSystems.forEach(sys => {
      if (manual)
        return sys.hitbox.classList.add('active');

      sys.dashboard.style.display = 'none';
      sys.hitbox.classList.remove('active');
    });
  }

  #updateBtnHitbox1() {
    let { COIL_LIGHT, STATUS_LIGHT } = this.#data;
    this.luminary.btnOn.disabled = COIL_LIGHT;
    this.luminary.btnOff.disabled = !COIL_LIGHT;

    this.luminary.showPointFocus.classList.toggle('active', STATUS_LIGHT);
  }

  #updateBtnHitbox2() {
    let { COIL_AIR_PUMP, STATUS_AIR } = this.#data;
    this.oxygenator.btnOn.disabled = COIL_AIR_PUMP;
    this.oxygenator.btnOff.disabled = !COIL_AIR_PUMP;

    this.oxygenator.showPointState.classList.toggle('active', STATUS_AIR);
  }

  #updateBtnHitbox3() {
    let { COIL_BOMBA_3, STATUS_BOMBA_3 } = this.#data;
    this.phosphoricAcid.btnOn.disabled = COIL_BOMBA_3;
    this.phosphoricAcid.btnOff.disabled = !COIL_BOMBA_3;

    this.phosphoricAcid.showPointBombState.classList.toggle('active', STATUS_BOMBA_3);
  }

  #updateBtnHitbox4() {
    let { COIL_BOMBA_0, STATUS_BOMBA_0 } = this.#data;
    this.nutrientSolutionA.btnOn.disabled = COIL_BOMBA_0;
    this.nutrientSolutionA.btnOff.disabled = !COIL_BOMBA_0;

    this.nutrientSolutionA.showPointBombState.classList.toggle('active', STATUS_BOMBA_0);
  }

  #updateBtnHitbox5() {
    let { COIL_BOMBA_2, STATUS_BOMBA_2 } = this.#data;
    this.nutrientSolutionB.btnOn.disabled = COIL_BOMBA_2;
    this.nutrientSolutionB.btnOff.disabled = !COIL_BOMBA_2;

    this.nutrientSolutionB.showPointBombState.classList.toggle('active', STATUS_BOMBA_2);
  }

  constructor(data = {}) {
    this.#data = { ...this.#data, ...data };

    /** @type {SocketData} */
    this.socket = io();

    this.luminary = {
      showPointFocus: document.querySelector('#luminaria .foco'),
      showPointIntensity: document.getElementById('luminaria-value'),
      setPoint: document.getElementById('luminaria-sp'),
      btnSave: document.getElementById('guardar-luminaria-sp'),
      btnOn: document.getElementById('luminaria-on'),
      btnOff: document.getElementById('luminaria-off'),
      hitbox: document.getElementById('hitbox-1'),
      dashboard: document.querySelector('#hitbox-1 .dashboard')
    }

    this.oxygenator = {
      showPointState: document.getElementById('oxigenador'),
      setPointTimeOn: document.getElementById('oxigenador-t-on'),
      setPointTimeOff: document.getElementById('oxigenador-t-off'),
      btnSave: document.getElementById('guardar-oxigenador-t'),
      btnOn: document.getElementById('oxigenador-btn-on'),
      btnOff: document.getElementById('oxigenador-btn-off'),
      hitbox: document.getElementById('hitbox-2'),
      dashboard: document.querySelector('#hitbox-2 .dashboard')
    }

    this.phosphoricAcid = {
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

    this.nutrientSolutionA = {
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

    this.nutrientSolutionB = {
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

    this.tankPH = {
      setPointPH: document.getElementById('ph-sp'),
      btnSave: document.getElementById('guardar-ph'),
      hitbox: document.getElementById('hitbox-6'),
      dashboard: document.querySelector('#hitbox-6 .dashboard')
    }

    this.tankECA = {
      setPointEC: document.getElementById('ec-a-sp'),
      btnSave: document.getElementById('guardar-ec-a'),
      hitbox: document.getElementById('hitbox-7'),
      dashboard: document.querySelector('#hitbox-7 .dashboard')
    }

    this.tankECB = {
      setPointEC: document.getElementById('ec-b-sp'),
      btnSave: document.getElementById('guardar-ec-b'),
      hitbox: document.getElementById('hitbox-8'),
      dashboard: document.querySelector('#hitbox-8 .dashboard')
    }

    this.hydroponicTank = {
      showPintEC: document.getElementById('ec-value'),
      showPointPH: document.getElementById('ph-value'),
      showPointLevel: document.querySelector('#tanque-0 .nivel'),
      showPointTEMP: document.getElementById('temp-value'),
    }

    this.btnControlManual = document.getElementById('control-manual');
    this.btnControlAutomatico = document.getElementById('control-automatico');

    this.allSystems = [
      this.luminary,
      this.oxygenator,
      this.phosphoricAcid,
      this.nutrientSolutionA,
      this.nutrientSolutionB,
      this.tankECA,
      this.tankECB,
      this.tankPH
    ];

    this.updateInterface();
    this.setupListeners();
    this.setupSocket();
  }

  updateInterface() {
    this.#updateControl();
    this.#updateBtnHitbox1();
    this.#updateBtnHitbox2();
    this.#updateBtnHitbox3();
    this.#updateBtnHitbox4();
    this.#updateBtnHitbox5();
  }

  setupListeners() {
    this.btnControlManual.addEventListener('click', () => {
      this.#data.HREG_MODE = 0;
      this.#updateControl();
      this.socket.emit('control-config', { mode: 0 });
    });
    this.btnControlAutomatico.addEventListener('click', () => {
      this.#data.HREG_MODE = 'AUTOMATICO';
      this.#updateControl();
      this.socket.emit('control-config', { mode: 1 });
    });

    // cerrar dashboards si clic fuera
    document.addEventListener('click', e => {
      if (this.#data.HREG_MODE !== 0)
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

    this.luminary.btnSave.addEventListener("click", () => {
      let sp = parseFloat(this.luminary.setPoint.value);
      this.socket.emit('luminary-config', { sp });
    })

    this.oxygenator.btnSave.addEventListener("click", () => {
      let timeOn = parseInt(this.oxygenator.setPointTimeOn.value)
      let timeOff = parseInt(this.oxygenator.setPointTimeOff.value)
      this.socket.emit('oxygenator-config', { timeOn, timeOff });
    })

    this.phosphoricAcid.btnSave.addEventListener("click", () => {
      let timeOn = parseInt(this.phosphoricAcid.setPointTimeOn.value);
      let timeOff = parseInt(this.phosphoricAcid.setPointTimeOff.value);
      let speed = parseInt(this.phosphoricAcid.setPointBombspeed.value);
      this.socket.emit('phosphoricAcid-config', { timeOn, timeOff, speed });
    })

    this.nutrientSolutionA.btnSave.addEventListener("click", () => {
      let timeOn = parseInt(this.nutrientSolutionA.setPointTimeOn.value);
      let timeOff = parseInt(this.nutrientSolutionA.setPointTimeOff.value);
      let speed = parseInt(this.nutrientSolutionA.setPointBombspeed.value);
      this.socket.emit('nutrientSolutionA-config', { timeOn, timeOff, speed });
    })

    this.nutrientSolutionB.btnSave.addEventListener("click", () => {
      let timeOn = parseInt(this.nutrientSolutionB.setPointTimeOn.value);
      let timeOff = parseInt(this.nutrientSolutionB.setPointTimeOff.value);
      let speed = parseInt(this.nutrientSolutionB.setPointBombspeed.value);
      this.socket.emit('nutrientSolutionB-config', { timeOn, timeOff, speed });
    })

    this.tankPH.btnSave.addEventListener("click", () => {
      let sp = parseInt(this.tankPH.setPointPH.value);
      this.socket.emit('tankPH-config', { sp });
    })

    this.tankECA.btnSave.addEventListener("click", () => {
      let sp = parseInt(this.tankECA.setPointEC.value);
      this.socket.emit('tankECA-config', { sp });
    })

    /* click on */

    this.luminary.btnOn.addEventListener("click", () => {
      this.socket.emit('luminary-state', { state: 1 });
    });

    this.oxygenator.btnOn.addEventListener("click", () => {
      this.socket.emit('oxygenator-state', { state: 1 });
    });

    this.phosphoricAcid.btnOn.addEventListener("click", () => {
      this.socket.emit('phosphoricAcid-state', { state: 1 });
    });

    this.nutrientSolutionA.btnOn.addEventListener("click", () => {
      this.socket.emit('nutrientSolutionA-state', { state: 1 });
    });

    this.nutrientSolutionB.btnOn.addEventListener("click", () => {
      this.socket.emit('nutrientSolutionB-state', { state: 1 });
    });

    /* click off */

    this.luminary.btnOff.addEventListener("click", () => {
      this.socket.emit('luminary-state', { state: 0 });
    });
    this.oxygenator.btnOff.addEventListener("click", () => {
      this.socket.emit('oxygenator-state', { state: 0 });
    });
    this.phosphoricAcid.btnOff.addEventListener("click", () => {
      this.socket.emit('phosphoricAcid-state', { state: 0 });
    });
    this.nutrientSolutionA.btnOff.addEventListener("click", () => {
      this.socket.emit('nutrientSolutionA-state', { state: 0 });
    });
    this.nutrientSolutionB.btnOff.addEventListener("click", () => {
      this.socket.emit('nutrientSolutionB-state', { state: 0 });
    });

  }

  /**
   * @param {HTMLInputElement} input 
   * @param {keyof DataClient} key 
   * @param {number} value 
   */
  #updateIfDiff(input, key, value) {
    if (this.#data[key] === value)
      return;

    this.#data[key] = value;
    input.value = value;
  }

  setupSocket() {
    this.socket.on('/update-data', data => {
      this.#refreshInputsData(data);

      this.#data = { ...this.#data, ...data };

      this.updateInterface();
      this.#refreshViewData();
    });
  }

  /**
   * @param {DataClient} data 
   */
  #refreshInputsData(data) {
    // LUX-SP
    console.log(this.#data.HREG_LIGHT_PWM, data.HREG_LIGHT_PWM);

    if (this.#data.HREG_LIGHT_PWM !== data.HREG_LIGHT_PWM)
      this.luminary.setPoint.value = data.HREG_LIGHT_PWM;

    // AIR-T-ON
    if (this.#data.HREG_AIR_ON_TIME !== data.HREG_AIR_ON_TIME)
      this.oxygenator.setPointTimeOn.value = data.HREG_AIR_ON_TIME;
    // AIR-T-OFF
    if (this.#data.HREG_AIR_OFF_TIME !== data.HREG_AIR_OFF_TIME)
      this.oxygenator.setPointTimeOff.value = data.HREG_AIR_OFF_TIME;

    // BOMB-2-T-ON
    if (this.#data.HREG_B1_ON_TIME !== data.HREG_B1_ON_TIME)
      this.oxygenator.setPointTimeOn.value = data.HREG_B1_ON_TIME;
    // BOMB-2-T-OFF
    if (this.#data.HREG_B1_OFF_TIME !== data.HREG_B1_OFF_TIME)
      this.oxygenator.setPointTimeOff.value = data.HREG_B1_OFF_TIME;
    // BOMB-2-SPEED
    if (this.#data.HREG_B1_SP !== data.HREG_B1_SP)
      this.nutrientSolutionA.setPointBombspeed.value = data.HREG_B1_SP;

    // BOMB-3-T-ON
    if (this.#data.HREG_B2_ON_TIME !== data.HREG_B2_ON_TIME)
      this.oxygenator.setPointTimeOn.value = data.HREG_B2_ON_TIME;
    // BOMB-3-T-OFF
    if (this.#data.HREG_B2_OFF_TIME !== data.HREG_B2_OFF_TIME)
      this.oxygenator.setPointTimeOff.value = data.HREG_B2_OFF_TIME;
    // BOMB-3-SPEED
    if (this.#data.HREG_B2_SP !== data.HREG_B2_SP)
      this.nutrientSolutionB.setPointBombspeed.value = data.HREG_B2_SP;

    // BOMB-1-T-ON
    if (this.#data.HREG_B3_ON_TIME !== data.HREG_B3_ON_TIME)
      this.oxygenator.setPointTimeOn.value = data.HREG_B3_ON_TIME;
    // BOMB-1-T-OFF
    if (this.#data.HREG_B3_OFF_TIME !== data.HREG_B3_OFF_TIME)
      this.oxygenator.setPointTimeOff.value = data.HREG_B3_OFF_TIME;
    // BOMB-1-SPEED
    if (this.#data.HREG_B3_SP !== data.HREG_B3_SP)
      this.phosphoricAcid.setPointBombspeed.value = data.HREG_B3_SP;

    // PH-SP
    if (this.#data.HREG_PH_SP !== data.HREG_PH_SP)
      this.phosphoricAcid.setPointBombspeed.value = data.HREG_PH_SP;

    // EC-SP
    if (this.#data.HREG_EC_SP !== data.HREG_EC_SP)
      this.phosphoricAcid.setPointBombspeed.value = data.HREG_EC_SP;
  }

  #refreshViewData() {
    this.hydroponicTank.showPointLevel.style.height = (this.#data.IREG_LSL ? 90 : 30) + '%';
    this.hydroponicTank.showPointPH.textContent = this.#parse_ph(this.#data.IREG_PH_RAW).toFixed(2);
    this.hydroponicTank.showPintEC.textContent = this.#data.IREG_TDS_RAW.toFixed(2);
    this.hydroponicTank.showPointTEMP.textContent = this.#parse_temp(this.#data.IREG_TEMP_RAW).toFixed(2);

    this.luminary.showPointIntensity.textContent = this.#data.IREG_LIGHT_LUX;

    this.phosphoricAcid.showPointLevel.style.height = this.#data.phosphoricAcidShowPointLevel + '%';
    this.phosphoricAcid.showPointBombSpeed.textContent = this.#data.HREG_BOMBA_3;

    this.nutrientSolutionA.showPointLevel.style.height = this.#data.nutrientSolutionAShowPointLevel + '%';
    this.nutrientSolutionA.showPointBombSpeed.textContent = this.#data.HREG_BOMBA_0;

    this.nutrientSolutionB.showPointLevel.style.height = this.#data.nutrientSolutionBShowPointLevel + '%';
    this.nutrientSolutionB.showPointBombSpeed.textContent = this.#data.HREG_BOMBA_2;
  }

  #parse_ph(ph) {
    return (-0.002273 * ph) + 13.431818
  }

  #parse_temp(temp) {
    return 20 + ((temp - 1752) / 125)
  }

  /**
   * @param {number} value 
   * @param {number} a_min 
   * @param {number} a_max 
   * @param {number} b_min 
   * @param {number} b_max 
   */
  #scale(value, a_min, a_max, b_min, b_max) {
    if (value < a_min) value = a_min;
    if (value > a_max) value = a_max;
    let res = ((value - a_min) / (a_max - a_min)) * (b_max - b_min) + b_min;
    return res || 0;
  }
}