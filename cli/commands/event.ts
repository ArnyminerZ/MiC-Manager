import {
    eventTypeFromName,
    getEvent,
    getEventsData,
    newEvent,
    removeEvent,
    updateEventProperty
} from "../../src/events/events";
import {Event} from "../../src/events/types";
import {getEventPrices, removeEventPrice, setEventPrice} from "../../src/events/price";

export const definition: Command = {
    base: 'event',
    commands: [
        [
            {base: 'list', requiresDatabase: true, parameters: []},
            'Shows a list of all the events available.',
            async (): Promise<CommandResult> => {
                try {
                    const list: Event[] = await getEventsData();
                    if (list.length <= 0)
                        return {success: true, message: 'No events available. Create some with "event create".'}
                    const text = list
                        .map(item => `  ${item.Id} : ${item.DisplayName} (Type=${item.Type})\n` + [
                            `Date: ${item.Date}`,
                            `Location: ${item.Location}`,
                            `Description: ${item.Description}`,
                            `Prices:`,
                            ...item.Prices.map(price => `  ${price.Category} : ${price.Price} €`)
                        ].join('\n    '))
                        .join('\n');
                    return {success: true, message: `Events:\n${text}`};
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Events fetch error: ${e.message}`};
                    }
                    return {
                        success: false,
                        message: 'Unknown error occurred while getting the events from the database.'
                    }
                }
            }
        ],
        [
            {
                base: 'create',
                requiresDatabase: true,
                parameters: [['displayName', true], ['date', true], ['location', true], ['type', true], ['description', false]]
            },
            'Creates a new event in the database.',
            async (...args): Promise<CommandResult> => {
                const [displayName, dateRaw, location, typeRaw, description] = args;

                try {
                    if (displayName == null || dateRaw == null || location == null || typeRaw == null)
                        return {success: false, message: 'Missing parameters.'};

                    const date = new Date(dateRaw);
                    const type = eventTypeFromName(typeRaw);

                    const successful = await newEvent(displayName, date, location, type, description);
                    if (successful)
                        return {success: true, message: `Created new event "${displayName}"`};
                    else
                        return {success: false, message: `Could not create event.`};
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Event creation error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while creating the event.'}
                }
            },
        ],
        [
            {base: 'remove', requiresDatabase: true, parameters: [['id', true]]},
            'Removes an event from the database.',
            async (...args): Promise<CommandResult> => {
                const [id] = args;

                try {
                    if (id == null)
                        return {success: false, message: 'You must specify the id of the event to remove.'};

                    const eventId = parseInt(id);
                    await removeEvent(eventId);
                    return {success: true, message: `Removed event #${eventId}`};
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Event creation error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while creating the event.'}
                }
            },
        ],
        [
            {
                base: 'update',
                requiresDatabase: true,
                parameters: [['eventId', true], ['DisplayName|DateTime|Location|Type|Description', true], ['value', true]]
            },
            'Creates a new event in the database.',
            async (...args): Promise<CommandResult> => {
                const [eventIdStr, property, value] = args;

                try {
                    if (eventIdStr == null || property == null || value == null)
                        return {success: false, message: 'Missing parameters.'};

                    const eventId = parseInt(eventIdStr);
                    const event = await getEvent(eventId);
                    if (event == null)
                        return {success: false, message: `Could not find the event #${eventId}`};

                    if (property === 'DisplayName' || property === 'DateTime' || property === 'Location' || property === 'Type' || property === 'Description') {
                        await updateEventProperty(eventId, property, value);
                        return {success: true, message: `Updated event #${eventId} correctly.`};
                    }

                    return {success: false, message: `The property "${property}" is not valid.`};
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Event creation error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while creating the event.'}
                }
            },
        ],
        [
            {
                base: 'set_price',
                requiresDatabase: true,
                parameters: [['eventId', true], ['price', true], ['categoryId', false]]
            },
            'Sets the price of an event for a given category.',
            async (...args): Promise<CommandResult> => {
                const [event, price, category] = args;

                try {
                    if (event == null || price == null)
                        return {success: false, message: 'Missing parameters.'};

                    const eventId = parseInt(event);
                    const categoryId = category != null ? parseInt(category) : null;
                    const priceNum = parseFloat(price);

                    const successful = await setEventPrice(eventId, priceNum, categoryId);
                    if (successful)
                        return {
                            success: true,
                            message: `Set price of ${priceNum}€ for category #${categoryId ?? '<fallback>'} at event #${eventId}`
                        };
                    else
                        return {success: false, message: `Could not set price.`};
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Price set error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while setting the price for the event.'}
                }
            },
        ],
        [
            {base: 'remove_price', requiresDatabase: true, parameters: [['eventId', true], ['categoryId', false]]},
            'Removes the set price of an event for a given category.',
            async (...args): Promise<CommandResult> => {
                const [event, category] = args;

                try {
                    if (event == null)
                        return {success: false, message: 'You must set an event id.'};

                    const eventId = parseInt(event);
                    const categoryId = category != null ? parseInt(category) : null;

                    await removeEventPrice(eventId, categoryId);
                    return {
                        success: true,
                        message: `Removed price for category #${categoryId ?? '<fallback>'} at event #${eventId}`
                    };
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Price remove error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while removing the price for the event.'}
                }
            },
        ],
        [
            {base: 'prices', requiresDatabase: true, parameters: [['eventId', true]]},
            'Fetches the prices set for an event for all categories.',
            async (...args): Promise<CommandResult> => {
                const [event] = args;

                try {
                    if (event == null)
                        return {success: false, message: 'You must set an event id.'};

                    const eventId = parseInt(event);

                    const prices = await getEventPrices(eventId);
                    const pricesString = prices
                        .map((price) => `  ${price.Category ?? '<fallback>'} : ${price.Price} €`)
                        .join('\n');
                    return {success: true, message: `Prices for event #${eventId}:\n${pricesString}`}
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Prices fetch error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while fetching the prices for the event.'}
                }
            },
        ],
    ],
}