class Config {
  cnfgToggle = document.getElementById("toggle-config")
  cnfgMenu = document.querySelector('.menu-config')
  conWifi = document.querySelector('.wifi')
  inputStaSsid = document.querySelector('.wifi .sta input[name=ssid]')
  inputStaPass = document.querySelector('.wifi .sta input[name=pass]')
  inputApSsid = document.querySelector('.wifi .ap input[name=ssid]')
  inputApPass = document.querySelector('.wifi .ap input[name=pass]')
  swichWifi = document.querySelector('.swich-wifi')
  wifiSave = document.getElementById("wifi-save")
  constructor() {
    this.cnfgToggle.addEventListener('click', () => {
      this.cnfgMenu.classList.toggle('show')
      this.read()
    })

    this.swichWifi.addEventListener("click", () => {
      this.conWifi.setAttribute("mode", ({
        "sta": "ap",
        "ap": "sta"
      })[this.conWifi.getAttribute("mode")])
    })

    this.wifiSave.addEventListener("click", () => {
      ({
        "ap": () => this.sendAp(),
        "sta": () => this.sendSta()
      })[this.conWifi.getAttribute("mode")]()
    })

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.menu-config') && !event.target.closest('#toggle-config'))
        this.cnfgMenu.classList.remove('show');
    });
  }
  read() {
    fetch("/readWifi", {
      method: "POST",
    })
      .then(res => res.json())
      .then(data => {
        this.conWifi.setAttribute(
          "mode", 
          data?.Mode?.toLowerCase()
        )
        this.inputStaSsid.value = data?.STA?.SSID;
        this.inputStaPass.value = data?.STA?.PASSWORD;
        this.inputApSsid.value = data?.AP?.SSID;
        this.inputApPass.value = data?.AP?.PASSWORD;
      })
  }
  sendAp() {
    fetch('/setAp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        SSID: this.inputApSsid.value,
        PASSWORD: this.inputApPass.value
      })
    })
  }
  sendSta() {
    fetch('/setSta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        SSID: this.inputStaSsid.value,
        PASSWORD: this.inputStaPass.value
      })
    })
  }
}

class Dashboard {
  $form = document.querySelector('.control-form form');
  $cortes = document.getElementById('cortes');
  $cortesSpin = [...this.$cortes.parentElement.querySelectorAll('.bxs-plus-square, .bxs-minus-square')];
  $longitud = document.getElementById('longitud');
  $longitudSpin = [...this.$longitud.parentElement.querySelectorAll('.bxs-plus-square, .bxs-minus-square')];
  $temperatura = document.getElementById('temperatura');
  $temperaturaLabel = this.$temperatura.closest('.input-box').querySelector('span');

  $stopReset = document.getElementById('stop-reset');
  $stopBtn = document.getElementById('stop');
  $resetBtn = document.getElementById('reset');
  $playPause = document.getElementById('play-pause');
  $playBtn = document.getElementById('play');
  $pauseBtn = document.getElementById('pause');
  $charge = document.querySelector('.charge');
  $bar = document.querySelector('.bar');
  $barText = document.querySelector('.bar-text');

  constructor() {
    this.inputs();
    this.btns();
    this.process();
  }

  async process() {
    let response = await fetch('/read', {
      method: 'POST'
    })

    let { cortes, longitud, temperatura } = await response.json();

    this.$cortes.value = cortes || "";
    this.$longitud.value = longitud || "";
    this.$temperatura.value = temperatura || "";
    this.$temperatura.dispatchEvent(new Event('input'));

    this.StopReset(false, false);
    this.PlayPause(true, false);

    while (true) {
      let response = await fetch('/read', {
        method: 'POST'
      })

      let { estado, cortes, longitud, temperatura, cortesHechos } = await response.json();

      if (estado == 0) {
        await this.delay(1000);
        continue;
      }

      let porcentaje = (cortesHechos * (100 / cortes)).toFixed(2);

      if (cortes == cortesHechos) {
        this.StopReset(false, true);
        this.PlayPause(false, false);
        this.loadWidth(porcentaje);
        this.$barText.textContent = `Tarea Completada - ${cortesHechos}/${cortes} - (${porcentaje}%)`;
      } else if (estado == 1) {
        this.toggleElements(this.$cortesSpin, false);
        this.toggleElements(this.$longitudSpin, false);
        this.StopReset(true, false);
        this.PlayPause(false, true);

        this.setAttributesDisabled([this.$cortes, this.$longitud, this.$temperatura], true);

        this.$barText.textContent = `En proceso... [${cortesHechos}/${cortes}] - (${porcentaje}%)`;
        this.loadColor('success');
      } else if (estado == -1) {
        this.toggleElements(this.$cortesSpin, true);
        this.toggleElements(this.$longitudSpin, true);
        this.StopReset(true, false);
        this.PlayPause(true, false);

        this.removeAttributesDisabled([this.$cortes, this.$longitud, this.$temperatura]);

        this.$barText.textContent = `Detenido... [${cortesHechos}/${cortes}] - (${porcentaje}%)`;
        this.loadColor('warning');
      } else if (estado == -2) {
        this.toggleElements(this.$cortesSpin, true);
        this.toggleElements(this.$longitudSpin, false);
        this.StopReset(false, true);
        this.PlayPause(false, false);

        this.setAttributesDisabled([this.$cortes, this.$longitud, this.$temperatura], true);

        this.$barText.textContent = `Cancelado... [${cortesHechos}/${cortes}] - (${porcentaje}%)`;
        this.loadColor('danger');
      }

      this.$charge.style.display = 'block';
      this.loadWidth(porcentaje);

      await this.delay(250);
    }
  }

