var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { BasicStrategy } from 'passport-http';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { AUTH_ENABLED, isBasicAuthEnabled } from '@nangohq/utils';
import { database } from '@nangohq/database';
import { dirname, userService } from '@nangohq/shared';
import crypto from 'crypto';
import util from 'util';
import cookieParser from 'cookie-parser';
import connectSessionKnex from 'connect-session-knex';
const KnexSessionStore = connectSessionKnex(session);
const sessionStore = new KnexSessionStore({
    knex: database.knex,
    tablename: '_nango_sessions',
    sidfieldname: 'sid'
});
export function setupAuth(app) {
    app.use(cookieParser());
    app.use(express.static(path.join(dirname(), 'public')));
    app.use(session({
        secret: process.env['NANGO_ADMIN_KEY'] || 'nango',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        name: 'nango_session',
        unset: 'destroy',
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: false },
        rolling: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    if (AUTH_ENABLED) {
        passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, function (email, password, cb) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!email) {
                    return cb(null, false, { message: 'Email is required.' });
                }
                // in the case of SSO, the password field is empty. Explicitly
                // check for this case to avoid a database query.
                if (!password) {
                    return cb(null, false, { message: 'Password is required.' });
                }
                const user = yield userService.getUserByEmail(email);
                if (user == null) {
                    return cb(null, false, { message: 'Incorrect email or password.' });
                }
                const proposedHashedPassword = yield util.promisify(crypto.pbkdf2)(password, user.salt, 310000, 32, 'sha256');
                const actualHashedPassword = Buffer.from(user.hashed_password, 'base64');
                if (proposedHashedPassword.length !== actualHashedPassword.length || !crypto.timingSafeEqual(actualHashedPassword, proposedHashedPassword)) {
                    return cb(null, false, { message: 'Incorrect email or password.' });
                }
                return cb(null, user);
            });
        }));
    }
    else {
        passport.use(new BasicStrategy(function (username, password, done) {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield userService.getUserById(0);
                if (!isBasicAuthEnabled) {
                    return done(null, user);
                }
                if (username !== process.env['NANGO_DASHBOARD_USERNAME']) {
                    return done(null, false);
                }
                if (password !== process.env['NANGO_DASHBOARD_PASSWORD']) {
                    return done(null, false);
                }
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            });
        }));
    }
    passport.serializeUser(function (user, cb) {
        process.nextTick(function () {
            cb(null, { id: user.id, email: user.email, name: user.name });
        });
    });
    passport.deserializeUser(function (user, cb) {
        process.nextTick(function () {
            return cb(null, user);
        });
    });
}
//# sourceMappingURL=auth.client.js.map