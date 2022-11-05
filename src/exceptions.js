export class SecurityException extends Error {
    constructor(message) {
        super(message);
        this.name = "SecurityException";
    }
}

export class DatabaseException extends Error {
    constructor(message) {
        super(message);
        this.name = "DatabaseException";
    }
}

export class UserNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserNotFoundException';
    }
}

export class PasswordlessUserException extends Error {
    constructor(message) {
        super(message);
        this.name = 'PasswordlessUserException';
    }
}

export class WrongPasswordException extends Error {
    constructor(message) {
        super(message);
        this.name = 'WrongPasswordException';
    }
}

export class InvalidTokenException extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTokenException';
    }
}

export class EnvironmentVariableException extends Error {
    constructor(message) {
        super(message);
        this.name = 'EnvironmentVariableException';
    }
}

export class ParseException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ParseException';
    }
}
