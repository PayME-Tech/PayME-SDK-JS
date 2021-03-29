class PaymeWebSdk {
  constructor(configs, settings) {
    this.configs = configs
    this.id = settings.id
    this.dimension = {
      width: settings.width || `${window.innerWidth}px`,
      height: settings.height || `${window.innerHeight}px`
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.onload = resolve
      script.onerror = reject
      script.src = src
      document.head.append(script)
    })
  }

  encrypt(text) {
    console.log('text', text)
    const secretKey = 'CMo359Lqx16QYi3x'
    return this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js')
      .then(() => {
        const encrypted = CryptoJS.AES.encrypt(text, secretKey).toString()

        return encrypted
      })
      .catch(() => console.error('Something went wrong.'))
  }

  async createIfrm(configs) {
    let ifrm = document.createElement("iframe");
    let str = '';
    if (configs !== '') str = encodeURIComponent(await this.encrypt(JSON.stringify(configs)))

    let link = ''
    if (configs.env === 'dev') link = 'http://localhost:3000'
    else if (configs.env === 'sandbox') link = 'https://sbx-sdk.payme.com.vn'
    else if (configs.env === 'sandbox2') link = 'https://sbx-sdk2.payme.com.vn'
    else link = 'https://sdk.payme.com.vn'

    ifrm.setAttribute("src", link + "/activeWeb/" + str);
    ifrm.style.width = this.dimension.width;
    ifrm.style.height = this.dimension.height;
    ifrm.frameBorder = "0";
    ifrm.allow = "camera *"
    ifrm.allowFullscreen = true
    const element = document.getElementById(this.id);
    element.appendChild(ifrm);
  }

  openWallet() {
    // custom: ifrm + element
    this.createIfrm(this.configs)
  }

  withdraw(configs) {
    if (configs && configs.actions && configs.actions.type.toUpperCase() === 'WITHDRAW') {
      this.createIfrm(configs)
    }
  }

  deposit(configs) {
    if (configs && configs.actions && configs.actions.type.toUpperCase() === 'DEPOSIT') {
      this.createIfrm(configs)
    }
  }

  onMessage(id, onEvent) {
    window.onmessage = function (e) {
      if (e.data.type === 'turnoff') {
        onEvent(e);
        document.getElementById(id).innerHTML = "";
      } else {
        onEvent(e);
      }
    };
  }
}
