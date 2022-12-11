let welcomePage = document.getElementById('welcomePage');
let phoneNumberPage = document.getElementById('phoneNumberPage');
let validationCodePage = document.getElementById('validationCodePage');
let passwordPage = document.getElementById('passwordPage');
let resultPage = document.getElementById('resultPage');
let errorPage = document.getElementById('errorPage');

let phoneNumber, validationId;

function show(page) {
    welcomePage.style.display = 'none';
    phoneNumberPage.style.display = 'none';
    validationCodePage.style.display = 'none';
    passwordPage.style.display = 'none';
    resultPage.style.display = 'none';
    errorPage.style.display = 'none';

    if (page == 'welcome') {
        welcomePage.style.display = 'flex';
    } else if (page == 'phoneNumber') {
        phoneNumberPage.style.display = 'flex';
    } else if (page == 'validationCode') {
        validationCodePage.style.display = 'flex';
    } else if (page == 'password') {
        passwordPage.style.display = 'flex';
    } else if (page == 'result') {
        resultPage.style.display = 'flex';
    } else if (page == 'error') {
        errorPage.style.display = 'flex';
    }
}

async function requestCode() {
    phoneNumber = document.getElementById('phoneNumber').value;

    try {
        let response = await fetch('https://api.boldsmartlock.com/v1/validations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: phoneNumber,
                language: 'en',
                purpose: 'ValidationWithCode'
            })
        });

        let body = await response.json();

        if (response.status >= 300) {
            showError(body);
            return;
        }

        validationId = body.id;

        show('validationCode')
    } catch (error) {
        showError(error);
    }
}

async function validateCode() {
    let code = document.getElementById('validationCode').value;

    try {
        let response = await fetch(`https://api.boldsmartlock.com/v1/validations/${validationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code
            })
        });

        let body = await response.json();

        if (response.status >= 300) {
            showError(body);
            return;
        }

        validationId = body.id;

        show('password')
    } catch (error) {
        showError(error);
    }
}

async function authenticate() {
    let password = document.getElementById('password').value;

    try {
        let response = await fetch('https://api.boldsmartlock.com/v1/authentications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`${phoneNumber}:${password}`)}`
            },
            body: JSON.stringify({
                validationId,

                // These are modified values captured from the Bold API
                clientType: 'IOS',
                clientId: 4952073786011980410,
                appId: 'sesam.technology.bold'
            })
        });

        let body = await response.json();

        if (response.status >= 300) {
            showError(body);
            return;
        }

        let authTokenElement = document.getElementById('authToken');

        authTokenElement.innerHTML = body.token;

        show('result');
    } catch (error) {
        showError(error);
    }
}

function showError(error) {
    console.error(error);

    let errorElement = document.getElementById('errorMessage');

    errorElement.innerHTML = error.message || error.errorMessage || (typeof error == 'string' && error) || JSON.stringify(error);
    
    show('error');
}

show('welcome');