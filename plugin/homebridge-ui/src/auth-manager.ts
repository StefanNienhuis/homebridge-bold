class AuthManager {

    static shared = new AuthManager();

    websocketURL = 'wss://bold-ws.nienhuisdevelopment.com';
    callbackURL = 'https://bold.nienhuisdevelopment.com/oauth/callback';

    private ws?: WebSocket;

    async connect(): Promise<void> {
        if (this.ws == null) {
            this.ws = new WebSocket(this.websocketURL);

            return await new Promise((resolve, reject) => {
                this.ws?.addEventListener('open', () => {
                    resolve();
                });

                this.ws?.addEventListener('close', (event) => {
                    console.log(`Websocket closed: ${event.reason}`);
                });

                this.ws?.addEventListener('error', () => {
                    reject(new Error('Error while connecting to socket. If this problem persists, try legacy authentication.'));
                });
            });
        } else if (this.ws.readyState == this.ws.CLOSED) {
            this.ws = undefined;
            await this.connect();
        }
    }

    async oauthBegin(): Promise<string> {
        await this.connect();

        if (this.ws == null || this.ws.readyState == this.ws.CLOSED) {
            throw new Error('Socket closed');
        }

        let payload = {
            action: 'oauthBegin'
        };

        this.ws.send(JSON.stringify(payload));

        return await new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                this.ws?.removeEventListener('message', handler);
                reject(new Error('Failed to get response from backend.'));
            }, 30000);

            let handler = (event: MessageEvent) => {
                let data = JSON.parse(event.data);

                if (data.action == 'oauthBegin') {
                    clearTimeout(timeout);
                    this.ws?.removeEventListener('message', handler);
                    resolve(data.payload?.callbackId);
                }
            };

            this.ws?.addEventListener('message', handler);
        });
    }

    once(action: 'oauthCallback', callback: (data: { accessToken: string, refreshToken: string }) => void): void;

    once(action: string, callback: (data: any) => void): void {
        let handler = (event: MessageEvent) => {
            let data = JSON.parse(event.data);

            if (data.action == action) {
                callback(data.payload);
            }

            this.ws?.removeEventListener('message', handler, {});
        };


        this.ws?.addEventListener('message', handler);
    }

    close(): void {
        this.ws?.close();
    }

}

export default AuthManager;