/** @typedef {import('../../types/types').DataGlobal} DataGlobal */
/** @typedef {import('../../types/types').DataEvent} DataEvent */
/** @typedef {import('../../types/types').SocketData} SocketData */

class HidroponiaUI {

  /** @type {DataGlobal} */
  #data = {
    mode: 'MANUAL',

    hydroponicTankShowPointLevel: 0, // 0-100
    hydroponicTankShowPH: 0, // 0-inf
    hydroponicTankShowEC: 0, // 0-inf
    hydroponicTankShowTEMP: 0, // 0-inf

    luminarySetPointIntensity: 0, // 0-100
    luminaryShowPointIntensity: 0, // 0-100
    luminaryState: 0, // 0-1

    oxygenatorSetPointtimeOn: 0, // 0-inf
    oxygenatorSetPointtimeOff: 0, // 0-inf
    oxygenatorState: 0, // 0-1

    bomb1ShowPointSpeed: 0, // 0-100
    bomb1SetPointSpeed: 0, // 0-100
    bomb1SetPointtimeOn: 0, // 0-inf
    bomb1SetPointtimeOff: 0, // 0-inf
    bomb1State: 0, // 0-1

    bomb2ShowPointSpeed: 0, // 0-100
    bomb2SetPointSpeed: 0, // 0-100
    bomb2SetPointtimeOn: 0, // 0-inf
    bomb2SetPointtimeOff: 0, // 0-inf
    bomb2State: 0, // 0-1

    bomb3ShowPointSpeed: 0, // 0-100
    bomb3SetPointSpeed: 0, // 0-100
    bomb3SetPointtimeOn: 0, // 0-inf
    bomb3SetPointtimeOff: 0, // 0-inf
    bomb3State: 0, // 0-1

