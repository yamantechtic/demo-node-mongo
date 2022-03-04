const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const passportJWT = require('passport-jwt');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const jwt = require('jsonwebtoken');
const config = require('config');

const cipher = require('./api/common/auth/cipherHelper');

const UserService = require('./api/common/user/userService');
const userService = new UserService();

const AdminUserService = require('./api/common/adminUser/adminUserService');
const adminUserService = new AdminUserService()

passport.use('user-email-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
},
  (email, password, cb) => {
    userService
      .findByEmail(email)
      .then(user => {
        const { passwordHash } = cipher.sha512(password, user.salt);

        if (!user || user.passwordHash !== passwordHash) {
          return cb(null, false, { message: 'Incorrect utils or password.' });
        }
        return cb(null, { id: user._id }, { message: 'Logged In Successfully' });
      })
      .catch(() => cb(null, false, { message: 'Incorrect utils or password.' }));
  }));

passport.use('user-phone-local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
},
  (email, password, cb) => {
    userService
      .findByPhone(email)
      .then(user => {
        const { passwordHash } = cipher.sha512(password, user.salt);

        if (!user || user.passwordHash !== passwordHash) {
          return cb(null, false, { message: 'Incorrect utils or password.' });
        }
        return cb(null, { id: user._id }, { message: 'Logged In Successfully' });
      })
      .catch(() => cb(null, false, { message: 'Incorrect utils or password.' }));
  }));

  // admin user

  passport.use('admin-user-email-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  },
    (email, password, cb) => {
      adminUserService
        .findByEmail(email)
        .then(user => {
          const { passwordHash } = cipher.sha512(password, user.salt);
  
          if (!user || user.passwordHash !== passwordHash) {
            return cb(null, false, { message: 'Incorrect utils or password.' });
          }
          return cb(null, { id: user._id }, { message: 'Logged In Successfully' });
        })
        .catch(() => cb(null, false, { message: 'Incorrect utils or password.' }));
    }));
  
  passport.use('admin-user-phone-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  },
    (email, password, cb) => {
      adminUserService
        .findByPhone(email)
        .then(user => {
          const { passwordHash } = cipher.sha512(password, user.salt);
  
          if (!user || user.passwordHash !== passwordHash) {
            return cb(null, false, { message: 'Incorrect utils or password.' });
          }
          return cb(null, { id: user._id }, { message: 'Logged In Successfully' });
        })
        .catch(() => cb(null, false, { message: 'Incorrect utils or password.' }));
    }));
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  // secretOrKey: config.get('auth.jwt.secret'),
  secretOrKey: process.env.JWT_SECRET,
},
  (jwtPayload, cb) => {
    return cb(null, jwtPayload);
  }));
