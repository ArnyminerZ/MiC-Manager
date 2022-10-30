import dotenv from 'dotenv';

dotenv.config();

export const UsersTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mUsers
    (
        Id      INT(10) UNSIGNED auto_increment NOT NULL,
        Hash    varchar(256)                    NOT NULL,
        SocioId INT(10) UNSIGNED                NOT NULL,
        Role    INT(10) UNSIGNED DEFAULT 1      NOT NULL,
        CONSTRAINT mUsers_PK PRIMARY KEY (Id),
        CONSTRAINT mUsers_FK FOREIGN KEY (Role) REFERENCES FilaMagenta.mRoles (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT = 'A table that keeps track of the users that make use of the platform. Data is available at tbSocios.'`;

export const LoginAttemptsTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mLoginAttempts
    (
        Id         INT(10) UNSIGNED auto_increment     NOT NULL,
        Timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        IP         BINARY                              NOT NULL,
        UserId     INT(10) UNSIGNED                    NOT NULL,
        Successful BIT                                 NOT NULL,
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

export const RolesTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mRoles
    (
        Id          int(10) UNSIGNED auto_increment NOT NULL COMMENT 'The id of the role.',
        DisplayName varchar(16)                     NOT NULL COMMENT 'A name for identifying the role.',
        CONSTRAINT PK_mRoles PRIMARY KEY (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='A list of all the available roles for the users of the system.';
`;

export const PermissionsTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mPermissions
    (
        Id          int(10) UNSIGNED auto_increment NOT NULL COMMENT 'The id of the permission.',
        DisplayName varchar(16)                     NOT NULL COMMENT 'A name for identifying the permission.',
        CONSTRAINT PK_mPermissions PRIMARY KEY (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='A list of all the available permissions that can be granted to each role.';
`;

export const CategoriesTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mCategories
    (
        Id          int(10) UNSIGNED auto_increment NOT NULL COMMENT 'The id of the category.',
        DisplayName varchar(16)                     NOT NULL COMMENT 'A name for identifying the category.',
        CONSTRAINT PK_mCategories PRIMARY KEY (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='A list of all the available categories that can be used by events.';
`;

export const EventsTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mEvents
    (
        Id          INTEGER UNSIGNED auto_increment   NOT NULL COMMENT 'The id of the event.',
        DisplayName varchar(100)                      NOT NULL COMMENT 'The name to use as an identifier of the event.',
        Description TEXT                 DEFAULT NULL NULL COMMENT 'An extra description to use for the event.',
        Date        DATETIME                          NOT NULL COMMENT 'The moment at which the event will take place.',
        Contact     varchar(100)         DEFAULT NULL NULL COMMENT 'Some contact information for the responsible of the event.',
        Category    INTEGER(10) UNSIGNED DEFAULT 0    NOT NULL COMMENT 'The category to assign to the event.',
        CONSTRAINT PK_mEvents PRIMARY KEY (Id),
        CONSTRAINT FK_mEvents_cat FOREIGN KEY (Category) REFERENCES mCategories (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Registers all the events scheduled to happen.';
`;

export const AssistanceTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mAssistance
    (
        Id      int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the row.',
        UserId  int(10) unsigned                NOT NULL COMMENT 'The id of the user that has confirmed the assistance.',
        Assists bit                             NOT NULL COMMENT 'If 1, the user has said that it will assist. False otherwise.',
        EventId int(10) unsigned                NOT NULL COMMENT 'The id of the event that is being assisted.',
        CONSTRAINT PK_mAssistance PRIMARY KEY (Id),
        CONSTRAINT mAssistance_FK_mEvents FOREIGN KEY (EventId) REFERENCES FilaMagenta.mEvents (Id),
        CONSTRAINT mAssistance_FK_mUsers FOREIGN KEY (UserId) REFERENCES FilaMagenta.mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores user''s assistance to events.';
`;

export const TablesTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mTables
    (
        Id          int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the table.',
        Responsible int(10) unsigned                NOT NULL COMMENT 'The id of the user that is responsible of the table.',
        EventId     int(10) unsigned                NOT NULL COMMENT 'The id of the event that this table matches to.',
        CONSTRAINT mTables_PK PRIMARY KEY (Id),
        CONSTRAINT mTables_FK_mEvents FOREIGN KEY (EventId) REFERENCES FilaMagenta.mEvents (Id),
        CONSTRAINT mTables_FK_mUsers FOREIGN KEY (Responsible) REFERENCES FilaMagenta.mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores all the assigned tables for each event that supports them.';
`;

export const PeopleTablesTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mTablesPeople
    (
        Id      int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the row.',
        UserId  int(10) unsigned                NOT NULL COMMENT 'The id of the user being assigned.',
        TableId int(10) unsigned                NOT NULL COMMENT 'The id of the table that the user is being assigned to.',
        CONSTRAINT mTablesPeople_PK PRIMARY KEY (Id),
        CONSTRAINT mTablesPeople_FK_mTables FOREIGN KEY (TableId) REFERENCES FilaMagenta.mTables (Id),
        CONSTRAINT mTablesPeople_FK_mUsers FOREIGN KEY (UserId) REFERENCES FilaMagenta.mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Relates people with tables.';
`;

export const RolesPermissionsTable = `
    CREATE TABLE IF NOT EXISTS FilaMagenta.mRolesPermissions
    (
        Id           int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the row.',
        RoleId       int(10) unsigned                NOT NULL COMMENT 'The id of the role to assign the permission to.',
        PermissionId int(10) unsigned                NOT NULL COMMENT 'The id of the permission being assigned.',
        CONSTRAINT mRolesPermissions_PK PRIMARY KEY (Id),
        CONSTRAINT mRolesPermissions_FK_mRoles FOREIGN KEY (RoleId) REFERENCES FilaMagenta.mRoles (Id),
        CONSTRAINT mRolesPermissions_FK_mPermissions FOREIGN KEY (PermissionId) REFERENCES FilaMagenta.mPermissions (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Relates permissions with roles';
`;
