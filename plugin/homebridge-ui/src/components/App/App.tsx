import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import AuthManager from '../../auth-manager';
import { Config } from '../../types';
import LegacyAuth from '../LegacyAuth';
import Page from '../Page';

function App(): JSX.Element {
    let [isAuthenticating, setAuthenticating] = useState(false);
    let [showLegacyAuthentication, setLegacyAuthentication] = useState(false);
    let [error, setError] = useState<string>();

    let [isStartingOAuth, setStartingOAuth] = useState(false);
    let [isShowingQRCode, setShowingQRCode] = useState(false);
    let [oauthURL, setOAuthURL] = useState<string>();

    let [result, setResult] = useState<Config>();
    let [isConfigured, setConfigured] = useState<boolean>();

    let [isInSettings, setInSettings] = useState(false);
    let [websocketURL, setWebsocketURL] = useState(AuthManager.shared.websocketURL);
    let [callbackURL, setCallbackURL] = useState(AuthManager.shared.callbackURL);

    async function authStart() {
        setStartingOAuth(true);
        setError(undefined);

        let callbackId;

        try {
            callbackId = await AuthManager.shared.oauthBegin();
        } catch (error) {
            console.error(`Error while starting auth: ${error}`);

            setStartingOAuth(false);
            setError((error instanceof Error ? error.toString() : JSON.stringify(error)));
            return;
        }

        setStartingOAuth(false);
        setOAuthURL(`https://boldsmartlock.com/app/authorize?response_type=code&client_id=HomeBridge&redirect_uri=${encodeURI(`${AuthManager.shared.callbackURL}`)}&state=${encodeURI(callbackId)}`);

        AuthManager.shared.once('oauthCallback', (result) => {
            setResult({ ...result, legacyAuthentication: false });
            AuthManager.shared.close();
        });
    }

    useEffect(() => {
        (async () => {
            let config = await homebridge.getPluginConfig();

            if (config && config.length) {
                homebridge.showSchemaForm();
                setConfigured(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (result != null) {
            (async () => {
                AuthManager.shared.close();
            
                let config = await homebridge.getPluginConfig();
                
                if (!config || config.length == 0) {
                    config = [{
                        platform: 'Bold'
                    }];
                }

                config[0].accessToken = result.accessToken;
                config[0].refreshToken = result.refreshToken;
                config[0].legacyAuthentication = result.legacyAuthentication;
                
                await homebridge.updatePluginConfig(config);
                homebridge.showSchemaForm();
            })();
        } else {
            homebridge.hideSchemaForm();
        }
    }, [result]);

    if (isConfigured || result != null) {
        return <p style={{ marginBottom: 0 }}>This Homebridge plugin provides HomeKit support for the Bold Smart Lock.</p>;
    }

    if (showLegacyAuthentication) {
        return <LegacyAuth setResult={setResult}/>;
    }

    return (
        <>
            {
                (() => {
                    if (isInSettings) {
                        return (
                            <Page title="Settings" buttons={[
                                { title: 'Done', action: () => {
                                    AuthManager.shared.websocketURL = websocketURL;
                                    AuthManager.shared.callbackURL = callbackURL;
                                    setInSettings(false);
                                } }
                            ]}>
                                <label htmlFor="websocketURL">Custom WebSocket URL</label>
                                <input name="websocketURL" placeholder="Custom WebSocket URL" value={websocketURL} onChange={onChange(setWebsocketURL)} className="w-100" />

                                <label htmlFor="callbackURL" className="pt-3">Custom callback URL</label>
                                <input name="callbackURL" placeholder="Custom callback URL" value={callbackURL} onChange={onChange(setCallbackURL)} className="w-100" />
                            </Page>
                        );
                    } else if (!isAuthenticating) {
                        return (
                            <Page title="Bold Smart Lock" buttons={[
                                { title: 'Log in', action: () => setAuthenticating(true) }
                            ]}>
                                <p>Welcome to <code>homebridge-bold</code>. This Homebridge plugin provides HomeKit support for the Bold Smart Lock.</p>
                            </Page>
                        );
                    } else {
                        return (
                            <Page title="Log in" buttons={
                                !isStartingOAuth && oauthURL == null ? [
                                    { title: 'Start', action: authStart },
                                ] : oauthURL != null ?
                                    [
                                        { icon: 'copy', action: () => navigator.clipboard.writeText(oauthURL || '') },
                                        { title: 'Open Bold', action: () => window.open(oauthURL) },
                                        { icon: 'qrcode', action: () => setShowingQRCode(!isShowingQRCode) }
                                    ] :
                                    []
                            } settingsAction={() => setInSettings(true)}>
                                <p>Log in using the Bold app by pressing the button below.</p>
                                <p className="text-muted fw-italic">Note: This must be done on a device with the Bold app installed. If this is not possible, use the <a href="#" onClick={() => setLegacyAuthentication(true)}>legacy authentication</a>.</p>
                
                                {
                                    isShowingQRCode && oauthURL != null ?
                                        <QRCode value={oauthURL} fgColor='white' bgColor='#00000000' /> :
                                        <></>
                                }

                                {
                                    isStartingOAuth ?
                                        <div className="spinner-border" role="status">
                                            <span className="sr-only">Loading...</span>
                                        </div> :
                                        <></>
                                }
                            </Page>
                        );
                    }
                })()
            }

            {
                error ?
                    <p className="text-center text-danger mt-2">{ error }</p> :
                    <></>
            }
        </>
    );
}

function onChange<T>(setValue: (value: T) => void): (event: { target: { value: T } }) => void {
    return (event) => {
        setValue(event.target.value);
    };
}

export default App;
