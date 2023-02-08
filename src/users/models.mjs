/**
 * @typedef {string} PhoneType
 * @enum
 */
const PhoneType = ["text", "voice", "fax", "cell", "video", "pager", "textphone"];

/**
 * @typedef {[type:PhoneType,number:string][]} UserInformationPhone
 */

/**
 * @typedef {Object} UserInformation
 * @property {?string} birthday
 * @property {?UserInformationPhone} phone
 */

/**
 * @typedef {Object} User
 * @property {number} Id
 * @property {string} Hash
 * @property {string} Name
 * @property {string} Surname
 * @property {string} NIF
 * @property {string} Email
 * @property {UserInformation} Information
 */

/**
 * @typedef {Object} AccessToken
 * @property {number} Id
 * @property {string} AccessToken
 * @property {number} UserId
 */
