export class EventAlreadyHasPriceError extends Error {
    constructor(eventId: number, category: number | null) {
        super(`The event #${eventId} has already a price assigned for the category ${category ? '#' + category : '<fallback>'}`);
        this.name = "EventAlreadyHasPriceError"
    }
}
