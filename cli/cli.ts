import {generateKeys} from "../src/security/generator";
import {Dim, FgBlue, FgGreen, FgRed, FgYellow, Reset} from './colors';

import {commandsList} from './commands/list';
import {loadConfig} from "../src/storage/config/base";
import {db, initDatabase} from "../src/storage/database/init";

let startIndex = -1;

process.argv.forEach(function (value, index) {
    if (startIndex >= 0) return;
    if (value.includes('cli')) startIndex = index;
});

if (startIndex < 0) {
    console.error('Invalid parameter given, or command not correctly formatted. argv:', process.argv);
    process.exit(1);
}

const args: string[] = process.argv.slice(startIndex + 1);

function commandUsage(command: Command, indent: number = 2) {
    console.info(' '.repeat(indent) + FgGreen + command.base);
    for (const [argument, description] of command.commands) {
        const args = argument.parameters.map(([key, required]) => {
            if (required)
                return `<${key}>`;
            else
                return `[${key}]`;
        });
        console.info(' '.repeat(indent) + ' ', FgBlue, argument.base, args.join(', '), Dim + ':', Reset + description);
    }
}

async function runCommand(command: Command, ...args: string[]): Promise<CommandResult> {
    for (const [argument, _, call] of command.commands) {
        if (argument.base !== args[0]) continue;
        const requiredArguments = argument.parameters.filter(([_, required]) => required);
        if (args.length < requiredArguments.length)
            return {success: false, message: `Missing arguments for "${command.base} ${argument.base}" (${args.length} < ${requiredArguments.length})`}

        process.env.LOG_LEVEL= 'none';

        if (argument.requiresDatabase) {
            generateKeys();
            loadConfig();
            await initDatabase();
        }

        const result = await call(...args.slice(1));

        if (argument.requiresDatabase) db.close();

        return result;
    }
    return {success: false, message: `Unknown argument "${args[0]}" for command "${command.base}"`};
}

const command = commandsList.find((entry) => entry.base === args[0]);
if (command == null) {
    console.info(FgYellow + 'Here are all the possible commands and their respective options:');
    for (const cmd of commandsList) {
        commandUsage(cmd);
    }
    process.exit(2);
} else {
    const result: CommandResult = await runCommand(command, ...args.slice(1));
    console.info();
    if (!result.success) {
        console.error(FgRed + 'Command exited with an error:', result.message, Reset);
        console.info(FgYellow + 'Command usage:');
        commandUsage(command);
    } else
        console.error(FgGreen + 'Command ran successfully:', result.message, Reset);
}
