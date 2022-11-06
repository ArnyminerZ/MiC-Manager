import dotenv from 'dotenv';

dotenv.config();

export const InfoTable = `
    CREATE TABLE IF NOT EXISTS mInfo
    (
        Id    int(10) unsigned auto_increment NOT NULL,
        Value varchar(16)                     NOT NULL,
        CONSTRAINT mInfo_PK PRIMARY KEY (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Provides some information about the database.';
`;

export const UsersTable = `
    CREATE TABLE IF NOT EXISTS mUsers
    (
        Id          INT(10) UNSIGNED auto_increment NOT NULL,
        NIF         varchar(20)                     NOT NULL,
        Hash        varchar(256)     DEFAULT NULL   NULL,
        Uid         varchar(36)                     NOT NULL COMMENT 'The UID of the user in the WebDAV address book.',
        Role        INT(10) UNSIGNED DEFAULT 1      NOT NULL,
        Grade       INT(10) UNSIGNED                NOT NULL,
        WhitesWheel INT(10) UNSIGNED DEFAULT 0      NOT NULL,
        BlacksWheel INT(10) UNSIGNED DEFAULT 0      NOT NULL,
        Associated  INT(10) UNSIGNED DEFAULT NULL   NULL COMMENT 'Can be linked with another user. The indicated will be the supervisor of the current user.',
        CONSTRAINT mUsers_PK PRIMARY KEY (Id),
        CONSTRAINT mUsers_UK UNIQUE KEY (NIF),
        CONSTRAINT mUsers_FK FOREIGN KEY (Role) REFERENCES mRoles (Id),
        CONSTRAINT mUsers_GR FOREIGN KEY (Grade) REFERENCES mGrades (Id),
        CONSTRAINT mUsers_AS FOREIGN KEY (Associated) REFERENCES mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT = 'A table that keeps track of the users that make use of the platform.'`;

export const LoginAttemptsTable = `
    CREATE TABLE IF NOT EXISTS mLoginAttempts
    (
        Id         INT(10) UNSIGNED auto_increment     NOT NULL,
        Timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        IP         BINARY(4)                           NOT NULL,
        UserId     INT(10) UNSIGNED                    NOT NULL,
        Successful BIT                                 NOT NULL,
        CONSTRAINT mLoginAttempts_PK PRIMARY KEY (Id),
        CONSTRAINT mLoginAttempts_FK FOREIGN KEY (UserId) REFERENCES mUsers (Id)
    )`;

export const RolesTable = `
    CREATE TABLE IF NOT EXISTS mRoles
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
    CREATE TABLE IF NOT EXISTS mPermissions
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
    CREATE TABLE IF NOT EXISTS mCategories
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
    CREATE TABLE IF NOT EXISTS mEvents
    (
        Id          INTEGER UNSIGNED auto_increment   NOT NULL COMMENT 'The id of the event.',
        DisplayName varchar(100)                      NOT NULL COMMENT 'The name to use as an identifier of the event.',
        Description TEXT                 DEFAULT NULL NULL COMMENT 'An extra description to use for the event.',
        Date        DATETIME                          NOT NULL COMMENT 'The moment at which the event will take place.',
        Contact     varchar(100)         DEFAULT NULL NULL COMMENT 'Some contact information for the responsible of the event.',
        Category    INTEGER(10) UNSIGNED DEFAULT 1    NOT NULL COMMENT 'The category to assign to the event.',
        CONSTRAINT PK_mEvents PRIMARY KEY (Id),
        CONSTRAINT FK_mEvents_cat FOREIGN KEY (Category) REFERENCES mCategories (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Registers all the events scheduled to happen.';
`;

export const AssistanceTable = `
    CREATE TABLE IF NOT EXISTS mAssistance
    (
        Id      int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the row.',
        UserId  int(10) unsigned                NOT NULL COMMENT 'The id of the user that has confirmed the assistance.',
        Assists bit                             NOT NULL COMMENT 'If 1, the user has said that it will assist. False otherwise.',
        EventId int(10) unsigned                NOT NULL COMMENT 'The id of the event that is being assisted.',
        CONSTRAINT PK_mAssistance PRIMARY KEY (Id),
        CONSTRAINT mAssistance_FK_mEvents FOREIGN KEY (EventId) REFERENCES mEvents (Id),
        CONSTRAINT mAssistance_FK_mUsers FOREIGN KEY (UserId) REFERENCES mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores user''s assistance to events.';
`;

