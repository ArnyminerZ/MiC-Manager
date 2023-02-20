type CommandArgument = {
    base: string,
    requiresDatabase: boolean,
    parameters: [key: string, required: boolean][],
}

type Command = {
    base: string,
    commands: [argument: CommandArgument, description: string, call: ((...args: string[]) => Promise<CommandResult>)][],
}

type CommandResult = {
    success: boolean,
    message: string,
}
