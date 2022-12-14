import {errorResponse, successResponse} from "../response.js";
import {changePassword as changeUserPassword, login} from "../auth.js";
import {
    InvalidTokenException,
    LoginAttemptInsertException,
    PasswordlessUserException,
    SecurityException,
    UserAlreadyExistsException,
    UserNotFoundException,
    WrongPasswordException
} from "../exceptions.js";
import {error, log, warn} from "../../cli/logger.js";
import {checkToken, decodeToken} from "../security.js";
import {hasPermission} from "../permissions.js";
import {getGradeId, getRoleId, getUserData, newUser as createUser} from "../data/users.js";
import {getCard, newCard} from "../request/caldav.js";

export const auth = async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const nif = body['nif'];
    /** @type {string|null} */
    const password = body['password'];

    if (nif == null || password == null)
        return res.status(400).json(errorResponse('missing-parameters'));
    try {
        const token = await login(nif, password, req.clientIp);
        res.status(200).json(successResponse({token}));
    } catch (e) {
        if (e instanceof PasswordlessUserException)
            res.status(417).json(errorResponse('passwordless'));
        else if (e instanceof WrongPasswordException)
            res.status(403).json(errorResponse('wrong-credentials'));
        else if (e instanceof SecurityException)
            res.status(412).json(errorResponse('max-attempts-reached'));
        else if (e instanceof UserNotFoundException)
            res.status(404).json(errorResponse('not-found'));
        else {
            // Internal exceptions
            error('Could not authenticate. Error:', e);
            if (e instanceof LoginAttemptInsertException)
                res.status(550).json(errorResponse('internal'));
            else
                res.status(500).json({success: false, error: 'unknown', errorData: e});
        }
    }
};

export const data = async (req, res) => {
    const query = req.query;
    /** @type {string|null} */
    const apiKey = req.get('API-Key');
    /** @type {string|null} */
    const userIdParam = query['user_id'];

    if (apiKey == null || !(await checkToken(apiKey)))
        return res.status(406).send(errorResponse('invalid-key'));

    let tokenData;
    try {
        tokenData = await decodeToken(apiKey);
    } catch (e) {
        return res.status(401).send(errorResponse('invalid-key'));
    }

    let userId, constrain = false;
    if (userIdParam != null) {
        userId = parseInt(userIdParam);
        constrain = !(await hasPermission(userId, 'people_see'));
    } else {
        userId = tokenData['userId'];
    }

    const userData = await getUserData(userId);
    if (userData == null)
        return res.status(404).json(errorResponse('not-found'));

    const vCard = await getCard(userData.Uid);
    log('vCard:', vCard)
    if (vCard == null)
        warn(`Could not find vCard for user #${userId}. Uid:`, userData.Uid);
    else
        userData.vCard = vCard;

    if (constrain)
        res.json(successResponse(userData.vCard));
    else
        res.json(successResponse(userData));
};

export const changePassword = async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const nif = body['nif'];
    /** @type {string|null} */
    const password = body['password'];
    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    if (nif == null || password == null)
        return res.status(400).json(errorResponse('missing-parameters'));
    try {
        await changeUserPassword(nif, password, apiKey);
        res.status(200).json(successResponse());
    } catch (e) {
        if (e instanceof InvalidTokenException)
            res.status(406).json(errorResponse('invalid-key'));
        else if (e instanceof UserNotFoundException)
            res.status(406).json(errorResponse('not-found'));
        else
            res.status(500).json({error: e instanceof Error ? e.toString() : e})
        error('Could not change password. Error:', e);
    }
};

export const newUser = async (req, res) => {
    const body = req.body;
    /** @type {string|null} */
    const nif = body['nif'];
    /** @type {string|null} */
    const email = body['email'];
    /** @type {string|null} */
    const role = body['role'] ?? '1';
    /** @type {string|null} */
    const grade = body['grade'];
    /** @type {string|null} */
    const whitesWheelNumber = body['whites_wheel_number'] ?? '0';
    /** @type {string|null} */
    const blacksWheelNumber = body['blacks_wheel_number'] ?? '0';
    /** @type {string|null} */
    const associatedTo = body['associated_to'];
    /** @type {string|null} */
    const meta = body['meta'];
    /** @type {string|null} */
    const apiKey = req.get('API-Key');

    if (nif == null || email == null || grade == null)
        return res.status(400).json(errorResponse('missing-parameters'));

    try {
        let tokenData;
        try {
            tokenData = await decodeToken(apiKey);
        } catch (e) {
            return res.status(401).send(errorResponse('invalid-key'));
        }

        const permission = !(await hasPermission(tokenData.userId, 'admin/create_users'));
        if (!permission) {
            warn('User', tokenData.userId, 'tried to create an user without permission.');
            return res.status(403).send(errorResponse('unauthorised'));
        }

        const roleId = await getRoleId(role);
        if (roleId == null) return res.status(406).json(errorResponse('invalid-request', 'The given role is not valid.'));

        const gradeId = await getGradeId(grade);
        if (gradeId == null) return res.status(406).json(errorResponse('invalid-request', 'The given grade is not valid.'));

        /** @type {string|null} */
        let uid = null;
        if (meta != null) {
            /** @type {PersonData} */
            const parsedMeta = JSON.parse(meta);
            const newCardResult = await newCard(parsedMeta);
            uid = newCardResult[0];
        }

        try {
            await createUser({
                NIF: nif,
                Uid: uid,
                Email: email,
                Grade: gradeId,
                Role: roleId,
                WhitesWheelNumber: whitesWheelNumber,
                BlacksWheelNumber: blacksWheelNumber,
                AssociatedTo: associatedTo,
            });

            res.send(successResponse());
        } catch (e) {
            if (e instanceof UserAlreadyExistsException)
                res.status(409)
                    .send(errorResponse('conflict', 'Tried to create an user that already exists.'))
        }
    } catch (e) {
        res.status(500).send(errorResponse(e));
    }
};
