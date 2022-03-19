let { HomebridgePluginUiServer, RequestError } = require('@homebridge/plugin-ui-utils');
let axios = require('axios');
let FormData = require('form-data');

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
            await axios.post('https://api.sesamtechnology.com/v2/verification/request-code', {
                phoneNumber,
                language: 'en',
                destination: 'Phone'
            });
        } catch (error) {
            throw new RequestError('Error while requesting validation code', error.response?.data || error);
        }
    }

    async validateCode(payload) {
        let { phoneNumber, code } = payload;

        try {
            let response = await axios.post('https://api.sesamtechnology.com/v2/verification/verify-code', {
                phoneNumber,
                verificationCode: code
            });

            return { verificationToken: response.data.verificationToken };
        } catch (error) {
            throw new RequestError('Error while validating code', error.response?.data || error);
        }
    }

    async authenticate(payload) {
        let { verificationToken, phoneNumber, password } = payload;

        try {
            let formData = new FormData();

            formData.append('client_id', 'BoldApp');
            formData.append('client_secret', 'pgJFgnGB87f9ednFiiHygCbf');
            formData.append('username', phoneNumber);
            formData.append('password', password);
            formData.append('mfa_token', verificationToken);
            formData.append('grant_type', 'password');

            let response = await axios.post('https://api.sesamtechnology.com/v2/oauth/token', formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });

            return { accessToken: response.data.access_token, refreshToken: response.data.refresh_token };
        } catch (error) {
            throw new RequestError('Error while authenticating', error.response?.data || error);
        }
    }
}

(() => {
    return new UiServer;
})();