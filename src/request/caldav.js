import tsdav from 'tsdav';
import dotenv from 'dotenv';

const {createDAVClient, DAVObject, DAVCollection} = tsdav;

dotenv.config();

let client,
    /** @type {DAVCollection} */
    addressBook,
    /** @type {DAVObject[]} */
    vCards;

export const createClient = async () => {
    if (client == null)
        client = await createDAVClient({
            serverUrl: process.env.CALDAV_HOSTNAME,
            credentials: {
                username: process.env.CALDAV_USERNAME,
                password: process.env.CALDAV_PASSWORD,
            },
            authMethod: 'Basic',
            defaultAccountType: 'carddav',
        });
    addressBook = (await client.fetchAddressBooks()).find(v => v.url === process.env.CALDAV_AB_URL);
    if (addressBook == null) throw Error('Could not find an address book with the url: ' + process.env.CALDAV_AB_URL);
    vCards = await client.fetchVCards({addressBook: addressBook});
    if (process.env.DEBUG === 'true')
        console.debug('There are', vCards.length, 'vCards.');
}
