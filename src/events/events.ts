import {insert, query} from "../storage/database/query";
import {EventItem, EventType} from "../../db/types/Events";
import {Event} from "./types";
import {getEventPrices} from "./price";

/**
 * Creates a new event in the database.
 * @param displayName The display name of the event.
 * @param date When the event will take place.
 * @param location Where the event will take place.
 * @param type The type of event.
 * @param description An optional description. Supports markdown.
 * @see EventType
 * @return If the request was successful.
 */
export async function newEvent(displayName: string, date: Date, location: string, type: EventType, description?: string): Promise<boolean> {
    const count = await insert('EventList', {
        DisplayName: displayName,
        DateTime: date.getDate(),
        Location: location,
        Type: type,
        Description: description,
    });
    return count > 0;
}

/**
 * Removes an event from the database.
 * @param id The id of the event to remove.
 * @return If the request was successful.
 */
export async function removeEvent(id: number): Promise<void> {
    await query('DELETE FROM EventList WHERE Id=?', id);
    // TODO: Removing an event should remove all the associated data: prices, menus...
}

/**
 * Gets a list of all the events available in the database.
 */
export async function getEvents(): Promise<EventItem[]> {
    return await query('SELECT * FROM EventList');
}

/**
 * Gets a list of all the events in the database with their respective data.
 */
export async function getEventsData(): Promise<Event[]> {
    const events = await getEvents();
    let eventsWithPrice: Event[] = [];
    for (const event of events) {
        const prices = await getEventPrices(event.Id);
        eventsWithPrice.push({
            Id: event.Id,
            DisplayName: event.DisplayName,
            Date: new Date(event.DateTime),
            Location: event.Location,
            Type: event.Type,
            Prices: prices.map(price => { return {Category: price.Category, Price: price.Price} }),
        });
    }
    return eventsWithPrice;
}

/**
 * Returns an EventType from its name.
 * @param name The name to search for.
 * @see EventType
 */
export function eventTypeFromName(name: string): EventType {
    switch (name) {
        case 'eat':
            return EventType.eat
        case 'parade':
            return EventType.parade
        default:
            return EventType.generic
    }
}
