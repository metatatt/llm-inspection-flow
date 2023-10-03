export class CheckResult {
    constructor() {
      this._id = '';
      this._imageBlob = null;
      this._boxLoc = '';
      this._isQRCode = false;
      this._isTarget = false;
      this._qrCodeContent = '';
      this._result = {
        time: '',
        tag: '',
        probability: '',
        boundingBox: null,
      };

          // Initialize the checkWorker and add event listener
       this.cvServiceWorker = new Worker('./lib/cvServiceWorker.js');
        this.cvServiceWorker.addEventListener('message', event => {
        this.showCVResult(event.data);
        });
    }
  
    reqeustCvService(imageBlob, cvServiceCredentials){
      console.log('cv cred', cvServiceCredentials)
      this._imageBlob = imageBlob
      const content = {
        imageBlob: imageBlob,
        cvServiceCredentials: cvServiceCredentials,
      };
      console.log('cvResult**1')
      this.cvServiceWorker.postMessage(content)
    }

    showCVResult(eventData) {
      const newResult = eventData;
      Object.assign(this._result, newResult);
    
      console.log('cvResult**2')
      const event = new Event('cvResultReady');
      window.dispatchEvent(event);
    }
    
}

  