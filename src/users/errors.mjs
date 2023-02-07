export class UserAlreadyExistsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserAlreadyExistsError';
    }
}

export class UserNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserNotFoundError';
    }
}

export class WrongCredentialsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'WrongCredentialsError';
    }
}

export class UnsupportedAuthenticationMethodError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnsupportedAuthenticationMethodError';
    }
}

export class InvalidTokenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTokenError';
    }
}