    nutrientSolutionAShowPointLevel: 0,
    nutrientSolutionBShowPointLevel: 0,
    phosphoricAcidShowPointLevel: 0
  }

  #updateControl() {
    let manual = this.#data.mode === 'MANUAL';
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
    let state = this.#data.luminaryState;
    this.luminary.btnOn.disabled = state;
    this.luminary.btnOff.disabled = !state;
    this.luminary.showPointFocus.classList.toggle('active', state)
  }

  #updateBtnHitbox2() {
    let state = this.#data.oxygenatorState;
    this.oxygenator.btnOn.disabled = state;
    this.oxygenator.btnOff.disabled = !state;
    this.oxygenator.showPointState
  }

  #updateBtnHitbox3() {
    let state = this.#data.bomb1State;
    this.phosphoricAcid.btnOn.disabled = state;
    this.phosphoricAcid.btnOff.disabled = !state;
  }

  #updateBtnHitbox4() {
    let state = this.#data.bomb2State;
    this.nutrientSolutionA.btnOn.disabled = state;
    this.nutrientSolutionA.btnOff.disabled = !state;
  }

  #updateBtnHitbox5() {
    let state = this.#data.bomb3State;
    this.nutrientSolutionB.btnOn.disabled = state;
    this.nutrientSolutionB.btnOff.disabled = !state;
    this.nutrientSolutionB
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

    this.hydroponicTank = {
      showPointLevel: document.querySelector('#tanque-0 .nivel'),
      showPointPH: document.getElementById('ph-value'),
      showPintEC: document.getElementById('ec-value'),
      showPointTEMP: document.getElementById('temp-value')
    }

    this.btnControlManual = document.getElementById('control-manual');
    this.btnControlAutomatico = document.getElementById('control-automatico');

    this.allSystems = [
      this.luminary,
      this.oxygenator,
      this.phosphoricAcid,
      this.nutrientSolutionA,
      this.nutrientSolutionB
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
      this.#data.mode = 'MANUAL';
      this.#updateControl();
      this.socket.emit('control-config', 'MANUAL');
    });
    this.btnControlAutomatico.addEventListener('click', () => {
      this.#data.mode = 'AUTOMATICO';
      this.#updateControl();
      this.socket.emit('control-config', 'AUTOMATICO');
    });

    // cerrar dashboards si clic fuera
    document.addEventListener('click', e => {
      if (this.#data.mode !== 'MANUAL')
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
      this.#data.luminarySetPointIntensity = sp;
      this.socket.emit('luminary-config', { sp });
    })

    this.oxygenator.btnSave.addEventListener("click", () => {
      let t_on = parseInt(this.oxygenator.setPointTimeOn.value)
      let t_off = parseInt(this.oxygenator.setPointTimeOff.value)
      this.#data.oxygenatorSetPointtimeOn = t_on;
      this.#data.oxygenatorSetPointtimeOff = t_off;
      this.socket.emit('oxygenator-config', { t_on, t_off });
    })

    this.phosphoricAcid.btnSave.addEventListener("click", () => {
      let t_on = parseInt(this.phosphoricAcid.setPointTimeOn.value);
      let t_off = parseInt(this.phosphoricAcid.setPointTimeOff.value);
      let speed = parseInt(this.phosphoricAcid.setPointBombspeed.value);
      this.#data.bomb1SetPointSpeed = speed;
      this.socket.emit('phosphoricAcid-config', { t_on, t_off, speed });
    })

    this.nutrientSolutionA.btnSave.addEventListener("click", () => {
      let t_on = parseInt(this.nutrientSolutionA.setPointTimeOn.value);
      let t_off = parseInt(this.nutrientSolutionA.setPointTimeOff.value);
      let speed = parseInt(this.nutrientSolutionA.setPointBombspeed.value);
      this.#data.bomb2SetPointSpeed = speed;
      this.socket.emit('nutrientSolutionA-config', { t_on, t_off, speed });
    })

    this.nutrientSolutionB.btnSave.addEventListener("click", () => {
      let t_on = parseInt(this.nutrientSolutionB.setPointTimeOn.value);
      let t_off = parseInt(this.nutrientSolutionB.setPointTimeOff.value);
      let speed = parseInt(this.nutrientSolutionB.setPointBombspeed.value);
      this.#data.bomb3SetPointSpeed = speed;
      this.socket.emit('nutrientSolutionB-config', { t_on, t_off, speed });
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
   * @param {keyof DataGlobal} key 
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
      this.#data.luminaryState = 0;
      this.#updateBtnHitbox1();
      this.#data.oxygenatorState = 0;
      this.#updateBtnHitbox2();
      this.#data.bomb1State = 0;
      this.#updateBtnHitbox3();
      this.#data.bomb2State = 0;
      this.#updateBtnHitbox4();
      this.#data.bomb3State = 0;
      this.#updateBtnHitbox5();

      if (this.#data.luminarySetPointIntensity !== data.luminarySetPointIntensity)
        this.luminary.setPoint.value = data.luminarySetPointIntensity;

      if (this.#data.oxygenatorSetPointtimeOn !== data.oxygenatorSetPointtimeOn)
        this.oxygenator.setPointTimeOn.value = data.oxygenatorSetPointtimeOn;

      if (this.#data.oxygenatorSetPointtimeOff !== data.oxygenatorSetPointtimeOff)
        this.oxygenator.setPointTimeOff.value = data.oxygenatorSetPointtimeOff;

      if (this.#data.bomb1SetPointSpeed !== data.bomb1SetPointSpeed)
        this.phosphoricAcid.setPointBombspeed.value = data.bomb1SetPointSpeed;

      if (this.#data.bomb2SetPointSpeed !== data.bomb2SetPointSpeed)
        this.nutrientSolutionA.setPointBombspeed.value = data.bomb2SetPointSpeed;

      if (this.#data.bomb3SetPointSpeed !== data.bomb3SetPointSpeed)
        this.nutrientSolutionB.setPointBombspeed.value = data.bomb3SetPointSpeed;

      this.#data = { ...this.#data, ...data };

      this.#refreshViewData();
    });
  }

  #refreshViewData() {
    this.hydroponicTank.showPointLevel.style.height = this.#data.hydroponicTankShowPointLevel + '%';
    this.hydroponicTank.showPointPH.textContent = this.#data.hydroponicTankShowPH.toFixed(1);
    this.hydroponicTank.showPintEC.textContent = this.#data.hydroponicTankShowEC.toFixed(1);
    this.hydroponicTank.showPointTEMP.textContent = this.#data.hydroponicTankShowTEMP + 'C°';

    this.luminary.showPointIntensity.textContent = this.#data.luminaryShowPointIntensity + 'lumenes';
    this.luminary.showPointFocus.classList.toggle('active', this.#data.luminaryState);

    this.oxygenator.showPointState.classList.toggle('active', this.#data.oxygenatorState);

    this.phosphoricAcid.showPointLevel.style.height = this.#data.phosphoricAcidShowPointLevel + '%';
    this.phosphoricAcid.showPointBombState.classList.toggle('active', this.#data.bomb1State);
    this.phosphoricAcid.showPointBombSpeed.textContent = this.#data.bomb1ShowPointSpeed + '%';

    this.nutrientSolutionA.showPointLevel.style.height = this.#data.nutrientSolutionAShowPointLevel + '%';
    this.nutrientSolutionA.showPointBombState.classList.toggle('active', this.#data.bomb2State);
    this.nutrientSolutionA.showPointBombSpeed.textContent = this.#data.bomb2ShowPointSpeed + '%';

    this.nutrientSolutionB.showPointLevel.style.height = this.#data.nutrientSolutionBShowPointLevel + '%';
    this.nutrientSolutionB.showPointBombState.classList.toggle('active', this.#data.bomb3State);
    this.nutrientSolutionB.showPointBombSpeed.textContent = this.#data.bomb3ShowPointSpeed + '%';
  }
}