enum PhoneType {
    cell = "cell",
    home = "home",
    pager = "pager",
    voice = "voice",
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
