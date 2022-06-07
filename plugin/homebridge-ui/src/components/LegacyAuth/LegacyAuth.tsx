import React, { useState } from 'react';
import { Config, LegacyAuthPage } from '../../types';
import Page from '../Page';

interface LegacyAuthProps {
    setResult: (result: Config) => void;
}

function LegacyAuth(props: LegacyAuthProps): JSX.Element {
    let [page, setPage] = useState(LegacyAuthPage.PhoneNumber);

    let [phoneNumber, setPhoneNumber] = useState('');
    let [verificationCode, setVerificationCode] = useState('');
    let [verificationToken, setVerificationToken] = useState();
    let [password, setPassword] = useState('');
    let [error, setError] = useState<string>();

    if (error != null) {
        return <p className="text-center text-danger mt-2">{ error }</p>;
    }

    switch (page) {
    case LegacyAuthPage.PhoneNumber: return (
        <Page title="Enter your phone number" buttons={[
            {
                icon: 'arrow-right',
                action: getVerificationCode
            }
        ]}>
            <input value={phoneNumber} onChange={onChange(setPhoneNumber)}
                name="Phone number" placeholder="Phone number" type="tel"
                className="form-control mt-3 mb-2 w-50" />
        </Page>
    );
    case LegacyAuthPage.VerificationCode: return (
        <Page title="Enter the verification code" buttons={[
            {
                icon: 'arrow-right',
                action: validateCode
            }
        ]}>
            <input value={verificationCode} onChange={onChange(setVerificationCode)}
                name="Verification code" placeholder="Verification code" type="number"
                className="form-control mt-3 mb-2 w-50" />
        </Page>
    );
    case LegacyAuthPage.Password: return (
        <Page title="Enter your password" buttons={[
            {
                icon: 'arrow-right',
                action: authenticate
            }
        ]}>
            <input value={password} onChange={onChange(setPassword)}
                name="Password" placeholder="Password" type="password"
                className="form-control mt-3 mb-2 w-50" />
        </Page>
    );
    default: return <></>;
    }

    async function getVerificationCode() {
        try {
            let response = await fetch('https://api.sesamtechnology.com/v2/verification/request-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber,
                    language: 'en',
                    destination: 'Phone'
                })
            });

            let body = await response.json();

            if (!response.ok) {
                console.error(`Error (${response.status}) while getting verification code: ${JSON.stringify(body)}`);
                setError(JSON.stringify(body));

                return;
            }

            setPage(LegacyAuthPage.VerificationCode);
        } catch (error) {
            console.error(`Error while getting verification code: ${error}`);
            setError((error as any).toString());
        }
    }

    async function validateCode() {
        try {
            let response = await fetch('https://api.sesamtechnology.com/v2/verification/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber,
                    verificationCode
                })
            });

            let body = await response.json();

            if (!response.ok) {
                console.error(`Error (${response.status}) while validating code: ${JSON.stringify(body)}`);
                setError(JSON.stringify(body));

                return;
            }

            setVerificationToken(body.verificationToken);

            setPage(LegacyAuthPage.Password);
        } catch (error) {
            console.error(`Error while validating code: ${error}`);
            setError((error as any).toString());
        }
    }

    async function authenticate() {
        try {
            let form = new URLSearchParams();

            form.append('grant_type', 'password');
            form.append('username', phoneNumber);
            form.append('password', password);
            form.append('mfa_token', verificationToken || '');
            form.append('client_id', 'BoldApp');
            form.append('client_secret', 'pgJFgnGB87f9ednFiiHygCbf');

            let response = await fetch('https://api.sesamtechnology.com/v2/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: form.toString()
            });

            let body = await response.json();

            if (!response.ok) {
                console.error(`Error (${response.status}) while authenticating: ${JSON.stringify(body)}`);
                setError(JSON.stringify(body));

                return;
            }

            let { access_token, refresh_token } = body;

            props.setResult({ accessToken: access_token, refreshToken: refresh_token, legacyAuthentication: true });
        } catch (error) {
            console.error(`Error while authenticating: ${error}`);
            setError((error as any).toString());
        }
    }
}

function onChange<T>(setValue: (value: T) => void): (event: { target: { value: T } }) => void {
    return (event) => {
        setValue(event.target.value);
    };
}

export default LegacyAuth;