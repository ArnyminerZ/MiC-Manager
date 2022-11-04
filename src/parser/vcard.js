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

/**
 * Splits all the given cards from a source to individual elements from an array, and divided into lines.
 * @author Arnau Mora
 * @since 20221104
 * @param {string} source The source to get the cards from.
 * @returns {VCardProperty[][]}
 */
const splitCards = source => {
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
                    person.address = [properties['TYPE'], data];
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
                        person.telephones = [properties['TYPE'], data];
                    else
                        person.telephones.push([properties['TYPE'], data]);
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
}
