import { APNNotificationBase } from './APNNotificationBase';
type NotificationPayload = Record<string, any>;
export declare class APNNotification extends APNNotificationBase {
    static readonly VALID_PUSH_TYPES: readonly ["alert", "background", "voip", "complication", "fileprovider", "mdm", "pushtotalk", "liveactivity", "location"];
    static readonly VALID_PRIORITIES: readonly [1, 5, 10];
    encoding: string;
    private _expiry;
    private _priority;
    private _pushType;
    private _topic;
    private _collapseId;
    private _id;
    private _pushTypeWarningShown;
    get topic(): string | undefined;
    set topic(value: string | null | undefined);
    get expiry(): number | undefined;
    set expiry(value: number | null | undefined);
    get priority(): 1 | 5 | 10 | undefined;
    set priority(value: 1 | 5 | 10 | null | undefined);
    get pushType(): typeof APNNotification.VALID_PUSH_TYPES[number] | undefined;
    set pushType(value: typeof APNNotification.VALID_PUSH_TYPES[number] | null | undefined);
    get collapseId(): string | undefined;
    set collapseId(value: string | null | undefined);
    get id(): string | undefined;
    set id(value: string | null | undefined);
    rawPayload: NotificationPayload | undefined;
    payload: NotificationPayload;
    constructor(payload?: NotificationPayload);
    /**
     * Check if alert has actual content (not an empty object or object with only undefined values)
     */
    private hasAlertContent;
    /**
     * Check if notification has visible content (alert, badge, or sound)
     * Uses != null to treat both null and undefined as absent (consistent with apsPayload filtering)
     */
    private hasVisibleContent;
    private validatePriority;
    headers(): Record<string, string | number>;
    compile(): string;
    private apsPayload;
    private validatePushType;
    toJSON(): NotificationPayload;
}
export {};
