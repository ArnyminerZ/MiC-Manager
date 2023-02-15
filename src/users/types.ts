enum PhoneType {
    text = "text",
    voice = "voice",
    fax = "fax",
    cell = "cell",
    video = "video",
    pager = "pager",
    textphone = "textphone",
}

type Phone = [
    type: PhoneType,
    number: string,
]

type UserInformation = {
    birthday?: string,
    phone?: Phone[],
}

type User = {
    Id: number,
    Hash?: string,
    Name: string,
    Surname: string,
    NIF: string,
    Email: string,
    Information: UserInformation | string,
}

type AccessToken = {
    Id: number,
    AccessToken: string,
    UserId: number,
}