export const TablesTable = `
    CREATE TABLE IF NOT EXISTS mTables
    (
        Id          int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the table.',
        Responsible int(10) unsigned                NOT NULL COMMENT 'The id of the user that is responsible of the table.',
        EventId     int(10) unsigned                NOT NULL COMMENT 'The id of the event that this table matches to.',
        CONSTRAINT mTables_PK PRIMARY KEY (Id),
        CONSTRAINT mTables_FK_mEvents FOREIGN KEY (EventId) REFERENCES mEvents (Id),
        CONSTRAINT mTables_FK_mUsers FOREIGN KEY (Responsible) REFERENCES mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores all the assigned tables for each event that supports them.';
`;

export const PeopleTablesTable = `
    CREATE TABLE IF NOT EXISTS mTablesPeople
    (
        Id      int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the row.',
        UserId  int(10) unsigned                NOT NULL COMMENT 'The id of the user being assigned.',
        TableId int(10) unsigned                NOT NULL COMMENT 'The id of the table that the user is being assigned to.',
        CONSTRAINT mTablesPeople_PK PRIMARY KEY (Id),
        CONSTRAINT mTablesPeople_FK_mTables FOREIGN KEY (TableId) REFERENCES mTables (Id),
        CONSTRAINT mTablesPeople_FK_mUsers FOREIGN KEY (UserId) REFERENCES mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Relates people with tables.';
`;

export const RolesPermissionsTable = `
    CREATE TABLE IF NOT EXISTS mRolesPermissions
    (
        Id           int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the row.',
        RoleId       int(10) unsigned                NOT NULL COMMENT 'The id of the role to assign the permission to.',
        PermissionId int(10) unsigned                NOT NULL COMMENT 'The id of the permission being assigned.',
        CONSTRAINT mRolesPermissions_PK PRIMARY KEY (Id),
        CONSTRAINT mRolesPermissions_FK_mRoles FOREIGN KEY (RoleId) REFERENCES mRoles (Id),
        CONSTRAINT mRolesPermissions_FK_mPermissions FOREIGN KEY (PermissionId) REFERENCES mPermissions (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Relates permissions with roles';
`;

export const GradesTable = `
    CREATE TABLE IF NOT EXISTS mGrades
    (
        Id              int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the grade.',
        DisplayName     varchar(16)                     NOT NULL COMMENT 'A descriptive name of the role.',
        ActsRight       bit      DEFAULT 0              NOT NULL COMMENT 'If the grade provides right to participate on public acts.',
        LockWhitesWheel bit      DEFAULT 0              NOT NULL COMMENT 'If the grade locks the position of the person in the whites wheel.',
        LockBlacksWheel bit      DEFAULT 0              NOT NULL COMMENT 'If the grade locks the position of the person in the blacks wheel.',
        Votes           bit      DEFAULT 0              NOT NULL COMMENT 'If the grade grants the user the possibility to vote.',
        MinAge          smallint DEFAULT 18             NOT NULL COMMENT 'The minimum age required to have this grade.',
        MaxAge          smallint DEFAULT NULL           NULL COMMENT 'The maximum age allowed to have this grade.',
        CONSTRAINT mGrades_PK PRIMARY KEY (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores the different grades that each person can get. These define which rights they have in the organization.';
`;

export const RegistrationsTable = `
    CREATE TABLE IF NOT EXISTS mUserRegistrations
    (
        Id            int(10) unsigned auto_increment     NOT NULL,
        UserId        int(10) unsigned                    NOT NULL,
        \`Left\`      bit       DEFAULT 0                 NOT NULL COMMENT '1 if the user is leaving, 0 if the user is entering.',
        \`Timestamp\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'The time in which the registration was made.',
        CONSTRAINT mUserRegistrations_PK PRIMARY KEY (Id),
        CONSTRAINT mUserRegistrations_FK FOREIGN KEY (UserId) REFERENCES mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores the different sign ups and downs users have made.';
`;

export const AscentsTable = `
    CREATE TABLE IF NOT EXISTS mUserAscents
    (
        Id        int(10) unsigned auto_increment     NOT NULL,
        Timestamp timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'The time in which the ascent was made.',
        UserId    int(10) unsigned                    NOT NULL,
        FromGrade int(10) unsigned                    NOT NULL,
        ToGrade   int(10) unsigned                    NOT NULL,
        CONSTRAINT mUserAscents_PK PRIMARY KEY (Id),
        CONSTRAINT mUserAscents_FK_User FOREIGN KEY (UserId) REFERENCES mUsers (Id),
        CONSTRAINT mUserAscents_FK_Grade1 FOREIGN KEY (FromGrade) REFERENCES mGrades (Id),
        CONSTRAINT mUserAscents_FK_Grade2 FOREIGN KEY (ToGrade) REFERENCES mGrades (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores the different movements between categories that the users have made.';
`;

