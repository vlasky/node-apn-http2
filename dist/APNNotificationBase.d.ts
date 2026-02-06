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
export declare class APNNotificationBase {
    aps: APSPayload;
    _mdm: string | undefined;
    set alert(value: APSAlert | string | undefined | null);
    get body(): string | undefined;
    private validateNonEmptyString;
    private validateStringArray;
    set body(value: string | null | undefined);
    set locKey(value: string | null | undefined);
    set locArgs(value: string[] | null | undefined);
    set title(value: string | null | undefined);
    set subtitle(value: string | null | undefined);
    set titleLocKey(value: string | null | undefined);
    set titleLocArgs(value: string[] | null | undefined);
    set actionLocKey(value: string | null | undefined);
    set launchImage(value: string | null | undefined);
    set badge(value: number | undefined | null);
    set sound(value: string | APSSound | null | undefined);
    set contentAvailable(value: boolean | number | null | undefined);
    set mutableContent(value: boolean | number | null | undefined);
    set mdm(value: string | null | undefined);
    set urlArgs(value: string[] | null | undefined);
    set category(value: string | null | undefined);
    set threadId(value: string | null | undefined);
    prepareAlert(): void;
}
export {};
