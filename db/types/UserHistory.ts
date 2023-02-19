
/** Defines an entry in the user's history before it has been signed and inserted into the database */
type UserHistoryProto = {
    UserId: number,
    FromCategory?: number,
    ToCategory: number,
    Timestamp: number,
}

/** Defines an entry in the user's history */
interface UserHistory extends UserHistoryProto {
    Id: number,
    TransactionHash: string,
}
