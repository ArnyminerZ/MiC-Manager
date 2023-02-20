export enum EventType {
    generic = 1,
    eat = 1,
    parade = 1
}

export type EventItem = {
    Id: number,
    DisplayName: string,
    DateTime: number,
    Description?: string,
    Location: string,
    Type: EventType,
};

export type EventPrice = {
    Id: number,
    Event: number,
    Category: number,
    Price: number
};