export const PositionsTable = `
    CREATE TABLE IF NOT EXISTS mPositions
    (
        Id          int(10) unsigned auto_increment NOT NULL COMMENT 'The id of the position.',
        DisplayName varchar(16)                     NOT NULL COMMENT 'A descriptive name of the position.',
        CONSTRAINT mPositions_PK PRIMARY KEY (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores the different positions that each person can get.';
`;

export const UserPositionsTable = `
    CREATE TABLE IF NOT EXISTS mUserPositions
    (
        Id        int(10) unsigned auto_increment     NOT NULL,
        Timestamp timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'The time in which the ascent was made.',
        UserId    int(10) unsigned                    NOT NULL,
        Position  int(10) unsigned                    NOT NULL,
        CONSTRAINT mUserPositions_PK PRIMARY KEY (Id),
        CONSTRAINT mUserPositions_FK_User FOREIGN KEY (UserId) REFERENCES mUsers (Id),
        CONSTRAINT mUserPositions_FK_Position FOREIGN KEY (Position) REFERENCES mPositions (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores the positions that people have made over time. This includes ruling charges, and public charges.';
`;

export const UserTrebuchetTable = `
    CREATE TABLE IF NOT EXISTS mUserTrebuchet
    (
        Id       int(10) unsigned auto_increment NOT NULL,
        UserId   int(10) unsigned                NOT NULL,
        Obtained date                            NOT NULL,
        Expires  date                            NOT NULL,
        CONSTRAINT mUserTrebuchet_PK PRIMARY KEY (Id),
        CONSTRAINT mUserTrebuchet_FK FOREIGN KEY (UserId) REFERENCES mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores every time an user has obtained a shooting permission.';
`;

export const UserShootsTable = `
    CREATE TABLE IF NOT EXISTS mUserShoots
    (
        Id     int(10) unsigned auto_increment NOT NULL,
        UserId int(10) unsigned                NOT NULL,
        Year   int(10) unsigned                NOT NULL,
        CONSTRAINT mUserShoots_PK PRIMARY KEY (Id),
        CONSTRAINT mUserShoots_FK FOREIGN KEY (UserId) REFERENCES mUsers (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores every time an user has shot.';
`;

export const EventMenusTable = `
    CREATE TABLE IF NOT EXISTS mMenus
    (
        Id             int(10) unsigned auto_increment NOT NULL,
        EventId        int(10) unsigned                NOT NULL,
        Firsts         varchar(512) DEFAULT NULL       NULL COMMENT 'A list of the first plates, separated by ";"',
        Seconds        varchar(512) DEFAULT NULL       NULL COMMENT 'A list of the seconds plates, separated by ";"',
        Thirds         varchar(512) DEFAULT NULL       NULL COMMENT 'A list of the thirds plates, separated by ";"',
        Desserts       varchar(512) DEFAULT NULL       NULL COMMENT 'A list of the desserts plates, separated by ";"',
        DrinkIncluded  bit          DEFAULT 0          NOT NULL COMMENT 'If drinks are included.',
        CoffeeIncluded bit          DEFAULT 0          NOT NULL COMMENT 'If coffees are included.',
        TeaIncluded    bit          DEFAULT 0          NOT NULL COMMENT 'If tea and infusions are included.',
        CONSTRAINT mMenus_PK PRIMARY KEY (Id),
        CONSTRAINT mMenus_FK FOREIGN KEY (EventId) REFERENCES mEvents (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores the menus for all the events that apply.';
`;

export const MenuPricingTable = `
    CREATE TABLE IF NOT EXISTS mMenuPricing
    (
        Id     int(10) unsigned auto_increment NOT NULL,
        MenuId int(10) unsigned                NOT NULL,
        RoleId int(10) unsigned                NOT NULL,
        Price  float(10) unsigned              NOT NULL,
        CONSTRAINT mMenuPricing_PK PRIMARY KEY (Id),
        CONSTRAINT mMenuPricing_MI FOREIGN KEY (MenuId) REFERENCES mMenus (Id),
        CONSTRAINT mMenuPricing_RI FOREIGN KEY (RoleId) REFERENCES mRoles (Id)
    )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb3
        COLLATE = utf8mb3_general_ci
        COMMENT ='Stores the prices for the different roles for a menu.';
`;
