$().find().dataTable().DataTable
$(() => {
  let colorTemperatura = {
    1: { c: "#ffe100", n: "bajo" },
    2: { c: "#ff9500", n: "medio" },
    3: { c: "#ff4343", n: "alto" }
  };

  let input = {
    cortes: $("#cortes"),
    longitud: $('#longitud'),
    temperatura: $('#temperatura')
  };

  let btn = {
    reset: $('#reset'),
    pause: $('#pause'),
    stop: $('#stop'),
    play: $('#play')
  }

  let box = {
    form: $('.control-form form'),
    stopReset: $('#stop-reset'),
    playPause: $('#play-pause'),
    cortes: input.cortes.parent(),
    longitud: input.longitud.parent(),
    motor_rodillo: $('.ready .motor_rodillo'),
    motor_cortadora: $('.ready .motor_cortadora'),
    termo_cupla: $('.ready .termo_cupla'),
  }

  let control = {
    cortes_plus: box.cortes.find('.bxs-plus-square'),
    cortes_minus: box.cortes.find('.bxs-minus-square'),
    longitud_plus: box.longitud.find('.bxs-plus-square'),
    longitud_minus: box.longitud.find('.bxs-minus-square'),
    temperaturaLabel: input.temperatura.closest('.input-box').find('span'),
    barState: $('.bar-state'),
    barText: $('.bar-text'),
    charge: $('.charge'),
    bar: $('.bar')
  }

  let update = {
    cortes: $(".update .cortes small"),
    longitud: $('.update .longitud small'),
    temperatura: $('.update .temperatura small')
  }

  let ready = {
    motor_rodillo: box.motor_rodillo.find('.state'),
    motor_cortadora: box.motor_cortadora.find('.state'),
    termo_cupla: box.termo_cupla.find('.state')
  }

  class Process {
    /** @param {Dashboard} dash  */
    constructor(dash) {
      this.dash = dash;
    }
    get input() {
      return {
        temperatura: input.temperatura.val(),
        longitud: input.longitud.val(),
        cortes: input.cortes.val(),
      }
    }
    set input({ temperatura, longitud, cortes, }) {
      console.log({ temperatura, longitud, cortes, });
      input.temperatura.val(temperatura);
      input.longitud.val(longitud);
      input.cortes.val(cortes);
    }
    /** @param {{ MRS:Number, MCS:Number, TCS:Number }} param0 */
    ready({ MRS, MCS, TCS }) {
      let state = ['var(--danger)', 'var(--success)'];

      ready.motor_rodillo.css('background-color', state[MRS]);
      box.motor_rodillo.css('color', state[MRS]);

      ready.motor_cortadora.css('background-color', state[MCS]);
      box.motor_cortadora.css('color', state[MCS]);

      ready.termo_cupla.css('background-color', state[TCS]);
      box.termo_cupla.css('color', state[TCS]);
    }
    log = $('.logger')
    logdata = this.log.find('.data')
    /** @param {{time:string, text:string, type:"info"|"warning"|"danger"|"success"}} param0 */
    logger({ time, text, type = 'success' }) {
      let cont = $('<div>');
      let small = $('<span>').text(time).addClass('info');
      let span = $('<span>').text(text).addClass(type);
      cont.append(small, span);
      this.logdata.append(cont);
    }
    /** @param {{STATE: number,INPUT: {CUTS: number,LENGTH: number,LENGTHTOTAL: number,TEMPERATURE: number,CHARGE: number},FACTS: {CUTS: number,LENGTH: number,LENGTHTOTAL: number,TEMPERATURE: number,ADJUSTMENT: number,FEVER: number}}} param0 */
    update({ STATE, INPUT, FACTS }) {
      if (INPUT.CUTS == FACTS.CUTS) {
        this.dash.barState('Tarea Completada');
        return this.stop();
      }

      let porcentaje = (FACTS.CUTS * (100 / INPUT.CUTS)).toFixed(2);

      this.dash.barWidth(porcentaje);
      this.dash.barText(`(${porcentaje}%)`);

      update.cortes.text(`[${FACTS.CUTS}/${INPUT.CUTS}] unit`);
      update.longitud.text(`[${FACTS.LENGTHTOTAL}/${INPUT.LENGTHTOTAL}] mm`);
      update.temperatura.text(`[${FACTS.FEVER}/${FACTS.TEMPERATURE}] Cº`);
    }
    play() {
      control.charge.css('display', 'block');

      this.dash.barColor('success');
      this.dash.disabledInput(true);

      this.dash.spinToggle(false);


      this.dash.stopReset(true, false);
      this.dash.playPause(false, true);

      this.dash.barState('En proceso...')
    }
    pause() {
      control.charge.css('display', 'block');
      this.dash.barColor('warning');
      this.dash.disabledInput(false);

      this.dash.spinToggle(true);

      this.dash.stopReset(true, false);
      this.dash.playPause(true, false);

      this.dash.barState('Detenido...');
    }
    stop() {
      control.charge.css('display', 'block');

      this.dash.barColor('danger');

      this.dash.disabledInput(true);

      this.dash.spinToggle(true);

      this.dash.stopReset(false, true);
      this.dash.playPause(false, false);

      this.dash.barState('Cancelado...');
    }
    reset() {
      input.cortes.val("");
      input.longitud.val("");

      control.charge.css('display', 'none');

      this.dash.disabledInput(false);

      this.dash.stopReset(false, false);
      this.dash.playPause(true, false);

      this.dash.barWidth(0);

      update.cortes.text(``);
      update.longitud.text(``);
      update.temperatura.text(``);
      this.log.empty();
    }
  }

  class Socket {
    /** @type {import('socket.io').Socket} */
    socket = io();

    /** @param {Dashboard} dash  */
    constructor(dash) {
      this.dash = dash;

      this.socket.on('process_svr_logger', d => dash.process.logger(d));

      this.socket.on('process_svr_ready', d => this.dash.process.ready(d));
      this.socket.on('process_svr_init', d => this.on_init(d));

      this.socket.on('process_svr_update', d => dash.process.update(d));
      this.socket.on('process_svr_play', _ => dash.process.play());

      this.socket.on('process_svr_pause', _ => dash.process.pause());
      this.socket.on('process_svr_stop', _ => dash.process.stop());
      this.socket.on('process_svr_reset', _ => dash.process.reset());
    }
    /** @param {{STATE: number,INPUT: {CUTS: number,LENGTH: number,LENGTHTOTAL: number,TEMPERATURE: number,CHARGE: number},FACTS: {CUTS: number,LENGTH: number,LENGTHTOTAL: number,TEMPERATURE: number,ADJUSTMENT: number,FEVER: number},READY: {MRS: number,MCS: number,TCS: number}, LOGGER: string}} param0 */
    on_init({ STATE, INPUT, FACTS, READY, LOGGER }) {
      this.dash.process.ready(READY);

      if (STATE == 0)
        return;

      dash.process.input = {
        temperatura: INPUT.TEMPERATURE,
        longitud: INPUT.LENGTH / 100,
        cortes: INPUT.CUTS
      };

      this.dash.process.update({ STATE, INPUT, FACTS });

      LOGGER.split('\n').forEach(l => {
        let [type, time, text] = l.split('|').map(d => d.trim())
        this.dash.process.logger({ time, text, type })
      })

      if (STATE == 1)
        return this.dash.process.play();
      if (STATE == -1)
        return this.dash.process.pause();
      if (STATE == -2)
        this.dash.process.stop();
    }
    emit_play() {
      this.socket.emit('process_clt_play', this.dash.process.input);
    }
    emit_pause() {
      this.socket.emit('process_clt_pause');
    }
    emit_stop() {
      this.socket.emit('process_clt_stop');
    }
    emit_reset() {
      this.socket.emit('process_clt_reset');
    }
    emit_motor_cortadora() {
      this.socket.emit('process_clt_motor_cortadora');
      ready.motor_cortadora.css('background-color', 'var(--warning)');
      box.motor_cortadora.css('color', 'var(--warning)');
    }
    emit_motor_rodillo() {
      this.socket.emit('process_clt_motor_rodillo');
      ready.motor_rodillo.css('background-color', 'var(--warning)');
      box.motor_rodillo.css('color', 'var(--warning)');
    }
    emit_termo_cupla() {
      this.socket.emit('process_clt_termo_cupla');
      ready.termo_cupla.css('background-color', 'var(--warning)');
      box.termo_cupla.css('color', 'var(--warning)');
    }
  }

  class Dashboard {
    process = new Process(this);
    socket = new Socket(this)
    constructor() {
      this.__inputs__()
      this.__btns__()
    }

    /* 
    ===========================================
    ================== UTILS ==================
    ===========================================
    */
    playPause(play, pause) {
      box.playPause.css('display', play || pause ? 'block' : 'none');
      btn.play.attr('disabled', !play);
      btn.pause.attr('disabled', !pause);
    }
    stopReset(stop, reset) {
      box.stopReset.css('display', stop || reset ? 'block' : 'none');
      btn.stop.css('display', stop ? 'block' : 'none');
      btn.reset.css('display', reset ? 'block' : 'none');
    }
    barWidth(porcentaje) {
      control.bar.css('width', `${porcentaje}%`);
    }
    /** @param {'success'|'danger'|'warning'} color  */
    barColor(color) {
      control.bar.css('background', `var(--${color})`);
    }
    barText(text) {
      control.barText.text(text);
    }
    barState(state) {
      control.barState.text(state);
    }
    spin = $([
      control.cortes_minus[0],
      control.cortes_plus[0],
      control.longitud_minus[0],
      control.longitud_plus[0]
    ])
    spinToggle(show) {
      this.spin.css('display', show ? 'inline-block' : 'none')
    }
    disabledInput(state) {
      input.cortes.attr('disabled', state);
      input.longitud.attr('disabled', state);
      input.temperatura.attr('disabled', state);
    }
    isValidForm() {
      if (box.form[0].checkValidity()) return true;

      const tempBtn = $('<button>');
      box.form.append(tempBtn);
      tempBtn.click();
      tempBtn.remove();
      return false;
    }

    /* 
      ===========================================
      ================== INIT ==================
      ===========================================
    */

    __inputs__() {
      control.cortes_plus
        .on('click', () => input.cortes.val((_, v) => Number(v) + 1))

      control.cortes_minus
        .on('click', () => input.cortes.val((_, v) => {
          v = Number(v) - 1;
          if (Number.isNaN(v)) v = 0;
          if (v < 1) return 1;
          return v;
        }))

      input.cortes.on('input', () => input.cortes.val((_, v) => v.replace(/[^0-9]/g, '')))

      control.longitud_plus
        .on('click', () => input.longitud.val((_, v) => {
          v = Number(v) + .1;
          return v.toFixed(2);
        }))

      control.longitud_minus
        .on('click', () => input.longitud.val((_, v) => {
          v = Number(v) - .1;
          if (Number.isNaN(v)) v = 0;
          if (v < .01) return .01;
          return v.toFixed(2);
        }))

      let lvp = '';
      input.longitud.on('input', () => input.longitud.val((_, v) => {
        if (v.length < lvp.length) return lvp = v;
        let n = v.at(-1);
        v = v.replace(/[^0-9.]/g, '');
        let l = v.split('').filter(s => s == '.').length
        if (l == 2) return lvp;
        if (2 < v.split('.')[1]?.length) return lvp;
        return lvp = v
      }))

      input.temperatura.on('input', () => input.temperatura.val(function (_, v) {
        v = Number(v);
        if (v < 0 || 3 < v) return;
        let { n, c } = colorTemperatura[v]
        control.temperaturaLabel.text(n);
        control.temperaturaLabel.css('color', c)
        document.documentElement.style.setProperty('--temp', c);
        return v
      }))
    }

    __btns__() {
      btn.play.on('click', () => {

        if (!this.isValidForm()) return;

        this.socket.emit_play()
        this.process.play()
      });

      btn.pause.on('click', () => {
        this.socket.emit_pause()
        this.process.pause()
      });

      btn.stop.on('click', () => {
        this.socket.emit_stop()
        this.process.stop()
      });

      btn.reset.on('click', () => {
        this.socket.emit_reset()
        this.process.reset()
      });

      box.motor_cortadora.click(_ => this.socket.emit_motor_cortadora())
      box.motor_rodillo.click(_ => this.socket.emit_motor_rodillo())
      box.termo_cupla.click(_ => this.socket.emit_termo_cupla())
    }
  }

  // run
  window.dash = new Dashboard()
})