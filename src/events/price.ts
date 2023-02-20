import {insert, query} from "../storage/database/query";
import {EventPrice} from "../../db/types/Events";
import {EventAlreadyHasPriceError} from "./errors";

/**
 * Sets the price of the given event for a given category.
 * @param eventId The id of the event to price.
 * @param price The price in euros of the event.
 * @param categoryId The id of the category that will have this price. `null` for setting fallback price. This is, for
 * the rest of categories, or unknown ones.
 * @throws {EventAlreadyHasPriceError} If the event given already has a price set for the given category.
 */
export async function setEventPrice(eventId: number, price: number, categoryId: number | null): Promise<boolean> {
    // Check if there's already a price for the category at the event
    let prices: any[];
    if (categoryId == null)
        prices = await query(`SELECT * FROM EventPrice WHERE Event=? AND Category IS NULL`, eventId);
    else
        prices = await query(`SELECT * FROM EventPrice WHERE Event=? AND Category=?`, eventId, categoryId);

    if (prices.length > 0) throw new EventAlreadyHasPriceError(eventId, categoryId);

    // If the event doesn't have a price yet for the given category, set it now
    const rowCount = await insert('EventPrice', {Event: eventId, Category: categoryId, Price: price});
    return rowCount > 0;
}

/**
 * Sets the price of the given event for a given category.
 * @param eventId The id of the event to price.
 * @param categoryId The id of the category that will have this price. `null` for the fallback price. This is, for the
 * rest of categories, or unknown ones.
 */
export async function removeEventPrice(eventId: number, categoryId: number | null): Promise<void> {
    if (categoryId == null)
        await query(`DELETE FROM EventPrice WHERE Event=? AND Category IS NULL`, eventId);
    else
        await query(`DELETE FROM EventPrice WHERE Event=? AND Category=?`, eventId, categoryId);
}

/**
 * Gets all the prices stored for the given event.
 * @param eventId The id of the event to fetch.
 */
export async function getEventPrices(eventId: number): Promise<EventPrice[]> {
    return await query('SELECT * FROM EventPrice WHERE Event=?', eventId);
}
