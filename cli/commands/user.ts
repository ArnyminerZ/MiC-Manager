import {verify as verifyUser, create as createUser} from '../../src/users/management.js';
import {db, initDatabase} from "../../src/storage/database/init";
import {generateKeys} from "../../src/security/generator";
import {loadConfig} from "../../src/storage/config/base";

export const definition: Command = {
    base: 'user',
    commands: [
        [
            {base: 'verify', parameters: [['nif', true]]},
            'Verifies the user with the given NIF by adding the user:usage scope.',
            async (...args: string[]): Promise<CommandResult> => {
                const [nif] = args;

                try {
                    generateKeys();
                    loadConfig();
                    await initDatabase();

                    if (nif == null) return {success: false, message: 'nif cannot be null'};
                    const trimmed = nif.trim();
                    if (trimmed.length <= 0) return {success: false, message: 'nif cannot be empty'};

                    const verified = await verifyUser(nif);
                    return verified ? {success: true, message: 'User verified successfully.'} : {
                        success: false,
                        message: 'Could not verify user. SQL error.'
                    };
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(e);
                        return {success: false, message: `Verification error: ${e.message}`};
                    }
                    return {success: false, message: 'Unknown error occurred while verifying the user.'}
                }
            },
        ],
        [
            {
                base: 'register',
                parameters: [['nif', true], ['password', true], ['email', true], ['name', true], ['surname', true], ['information', false]]
            },
            'Registers a new user with the parameters given.',
            async (...args: string[]): Promise<CommandResult> => {
                const [nif, password, email, name, surname, information] = args;
                try {
                    generateKeys();
                    loadConfig();
                    await initDatabase();

                    const info = information == null ? {} : JSON.parse(information);
                    console.log('Creating user:', args, info);

                    const rowCount = await createUser(password, name, surname, nif, email, info);
                    db.close();

                    return {success: true, message: `User created successfully. Updated rows: ${rowCount}`}
                } catch (e) {
                    if (e instanceof Error)
                        return {success: false, message: `Creation error: ${e.message}`}
                    return {success: false, message: 'Unknown error occurred while registering user.'}
                }
            },
        ],
    ],
}
