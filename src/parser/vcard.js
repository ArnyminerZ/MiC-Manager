/**
 * @typedef {Object} VCardProperty
 * @see https://en.wikipedia.org/wiki/VCard
 * @property {string} key The key of the property.
 * @property {Map<string, string>} properties A Map of properties provided by the key.
 * @property {string} data The data of the user.
 */

/**
 * @typedef {Object} PersonData
 * @property {string[]} address ADR
 * @property {string} agent AGENT
 * @property {string} birthday BDAY
 * @property {string[]} categories CATEGORIES
 * @property {string} email EMAIL
 * @property {string} formattedName FN
 * @property {number[]} geo GEO
 * @property {string} label LABEL
 * @property {string} logo LOGO
 * @property {string[]} name N
 * @property {string} nickname NICKNAME
 * @property {string} note NOTE
 * @property {string} org ORG
 * @property {string} photo PHOTO
 * @property {string} revision REV
 * @property {string} role ROLE
 * @property {string[][]} telephones TEL
 * @property {string} title TITLE
 * @property {string} uid UID
 * @property {Object} data Extra data stored in the user.
 */

import {ParseException} from "../exceptions.js";
import {v4 as uuidv4} from 'uuid';

import package_json from '../../package.json' assert {type: 'json'};

/**
 * Splits all the given cards from a source to individual elements from an array, and divided into lines.
 * @author Arnau Mora
 * @since 20221104
 * @param {string} source The source to get the cards from.
 * @returns {VCardProperty[][]}
 */
export const splitCards = source => {
    /** @type {VCardProperty[][]} */
    const cards = [];
    let cardBegin = source.indexOf('BEGIN:VCARD');
    while (cardBegin >= 0) {
        const cardEnd = source.indexOf('END:VCARD', cardBegin);
        if (cardEnd < 0) break;
        cardBegin += 'BEGIN:VCARD\n'.length;

        const block = source.substring(cardBegin, cardEnd);
        /** @type {VCardProperty[]} */
        const parts = [];
        block
            .split('\n')
            .forEach(line => {
                if (line.length <= 0) return;

                const keyEnd = line.indexOf(':');
                /** @type {string[]} */
                const rawKey = line.substring(0, keyEnd).split(';');
                const key = rawKey[0];
                /** @type {Map<string, string>} */
                const properties = new Map();
                rawKey
                    .slice(1)
                    .forEach(prop => {
                        const kp = prop.split('=');
                        properties.set(kp[0], kp[1]);
                    });
                const data = line.substring(keyEnd + 1);
                parts.push({key, properties, data});
            });
        cards.push(parts);

        cardBegin = source.indexOf('BEGIN:VCARD', cardEnd);
    }
    return cards;
}

/**
 * Converts a given source vCard response into individual data.
 * @author Arnau Mora
 * @since 20221104
 * @param {string} source The source to get the cards from.
 * @return {PersonData[]} The data of all the parsed people.
 */
export const parseCards = source => {
    /** @type {PersonData[]} */
    const people = [];
    const cards = splitCards(source.replaceAll('\r', ''));
    for (let card of cards) {
        /** @type {PersonData} */
        const person = {};
        for (let property of card) {
            const key = property.key;
            const properties = property.properties;
            const data = property.data;
            switch (key) {
                case 'VERSION':
                    if (data !== '3.0')
                        console.warn('Got unsupported vCard version:', data, "Errors may occur.");
                    break;
                case 'ADR':
                    person.address = [properties.get('TYPE'), data];
                    break;
                case 'AGENT':
                    person.agent = data;
                    break;
                case 'BDAY':
                    person.birthday = data;
                    break;
                case 'CATEGORIES':
                    person.categories = data.split(',');
                    break;
                case 'EMAIL':
                    person.email = data;
                    break;
                case 'FN':
                    person.formattedName = data;
                    break;
                case 'GEO':
                    const geo = data.split(';');
                    person.geo = [parseFloat(geo[0]), parseFloat(geo[1])];
                    break;
                case 'LABEL':
                    person.label = data;
                    break;
                case 'LOGO':
                    person.logo = data;
                    break;
                case 'N':
                    person.name = data.split(';').filter(v => v.trim().length > 0);
                    break;
                case 'NICKNAME':
                    person.nickname = data;
                    break;
                case 'NOTE':
                    person.note = data;
                    try {
                        person.data = JSON.parse(data);
                    } catch (e) {
                    }
                    break;
                case 'ORG':
                    person.org = data;
                    break;
                case 'PHOTO':
                    person.photo = data;
                    break;
                case 'REV':
                    person.revision = data;
                    break;
                case 'ROLE':
                    person.role = data;
                    break;
                case 'TEL':
                    if (person.telephones == null)
                        person.telephones = [[properties.get('TYPE'), data]];
                    else
                        person.telephones.push([properties.get('TYPE'), data]);
                    break;
                case 'TITLE':
                    person.title = data;
                    break;
                case 'UID':
                    person.uid = data;
                    break;
            }
        }
        people.push(person);
    }
    return people;
};

/**
 * Converts a `PersonData` object into a vCard string.
 * @author Arnau Mora
 * @since 20221105
 * @param {PersonData} data
 * @return {string}
 * @throws {ParseException} If the data given is missing one or more parameters.
 */
export const personDataToVCard = (data) => {
    if (!checkV3(data)) throw new ParseException('The data is incomplete.');

    return [
        "BEGIN:VCARD",
        "VERSION:3.0", // Right now only 3.0 is supported
        "PRODID:MiC_Manager//" + package_json.version,
        "REV:" + (new Date()).toISOString(),
        data.address != null ? 'ADR;TYPE=' + data.address[0] + ':' + data.address[1] : null,
        data.agent != null ? `AGENT:${data.agent}` : null,
        data.birthday != null ? `BDAY:${data.birthday}` : null,
        data.categories != null ? `CATEGORIES:${data.categories.join(',')}` : null,
        data.email != null ? `EMAIL:${data.email}` : null,
        data.formattedName != null ? `FN:${data.formattedName}` : null,
        data.geo != null ? `GEO:${data.geo.join(';')}` : null,
        data.label != null ? `LABEL:${data.label}` : null,
        data.logo != null ? `LOGO:${data.logo}` : null,
        data.name != null ? `N:${Array(5).fill('').map((_, i) => data.name[i] ?? '').join(';')}` : null,
        data.nickname != null ? `NICKNAME:${data.nickname}` : null,
        data.note != null ? `NOTE:${data.note}` : null,
        data.org != null ? `ORG:${data.org}` : null,
        data.photo != null ? `PHOTO:${data.photo}` : null,
        data.role != null ? `ROLE:${data.role}` : null,
        data.telephones != null ? data.telephones.map(t => `TEL;TYPE=${t[0]}:${t[1]}`).join('\n') : null,
        data.title != null ? `TITLE:${data.title}` : null,
        data.uid != null ? `UID:${data.uid}` : `UID:${uuidv4()}`,
        "END:VCARD",
    ].filter(i => i != null).join('\n');
};

/**
 * Checks if a given `PersonData` object is valid or not.
 * @author Arnau Mora
 * @since 20221105
 * @param {PersonData} data
 * @return {boolean} If the data given is valid. This is, if it's not missing any property.
 */
export const checkV3 = data => !(data.formattedName == null || data.name == null);
