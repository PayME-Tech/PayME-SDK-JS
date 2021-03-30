export class PaymeWebSdk {
    WALLET_ACTIONS = {
      LOGIN: "LOGIN",
      GET_WALLET_INFO: "GET_WALLET_INFO",
      GET_ACCOUNT_INFO: "GET_ACCOUNT_INFO",
      OPEN_WALLET: "OPEN_WALLET",
      WITHDRAW: "WITHDRAW",
      DEPOSIT: "DEPOSIT",
      GET_LIST_SERVICE: "GET_LIST_SERVICE",
      UTILITY: "UTILITY",
      GET_LIST_PAYMENT_METHOD: "GET_LIST_PAYMENT_METHOD",
      PAY: "PAY",
    }
  
    ENV = {
      dev: "dev",
      sandbox: "sandbox",
      production: "production",
    }
  
    constructor(configs, settings) {
      this.configs = configs
      this.id = settings.id
      this.dimension = {
        width: settings.width || `${window.innerWidth}px`,
        height: settings.height || `${window.innerHeight}px`
      }
      this.domain = this.getDomain(configs.env)
    }
  
    getDomain(env) {
      switch (env) {
        case this.ENV.dev:
          return "http://localhost:3000"
        case this.ENV.sandbox:
          return "https://sbx-sdk.payme.com.vn"
        case this.ENV.production:
          return "https://sdk.payme.com.vn"
        default:
          return "https://sbx-sdk.payme.com.vn"
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
      const secretKey = 'CMo359Lqx16QYi3x'
      return this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js')
        .then(() => {
          const encrypted = CryptoJS.AES.encrypt(JSON.stringify(text), secretKey).toString()
  
          return encrypted
        })
        .catch((err) => console.error('Something went wrong.', err))
    }
  
    async createGetWalletInfoURL() {
      const configs = {
        ...this.configs,
        actions: {
          type: this.WALLET_ACTIONS.GET_WALLET_INFO,
        },
      }
  
      const encrypt = await this.encrypt(configs)
  
      return this.domain + "/getDataWithAction/" + encodeURIComponent(encrypt)
    }
  
    async createOpenWalletURL() {
      const configs = {
        ...this.configs,
        actions: {
          type: this.WALLET_ACTIONS.OPEN_WALLET,
        },
      }
      const encrypt = await this.encrypt(configs)
  
      return this.domain + "/activeWeb/" + encodeURIComponent(encrypt)
    }
  
    async createDepositURL(amount, description, extraData) {
      const configs = {
        ...this.configs,
        actions: {
          type: this.WALLET_ACTIONS.DEPOSIT,
          amount,
          description,
          extraData,
        },
      }
  
      const encrypt = await this.encrypt(configs)
  
      return this.domain + "/getDataWithAction/" + encodeURIComponent(encrypt)
    }
  
    async createWithdrawURL(amount, description, extraData) {
      const configs = {
        ...this.configs,
        actions: {
          type: this.WALLET_ACTIONS.WITHDRAW,
          amount,
          description,
          extraData,
        },
      }
      const encrypt = await this.encrypt(configs)
  
      return this.domain + "/getDataWithAction/" + encodeURIComponent(encrypt)
    }
  
    openIframe(link) {
      let ifrm = document.createElement("iframe");
  
      ifrm.setAttribute(`src`, link);
      ifrm.style.width = this.dimension.width;
      ifrm.style.height = this.dimension.height;
      ifrm.frameBorder = "0";
      ifrm.allow = "camera *"
      ifrm.allowFullscreen = true
      const element = document.getElementById(this.id);
      element.appendChild(ifrm);
    }
  
    hideIframe(link) {
      let div = document.createElement("div");
      let ifrm = document.createElement("iframe");
  
      div.style.visibility = 'hidden'
      div.style.display = 'block'
      div.style.width = '0px'
      div.style.height = '0px'
      
      ifrm.setAttribute(`src`, link);
      ifrm.style.width = '0px'
      ifrm.style.height = '0px'
      ifrm.frameBorder = "0";
      const element = document.getElementById(this.id);
      div.appendChild(ifrm)
      element.appendChild(div);
    }
  
    async openWallet() {
      // custom: ifrm + element
      const iframe = await this.createOpenWalletURL()
      this.openIframe(iframe)
    }
  
    async withdraw(configs) {
      const iframe = await this.createWithdrawURL()
      this.openIframe(iframe)
    }
  
    async deposit(configs) {
      const iframe = await this.createDepositURL()
      this.openIframe(iframe)
    }
  
    getBalance() {
      return new Promise(async (resolve, reject) => {
        const iframe = await this.createGetWalletInfoURL()
  
        this.hideIframe(iframe)
  
        window.onmessage = function (e) {
          if (e.data.type === 'GET_BALANCE') {
            const balance = e.data.data
            resolve(balance)
            document.getElementById(id).innerHTML = "";
          }
        };
      })
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
  
