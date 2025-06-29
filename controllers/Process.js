class Process {
  /** @param {import('socket.io').Socket} io @param {Jsoning} db  */
  constructor(io, db) {
    this.io = io;
    this.db = db;


    this.io.on('connection', (socket) => {
      console.log('usuario conectado');

      socket.on('process_on_play', (d) => this.process_on_play(d));
      socket.on('process_on_pause', (d) => this.process_on_pause(d));
      socket.on('process_on_stop', (d) => this.process_on_stop(d));
      socket.on('process_on_reset', (d) => this.process_on_reset(d));
    });
  }
  /* 
    ==========================================
    ================= server =================
    ==========================================
  */
  process_on_play({ temperatura, longitud, cortes }) {
    this.db.data.process.STATE = 1;

    this.db.data.process.CUTS = parseInt(cortes);
    this.db.data.process.LENGTH = parseInt(longitud) * 10;
    this.db.data.process.TEMPERATURE = 250 + (parseInt(temperatura) * 25);

    this.db.write();
    this.process.process_svr_update()
  }
  process_on_pause() {
    this.db.data.process.STATE = -1;

    this.db.write()
    this.process.process_svr_pause()
  }
  process_on_stop() {
    this.db.data.process.STATE = -2;

    this.db.write()
    this.process.process_svr_stop()
  }
  process_on_reset() {
    this.db.data.process.STATE = 0;
    this.db.data.process.CUTS = 0;
    this.db.data.process.LENGTH = 0;
    this.db.data.process.CUTSFACTS = 0;
    this.db.data.process.TEMPERATURE = 0;

    this.db.write()
    this.process.process_emit_update()
  }

  /* 
    ==========================================
    ================= client =================
    ==========================================
  */
  process_emit_update() {
    this.io.emit('process_emit_update', {
      cortes: this.db.data.process.CUTS,
      cortesHechos: this.db.data.process.CUTSFACTS
    })
  }
  process_emit_pause() {
    this.io.emit('process_emit_pause', {
      cortes: this.db.data.process.CUTS,
      cortesHechos: this.db.data.process.CUTSFACTS
    })
  }
  process_emit_stop() {
    this.io.emit('process_emit_stop', {
      cortes: this.db.data.process.CUTS,
      cortesHechos: this.db.data.process.CUTSFACTS
    })
  }
}

module.exports = Process