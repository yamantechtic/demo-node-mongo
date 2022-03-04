const cipher = require('./cipherHelper');
const emailService = require('../../../utils/emailService');
const UserRepository = require('../user/userRepository');
const AdminUserService = require('../adminUser/adminUserService');
const UserService = require('../user/userService');
const config = require('config');
// const { domain } = config.get('frontEnd');
const domain  = process.env.FRONTEND_URL;
// const { domain: backend_domain } = config.get('backEnd');
const backend_domain = process.env.BACKEND_URL;

class AuthService {
  constructor() {
    this.userService = new UserService();
    this.adminUserService = new AdminUserService();
    this.userRepository = new UserRepository();
  }

  //-----------------------------------------
  // User functions
  //-----------------------------------------

  // request user password
  requestUserPassword(email) {
    return this.userService
      .findByEmail(email)
      .then(user => {
        if (user) {
          const token = cipher.generateResetPasswordToken(user._id);
          if (user.user_type.trim().toLowerCase() === 'donor' || user.user_type.trim().toLowerCase().includes('admin'))
            return emailService.sendResetUserPasswordEmail(email, user.first_name + ' ' + user.last_name, token, domain);
          else
            return emailService.sendResetUserPasswordEmail(email, user.company_name, token, domain);
        }
        throw new Error('There is no defined email in the system.');
      });
  }

  // reset user password
  resetPassword(password, confirmPassword, resetPasswordToken) {
    if (password.length < 6) {
      throw new Error('Password should be longer than 6 characters');
    }

    if (password !== confirmPassword) {
      throw new Error('Password and its confirmation do not match.');
    }

    const tokenContent = cipher.decipherResetPasswordToken(resetPasswordToken);
    if (new Date().getTime() > tokenContent.valid) {
      throw new Error('Reset password token has expired.');
    }

    return this.userService.changePassword(tokenContent.userId, password);
  }

  //-----------------------------------------
  // Admin User functions
  //-----------------------------------------

  // request user password
  requestAdminUserPassword(email) {
    return this.adminUserService
      .findByEmail(email)
      .then(user => {
        if (user) {
          const token = cipher.generateResetPasswordToken(user._id);
          return emailService.sendResetUserPasswordEmail(email, user.first_name + ' ' + user.last_name, token, backend_domain);
        }
        throw new Error('There is no defined email in the system.');
      });
  }

  // reset user password
  resetAdminUserPassword(password, confirmPassword, resetPasswordToken) {
    if (password.length < 6) {
      throw new Error('Password should be longer than 6 characters');
    }

    if (password !== confirmPassword) {
      throw new Error('Password and its confirmation do not match.');
    }

    const tokenContent = cipher.decipherResetPasswordToken(resetPasswordToken);
    if (new Date().getTime() > tokenContent.valid) {
      throw new Error('Reset password token has expired.');
    }

    return this.adminUserService.changePassword(tokenContent.userId, password);
  }

}

module.exports = AuthService;
