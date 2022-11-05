import tsdav from 'tsdav';
import dotenv from 'dotenv';
import {parseCards, personDataToVCard} from "../parser/vcard.js";
import {error, log} from '../../cli/logger.js';
import {v4 as uuidv4} from 'uuid';

const {createDAVClient, DAVObject, DAVCollection} = tsdav;

dotenv.config();

let client,
    /** @type {DAVCollection} */
    addressBook,
    /** @type {DAVObject[]} */
    vCards;

const serverUrl = () => (process.env.CALDAV_SSL_ENABLE === 'true' ? 'https' : 'http') + '://' + process.env.CALDAV_HOSTNAME + ':' + process.env.CALDAV_PORT;

/**
 * Fetches the cards data from the server, and stores it locally.
 * @author Arnau Mora
 * @since 20221104
 * @return {Promise<void>}
 */
export const fetchCards = async () => {
    const abs = await client.fetchAddressBooks();
    addressBook = abs.find(v => v.url.endsWith(process.env.CALDAV_AB_UUID));

    if (addressBook == null) throw Error('Could not find an address book with the uid: ' + process.env.CALDAV_AB_UUID);

    vCards = await client.fetchVCards({addressBook: addressBook});
}

export const createClient = async (debug = process.env.DEBUG) => {
    if (client == null) try {
        client = await createDAVClient({
            serverUrl: serverUrl(),
            credentials: {
                username: process.env.CALDAV_USERNAME,
                password: process.env.CALDAV_PASSWORD,
            },
            authMethod: 'Basic',
            defaultAccountType: 'carddav',
        });
    } catch (e) {
        error(
            `CalDAV settings: CALDAV_HOSTNAME:`, process.env.CALDAV_HOSTNAME,
            'Server url:', serverUrl(),
            'CALDAV_USERNAME:', process.env.CALDAV_USERNAME,
            'CALDAV_PASSWORD:', process.env.CALDAV_PASSWORD,
        );
        error(`Could not connect to the CalDAV server. Error:`, e);
        return false;
    }

    await fetchCards();

    if (debug === 'true')
        log('There are', vCards.length, 'vCards.');
    return true;
};

export const getCards = async () => parseCards(vCards.map(t => t.data).join('\n'));

/**
 * Tries to get the card of a user that has `uid` as user data.
 * @author Arnau Mora
 * @since 20221104
 * @param {string} uid The uid of the user.
 * @return {Promise<PersonData|null>}
 */
export const getCard = async (uid) => {
    const cards = await getCards();
    return cards.find(v => v.uid === uid);
};

/**
 *
 * @param {PersonData} data
 * @return {Promise<[string,Response]>}
 * @throws {ParseException} If the data given is missing one or more parameters.
 */
export const newCard = async (data) => {
    if (addressBook == null) throw new Error('Address book not found. Please, run createClient before.');
    const vCard = personDataToVCard(data);
    const uuid = uuidv4();
    return [
        uuid,
        await client.createVCard({
            addressBook,
            filename: uuid + '.vcf',
            vCardString: vCard,
        })
    ];
};
