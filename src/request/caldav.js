import tsdav from 'tsdav';
import dotenv from 'dotenv';
import {v4 as uuidv4} from 'uuid';
import http from 'http';
import {parseCards, personDataToVCard} from "../parser/vcard.js";
import {error, info, log} from '../../cli/logger.js';
import {XMLParser} from 'fast-xml-parser';

const {createDAVClient, DAVObject, DAVCollection, makeCollection} = tsdav;

dotenv.config();

let client,
    /** @type {DAVCollection} */
    addressBook,
    /** @type {DAVObject[]} */
    vCards;

const serverUrl = () => (process.env.CALDAV_SSL_ENABLE === 'true' ? 'https' : 'http') + '://' + process.env.CALDAV_HOSTNAME + ':' + process.env.CALDAV_PORT;

const makeRequest = (method, path, body, isXml = true) => new Promise((resolve, reject) => {
    log('Making request to', path, 'with', method);
    const req = http.request({
        method,
        host: process.env.CALDAV_HOSTNAME,
        port: process.env.CALDAV_PORT,
        path,
        protocol: process.env.CALDAV_SSL_ENABLE === 'true' ? 'https:' : 'http:',
        auth: `${process.env.CALDAV_USERNAME}:${process.env.CALDAV_PASSWORD}`,
    }, response => {
        let str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            const statusCode = response.statusCode;
            if (statusCode >= 200 && statusCode < 300)
                if (isXml) {
                    const parser = new XMLParser();
                    const xml = parser.parse(str);
                    resolve(xml);
                } else
                    resolve(str);
            else
                reject(`${statusCode}: "${str}"`);
        });
        response.on('error', (e) => reject(e));
    });
    req.write(body);
    req.end();
});

/**
 * Runs a `PROPFIND` request to the server.
 * @author Arnau Mora
 * @since 20221118
 * @param {string[]} props
 * @param {string} path
 * @return {Promise<{currentUserPrincipal:{href:string,privilege:Object}?}>}
 */
const propFind = async (props, path = '/') => {
    const xml = await makeRequest(
        'PROPFIND',
        path,
        `<?xml version="1.0" encoding="UTF-8" ?>` +
        `<propfind xmlns="DAV:">` +
        `<prop>` +
        props.map(p => `<${p} />`).join() +
        `</prop>` +
        `</propfind>`
    );
    const prop = xml['multistatus']['response']['propstat']['prop'];
    let result = {};
    if (props.includes('current-user-principal'))
        result['currentUserPrincipal'] = {
            href: prop['current-user-principal']['href'],
            privilege: prop['current-user-privilege-set']['privilege'],
        };
    return result;
};

/**
 * Fetches the cards data from the server, and stores it locally.
 * @author Arnau Mora
 * @since 20221104
 * @return {Promise<void>}
 */
export const fetchCards = async () => {
    const abs = await client.fetchAddressBooks();
    addressBook = abs.find(v => v.url.endsWith(process.env.CALDAV_AB_UUID));

    if (addressBook == null) {
        error('Could not find an address book with the uid: ' + process.env.CALDAV_AB_UUID);
        info('Trying to create a new DAV collection...');
        const props = await propFind(['current-user-principal', 'displayname']);
        const response = await makeRequest(
            'MKCOL',
            `${props.currentUserPrincipal.href}${process.env.CALDAV_AB_UUID}/`,
            `<?xml version="1.0" encoding="UTF-8" ?>` +
            `<mkcol xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CR="urn:ietf:params:xml:ns:carddav" xmlns:I="http://apple.com/ns/ical/" xmlns:INF="http://inf-it.com/ns/ab/">` +
            `<set>` +
            `<prop>` +
            `<resourcetype>` +
            `<CR:addressbook />` +
            `<collection />` +
            `</resourcetype>` +
            `<displayname>Testing ab</displayname>` +
            `<INF:addressbook-color>#ff0000ff</INF:addressbook-color>` +
            `<CR:addressbook-description>Addressbook description</CR:addressbook-description>` +
            `</prop>` +
            `</set>` +
            `</mkcol>`,
            false,
        );
        info('Collection create result:', response);
        throw Error('');
    }

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
    const uuid = uuidv4();
    data.uid = uuid;
    const vCard = personDataToVCard(data);
    log('Creating new vCard. Uid:', uuid, 'vCard:', vCard.replaceAll('\n', '\\n'));
    return [
        uuid,
        await client.createVCard({
            addressBook,
            filename: uuid + '.vcf',
            vCardString: vCard,
        })
    ];
};

export const getAddressBookUrl = () => addressBook?.url;
