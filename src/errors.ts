export class ParseException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ParseException';
    }
}

export class InvalidConfigurationError extends Error {
    constructor(key: string, reason: string) {
        super(`Invalid configuration for "${key}".\nReason: ${reason}`);
        this.name = 'InvalidConfigurationError';
    }
}

export class ConfigurationParseError extends ParseException {
    constructor(lineNumber: number|string, line: string, reason: string) {
        super(`Invalid configuration at line #${lineNumber}: ${line}.\nReason: ${reason}`);
        this.name = 'ConfigurationParseError';
    }
}

export class IllegalConfigParameterError extends InvalidConfigurationError {
    constructor(key: string, reason: string) {
        super(key, reason);
        this.name = 'IllegalConfigParameterError';
    }
}

export class MissingConfigParameterError extends InvalidConfigurationError {
    constructor(key: string, reason: string) {
        super(key, reason);
        this.name = 'MissingConfigParameterError';
    }
}

export class IllegalDateFormatException extends ParseException {
    constructor(message: string) {
        super(message);
        this.name = 'IllegalDateFormatException';
    }
}

export class StateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StateError';
    }
}
