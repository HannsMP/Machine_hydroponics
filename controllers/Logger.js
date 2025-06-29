const { readFileSync, writeFileSync, existsSync } = require("fs");

class Logger {
  DATA = "";
  #path;
  /** @param {string} path @param {import('../app')} app  */
  constructor(path, app) {
    this.#path = path;
    this.app = app;
    try {
      if (!existsSync(path)) {
        this.DATA = this.time()
        return this.write();
      }
      this.DATA = this.read();
    } catch {
      this.DATA = this.time();
      this.write();
    }
  }
  /** @param {string} text @param {"info"|"warning"|"danger"|"success"} type */
  log(text, type = "success") {
    let now = this.time();
    let data = type + ' | ' + now + ' | ' + text

    this.DATA = this.DATA + '\n' + data;

    this.write()

    this.app.Socket.process_svr_logger({ time: now, text: text, type: type })
  }
  reset(){
    this.DATA = "";
    this.write();
  }
  time() {
    let time = new Date()

    let segundo = time.getSeconds();
    let minuto = time.getMinutes();
    let hora = time.getHours(); 

    return (hora % 12 >= 10 ? hora % 12 : `0${hora % 12}`) + ':' + (minuto >= 10 ? minuto : `0${minuto}`) + ':' + (segundo >= 10 ? segundo : `0${segundo}`) + ' ' + (hora >= 12 ? 'pm' : 'am');

    // let dia = time.getDate();
    // let mes = time.getMonth();
    /// let año = time.getFullYear();
    // return año + '/' + (mes >= 10 ? mes : `0${mes}`) + '/' + (dia >= 10 ? dia : `0${dia}`) + ' ' + (hora % 12 >= 10 ? hora % 12 : `0${hora % 12}`) + ':' + (minuto >= 10 ? minuto : `0${minuto}`) + ':' + (segundo >= 10 ? segundo : `0${segundo}`) + ' ' + (hora >= 12 ? 'pm' : 'am');
  }
  read() {
    return readFileSync(this.#path, "utf-8");
  }
  write() {
    writeFileSync(this.#path, this.DATA);
  }
}

module.exports = Logger;