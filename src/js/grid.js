$(() => {
  let canvasId = 'dot-grid';
  let canvas = document.getElementById(canvasId);

  /** @type {CanvasRenderingContext2D} */
  let context = canvas.getContext('2d');

  let getDocumentWidth = () => Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  );

  let getDocumentHeight = () => Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  );

  let drawBg = (vw, vh) => {
    context.fillStyle = '#666666';
    context.fillRect(0, 0, vw, vh);
  }

  let drawDots = (vw, vh) => {
    let r = 2

    for (let x = 15; x < vw; x += 30 /* ancho */) {
      for (let y = 15; y < vh; y += 30 /* alto */) {
        context.fillStyle = '#ffffff';
        context.fillRect(x - r / 2, y - r / 2, r, r);
      }
    }
  }

  let onResize = () => {
    let vw = canvas.width = getDocumentWidth();
    let vh = canvas.height = getDocumentHeight();

    drawBg(vw, vh);
    drawDots(vw, vh);
  }

  window.addEventListener('resize', () => onResize(), false);
  onResize();
})