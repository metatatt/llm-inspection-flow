// jsQR_worker.js
importScripts('./lib/jsQR.js');  // Replace with the path to your jsQR library

self.addEventListener('message', (event) => {
  const { data, width, height } = event.data;
  console.log('worker height',height)
  const qrCode = jsQR(data, width, height, {
    inversionAttempts: 'dontInvert',
  });

  let cardData = '';

  if (qrCode) {
    cardData = qrCode.data;
    postMessage(cardData);
  } else {
    postMessage(null);
  }
});
