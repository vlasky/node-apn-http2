import { APNNotification } from './APNNotification';
import { TokenOptions } from './TokenOptions';
export interface APNProviderOptions {
    token: TokenOptions;
    production?: boolean;
    requestTimeout?: number;
}
export interface APNSendResult {
    sent: Array<string>;
    failed: Array<{
        device: string;
        status?: string;
        response?: any;
        error?: any;
    }>;
}
export declare class APNPushProvider {
    private options;
    private authToken;
    private session;
    private _lastToken;
    private _lastTokenTime;
    private _pingInterval;
    constructor(options: APNProviderOptions);
    private ensureConnected;
    private ping;
    private getAuthToken;
    send(notification: APNNotification, deviceTokens: string[] | string): Promise<APNSendResult>;
    private allPostRequests;
    private sendPostRequest;
    shutdown(): void;
}
