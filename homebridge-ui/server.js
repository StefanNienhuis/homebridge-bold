let { HomebridgePluginUiServer, RequestError } = require('@homebridge/plugin-ui-utils');
let axios = require('axios');

class UiServer extends HomebridgePluginUiServer {

    constructor() {
        super();

        this.onRequest('/requestCode', this.requestCode.bind(this));
        this.onRequest('/validateCode', this.validateCode.bind(this));
        this.onRequest('/authenticate', this.authenticate.bind(this));

        this.ready();
    }

    async requestCode(payload) {
        let { phoneNumber } = payload;

        try {
            let response = await axios.post('https://api.sesamtechnology.com/v1/validations', {
                phone: phoneNumber,
                language: 'en',
                purpose: 'ValidationWithCode'
            });

            return { validationId: response.data.id };
        } catch (error) {
            throw new RequestError('Error while requesting validation code', error.response?.data || error);
        }
    }

    async validateCode(payload) {
        let { validationId, code } = payload;

        try {
            let response = await axios.post(`https://api.sesamtechnology.com/v1/validations/${validationId}`, {
                code
            });

            return { validationId: response.data.id };
        } catch (error) {
            throw new RequestError('Error while validating code', error.response?.data || error);
        }
    }

    async authenticate(payload) {
        let { validationId, phoneNumber, password } = payload;

        try {
            let response = await axios.post('https://api.sesamtechnology.com/v1/authentications', {
                validationId,

                // These are modified values captured from the Bold API
                clientType: 'IOS',
                clientId: 1234567890123456789,
                appId: 'com.nienhuisdevelopment.homebridge.bold'
            }, {
                auth: {
                    username: phoneNumber,
                    password
                }
            });

            return { token: response.data.token };
        } catch (error) {
            throw new RequestError('Error while authenticating', error.response?.data || error);
        }
    }
}

(() => {
    return new UiServer;
})();