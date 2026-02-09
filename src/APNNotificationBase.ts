export interface APSAlert {
  title?: string;
  subtitle?: string;
  body?: string;
  "loc-key"?: string;
  "loc-args"?: string[];
  "title-loc-key"?: string;
  "title-loc-args"?: string[];
  "action-loc-key"?: string;
  "launch-image"?: string;
}

/**
 * Sound dictionary for custom or critical alert sounds.
 * 'name' is always required for sound dictionaries (use string for simple sounds like "default").
 * 'critical' enables critical alerts (iOS 12+) for immediate attention (medical, security, etc.).
 * 'volume' must be between 0.0 and 1.0 (enforced at runtime).
 */
export interface APSSound {
  name: string;
  critical?: 0 | 1;
  volume?: number;
}

interface APSPayload {
  alert?: APSAlert | string;
  category?: string;
  badge?: number;
  sound?: string | APSSound;
  "content-available"?: number;
  "mutable-content"?: number;
  "url-args"?: string[];
  "thread-id"?: string;
}

export class APNNotificationBase {
    private static readonly ALERT_ALLOWED_FIELDS = new Set([
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

    private static readonly ALERT_ARRAY_FIELDS = new Set([
      "loc-args",
      "title-loc-args"
    ]);

    aps: APSPayload = {};

    _mdm: string | undefined;
  
    set alert(value: APSAlert | string | undefined | null) {
      if (value == null) {
        this.aps.alert = undefined;
      } else if (typeof value === 'string') {
        if (value === '') {
          throw new Error("alert must be a non-empty string");
        }
        // Replace entire alert with string (clears any previous title/subtitle/etc.)
        this.aps.alert = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Validate alert object fields
        for (const [k, v] of Object.entries(value)) {
          if (!APNNotificationBase.ALERT_ALLOWED_FIELDS.has(k)) {
            throw new Error(`alert.${k} is not a supported APNs alert field`);
          }
          if (v == null) continue;
          const isArrayField = APNNotificationBase.ALERT_ARRAY_FIELDS.has(k);
          if (Array.isArray(v)) {
            if (!isArrayField) {
              throw new Error(`alert.${k} must be a non-empty string`);
            }
            // Array fields (loc-args, title-loc-args) - validate elements are non-empty strings if present
            if (v.length > 0 && !v.every(item => typeof item === 'string' && item !== '')) {
              throw new Error(`alert.${k} must be an array of non-empty strings`);
            }
          } else if (isArrayField || typeof v !== 'string' || v === '') {
            throw new Error(`alert.${k} must be a non-empty string`);
          }
        }
        this.aps.alert = value;
      } else {
        throw new Error("alert must be a string or an object");
      }
    }

    get body(): string | undefined {
      if (this.aps.alert !== null && typeof this.aps.alert === 'object') {
        return this.aps.alert.body;
      } else if (typeof this.aps.alert === 'string') {
        return this.aps.alert;
      }
      return undefined;
    }

    private validateNonEmptyString(value: string, field: string): void {
      if (typeof value !== 'string' || value === '') {
        throw new Error(`${field} must be a non-empty string`);
      }
    }

    private validateStringArray(value: string[], field: string): void {
      if (!Array.isArray(value) || (value.length > 0 && !value.every(item => typeof item === 'string' && item !== ''))) {
        throw new Error(`${field} must be an array of non-empty strings`);
      }
    }

    set body(value: string | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert).body = undefined;
        }
      } else {
        this.validateNonEmptyString(value, 'body');
        this.prepareAlert();
        (this.aps.alert as APSAlert).body = value;
      }
    }

    set locKey(value: string | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert)["loc-key"] = undefined;
        }
      } else {
        this.validateNonEmptyString(value, 'locKey');
        this.prepareAlert();
        (this.aps.alert as APSAlert)["loc-key"] = value;
      }
    }

    set locArgs(value: string[] | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert)["loc-args"] = undefined;
        }
      } else {
        this.validateStringArray(value, 'locArgs');
        this.prepareAlert();
        (this.aps.alert as APSAlert)["loc-args"] = value;
      }
    }

    set title(value: string | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert).title = undefined;
        }
      } else {
        this.validateNonEmptyString(value, 'title');
        this.prepareAlert();
        (this.aps.alert as APSAlert).title = value;
      }
    }

    set subtitle(value: string | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert).subtitle = undefined;
        }
      } else {
        this.validateNonEmptyString(value, 'subtitle');
        this.prepareAlert();
        (this.aps.alert as APSAlert).subtitle = value;
      }
    }

    set titleLocKey(value: string | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert)["title-loc-key"] = undefined;
        }
      } else {
        this.validateNonEmptyString(value, 'titleLocKey');
        this.prepareAlert();
        (this.aps.alert as APSAlert)["title-loc-key"] = value;
      }
    }

    set titleLocArgs(value: string[] | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert)["title-loc-args"] = undefined;
        }
      } else {
        this.validateStringArray(value, 'titleLocArgs');
        this.prepareAlert();
        (this.aps.alert as APSAlert)["title-loc-args"] = value;
      }
    }

    set actionLocKey(value: string | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert)["action-loc-key"] = undefined;
        }
      } else {
        this.validateNonEmptyString(value, 'actionLocKey');
        this.prepareAlert();
        (this.aps.alert as APSAlert)["action-loc-key"] = value;
      }
    }

    set launchImage(value: string | null | undefined) {
      if (value == null) {
        if (this.aps.alert && typeof this.aps.alert === 'object') {
          (this.aps.alert as APSAlert)["launch-image"] = undefined;
        }
      } else {
        this.validateNonEmptyString(value, 'launchImage');
        this.prepareAlert();
        (this.aps.alert as APSAlert)["launch-image"] = value;
      }
    }
  
    set badge(value: number | undefined | null) {
      if (value == null) {
        this.aps.badge = undefined;
      } else if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        throw new Error("badge must be a non-negative integer");
      } else {
        this.aps.badge = value;
      }
    }

    set sound(value: string | APSSound | null | undefined) {
      if (value == null) {
        this.aps.sound = undefined;
      } else if (typeof value === "string") {
        if (value === "") {
          throw new Error("sound must be a non-empty string");
        }
        this.aps.sound = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
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
      } else {
        throw new Error("sound must be a string or an APSSound object");
      }
    }

    set contentAvailable(value: boolean | number | null | undefined) {
      if (value == null || value === false || value === 0) {
        this.aps["content-available"] = undefined;
      } else if (value === true || value === 1) {
        this.aps["content-available"] = 1;
      } else {
        throw new Error("contentAvailable must be a boolean or 0/1");
      }
    }

    set mutableContent(value: boolean | number | null | undefined) {
      if (value == null || value === false || value === 0) {
        this.aps["mutable-content"] = undefined;
      } else if (value === true || value === 1) {
        this.aps["mutable-content"] = 1;
      } else {
        throw new Error("mutableContent must be a boolean or 0/1");
      }
    }

    set mdm(value: string | null | undefined) {
      if (value != null && (typeof value !== 'string' || value === "")) {
        throw new Error("mdm must be a non-empty string");
      }
      this._mdm = value ?? undefined;
    }

    set urlArgs(value: string[] | null | undefined) {
      if (value == null) {
        this.aps["url-args"] = undefined;
      } else if (!Array.isArray(value) || (value.length > 0 && !value.every(arg => typeof arg === 'string' && arg !== ''))) {
        throw new Error("urlArgs must be an array of non-empty strings");
      } else {
        this.aps["url-args"] = value;
      }
    }

    set category(value: string | null | undefined) {
      if (value != null && (typeof value !== 'string' || value === '')) {
        throw new Error("category must be a non-empty string");
      }
      this.aps.category = value ?? undefined;
    }

    set threadId(value: string | null | undefined) {
      if (value != null && (typeof value !== 'string' || value === '')) {
        throw new Error("threadId must be a non-empty string");
      }
      this.aps["thread-id"] = value ?? undefined;
    }

    prepareAlert() {
      if (!(this.aps.alert !== null && typeof this.aps.alert === 'object')) {
        this.aps.alert = typeof this.aps.alert === "string" ? { body: this.aps.alert } : {};
      }
    }
}
