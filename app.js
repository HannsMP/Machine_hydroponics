const express = require('express');
const { createServer } = require('http');
const { resolve } = require('path');

const morgan = require('morgan');
const Jsoning = require('./controllers/jsoning');
const Socket = require('./controllers/Socket');
const Mqtt = require('./controllers/Mqtt');
const Logger = require('./controllers/Logger');
const { networkInterfaces } = require('os');

class App {
  app = express();
  server = createServer(this.app);

  logger = new Logger(resolve('logger.log'), this);

  db = new Jsoning(resolve('data/data.json'));
  Socket = new Socket(this);
  mqtt = new Mqtt(this);
  constructor() {
    this.app.set('view engine', 'ejs');
    this.app.use('/src', express.static(resolve('src')));
    // this.app.use('/', morgan(':method :status :response-time ms - :url'));

    /* ruta inicial */
    this.app.get('/', (req, res) => {
      res
        .status(200)
        .render(resolve('view', 'hmi.ejs'), { data: this.db.DATA });
    })

    this.start();
    this.Listen();
  }

  start() {
    setInterval(() => {
      this.mqtt.REQ_DATA_STREAM();
    }, 1000);
  }

  Listen() {
    return new Promise((res, rej) => {
      let port = 4321
      this.server.listen(port, (err) => {
        if (err)
          return rej(err);
        this.net = this.getIPAddress();
        console.log(`[App] http://${this.net.ipv4 || 'localhost'}:${port}`);
        res();
      })
    })
  }

  /**
   * @param {number} value 
   * @param {number} a_min 
   * @param {number} a_max 
   * @param {number} b_min 
   * @param {number} b_max 
   */
  scale(value, a_min, a_max, b_min, b_max) {
    if (value < a_min) value = a_min;
    if (value > a_max) value = a_max;
    let res = ((value - a_min) / (a_max - a_min)) * (b_max - b_min) + b_min;
    return res || 0;
  }

  /**
 * @returns {{ ipv4?: string, ipv6?: string, internal?: string }}
 */
  getIPAddress() {
    const nets = networkInterfaces();
    const result = {};

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal)
          result.ipv4 = net.address;
        else if (net.family === 'IPv4' && net.internal)
          result.internal = net.address;
        else if (net.family === 'IPv6' && !net.internal)
          result.ipv6 = net.address;

        if (result.ipv4 && result.ipv6 && result.internal) break;
      }

      if (result.ipv4 && result.ipv6 && result.internal) break;
    }

    return result;
  }
}

module.exports = App