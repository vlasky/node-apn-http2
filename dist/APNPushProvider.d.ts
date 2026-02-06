import { APNNotification } from './APNNotification';
import { TokenOptions } from './TokenOptions';
export interface APNProviderOptions {
    token: TokenOptions;
    production?: boolean;
    requestTimeout?: number;
    connectionTimeout?: number;
}
export interface APNSendResult {
    sent: Array<string>;
    failed: Array<{
        device: string;
        status?: string;
        response?: unknown;
        error?: Error;
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
    private forceRefreshToken;
    private isExpiredTokenError;
    send(notification: APNNotification, deviceTokens: string[] | string): Promise<APNSendResult>;
    private static readonly DEVICE_TOKEN_REGEX;
    private validateDeviceToken;
    private allPostRequests;
    private sendPostRequest;
    shutdown(): void;
}
