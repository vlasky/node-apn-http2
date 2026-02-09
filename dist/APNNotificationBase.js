"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APNNotificationBase = void 0;
class APNNotificationBase {
    constructor() {
        this.aps = {};
    }
    set alert(value) {
        if (value == null) {
            this.aps.alert = undefined;
        }
        else if (typeof value === 'string') {
            if (value === '') {
                throw new Error("alert must be a non-empty string");
            }
            // Replace entire alert with string (clears any previous title/subtitle/etc.)
            this.aps.alert = value;
        }
        else if (typeof value === 'object' && !Array.isArray(value)) {
            // Validate alert object fields
            for (const [k, v] of Object.entries(value)) {
                if (!APNNotificationBase.ALERT_ALLOWED_FIELDS.has(k)) {
                    throw new Error(`alert.${k} is not a supported APNs alert field`);
                }
                if (v == null)
                    continue;
                const isArrayField = APNNotificationBase.ALERT_ARRAY_FIELDS.has(k);
                if (Array.isArray(v)) {
                    if (!isArrayField) {
                        throw new Error(`alert.${k} must be a non-empty string`);
                    }
                    // Array fields (loc-args, title-loc-args) - validate elements are non-empty strings if present
                    if (v.length > 0 && !v.every(item => typeof item === 'string' && item !== '')) {
                        throw new Error(`alert.${k} must be an array of non-empty strings`);
                    }
                }
                else if (isArrayField || typeof v !== 'string' || v === '') {
                    throw new Error(`alert.${k} must be a non-empty string`);
                }
            }
            this.aps.alert = value;
        }
        else {
            throw new Error("alert must be a string or an object");
        }
    }
    get body() {
        if (this.aps.alert !== null && typeof this.aps.alert === 'object') {
            return this.aps.alert.body;
        }
        else if (typeof this.aps.alert === 'string') {
            return this.aps.alert;
        }
        return undefined;
    }
    validateNonEmptyString(value, field) {
        if (typeof value !== 'string' || value === '') {
            throw new Error(`${field} must be a non-empty string`);
        }
    }
    validateStringArray(value, field) {
        if (!Array.isArray(value) || (value.length > 0 && !value.every(item => typeof item === 'string' && item !== ''))) {
            throw new Error(`${field} must be an array of non-empty strings`);
        }
    }
    set body(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert.body = undefined;
            }
        }
        else {
            this.validateNonEmptyString(value, 'body');
            this.prepareAlert();
            this.aps.alert.body = value;
        }
    }
    set locKey(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert["loc-key"] = undefined;
            }
        }
        else {
            this.validateNonEmptyString(value, 'locKey');
            this.prepareAlert();
            this.aps.alert["loc-key"] = value;
        }
    }
    set locArgs(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert["loc-args"] = undefined;
            }
        }
        else {
            this.validateStringArray(value, 'locArgs');
            this.prepareAlert();
            this.aps.alert["loc-args"] = value;
        }
    }
    set title(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert.title = undefined;
            }
        }
        else {
            this.validateNonEmptyString(value, 'title');
            this.prepareAlert();
            this.aps.alert.title = value;
        }
    }
    set subtitle(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert.subtitle = undefined;
            }
        }
        else {
            this.validateNonEmptyString(value, 'subtitle');
            this.prepareAlert();
            this.aps.alert.subtitle = value;
        }
    }
    set titleLocKey(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert["title-loc-key"] = undefined;
            }
        }
        else {
            this.validateNonEmptyString(value, 'titleLocKey');
            this.prepareAlert();
            this.aps.alert["title-loc-key"] = value;
        }
    }
    set titleLocArgs(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert["title-loc-args"] = undefined;
            }
        }
        else {
            this.validateStringArray(value, 'titleLocArgs');
            this.prepareAlert();
            this.aps.alert["title-loc-args"] = value;
        }
    }
    set actionLocKey(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert["action-loc-key"] = undefined;
            }
        }
        else {
            this.validateNonEmptyString(value, 'actionLocKey');
            this.prepareAlert();
            this.aps.alert["action-loc-key"] = value;
        }
    }
    set launchImage(value) {
        if (value == null) {
            if (this.aps.alert && typeof this.aps.alert === 'object') {
                this.aps.alert["launch-image"] = undefined;
            }
        }
        else {
            this.validateNonEmptyString(value, 'launchImage');
            this.prepareAlert();
            this.aps.alert["launch-image"] = value;
        }
    }
    set badge(value) {
        if (value == null) {
            this.aps.badge = undefined;
        }
        else if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
            throw new Error("badge must be a non-negative integer");
        }
        else {
            this.aps.badge = value;
        }
    }
    set sound(value) {
        if (value == null) {
            this.aps.sound = undefined;
        }
        else if (typeof value === "string") {
            if (value === "") {
                throw new Error("sound must be a non-empty string");
            }
            this.aps.sound = value;
        }
        else if (typeof value === 'object' && !Array.isArray(value)) {
            // Sound dictionary - validate constraints (JS callers can pass anything)
            // Apple requires 'name' for any sound dictionary
            if (typeof value.name !== 'string' || !value.name) {
                throw new Error("sound.name is required and must be a non-empty string");
            }
            if (value.critical != null && value.critical !== 0 && value.critical !== 1) {
                throw new Error("sound.critical must be 0 or 1");
            }
            if (value.volume != null && (typeof value.volume !== 'number' || !Number.isFinite(value.volume) || value.volume < 0 || value.volume > 1)) {
                throw new Error("sound.volume must be a number between 0.0 and 1.0");
            }
            this.aps.sound = value;
        }
        else {
            throw new Error("sound must be a string or an APSSound object");
        }
    }
    set contentAvailable(value) {
        if (value == null || value === false || value === 0) {
            this.aps["content-available"] = undefined;
        }
        else if (value === true || value === 1) {
            this.aps["content-available"] = 1;
        }
        else {
            throw new Error("contentAvailable must be a boolean or 0/1");
        }
    }
    set mutableContent(value) {
        if (value == null || value === false || value === 0) {
            this.aps["mutable-content"] = undefined;
        }
        else if (value === true || value === 1) {
            this.aps["mutable-content"] = 1;
        }
        else {
            throw new Error("mutableContent must be a boolean or 0/1");
        }
    }
    set mdm(value) {
        if (value != null && (typeof value !== 'string' || value === "")) {
            throw new Error("mdm must be a non-empty string");
        }
        this._mdm = value !== null && value !== void 0 ? value : undefined;
    }
    set urlArgs(value) {
        if (value == null) {
            this.aps["url-args"] = undefined;
        }
        else if (!Array.isArray(value) || (value.length > 0 && !value.every(arg => typeof arg === 'string' && arg !== ''))) {
            throw new Error("urlArgs must be an array of non-empty strings");
        }
        else {
            this.aps["url-args"] = value;
        }
    }
    set category(value) {
        if (value != null && (typeof value !== 'string' || value === '')) {
            throw new Error("category must be a non-empty string");
        }
        this.aps.category = value !== null && value !== void 0 ? value : undefined;
    }
    set threadId(value) {
        if (value != null && (typeof value !== 'string' || value === '')) {
            throw new Error("threadId must be a non-empty string");
        }
        this.aps["thread-id"] = value !== null && value !== void 0 ? value : undefined;
    }
    prepareAlert() {
        if (!(this.aps.alert !== null && typeof this.aps.alert === 'object')) {
            this.aps.alert = typeof this.aps.alert === "string" ? { body: this.aps.alert } : {};
        }
    }
}
exports.APNNotificationBase = APNNotificationBase;
APNNotificationBase.ALERT_ALLOWED_FIELDS = new Set([
    "title",
    "subtitle",
    "body",
    "loc-key",
    "loc-args",
    "title-loc-key",
    "title-loc-args",
    "action-loc-key",
    "launch-image"
]);
APNNotificationBase.ALERT_ARRAY_FIELDS = new Set([
    "loc-args",
    "title-loc-args"
]);
//# sourceMappingURL=APNNotificationBase.js.map