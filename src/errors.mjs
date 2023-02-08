export class ParseException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ParseException';
    }
}

export class InvalidConfigurationError extends Error {
    constructor(key, reason) {
        super(`Invalid configuration for "${key}".\nReason: ${reason}`);
        this.name = 'InvalidConfigurationError';
    }
}

export class ConfigurationParseError extends ParseException {
    constructor(lineNumber, line, reason) {
        super(`Invalid configuration at line #${lineNumber}: ${line}.\nReason: ${reason}`);
        this.name = 'ConfigurationParseError';
    }
}

export class IllegalConfigParameterError extends InvalidConfigurationError {
    constructor(key, reason) {
        super(key, reason);
        this.name = 'IllegalConfigParameterError';
    }
}

export class MissingConfigParameterError extends InvalidConfigurationError {
    constructor(key, reason) {
        super(key, reason);
        this.name = 'MissingConfigParameterError';
    }
}

export class IllegalDateFormatException extends ParseException {
    constructor(message) {
        super(message);
        this.name = 'IllegalDateFormatException';
    }
}
