"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APNPushProvider = void 0;
const Token_1 = require("./Token");
const http2_1 = require("http2");
const AuthorityAddress = {
    production: "https://api.push.apple.com:443",
    development: "https://api.development.push.apple.com:443"
};
class APNPushProvider {
    constructor(options) {
        this.options = options;
        this.session = null;
        this._remoteSettingsKnown = false;
        this._lastToken = '';
        this._lastTokenTime = 0;
        this._pingInterval = null;
        this.authToken = new Token_1.AuthToken(options.token);
        if (options.production == null) {
            options.production = process.env.NODE_ENV === "production";
        }
        if (options.requestTimeout == null) {
            options.requestTimeout = 10000;
        }
        else if (typeof options.requestTimeout !== 'number' || !Number.isFinite(options.requestTimeout) || options.requestTimeout <= 0) {
            throw new Error("requestTimeout must be a positive number");
        }
        if (options.connectionTimeout == null) {
            options.connectionTimeout = 30000;
        }
        else if (typeof options.connectionTimeout !== 'number' || !Number.isFinite(options.connectionTimeout) || options.connectionTimeout <= 0) {
            throw new Error("connectionTimeout must be a positive number");
        }
    }
    ensureConnected() {
        return new Promise((resolve, reject) => {
            if (!this.session || this.session.destroyed || this.session.closed) {
                const newSession = (0, http2_1.connect)(this.options.production ? AuthorityAddress.production : AuthorityAddress.development);
                this.session = newSession;
                this._remoteSettingsKnown = false;
                // set default error handler, else the emitter will throw an error that the error event is not handled
                newSession.on('error', () => {
                    // if the error happens during a request, the request will receive the error as well
                    // otherwise the connection will be destroyed and will be reopened the next time this
                    // method is called
                });
                newSession.once('remoteSettings', () => {
                    if (this.session === newSession) {
                        this._remoteSettingsKnown = true;
                    }
                });
                newSession.on('close', () => {
                    if (this._pingInterval) {
                        clearInterval(this._pingInterval);
                    }
                    this._pingInterval = null;
                    this._remoteSettingsKnown = false;
                    this.session = null;
                });
                this._pingInterval = setInterval(() => {
                    this.ping();
                }, 3600000); // every 1 hour per Apple best practices
            }
            if (this.session.connecting) {
                const connectingSession = this.session;
                let timeoutId = null;
                const cleanup = () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    connectingSession.removeListener('connect', onConnect);
                    connectingSession.removeListener('error', onError);
                    connectingSession.removeListener('close', onClose);
                };
                const onConnect = () => {
                    cleanup();
                    resolve();
                };
                const onError = (err) => {
                    cleanup();
                    // Clean up so next call can create fresh session
                    if (this._pingInterval) {
                        clearInterval(this._pingInterval);
                    }
                    this._pingInterval = null;
                    if (this.session === connectingSession) {
                        this._remoteSettingsKnown = false;
                        this.session = null;
                    }
                    reject(err);
                };
                const onClose = () => {
                    cleanup();
                    // Clean up so next call can create fresh session
                    if (this._pingInterval) {
                        clearInterval(this._pingInterval);
                    }
                    this._pingInterval = null;
                    if (this.session === connectingSession) {
                        this._remoteSettingsKnown = false;
                        this.session = null;
                    }
                    reject(new Error('Connection closed before establishing'));
                };
                const onTimeout = () => {
                    cleanup();
                    // Clean up so next call can create fresh session
                    if (this._pingInterval) {
                        clearInterval(this._pingInterval);
                    }
                    this._pingInterval = null;
                    if (!connectingSession.destroyed) {
                        connectingSession.destroy();
                    }
                    if (this.session === connectingSession) {
                        this._remoteSettingsKnown = false;
                        this.session = null;
                    }
                    reject(new Error('Connection timeout'));
                };
                timeoutId = setTimeout(onTimeout, this.options.connectionTimeout);
                connectingSession.once('connect', onConnect);
                connectingSession.once('error', onError);
                connectingSession.once('close', onClose);
            }
            else {
                resolve();
            }
        });
    }
    ping() {
        if (this.session && !this.session.destroyed) {
            const pingSession = this.session;
            pingSession.ping(Buffer.alloc(8), (err) => {
                if (err) {
                    if (this._pingInterval) {
                        clearInterval(this._pingInterval);
                    }
                    this._pingInterval = null;
                    if (this.session === pingSession) {
                        this._remoteSettingsKnown = false;
                        this.session = null;
                    }
                    if (!pingSession.destroyed) {
                        pingSession.destroy();
                    }
                    // Attempt to reconnect. If it fails, warn the user but don't throw -
                    // the next send() will retry and surface the error with full context.
                    this.ensureConnected().catch((reconnectErr) => {
                        console.warn(`APNs connection ping failed and reconnection unsuccessful: ${reconnectErr.message}`);
                    });
                }
            });
        }
    }
    getAuthToken() {
        // return the same token for 3000 seconds
        if (this._lastTokenTime > Date.now() - 3000 * 1000) {
            return this._lastToken;
        }
        this._lastTokenTime = Date.now();
        this._lastToken = this.authToken.generate();
        return this._lastToken;
    }
    forceRefreshToken() {
        this._lastTokenTime = 0;
        return this.getAuthToken();
    }
    isExpiredTokenError(result) {
        if (result.status !== '403' || !result.body)
            return false;
        try {
            const body = JSON.parse(result.body);
            return body.reason === 'ExpiredProviderToken';
        }
        catch (_a) {
            return false;
        }
    }
    send(notification, deviceTokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const authToken = this.getAuthToken();
            yield this.ensureConnected();
            const results = yield this.allPostRequests(authToken, notification, deviceTokens);
            const sent = results.filter(res => res.status === "200").map(res => res.device);
            const failed = results.filter(res => res.status !== "200").map(res => {
                if (res.error)
                    return { device: res.device, error: res.error };
                let response;
                try {
                    response = res.body ? JSON.parse(res.body) : undefined;
                }
                catch (_a) {
                    response = res.body;
                }
                return {
                    device: res.device,
                    status: res.status,
                    response
                };
            });
            return { sent, failed };
        });
    }
    normalizeDeviceTokenForResult(token) {
        if (typeof token === 'string') {
            return token;
        }
        if (token == null) {
            return '';
        }
        try {
            return String(token);
        }
        catch (_a) {
            return '';
        }
    }
    validateDeviceToken(token) {
        if (!token || typeof token !== 'string') {
            return 'Device token must be a non-empty string';
        }
        if (!APNPushProvider.DEVICE_TOKEN_REGEX.test(token)) {
            return 'Device token must be a hexadecimal string';
        }
        return null;
    }
    allPostRequests(authToken, notification, deviceTokens) {
        const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
        const results = new Array(tokens.length);
        // Validate all device tokens upfront
        for (let i = 0; i < tokens.length; i++) {
            const error = this.validateDeviceToken(tokens[i]);
            if (error) {
                results[i] = { device: this.normalizeDeviceTokenForResult(tokens[i]), error: new Error(error) };
            }
        }
        // Use server's advertised limit, but treat 0 or undefined as 1 to avoid deadlock
        const serverLimit = this.session.remoteSettings.maxConcurrentStreams;
        const maxConcurrent = this._remoteSettingsKnown && serverLimit && serverLimit > 0 ? serverLimit : 1;
        let currentToken = authToken;
        let nextIndex = 0;
        let inFlight = 0;
        let resolveAll;
        const compiledPayload = notification.compile();
        const notificationHeaders = notification.headers();
        const sendRequest = (index, deviceToken, token, isRetry) => {
            const headers = {
                ':method': 'POST',
                ':path': '/3/device/' + deviceToken,
                'authorization': 'bearer ' + token,
            };
            Object.assign(headers, notificationHeaders);
            this.sendPostRequest(headers, compiledPayload, deviceToken).then(result => {
                // Retry once on ExpiredProviderToken
                if (!isRetry && this.isExpiredTokenError(result)) {
                    currentToken = this.forceRefreshToken();
                    sendRequest(index, deviceToken, currentToken, true);
                    return;
                }
                results[index] = result;
                inFlight--;
                if (nextIndex < tokens.length) {
                    processNext();
                }
                else if (inFlight === 0) {
                    resolveAll();
                }
            });
        };
        const processNext = () => {
            while (inFlight < maxConcurrent && nextIndex < tokens.length) {
                const index = nextIndex++;
                const deviceToken = tokens[index];
                // Skip tokens that already have validation errors
                if (results[index]) {
                    continue;
                }
                inFlight++;
                sendRequest(index, deviceToken, currentToken, false);
            }
            // If no requests in flight and no more tokens to process, we're done
            // (handles case where remaining tokens all had validation errors)
            if (inFlight === 0 && nextIndex >= tokens.length) {
                resolveAll();
            }
        };
        return new Promise(resolve => {
            resolveAll = () => resolve(results);
            if (tokens.length === 0) {
                resolveAll();
            }
            else {
                processNext();
            }
        });
    }
    sendPostRequest(headers, payload, deviceToken) {
        return new Promise((resolve) => {
            let req;
            try {
                req = this.session.request(headers);
            }
            catch (err) {
                resolve({ error: err, device: deviceToken });
                return;
            }
            let settled = false;
            let status;
            const settle = (result) => {
                if (settled)
                    return;
                settled = true;
                if (timeoutId)
                    clearTimeout(timeoutId);
                resolve(result);
            };
            const timeoutId = setTimeout(() => {
                settle({ error: new Error('Request timeout'), device: deviceToken });
                try {
                    req.close(http2_1.constants.NGHTTP2_CANCEL);
                }
                catch ( /* noop */_a) { /* noop */ }
            }, this.options.requestTimeout);
            req.setEncoding('utf8');
            req.on('response', (responseHeaders) => {
                var _a;
                status = (_a = responseHeaders[http2_1.constants.HTTP2_HEADER_STATUS]) === null || _a === void 0 ? void 0 : _a.toString();
                let data = '';
                req.on('data', (chunk) => data += chunk);
                req.on('end', () => settle({ status, body: data, device: deviceToken }));
            });
            req.on('error', (err) => settle({ error: err, device: deviceToken }));
            req.on('close', () => {
                // Include status if we received response headers before the stream closed
                if (status) {
                    settle({ status, error: new Error('Stream closed unexpectedly'), device: deviceToken });
                }
                else {
                    settle({ error: new Error('Stream closed unexpectedly'), device: deviceToken });
                }
            });
            try {
                req.write(payload);
                req.end();
            }
            catch (err) {
                settle({ error: err, device: deviceToken });
                try {
                    req.close(http2_1.constants.NGHTTP2_CANCEL);
                }
                catch ( /* noop */_a) { /* noop */ }
            }
        });
    }
    shutdown() {
        var _a;
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
        (_a = this.session) === null || _a === void 0 ? void 0 : _a.destroy();
    }
}
exports.APNPushProvider = APNPushProvider;
APNPushProvider.DEVICE_TOKEN_REGEX = /^[0-9a-fA-F]+$/;
//# sourceMappingURL=APNPushProvider.js.map