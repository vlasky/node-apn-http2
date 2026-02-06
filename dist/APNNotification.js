"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APNNotification = void 0;
const APNNotificationBase_1 = require("./APNNotificationBase");
class APNNotification extends APNNotificationBase_1.APNNotificationBase {
    get topic() {
        return this._topic;
    }
    set topic(value) {
        if (value == null) {
            this._topic = undefined;
        }
        else if (typeof value !== 'string' || value === '') {
            throw new Error("topic must be a non-empty string");
        }
        else {
            this._topic = value;
        }
    }
    get expiry() {
        return this._expiry;
    }
    set expiry(value) {
        if (value == null) {
            this._expiry = undefined;
        }
        else if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
            throw new Error("expiry must be a non-negative integer");
        }
        else {
            this._expiry = value;
        }
    }
    get priority() {
        return this._priority;
    }
    set priority(value) {
        if (value == null) {
            this._priority = undefined;
        }
        else if (!APNNotification.VALID_PRIORITIES.includes(value)) {
            throw new Error("priority must be 1, 5, or 10");
        }
        else {
            this._priority = value;
        }
    }
    get pushType() {
        return this._pushType;
    }
    set pushType(value) {
        this._pushTypeWarningShown = false;
        if (value == null) {
            this._pushType = undefined;
        }
        else if (!APNNotification.VALID_PUSH_TYPES.includes(value)) {
            throw new Error(`pushType must be one of: ${APNNotification.VALID_PUSH_TYPES.join(', ')}`);
        }
        else {
            this._pushType = value;
        }
    }
    get collapseId() {
        return this._collapseId;
    }
    set collapseId(value) {
        if (value == null) {
            this._collapseId = undefined;
        }
        else if (typeof value !== 'string' || value === '') {
            throw new Error("collapseId must be a non-empty string");
        }
        else if (Buffer.byteLength(value, 'utf8') > 64) {
            throw new Error("collapseId must not exceed 64 bytes");
        }
        else {
            this._collapseId = value;
        }
    }
    get id() {
        return this._id;
    }
    set id(value) {
        if (value == null) {
            this._id = undefined;
        }
        else if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            throw new Error("id must be a valid UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)");
        }
        else {
            this._id = value;
        }
    }
    constructor(payload = {}) {
        super();
        this.encoding = 'utf8';
        this._expiry = undefined;
        this._priority = undefined;
        this._pushType = undefined;
        this._topic = undefined;
        this._collapseId = undefined;
        this._id = undefined;
        this._pushTypeWarningShown = false;
        this.rawPayload = undefined;
        this.payload = payload;
    }
    /**
     * Check if alert has actual content (not an empty object or object with only undefined values)
     */
    hasAlertContent() {
        if (this.aps.alert == null)
            return false;
        if (typeof this.aps.alert === 'string') {
            return true;
        }
        // Check for at least one key with a non-null/undefined value
        return Object.values(this.aps.alert).some(value => value != null);
    }
    /**
     * Check if notification has visible content (alert, badge, or sound)
     * Uses != null to treat both null and undefined as absent (consistent with apsPayload filtering)
     */
    hasVisibleContent() {
        return this.hasAlertContent() || this.aps.badge != null || this.aps.sound != null;
    }
    validatePriority() {
        // Always validate priority is a valid value (even with rawPayload)
        if (this.priority != null && !APNNotification.VALID_PRIORITIES.includes(this.priority)) {
            throw new Error(`Invalid priority '${this.priority}'. Valid values: ${APNNotification.VALID_PRIORITIES.join(', ')}`);
        }
        // Skip aps-based validation when rawPayload is set (user takes full responsibility)
        if (this.rawPayload != null) {
            return;
        }
        // Apple rejects priority 10 for pure background notifications (content-available without alert/badge/sound)
        if (this.priority === 10 && this.aps["content-available"] === 1 && !this.hasVisibleContent()) {
            throw new Error("Invalid priority: priority 10 cannot be used with content-available notifications that have no alert, badge, or sound. " +
                "Use priority 5 for background notifications.");
        }
    }
    headers() {
        const headers = {};
        // When rawPayload is set, skip aps-based validation and auto-detection
        // User takes full responsibility for payload correctness
        const useRawPayload = this.rawPayload != null;
        this.validatePriority();
        if (this.priority) {
            //The default APN priority is 10, so if it's set to that, we will leave it out of the header to save space
            if (this.priority !== 10) {
                headers["apns-priority"] = this.priority;
            }
        }
        else if (!useRawPayload) {
            //If this notification is an alert or badge or sound, the priority will also be left at the default value
            if (this.hasVisibleContent()) {
                // Default priority 10, no header needed
                //Apple's new rules for iOS 13 require content-available notifications to have a priority of 5
            }
            else if (this.aps["content-available"] === 1) {
                headers["apns-priority"] = 5;
            }
        }
        if (this.pushType != null) {
            //If a pushType has been provided, use that
            this.validatePushType();
            headers["apns-push-type"] = this.pushType;
        }
        else if (!useRawPayload) {
            // MDM payloads always use mdm push-type, check before aps fields
            if (typeof this._mdm === 'string') {
                headers["apns-push-type"] = "mdm";
                //Anything with an alert or badge or sound is considered an alert
            }
            else if (this.hasVisibleContent()) {
                headers["apns-push-type"] = "alert";
                //Otherwise, Apple's new rules for iOS 13 require pure content-available notifications to have a push type of background
            }
            else if (this.aps["content-available"] === 1) {
                headers["apns-push-type"] = "background";
            }
            else {
                throw new Error("Cannot determine push type automatically. " +
                    "Set notification.pushType explicitly to 'alert', 'background', 'voip', 'mdm', etc.");
            }
        }
        else if (!this._pushTypeWarningShown) {
            // rawPayload is set but no pushType - warn user
            this._pushTypeWarningShown = true;
            console.warn("rawPayload is set but pushType is not specified. " +
                "Set notification.pushType explicitly to 'alert', 'background', 'voip', 'mdm', etc. " +
                "Notification may be rejected by Apple.");
        }
        if (this.id) {
            headers["apns-id"] = this.id;
        }
        if (this.expiry != null) {
            headers["apns-expiration"] = this.expiry;
        }
        if (this.topic) {
            headers["apns-topic"] = this.topic;
        }
        else {
            throw new Error("Missing required 'topic' (your app's bundle ID). " +
                "This is required for token-based authentication. " +
                "Certificate-based authentication does not require a topic, but is not currently supported by this library.");
        }
        if (this.collapseId) {
            headers["apns-collapse-id"] = this.collapseId;
        }
        return headers;
    }
    compile() {
        const payload = JSON.stringify(this);
        const maxSize = this.pushType === 'voip' ? 5120 : 4096;
        const payloadSize = Buffer.byteLength(payload, 'utf8');
        if (payloadSize > maxSize) {
            throw new Error(`Payload size ${payloadSize} bytes exceeds maximum ${maxSize} bytes for ${this.pushType || 'standard'} notifications`);
        }
        return payload;
    }
    apsPayload() {
        // Process alert object - filter out undefined/null values
        let alertValue = this.aps.alert;
        if (alertValue && typeof alertValue === 'object') {
            const filteredAlert = {};
            for (const [k, v] of Object.entries(alertValue)) {
                if (v != null) {
                    filteredAlert[k] = v;
                }
            }
            // If no content remains, treat alert as undefined
            alertValue = Object.keys(filteredAlert).length > 0 ? filteredAlert : undefined;
        }
        const aps = Object.assign(Object.assign({}, this.aps), { alert: alertValue });
        // Filter out null, undefined, and invalid content-available/mutable-content values
        const filtered = {};
        for (const key of Object.keys(aps)) {
            const value = aps[key];
            if (value == null) {
                continue;
            }
            // content-available and mutable-content must be exactly 1 (Apple rejects 0 or other values)
            if ((key === 'content-available' || key === 'mutable-content') && value !== 1) {
                continue;
            }
            filtered[key] = value;
        }
        return Object.keys(filtered).length > 0 ? filtered : undefined;
    }
    validatePushType() {
        // Always validate pushType is a valid value (even with rawPayload)
        if (this.pushType != null && !APNNotification.VALID_PUSH_TYPES.includes(this.pushType)) {
            throw new Error(`Invalid pushType '${this.pushType}'. Valid types: ${APNNotification.VALID_PUSH_TYPES.join(', ')}`);
        }
        // Skip aps-based validation when rawPayload is set (user takes full responsibility)
        if (this.rawPayload != null) {
            return;
        }
        // Background notifications require content-available and must be silent (no visible content)
        if (this.pushType === 'background') {
            if (this.aps["content-available"] !== 1) {
                throw new Error("Invalid payload for background push: pushType is 'background' but content-available is not set to 1. " +
                    "Background notifications require content-available: 1 in the aps payload.");
            }
            if (this.hasVisibleContent()) {
                throw new Error("Invalid payload for background push: pushType is 'background' but notification has visible content (alert, badge, or sound). " +
                    "Background notifications must be silent.");
            }
        }
        // Alert notifications require visible content
        if (this.pushType === 'alert' && !this.hasVisibleContent()) {
            throw new Error("Invalid payload for alert push: pushType is 'alert' but notification has no visible content. " +
                "Alert notifications require alert, badge, or sound.");
        }
        // MDM notifications require _mdm to be set
        if (this.pushType === 'mdm' && typeof this._mdm !== 'string') {
            throw new Error("Invalid payload for mdm push: pushType is 'mdm' but mdm payload is not set. " +
                "MDM notifications require the mdm property to be set.");
        }
        // If _mdm is set, pushType must be 'mdm' (or unset for auto-detection)
        if (typeof this._mdm === 'string' && this.pushType != null && this.pushType !== 'mdm') {
            throw new Error(`Invalid pushType '${this.pushType}' for mdm notification. ` +
                "When mdm payload is set, pushType must be 'mdm' or left unset for auto-detection.");
        }
    }
    toJSON() {
        if (this.rawPayload != null) {
            return this.rawPayload;
        }
        if (typeof this._mdm === "string") {
            return { "mdm": this._mdm };
        }
        const aps = this.apsPayload();
        if (aps == null) {
            throw new Error("Invalid notification: aps payload is empty. " +
                "Standard notifications require at least one aps field (alert, badge, sound, or content-available). " +
                "Use rawPayload for custom payloads or set mdm for MDM notifications.");
        }
        if (this.payload && 'aps' in this.payload) {
            throw new Error("payload must not contain an 'aps' key; use the aps property setters instead");
        }
        return Object.assign({}, this.payload, { aps });
    }
}
exports.APNNotification = APNNotification;
APNNotification.VALID_PUSH_TYPES = [
    'alert', 'background', 'voip', 'complication',
    'fileprovider', 'mdm', 'pushtotalk', 'liveactivity', 'location'
];
APNNotification.VALID_PRIORITIES = [1, 5, 10];
//# sourceMappingURL=APNNotification.js.map