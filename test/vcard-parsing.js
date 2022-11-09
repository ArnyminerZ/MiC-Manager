const sampleVCard = 'BEGIN:VCARD\n' +
    'VERSION:3.0\n' +
    'PRODID:MiC_Manager//1.0.0-indev02\n' +
    'UID:25c02c68-99be-4615-86f9-d5821190d03e\n' +
    'ADR;TYPE=home:IBI 14 6º;;;;;;\n' +
    'BDAY:20020029\n' +
    'EMAIL:ARNYMINER.Z@GMAIL.COM\n' +
    'FN:Arnau Mora Gras\n' +
    'N:Arnau;Mora Gras;;;\n' +
    'REV:2022-11-06T13:23:33.464Z\n' +
    'TEL;TYPE=home:673910251\n' +
    'END:VCARD';

import assert from 'assert';
import {parseCards, splitCards} from "../src/parser/vcard.js";

describe('vCard', () => {
    describe('splitCards()', () => {
        const cards = splitCards(sampleVCard);
        it('Cards are cut correctly.', () => {
            assert.equal(cards.length, 1);
        });
        const card = cards[0];
        it('Objects length is correct.', () => {
            assert.equal(card.length, 10);
        });
        it('Elements with properties are detected correctly.', () => {
            const adr = card.find(v => v.key === 'ADR');
            assert.equal(adr == null, false);
            assert.equal(adr.properties.size, 1);
            assert.equal(adr.properties.get('TYPE'), 'home');

            const tel = card.find(v => v.key === 'TEL');
            assert.equal(tel == null, false);
            assert.equal(tel.properties.size, 1);
            assert.equal(tel.properties.get('TYPE'), 'home');
        });
    });
    describe('parseCards()', () => {
        const vCards = parseCards(sampleVCard);
        it('Cards length is correct.', () => {
            assert.equal(vCards.length, 1);
        });
        const vCard = vCards[0];
        describe('Parsing', function () {
            it('Address.', () => {
                assert.equal(vCard.address.length, 2);
                assert.equal(vCard.address[0], 'home');
                assert.equal(vCard.address[1], 'IBI 14 6º;;;;;;');
            });
            it('Birthday.', () => {
                assert.equal(vCard.birthday, '20020029');
            });
            it('UID.', () => {
                assert.equal(vCard.uid, '25c02c68-99be-4615-86f9-d5821190d03e');
            });
            it('Email.', () => {
                assert.equal(vCard.email, 'ARNYMINER.Z@GMAIL.COM');
            });
            it('Formatted Name.', () => {
                assert.equal(vCard.formattedName, 'Arnau Mora Gras');
            });
            it('Name.', () => {
                assert.equal(vCard.name.length, 2);
                assert.equal(vCard.name[0], 'Arnau');
                assert.equal(vCard.name[1], 'Mora Gras');
            });
            it('Revision.', () => {
                assert.equal(vCard.revision, '2022-11-06T13:23:33.464Z');
            });
            it('Telephone.', () => {
                assert.equal(vCard.telephones.length, 1);
                const tel = vCard.telephones[0];
                assert.equal(tel[0], 'home');
                assert.equal(tel[1], '673910251');
            });
        });
    });
});
