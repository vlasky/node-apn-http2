export declare class APNNotificationBase {
    aps: {
        alert: {
            title?: string;
            subtitle?: string;
            action?: string;
            body: string;
        };
        category: string;
        badge: number;
        sound: string;
    };
    _mdm: any;
    set alert(value: any);
    get body(): string;
    set body(value: string);
    set locKey(value: any);
    set locArgs(value: any);
    set title(value: any);
    set subtitle(value: any);
    set titleLocKey(value: any);
    set titleLocArgs(value: any);
    set action(value: any);
    set actionLocKey(value: any);
    set launchImage(value: any);
    set badge(value: any);
    set sound(value: any);
    set contentAvailable(value: any);
    set mutableContent(value: any);
    set mdm(value: any);
    set urlArgs(value: any);
    set category(value: any);
    set threadId(value: any);
    prepareAlert(): void;
}
