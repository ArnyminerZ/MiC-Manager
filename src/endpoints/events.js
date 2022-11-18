import {checkToken, decodeToken} from "../security.js";
import {errorResponse, successResponse} from "../response.js";
import {
    confirmAssistance,
    create as createEvent,
    createTable,
    getEvents,
    isEatEvent,
    joinTable
} from "../data/events.js";
import {hasPermission} from "../permissions.js";
import {error} from "../../cli/logger.js";
import {
    AlreadyInTableException,
    TableAlreadyExistsException,
    TableNotFoundException,
    UserNotFoundException
} from "../exceptions.js";

export const list = async (req, res) => {
    /**
     * @type {string|null}
     */
    const apiKey = req.get('API-Key');
    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).send(errorResponse('invalid-key'));
    const events = await getEvents();
    res.json(successResponse(events));
};

export const create = async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const displayName = body['displayName'];
    /** @type {string|null} */
    const description = body['description'];
    /** @type {string|null} */
    const date = body['date'];
    /** @type {string|null} */
    const contact = body['contact'];
    /** @type {string|null} */
    const category = body['category'];
    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    // Check for the mandatory parameters
    if (displayName == null || date == null || category == null)
        return res.status(400).json(errorResponse('missing-parameters'));

    // Check API key
    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).json(errorResponse('invalid-key'));

    /** @type {{nif: string, userId: number}} */
    let tokenData;
    try {
        tokenData = await decodeToken(apiKey);
    } catch (e) {
        return res.status(406).json(errorResponse('invalid-key'));
    }

    // Check if user has permission to add events
    if (!(await hasPermission(tokenData.userId, 'event_add'))) {
        error('User', tokenData.userId, 'tried to add a new event. Error: unauthorised');
        return res.status(401).json(errorResponse('unauthorised'));
    }

    // Create the event
    try {
        await createEvent(displayName, description, new Date(date), contact, category);
        res.json(successResponse());
    } catch (e) {
        error('Could not create event. Error:', e);
        res.status(500).json(errorResponse(e instanceof Error ? e.toString() : e));
    }
};

export const join = async (req, res) => {
    const params = req.params;
    const body = req.body;
    /** @type {number} */
    const eventId = parseInt(params['event_id']);
    /** @type {string|null} */
    const apiKey = req.get('API-Key');
    /** @type {number|NaN} */
    const tableId = parseInt(body['table_id']);
    /** @type {boolean} */
    const assists = body['assists'] ?? true;

    if (eventId == null) return res.status(400).send(errorResponse('missing-parameters'));

    // Check if the key is correct
    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).send(errorResponse('invalid-key'));

    // Get token data
    /** @type {{nif: string, userId: number}} */
    let tokenData;
    try {
        tokenData = await decodeToken(apiKey);
    } catch (e) {
        return res.status(406).json(errorResponse('invalid-key'));
    }
    const {userId, nif} = tokenData;

    // Check if event exists
    const events = await getEvents();
    /** @type {EventData|null} */
    const event = events.find(v => v.id === eventId);
    if (event == null) return res.status(404).json(errorResponse('not-found'))

    const eatEvent = isEatEvent(eventId);
    try {
        if (eatEvent) {
            if (isNaN(tableId)) {
                // Create table
                await createTable(eventId, userId);
            } else {
                // Join table
                await joinTable(eventId, tableId, userId);
            }
        } else {
            // Confirm assistance
            await confirmAssistance(eventId, userId, assists);
        }
    } catch (e) {
        error(`Could not join`, nif, `(${userId}) to event`, eventId, '. Error:', e);
        if (e instanceof UserNotFoundException)
            res.status(503).json(errorResponse('not-found'));
        else if (e instanceof TableAlreadyExistsException || e instanceof AlreadyInTableException)
            res.status(409).json(errorResponse('conflict'));
        else if (e instanceof TableNotFoundException)
            res.status(404).json(errorResponse('not-found'));
        else
            res.status(500).json(errorResponse(e));
    }
};

export const setMenu = async (req, res) => {
    const params = req.params;
    const body = req.body;
    /** @type {number} */
    const eventId = parseInt(params['event_id']);

    /** @type {string[]} */
    const firsts = body['firsts'];
    /** @type {string[]} */
    const seconds = body['seconds'];
    /** @type {string[]} */
    const thirds = body['thirds'];
    /** @type {string[]} */
    const desserts = body['desserts'];
    /** @type {boolean|null} */
    const drinkIncluded = body['drink_included'];
    /** @type {boolean|null} */
    const coffeeIncluded = body['coffee_included'];
    /** @type {boolean|null} */
    const teaIncluded = body['tea_included'];
    /** @type {{grade:string|null,price:number}[]|null} */
    const pricing = body['pricing'];

    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    if (drinkIncluded == null || coffeeIncluded == null || teaIncluded == null || pricing == null)
        return res.status(400).json(errorResponse('missing-parameters'));

    if (isNaN(eventId)) return res.status(406).json(errorResponse('invalid-request'));

    // Check API key
    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).json(errorResponse('invalid-key'));

    /** @type {{nif: string, userId: number}} */
    let tokenData;
    try {
        tokenData = await decodeToken(apiKey);
    } catch (e) {
        return res.status(406).json(errorResponse('invalid-key'));
    }

    // Check if user has permission to add events
    if (!(await hasPermission(tokenData.userId, 'event_edit'))) {
        error('User', tokenData.userId, 'tried to add a new event. Error: unauthorised');
        return res.status(401).json(errorResponse('unauthorised'));
    }

    const events = await getEvents();
    /** @type {EventData,null} */
    const event = events.find(v => v.id === eventId);

    if (event == null) return res.status(404).json(errorResponse('not-found'));

    const eatEvent = isEatEvent(eventId);
    if (!eatEvent) return res.status(405).json(errorResponse('not-allowed'));

    await setMenu(eventId, {
        firsts: firsts ?? [],
        seconds: seconds ?? [],
        thirds: thirds ?? [],
        desserts: desserts ?? [],
        drinkIncluded,
        coffeeIncluded,
        teaIncluded,
        pricing,
    });

    res.json(successResponse());
};
