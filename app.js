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

  db = new Jsoning(resolve('data.json'));
  Socket = new Socket(this);
  mqtt = new Mqtt(this);
  constructor() {

    this.app.set('view engine', 'ejs');

    this.app.use('/src', express.static(resolve('src')));

    // this.app.use('/', morgan(':method :status :response-time ms - :url'));

    /* ruta inicial */
    this.app.get('/', (req, res) => {
      res.render(resolve('view', 'hmi.ejs'))
    })

    this.app.get('/logger', (req, res) => {
      this.logger.log('holaaaaa', "success")
      res.json({confim: true})
    })

    this.Listen()
  }

  Listen() {
    return new Promise((res, rej) => {
      let port = 800
      this.server.listen(port, (err) => {
        if (err)
          return rej(err);
        try {
          let net = networkInterfaces();
          this.ip = (
            net["Ethernet"] || net["Ethernet 3"] || net["Wi-Fi"] || net['Ethernet 5']
          )[1].address;
        } catch (error) {
          
        }
        console.log(`[App] http://${this.ip}:${port}`);
        res();
      })
    })
  }
}

module.exports = App