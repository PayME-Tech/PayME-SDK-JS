class MeAPI {
    constructor(
        config = {
            'url': '',
            'publicKey': '',
            'privateKey': '',
            'isSecurity': false,
            'x-api-client': '',
        }
    ) {
        this.config = config;
    }

    merge(object, source) {
        this.loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
            () => {
                return _.merge(object, source)
            }
        )
    }

    values(object) {
        this.loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
            () => {
                return _.values(object)
            }
        )
    }

    loadScript(src, callback) {
        // return new Promise((resolve, reject) => {
        //   const script = document.createElement("script");
        //   script.type = "text/javascript";
        //   script.onload = resolve;
        //   script.onerror = reject;
        //   script.src = src;
        //   document.head.append(script);
        // });
        const script = document.createElement("script")
        script.type = "text/javascript";
        if (script.readyState) {  // only required for IE <9
            script.onreadystatechange = function () {
                if (script.readyState === "loaded" || script.readyState === "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {  //Others
            script.onload = function () {
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    }

    decryptKey(
        xAPIAction,
        xAPIKey,
        xAPIMessage,
        xAPIValidate
    ) {
        this.loadScript("https://cdn.jsdelivr.net/npm/node-forge@0.10.0/lib/index.js",
            () => {
                // console.log('forge', forge)
                let decryptKey;
                try {
                    const key = forge.pki.privateKeyFromPem(this.config.privateKey);
                    const { util } = forge;

                    const encrypted = util.decode64(xAPIKey);

                    decryptKey = key.decrypt(encrypted, 'RSA-OAEP');

                } catch (error) {
                    throw new Error('Thông tin "x-api-key" không chính xác');
                }
                const objValidate = {
                    'x-api-action': xAPIAction,
                    method,
                    accessToken,
                    'x-api-message': xAPIMessage,
                };

                const md = forge.md.md5.create();
                const objValidateValue = this.values(objValidate)
                md.update(objValidateValue.join('') + decryptKey);
                const validate = md.digest().toHex();

                // console.log('validate', validate)
                // console.log('xAPIValidate', xAPIValidate)

                if (validate !== xAPIValidate) {
                    throw new Error('Thông tin "x-api-validate" không chính xác');
                }

                return decryptKey
            }
        )
    }

    parseDecryptKey(xAPIMessage, decryptKey) {
        this.loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js"
        )
            .then(() => {
                // eslint-disable-next-line no-undef
                let result = null;
                try {
                    result = JSON.parse(
                        CryptoJS.AES.decrypt(xAPIMessage, decryptKey).toString(
                            CryptoJS.enc.Utf8
                        )
                    );
                    if (typeof result === 'string') {
                        result = JSON.parse(result);
                    }

                    return result
                } catch (error) {
                    throw new Error('Thông tin "x-api-message" không chính xác');
                }

                return encrypted;
            })
            .catch((err) => console.error("Something went wrong.", err));
    }

    createShortId() {
        this.loadScript(
            "https://unpkg.com/shortid-dist@1.0.5/dist/shortid-2.2.13.js",
            () => {
                // console.log('shortid', shortid())

                return shortid();
            }
        )
    }

    AESEncrypt(url, payload, encryptKey) {
        this.loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js",
            () => {
                const xApiAction = CryptoJS.AES.encrypt(url, encryptKey).toString();
                let xApiMessage = '';
                if (payload) {
                    xApiMessage = CryptoJS.AES.encrypt(
                        JSON.stringify(payload),
                        encryptKey
                    ).toString();
                }

                return {
                    xApiAction,
                    xApiMessage
                };
            }
        )
    }

    createXApiValidate(objValidate, encryptKey) {
        this.loadScript(
            "https://cdn.jsdelivr.net/npm/node-forge@0.10.0/lib/index.js",
            () => {
                // eslint-disable-next-line no-undef
                const md = forge.md.md5.create();
                const objValidateValue = this.values(objValidate)
                md.update(objValidateValue.join('') + encryptKey);
                const xAPIValidate = md.digest().toHex();
                return xAPIValidate;
            }
        )
    }

    createXApiKey(encryptKey) {
        this.loadScript(
            "https://cdn.jsdelivr.net/npm/node-forge@0.10.0/lib/index.js",
            () => {
                // eslint-disable-next-line no-undef
                const key = forge.pki.publicKeyFromPem(this.config.publicKey);
                const { util } = forge;
                const encrypt = key.encrypt(encryptKey, 'RSA-OAEP');
                const xAPIKey = util.encode64(encrypt);
                return xAPIKey;
            }
        )
    }

    postRequest(url, body, header) {
        this.loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js",
            () => {
                const request = await axios.post(url, body, header);
                return request;
            }
        )
    }

    async ResponseDecrypt(
        xAPIAction,
        method,
        xAPIClient,
        xAPIKey,
        xAPIMessage,
        xAPIValidate,
        accessToken
    ) {
        const decryptKey = await this.decryptKey(xAPIAction, xAPIKey, xAPIMessage, xAPIValidate);

        const result = await this.parseDecryptKey(xAPIMessage, decryptKey)
        return result;
    }

    async RequestEncrypt(url, method, payload, accessToken) {
        const encryptKey = await this.createShortId();

        // console.log('encryptKey', encryptKey)
        const xAPIKey = await this.createXApiKey(encryptKey);
        // console.log('xAPIKey', xAPIKey)
        let body = '';

        const { xApiAction, xApiMessage } = await this.AESEncrypt(url, payload, encryptKey);

        // console.log('xApiAction', xApiAction)
        // console.log('xApiMessage', xApiMessage)

        const objValidate = {
            xApiAction,
            method,
            accessToken,
            'x-api-message': xApiMessage,
        };
        const xAPIValidate = await this.createXApiValidate(objValidate, encryptKey);
        // console.log('xAPIValidate', xAPIValidate)

        body = {
            'x-api-message': xApiMessage,
        };
        const meAPIHeader = {
            'x-api-client': this.config['x-api-client'],
            'x-api-key': xAPIKey,
            'x-api-action': xApiAction,
            'x-api-validate': xAPIValidate,
        };
        if (accessToken !== '') {
            meAPIHeader.Authorization = accessToken;
        }
        return {
            body,
            headers: meAPIHeader,
        };
    }

    async Post(pathUrl, payload, accessToken = '', headers = {}) {
        try {
            if (!accessToken) {
                accessToken = '';
            }
            let meAPIHeader = {};
            if (accessToken !== '') {
                meAPIHeader.Authorization = accessToken;
            }
            let body = payload;
            let url = this.config.url + pathUrl;

            if (this.config.isSecurity === true) {
                url = this.config.url;
                const encrypt = await this.RequestEncrypt(
                    pathUrl,
                    'POST',
                    payload,
                    accessToken
                );
                // console.log('encrypt post', encrypt)
                meAPIHeader = encrypt.headers;
                body = encrypt.body;
            }

            const response = await this.postRequest(url, body, {
                headers: this.merge(meAPIHeader, headers),
                timeout: 60000,
            })
            // console.log('response', response)

            if (response.status === 200) {
                if (this.config.isSecurity === true) {
                    try {
                        const responseHeaders = response.headers;
                        const data = this.ResponseDecrypt(
                            responseHeaders['x-api-action'],
                            'POST',
                            responseHeaders['x-api-client'],
                            responseHeaders['x-api-key'],
                            response.data['x-api-message'],
                            responseHeaders['x-api-validate'],
                            accessToken
                        );
                        return {
                            code: 1,
                            data: data || {},
                            original: response.data,
                        };
                    } catch (error) {
                        return {
                            code: -3,
                            data: { message: error.message },
                            original: response.data,
                        };
                    }
                } else {
                    // console.log('2121787283', response.data)
                    return {
                        code: 1,
                        data: response.data || {},
                    };
                }
            } else {
                return {
                    code: response.status,
                    data: response.data || {},
                };
            }
            // .then(response => {
            //   console.log('post request', response)
            //   if (response.status === 200) {
            //     if (this.config.isSecurity === true) {
            //       try {
            //         const responseHeaders = response.headers;
            //         const data = this.ResponseDecrypt(
            //           responseHeaders['x-api-action'],
            //           'POST',
            //           responseHeaders['x-api-client'],
            //           responseHeaders['x-api-key'],
            //           response.data['x-api-message'],
            //           responseHeaders['x-api-validate'],
            //           accessToken
            //         );
            //         return {
            //           code: 1,
            //           data: data || {},
            //           original: response.data,
            //         };
            //       } catch (error) {
            //         return {
            //           code: -3,
            //           data: { message: error.message },
            //           original: response.data,
            //         };
            //       }
            //     } else {
            //       console.log('2121787283', response.data)
            //       return {
            //         code: 1,
            //         data: response.data || {},
            //       };
            //     }
            //   } else {
            //     return {
            //       code: response.status,
            //       data: response.data || {},
            //     };
            //   }
            // })
        } catch (error) {
            return {
                code: -2,
                data: {
                    errors: [{ message: error.message }],
                },
            };
        }
    }
}