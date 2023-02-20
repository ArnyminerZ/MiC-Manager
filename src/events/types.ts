import {EventType} from "../../db/types/Events";

export type EventPrice = {
    Category: number,
    Price: number,
}

export type Event = {
    Id: number,
    DisplayName: string,
    Date: Date,
    Description?: string,
    Location: string,
    Type: EventType,
    Prices: EventPrice[],
}