  btns() {
    this.$playBtn.addEventListener('click', () => {
      if (!this.isValidForm()) return;
      fetch('/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          temperatura: this.$temperatura.value,
          longitud: this.$longitud.value,
          cortes: this.$cortes.value,
        })
      })
    });

    this.$pauseBtn.addEventListener('click', () => {
      fetch('/pause', {
        method: 'POST'
      })
    });

    this.$stopBtn.addEventListener('click', () => {
      fetch('/stop', {
        method: 'POST'
      })
    });

    this.$resetBtn.addEventListener('click', async () => {
      let response = await fetch('/reset', {
        method: 'POST'
      })
      let data = await response.json()
      if (data.confirm) {
        this.$cortes.value = "";
        this.$longitud.value = "";
        this.removeAttributesDisabled([this.$cortes, this.$longitud]);
        this.StopReset(false, false);
        this.PlayPause(true, false);
        this.$charge.style.display = 'none';
        this.loadWidth(0);
      }
    });
  }

  inputs() {
    this.$cortes.parentElement.querySelector('.bxs-plus-square').addEventListener('click', () => {
      this.$cortes.value = Number(this.$cortes.value) + 1;
    });

    this.$cortes.parentElement.querySelector('.bxs-minus-square').addEventListener('click', () => {
      let val = Number(this.$cortes.value) - 1;
      if (val >= 0) this.$cortes.value = val || "";
    });

    this.$cortes.addEventListener('input', () => {
      let val = this.$cortes.value.replace(/[^0-9]/g, '');
      this.$cortes.value = val;
    });

    this.$longitud.parentElement.querySelector('.bxs-plus-square').addEventListener('click', () => {
      this.$longitud.value = Number(this.$longitud.value) + 1;
    });

    this.$longitud.parentElement.querySelector('.bxs-minus-square').addEventListener('click', () => {
      let val = (Number(this.$longitud.value) - 0.1).toFixed(2);
      if (val > 0) this.$longitud.value = val;
      else this.$longitud.value = "";
    });

    this.$longitud.addEventListener('input', () => {
      let val = Number(this.$longitud.value).toFixed(2);
      if (val <= 0) this.$longitud.value = 1;
    });

    const temp = {
      1: { c: "#ffe100", n: "bajo" },
      2: { c: "#ff9500", n: "medio" },
      3: { c: "#ff4343", n: "alto" }
    };

    this.$temperatura.addEventListener('input', () => {
      let { n, c } = temp[this.$temperatura.value];
      this.$temperaturaLabel.textContent = n;
      this.$temperaturaLabel.style.color = c;
      document.documentElement.style.setProperty('--temp', c);
    });
  }

  PlayPause(play, pause) {
    this.$playPause.style.display = `play` || `pause` ? 'block' : 'none';
    this.$playBtn.disabled = !play;
    this.$pauseBtn.disabled = !pause;
  }

  StopReset(stop, reset) {
    this.$stopReset.style.display = stop || reset ? 'block' : 'none';
    this.$stopBtn.style.display = stop ? 'block' : 'none';
    this.$resetBtn.style.display = reset ? 'block' : 'none';
  }

  loadWidth(porcentaje) {
    this.$bar.style.width = `${porcentaje}%`;
  }

  /** @param {'success'|'danger'|'warning'} color  */
  loadColor(color) {
    this.$bar.style.background = `var(--${color})`;
  }

  isValidForm() {
    if (this.$form.checkValidity()) return true;

    const tempBtn = document.createElement('button');
    this.$form.appendChild(tempBtn);
    tempBtn.click();
    tempBtn.remove();
    return false;
  }

  delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  toggleElements(elements, show) {
    elements.forEach(element => {
      element.style.display = show ? 'inline-block' : 'none';
    });
  }

  setAttributesDisabled(elements, disabled) {
    elements.forEach(element => {
      element.disabled = disabled;
    });
  }

  removeAttributesDisabled(elements) {
    elements.forEach(element => {
      element.disabled = false;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Uso de la clase
  window.cnfg = this.Config = new Config();
  window.dash = this.Dashboard = new Dashboard();
});