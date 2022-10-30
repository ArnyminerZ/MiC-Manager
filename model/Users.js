import dotenv from 'dotenv';

dotenv.config();

export const UsersTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mUsers
    (
        Id      INT(10) UNSIGNED auto_increment NOT NULL,
        Hash    varchar(256)     NOT NULL,
        SocioId INT(10) UNSIGNED NOT NULL,
        CONSTRAINT mUsers_PK PRIMARY KEY (Id)
    )`;

export const LoginAttemptsTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mLoginAttempts
    (
        Id          INT(10) UNSIGNED auto_increment     NOT NULL,
        Timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        IP          BINARY                              NOT NULL,
        UserId      INT(10) UNSIGNED                    NOT NULL,
        Successful  BIT NOT NULL,
        CONSTRAINT mLoginAttempts_PK PRIMARY KEY (Id),
        CONSTRAINT mLoginAttempts_FK FOREIGN KEY (UserId) REFERENCES FilaMagenta.mUsers (Id)
    )`;

export const SociosTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.tbSocios
    (
        idSocio                   int(10) UNSIGNED auto_increment NOT NULL,
        Nombre                    varchar(24)                     NOT NULL,
        Apellidos                 varchar(40)                     NOT NULL,
        Direccion                 varchar(64)                     NULL,
        idCodPostal               int                             NULL,
        Dni                       varchar(16)                     NULL,
        FecNacimiento             date                            NULL,
        TlfParticular             varchar(16)                     NULL,
        TlfTrabajo                varchar(16)                     NULL,
        TlfMovil                  varchar(16)                     NULL,
        eMail                     varchar(64)                     NULL,
        idEstadoCivil             int                             NULL,
        idEstadoFicha             int                             NULL,
        bDerechoActos             bit                             NULL,
        FecAlta                   date                            NULL,
        FecUltAlta                date                            NULL,
        AnyAltaJuvenil            int                             NULL,
        AnyAltaFester             int                             NULL,
        FecBaja                   date                            NULL,
        AnyMuntanyesMerit         int                             NULL,
        bRodaBlancos              bit                             NULL,
        bRodaNegros               bit                             NULL,
        nrAntiguedad              int                             NULL,
        bArrancoDianaJuvenil      bit                             NULL,
        AnyAltaRodaBlancos        int                             NULL,
        nrRodaBlancos             int                             NULL,
        AnyAltaRodaNegros         int                             NULL,
        nrRodaNegros              int                             NULL,
        AnyUltEscuadra            int                             NULL,
        idPuestoEscuadra          int                             NULL,
        AnyUltEscuadraEspecial    int                             NULL,
        idPuestoEscuadraEspecial  int                             NULL,
        AnyGloriero               int                             NULL,
        idFormaPago               int                             NULL,
        Sexo                      bit                             NULL,
        idTipoFestero             int                             NULL,
        idCargo                   int                             NULL,
        Obs                       varchar(2048)                   NULL,
        Fotografia                varchar(128)                    NULL,
        AsociadoCon               int                             NULL,
        bCarnetAvancarga          bit                             NULL,
        FecCaducidadAvancarga     date                            NULL,
        bDisparaAvancarga         bit                             NULL,
        idParentesco              int                             NULL,
        bEnviadoAsociacion        bit                             NULL,
        bTipoFesteroBloqueado     bit                             NULL,
        ImpLoteriaAbonado         float                           NULL,
        bAbonadoLoteria           bit                             NULL,
        idBanco                   int                             NULL,
        Iban                      varchar(64)                     NULL,
        Bic                       varchar(16)                     NULL,
        bUsaMontepio              bit                             NULL,
        TiempoBaja                int                             NULL,
        IdentificadorBanco        int                             NULL,
        IdentificadorClienteBanco int                             NULL,
        UltNrRemesa               int                             NULL,
        esAutorizoProteccionDatos bit DEFAULT 0                   NOT NULL,
        filaPrincipal             int                             NULL,
        FecExpedicionAvancarga    date                            NULL,
        RodaBlancaBloqueada       bit                             NULL,
        CtaContable               int                             NULL,
        CONSTRAINT PK_tbSocios PRIMARY KEY (idSocio)
    );`
