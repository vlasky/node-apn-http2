"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APNNotificationBase_1 = require("./APNNotificationBase");
class APNNotification extends APNNotificationBase_1.APNNotificationBase {
    constructor(payload = {}) {
        super();
        this.payload = payload;
        this.encoding = 'utf8';
        this.compiled = null;
        this.expiry = 0;
        this.priority = null;
        this.pushType = null;
        this.topic = null;
        this.collapseId = null;
        this.id = null;
    }
    headers() {
        let headers = {};
        if (this.priority) {
            //The default APN priority is 10, so if it's set to that, we will leave it out of the header to save space
            if (this.priority !== 10) {
                headers["apns-priority"] = this.priority;
            }
            //If this notification is an alert or badge or sound, the priority will also be left at the default value 
        }
        else if (this.aps.alert || this.aps.badge || this.aps.sound) {
            //Apple's new rules for iOS 13 require content-available notifications to have a priority of 5
        }
        else if (this.aps["content-available"] === 1) {
            headers["apns-priority"] = 5;
        }
        if (this.pushType) {
            //If a pushType has been provided, use that
            headers["apns-push-type"] = this.pushType;
            //Anything with an alert or badge or sound is considered an alert
        }
        else if (this.aps.alert || this.aps.badge || this.aps.sound) {
            headers["apns-push-type"] = "alert";
            //Otherwise, Apple's new rules for iOS 13 require pure content-available notifications to have a push type of background 
        }
        else if (this.aps["content-available"] === 1) {
            headers["apns-push-type"] = "background";
        }
        else {
            console.warn("APNNotification.ts::headers(): pushType not specified for APN notification. Might not be relayed by Apple.");
        }
        if (this.id) {
            headers["apns-id"] = this.id;
        }
        if (this.expiry > 0) {
            headers["apns-expiration"] = this.expiry;
        }
        if (this.topic) {
            headers["apns-topic"] = this.topic;
        }
        if (this.collapseId) {
            headers["apns-collapse-id"] = this.collapseId;
        }
        return headers;
    }
    compile() {
        if (!this.compiled) {
            this.compiled = JSON.stringify(this);
        }
        return this.compiled;
    }
    apsPayload() {
        var aps = this.aps;
        return Object.keys(aps).find(key => aps[key] !== undefined) ? aps : undefined;
    }
    ;
    toJSON() {
        if (this.rawPayload != null) {
            return this.rawPayload;
        }
        if (typeof this._mdm === "string") {
            return { "mdm": this._mdm };
        }
        return Object.assign({}, this.payload, { aps: this.apsPayload() });
    }
    ;
}
exports.APNNotification = APNNotification;
//# sourceMappingURL=APNNotification.js.map