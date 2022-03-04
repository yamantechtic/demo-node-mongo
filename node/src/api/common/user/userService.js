const crypto = require('crypto');
const cipher = require('../auth/cipherHelper');
const config = require('config');
const jwt = require('jsonwebtoken');
const UserRepository = require('./userRepository');
const emailService = require('../../../utils/emailService');

const AdminUserService = require('../adminUser/adminUserService');
const adminUserService = new AdminUserService();

const ProfileRestrictionsRepository = require('../profileRestrictions/profileRestrictionsRepository');
const profileRestrictionsRepository = new ProfileRestrictionsRepository();

const FollowedUserRepository = require('../followedUser/followedUserRepository');
const followedUserRepository = new FollowedUserRepository();

const BlockedUserRepository = require('../blockedUser/blockedUserRepository');
const blockedUserRepository = new BlockedUserRepository();
// const { ObjectID } = require('mongodb');

class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  // get all users
  async list(req) {
    var req_user = await adminUserService.findById(req.user.id);
    let blockedusers;
    if (req_user.length > 0) {
      if (!req_user[0].role_data[0].frontend_user.read) throw new Error('Access Denied!');
    } else {
      var site_user = await this.repository.findById(req.user.id);
      if (site_user.length <= 0) throw new Error('Current user does not exist!');
      var site__blocked_user = await blockedUserRepository.getBlockedUsers(req);
      blockedusers = site__blocked_user.data.map((item) => item.blocked_users)
    }
    return this.repository.getAllUsers(req,blockedusers);
  }

  //get count
  getCount(req) {
    return this.repository.getCount(req);
  }

  // get user by email
  findByEmail(email) {
    return this.repository.findByEmail(email);
  }

  // get user by phone
  findByPhone(phone) {
    return this.repository.findByPhone(phone);
  }

  // get user by email and provider_token
  findByEmailProvider(body) {
    var search = {};
    if (body.provider.trim().toLowerCase() === 'google') {
      search = {
        email: body.email,
        google_token: body.provider_token
      }
    } else if (body.provider.trim().toLowerCase() === 'facebook') {
      search = {
        email: body.email,
        facebook_token: body.provider_token
      }
    } else if (body.provider.trim().toLowerCase() === 'apple') {
      search = {
        email: body.email,
        apple_token: body.provider_token
      }
    }
    return this.repository.findByEmailProvider(search);
  }

  // get user by id
  async findById(id, req_user_id, req) {
    if (req) {
      var req_user = await adminUserService.findById(req.user.id);
      if (req_user.length > 0 && !req_user[0].role_data[0].frontend_user.read) throw new Error('Access Denied!');
      if (req_user.length > 0) {
        return this.repository.findById(id)
          .then(user => user);
      }
    }

    if (req_user_id) {
      if (id != req_user_id) {
        var user_data = await this.repository.findById(id);
        if (user_data.length > 0 && user_data[0].user_type == 'donor') {
          var request_user_data = await this.repository.findById(req_user_id);
          if (request_user_data.length > 0) {
            var restrictions_data = await profileRestrictionsRepository.getProfileRestrictions(id);
            if (restrictions_data.length > 0) {
              if (restrictions_data[0].contact_info.trim().toLowerCase() == "everybody") {
                if (restrictions_data[0].profile.trim().toLowerCase() == "everybody") {
                  return this.repository.findById(id)
                    .then(user => user);
                } else if (restrictions_data[0].profile.trim().toLowerCase() == "only connections") {
                  var connection_data = await followedUserRepository.findRequestByUser(id, req_user_id);
                  if (connection_data.length > 0 && connection_data[0].request == true) {
                    return this.repository.findById(id)
                      .then(user => user);
                  } else {
                    return this.repository.findById(id)
                      .then(user => {
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                        return user;
                      });
                  }
                }
                else if (restrictions_data[0].profile.trim().toLowerCase() == "only donors") {
                  if (request_user_data.length > 0 && request_user_data[0].user_type == 'donor') {
                    return this.repository.findById(id)
                      .then(user => user);
                  } else {
                    return this.repository.findById(id)
                      .then(user => {
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                        return user;
                      });
                  }
                }
                else if (restrictions_data[0].profile.trim().toLowerCase() == "nobody") {
                  return this.repository.findById(id)
                    .then(user => {
                      delete user[0]["dob"];
                      delete user[0]["about_me"];
                      delete user[0]["causes"];
                      delete user[0]["influence"];
                      return user;
                    });
                }
              } else if (restrictions_data[0].contact_info.trim().toLowerCase() == "only connections") {
                var connection_data = await followedUserRepository.findRequestByUser(id, req_user_id);
                if (restrictions_data[0].profile.trim().toLowerCase() == "everybody") {
                  return this.repository.findById(id)
                    .then(user => {
                      if (connection_data.length <= 0 || (connection_data.length > 0 && connection_data[0].request == false)) {
                        delete user[0]["email"];
                        delete user[0]["phone"];
                        delete user[0]["location"];
                        delete user[0]["social_media_accounts"];
                      }
                      return user;
                    });
                } else if (restrictions_data[0].profile.trim().toLowerCase() == "only connections") {
                  if (connection_data.length > 0 && connection_data[0].request == true) {
                    return this.repository.findById(id)
                      .then(user => user);
                  } else {
                    delete user[0]["email"];
                    delete user[0]["phone"];
                    delete user[0]["location"];
                    delete user[0]["social_media_accounts"];
                    delete user[0]["dob"];
                    delete user[0]["about_me"];
                    delete user[0]["causes"];
                    delete user[0]["influence"];
                    return user;
                  }
                }
                else if (restrictions_data[0].profile.trim().toLowerCase() == "only donors") {
                  return this.repository.findById(id)
                    .then(user => {
                      if ((connection_data.length <= 0 || (connection_data.length > 0 && connection_data[0].request == false)) && request_user_data.length > 0 && request_user_data[0].user_type == 'donor') {
                        delete user[0]["email"];
                        delete user[0]["phone"];
                        delete user[0]["location"];
                        delete user[0]["social_media_accounts"];
                      }
                      else if ((connection_data.length <= 0 || (connection_data.length > 0 && connection_data[0].request == false)) && request_user_data.length > 0 && request_user_data[0].user_type != 'donor') {
                        delete user[0]["email"];
                        delete user[0]["phone"];
                        delete user[0]["location"];
                        delete user[0]["social_media_accounts"];
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                      }
                      else if ((connection_data.length <= 0 || (connection_data.length > 0 && connection_data[0].request == true)) && request_user_data.length > 0 && request_user_data[0].user_type != 'donor') {
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                      }
                      return user;
                    });
                }
                else if (restrictions_data[0].profile.trim().toLowerCase() == "nobody") {
                  return this.repository.findById(id)
                    .then(user => {
                      if (connection_data.length <= 0 || (connection_data.length > 0 && connection_data[0].request == true)) {
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                        return user;
                      } else {
                        delete user[0]["email"];
                        delete user[0]["phone"];
                        delete user[0]["location"];
                        delete user[0]["social_media_accounts"];
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                        return user;
                      }
                    });
                }
              } else if (restrictions_data[0].contact_info.trim().toLowerCase() == "only donors") {
                return this.repository.findById(id)
                  .then(async user => {
                    var flag = true;
                    if (request_user_data[0].user_type != 'donor') {
                      delete user[0]["email"];
                      delete user[0]["phone"];
                      delete user[0]["location"];
                      delete user[0]["social_media_accounts"];
                    }
                    if (restrictions_data[0].profile.trim().toLowerCase() == "only connections") {
                      var connection_data = await followedUserRepository.findRequestByUser(id, req_user_id);
                      if (request_user_data[0].user_type != 'donor' && (connection_data.length > 0 && connection_data[0].request == false)) {
                        flag = false;
                      } else if (request_user_data[0].user_type == 'donor' && (connection_data.length > 0 && connection_data[0].request == false)) {
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                      }
                    }
                    else if (restrictions_data[0].profile.trim().toLowerCase() == "only donors") {
                      if (request_user_data.length > 0 && request_user_data[0].user_type != 'donor') {
                        flag = false;
                      }
                    }
                    else if (restrictions_data[0].profile.trim().toLowerCase() == "nobody") {
                      if (request_user_data[0].user_type != 'donor') flag = false;
                      else {
                        delete user[0]["dob"];
                        delete user[0]["about_me"];
                        delete user[0]["causes"];
                        delete user[0]["influence"];
                      }
                    }

                    if (flag) return user;
                    else {
                      delete user[0]["email"];
                      delete user[0]["phone"];
                      delete user[0]["location"];
                      delete user[0]["social_media_accounts"];
                      delete user[0]["dob"];
                      delete user[0]["about_me"];
                      delete user[0]["causes"];
                      delete user[0]["influence"];
                      return user;
                    }
                  });
              } else if (restrictions_data[0].contact_info.trim().toLowerCase() == "nobody") {
                return this.repository.findById(id)
                  .then(async user => {
                    delete user[0]["email"];
                    delete user[0]["phone"];
                    delete user[0]["location"];
                    delete user[0]["social_media_accounts"];
                    var flag = true;
                    if (restrictions_data[0].profile.trim().toLowerCase() == "only connections") {
                      var connection_data = await followedUserRepository.findRequestByUser(id, req_user_id);
                      if (connection_data.length > 0 && connection_data[0].request == false) {
                        flag = false;
                      }
                    }
                    else if (restrictions_data[0].profile.trim().toLowerCase() == "only donors") {
                      if (request_user_data.length > 0 && request_user_data[0].user_type != 'donor') {
                        flag = false;
                      }
                    }
                    else if (restrictions_data[0].profile.trim().toLowerCase() == "nobody") {
                      flag = false;
                    }
                    if (flag) return user;
                    else {
                      delete user[0]["email"];
                      delete user[0]["phone"];
                      delete user[0]["location"];
                      delete user[0]["social_media_accounts"];
                      delete user[0]["dob"];
                      delete user[0]["about_me"];
                      delete user[0]["causes"];
                      delete user[0]["influence"];
                      return user;
                    }
                  });
              }

              // if (restrictions_data[0].profile.trim().toLowerCase() == "everybody") {
              //   return this.repository.findById(id)
              //     .then(user => user);
              // } else if (restrictions_data[0].profile.trim().toLowerCase() == "only connections") {
              //   var connection_data = await followedUserRepository.findRequestByUser(id, req_user_id);
              //   if (connection_data.length > 0 && connection_data[0].request == true) {
              //     return this.repository.findById(id)
              //       .then(user => user);
              //   } else {
              //     throw new Error('User account is private!');
              //   }
              // }
              // else if (restrictions_data[0].profile.trim().toLowerCase() == "only donors") {
              //   if (request_user_data.length > 0 && request_user_data[0].user_type == 'donor') {
              //     return this.repository.findById(id)
              //       .then(user => user);
              //   } else {
              //     throw new Error('User account is private!');
              //   }
              // }
              // else if (restrictions_data[0].profile.trim().toLowerCase() == "nobody") {
              //   throw new Error('User account is private!');
              // }
            }
          } else {
            throw new Error('Current user does not exist');
          }
        }
      }
    }
    return this.repository.findById(id)
      .then(user => user);
  }

  // get user by id
  async userInfoById(id) {
    // if(req) {
    //   var req_user = await adminUserService.findById(req.user.id);
    //   if(!req_user[0].role_data[0].frontend_user.read) throw new Error('Access Denied!');
    // }
    return this.repository.findById(id)
      .then(user => user);
  }

  // register user
  async register_user(user, admin_user_id) {
    var password;
    var admin_verification = null;

    if (admin_user_id) {
      var req_user = await adminUserService.findById(admin_user_id);
      if (!req_user[0].role_data[0].frontend_user.create) throw new Error("Access Denied!");
      admin_verification = true;
      password = Math.random().toString(36).substring(7);
    } else password = user.password;

    // var user_token = jwt.sign({ email: user.email, token: crypto.randomBytes(16).toString('hex') }, config.get('auth.jwt.secret'));
    var user_token = jwt.sign({ email: user.email, token: crypto.randomBytes(16).toString('hex') }, process.env.JWT_SECRET);

    var user_by_email = await this.repository.findByEmail(user.email);
    var user_by_phone = await this.repository.findByPhone(user.phone);

    if (user_by_email) throw new Error('User with same email already exists');
    if (user_by_phone) throw new Error('User with same phone already exists');

    const { salt, passwordHash } = cipher.saltHashPassword(password);
    var newUser = {};

    if (user.user_type.trim().toLowerCase() == 'donor') {
      newUser = {
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        age: parseInt(user.age),
        dob: user.dob ? new Date(user.dob) : null,
        user_type: user.user_type,
        is_verified: false,
        verification_token: user_token,
        admin_verification: admin_verification,
        deactivate: false,
        salt: salt,
        passwordHash: passwordHash,
        profile_img: user.profile_img,
        location: user.location,//{city:'',state: '', country: ''}
        about_me: user.about_me,
        causes: user.causes,//['cause 1', 'cause 2', ...]
        influence: user.influence,
        social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
        created_at: new Date(),
        updated_at: null
      };
    } else if (user.user_type.trim().toLowerCase() == 'non_profit') {
      newUser = {
        company_name: user.company_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        is_verified: false,
        verification_token: user_token,
        admin_verification: admin_verification,
        deactivate: false,
        salt: salt,
        passwordHash: passwordHash,
        profile_img: user.profile_img,
        website: user.website,
        ein: user.ein,
        category: user.category,
        sub_category: user.sub_category,
        // category: new ObjectID(user.category),
        // sub_category: new ObjectID (user.sub_category),
        mission: user.mission,
        vision: user.vision,
        area_served: user.area_served, //['area 1', 'area 2', ...]
        established_in: user.established_in ? new Date(user.established_in) : null,
        facts_accomplishments: user.facts_accomplishments,
        address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
        social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
        // tax_returns: user.tax_returns != null ? user.tax_returns: null, //[{year: 0000, file_name: ''}, ...]
        tax_returns: user.tax_returns, //["file1.jpg", ...]
        annual_reports: user.annual_reports, //["file1.jpg", ...]
        administration_funds_amt: user.administration_funds_amt, // rs.
        administration_funds_per: user.administration_funds_per, //%
        fundraising_fund_amt: user.fundraising_fund_amt,// rs.
        fundraising_fund_per: user.fundraising_fund_per,// %
        direct_programs_fund_amt: user.direct_programs_fund_amt,// rs.
        direct_programs_fund_per: user.direct_programs_fund_per,//%
        created_at: new Date(),
        updated_at: null
      };
    } else if (user.user_type.trim().toLowerCase() == 'for_profit') {
      newUser = {
        company_name: user.company_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        is_verified: false,
        verification_token: user_token,
        admin_verification: admin_verification,
        deactivate: false,
        salt: salt,
        passwordHash: passwordHash,
        profile_img: user.profile_img,
        website: user.website,
        ein: user.ein,
        mission: user.mission,
        address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
        social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
        product_services: user.product_services,
        industry: user.industry,
        created_at: new Date(),
        updated_at: null
      };
    } else if (user.user_type.trim().toLowerCase() == 'government') {
      newUser = {
        company_name: user.company_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        is_verified: false,
        verification_token: user_token,
        admin_verification: admin_verification,
        deactivate: false,
        salt: salt,
        passwordHash: passwordHash,
        profile_img: user.profile_img,
        website: user.website,
        mission: user.mission,
        address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
        social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
        gov_type: user.gov_type, //local,state,federal/national, international
        created_at: new Date(),
        updated_at: null
      };
    } else if (user.user_type.trim().toLowerCase() == 'foundation') {
      newUser = {
        company_name: user.company_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        is_verified: false,
        verification_token: user_token,
        admin_verification: admin_verification,
        deactivate: false,
        salt: salt,
        passwordHash: passwordHash,
        profile_img: user.profile_img,
        website: user.website,
        ein: user.ein,
        mission: user.mission,
        vision: user.vision,
        address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
        social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
        created_at: new Date(),
        updated_at: null
      };
    } else {
      newUser = {
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        is_verified: false,
        verification_token: user_token,
        admin_verification: admin_verification,
        deactivate: false,
        salt: salt,
        passwordHash: passwordHash,
        profile_img: user.profile_img,
        address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
        created_at: new Date(),
        updated_at: null
      };
    }
    return this.repository.add(newUser)
      .then(() => {
        if (admin_user_id) {
          if (user.user_type.trim().toLowerCase() === 'donor' || user.user_type.trim().toLowerCase().includes('admin'))
            return emailService.sendVerifyUserEmail(user.first_name + " " + user.last_name, user.email, user_token, password);
          else
            return emailService.sendVerifyUserEmail(user.company_name, user.email, user_token, password);
        } else {
          if (user.user_type.trim().toLowerCase() === 'donor' || user.user_type.trim().toLowerCase().includes('admin'))
            return emailService.sendVerifyUserEmail(user.first_name + " " + user.last_name, user.email, user_token);
          else
            return emailService.sendVerifyUserEmail(user.company_name, user.email, user_token);
        }
      });
  }

  confirm_user(email, token) {
    return this.repository.confirm_user(email, token)
      .then(result => {
         result
        });
  }

  // change user password
  changePassword(user_id, password) {
    return this.repository.findById(user_id)
      .then(user_data => {
        if (user_data.length > 0) {
          const { salt, passwordHash } = cipher.saltHashPassword(password);
          return this.repository.changePassword(user_id, salt, passwordHash)
            .then((data) => {
              if (user_data[0].user_type.trim().toLowerCase() == 'donor' || user_data[0].user_type.trim().toLowerCase().includes('admin'))
                return emailService.sendChangeUserPasswordEmail(user_data[0].email, user_data[0].first_name + ' ' + user_data[0].last_name)
                  .then(() => { return data });
              else
                return emailService.sendChangeUserPasswordEmail(user_data[0].email, user_data[0].company_name)
                  .then(() => { return data });
            })
        } else { throw new Error("No user found") }
      });
  }

  addMany(users) {
    return this.repository.addMany(users);
  }

  async approveRejectAccount(user_id, body) {
    var current_user = await adminUserService.findById(user_id);
    var selected_user = await this.findById(body.user_id);

    if (current_user.length > 0) {
      if (selected_user.length > 0) {
        if (current_user[0].role_data[0].frontend_user.update) {
          var data = {
            admin_verification: body.admin_verification,
            internal_comments: body.internal_comments,
            updated_at: new Date()
          };
          return this.repository.edit(body.user_id, data)
            .then(() => {
              if (!body.admin_verification) {
                return emailService.sendAdminVerificationRejectionEmail(selected_user[0].company_name, selected_user[0].email, body.internal_comments)
                  .then(() => { 
                  this.repository.deleteUser(selected_user[0])
                    return "Rejected!"
                  });
              } else {
                return emailService.sendAdminVerificationApprovalEmail(selected_user[0].company_name, selected_user[0].email)
                  .then(() => { return "Approved!" });
              }
            });
        } else {
          throw new Error('Access Denied!');
        }
      } else {
        throw new Error('Selected user does not exist');
      }
    } else {
      throw new Error('Current user does not exist');
    }
    // return this.findById(user_id)
    //   .then(user_data => {
    //     if (user_data.length > 0) {
    //       if (user_data[0].user_type.trim().toLowerCase() == 'admin') {
    //         var data = {
    //           admin_verification: body.admin_verification
    //         };
    //         return this.repository.edit(body.user_id, data)
    //         .then(() => {
    //           if(!admin_verification) {
    //             return emailService.sendAdminVerificationRejectionEmail(user_data[0].company_name, user_data[0].email)
    //           }
    //         });
    //       } else {
    //         throw new Error('Access Denied!');
    //       }
    //     }
    //   });
  }

  async editUser(user_id, user) {
    var data = {};
    var req_user = await adminUserService.findById(user_id);
    if (!req_user[0].role_data[0].frontend_user.update) throw new Error('Access Denied!');
    var current_user = await this.findById(user._id);
    if (current_user.length > 0) {
      if (current_user[0].user_type.trim().toLowerCase() == 'donor') {
        if (!user.first_name) throw new Error('Please enter valid first name');
        if (typeof (user.first_name) !== 'string') throw new Error('Please enter valid first name');
        if (user.first_name.trim().toLowerCase() == 'null' || user.first_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid first name');
        }
        if (!user.last_name) throw new Error('Please enter valid last name');
        if (typeof (user.last_name) !== 'string') throw new Error('Please enter valid last name');
        if (user.last_name.trim().toLowerCase() == 'null' || user.last_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid last name');
        }
        // if (!user.age) throw new Error('Please enter valid age');
        // if (typeof (user.age) !== 'number')throw new Error('Please enter valid age');

        data = {
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          dob: new Date(user.dob),
          location: user.location,//{city:'',state: '', country: ''}
          about_me: user.about_me,
          causes: user.causes,//['cause 1', 'cause 2', ...]
          influence: user.influence,
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'non_profit') {
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.category) throw new Error('Please select valid category');
        if (!user.sub_category) throw new Error('Please select valid sub category');
        if (!user.ein) throw new Error('Please enter valid EIN number');
        if (!user.mission) throw new Error('Please enter valid mission');
        if (!user.area_served) throw new Error('Please select valid area searved');
        if (user.area_served.length == 0) throw new Error('Please select valid area searved');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        if (!user.tax_returns) throw new Error('Please enter valid tax returns');
        if (!user.annual_reports) throw new Error('Please enter valid annual reports');

        if (!user.administration_funds_amt) throw new Error('Please enter valid Funds used for administration');
        if (typeof (user.administration_funds_amt) !== 'number') throw new Error('Please enter valid Funds used for administration)');

        if (!user.administration_funds_per) throw new Error('Please enter valid Funds(%) used for administration');
        if (typeof (user.administration_funds_per) !== 'number') throw new Error('Please enter valid Funds(%) used for administration)');

        if (!user.fundraising_fund_amt) throw new Error('Please enter valid Funds used for fundraising');
        if (typeof (user.fundraising_fund_amt) !== 'number') throw new Error('Please enter valid Funds used for fundraising');

        if (!user.fundraising_fund_per) throw new Error('Please enter valid Funds(%) used for fundraising');
        if (typeof (user.fundraising_fund_per) !== 'number') throw new Error('Please enter valid Funds(%) used for fundraising');

        if (!user.direct_programs_fund_amt) throw new Error('Please enter valid Funds used for Direct Programs');
        if (typeof (user.direct_programs_fund_amt) !== 'number') throw new Error('Please enter valid Funds used for Direct Programs');

        if (!user.direct_programs_fund_per) throw new Error('Please enter valid Funds(%) used for Direct Programs');
        if (typeof (user.direct_programs_fund_per) !== 'number') throw new Error('Please enter valid Funds(%) used for Direct Programs');

        data = {
          company_name: user.company_name,
          website: user.website,
          ein: user.ein,
          category: user.category,
          sub_category: user.sub_category,
          // category: new ObjectID(user.category),
          // sub_category: new ObjectID(user.sub_category),
          mission: user.mission,
          vision: user.vision,
          area_served: user.area_served, //['area 1', 'area 2', ...]
          established_in: new Date(user.established_in),
          facts_accomplishments: user.facts_accomplishments,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          tax_returns: user.tax_returns, //[{year: 0000, file_name: 'date.toString()+_+filename.extension'}, ...]
          annual_reports: user.annual_reports, //[{year: 0000, file_name: ''}, ...]
          administration_funds_amt: user.administration_funds_amt, // rs.
          administration_funds_per: user.administration_funds_per, //%
          fundraising_fund_amt: user.fundraising_fund_amt,// rs.
          fundraising_fund_per: user.fundraising_fund_per,// %
          direct_programs_fund_amt: user.direct_programs_fund_amt,// rs.
          direct_programs_fund_per: user.direct_programs_fund_per,//%
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'for_profit') {
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.ein) throw new Error('Please enter valid EIN number');
        if (!user.product_services) throw new Error('Please enter valid product services');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          company_name: user.company_name,
          website: user.website,
          ein: user.ein,
          mission: user.mission,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          product_services: user.product_services,
          industry: user.industry,
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'government') {
        var types = ['local', 'state', 'federal/national', 'international'];
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.gov_type) throw new Error('Please select valid government type (local, state, federal/national, international)');
        if (!(types.includes(user.gov_type.toLowerCase()))) throw new Error('Please select valid government type (local, state, federal/national, international)');
        if (!user.mission) throw new Error('Please enter valid mission');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          company_name: user.company_name,
          website: user.website,
          mission: user.mission,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          gov_type: user.gov_type, //local,state,federal/national, international
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'foundation') {
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.ein) throw new Error('Please enter valid EIN number');
        if (!user.mission) throw new Error('Please enter valid mission');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          company_name: user.company_name,
          website: user.website,
          ein: user.ein,
          mission: user.mission,
          vision: user.vision,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          updated_at: new Date()
        };
      } else {
        if (!user.first_name) throw new Error('Please enter valid first name');
        if (typeof (user.first_name) !== 'string') throw new Error('Please enter valid first name');
        if (user.first_name.trim().toLowerCase() == 'null' || user.first_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid first name');
        }
        if (!user.last_name) throw new Error('Please enter valid last name');
        if (typeof (user.last_name) !== 'string') throw new Error('Please enter valid last name');
        if (user.last_name.trim().toLowerCase() == 'null' || user.last_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid last name');
        }
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          updated_at: new Date()
        };
      }
      return this.repository.edit(user._id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  async editProfile(user_id, user) {
    var data = {};
    var current_user = await this.findById(user_id);
    if (current_user.length > 0) {
      if (current_user[0].user_type.trim().toLowerCase() == 'donor') {
        if (!user.first_name) throw new Error('Please enter valid first name');
        if (typeof (user.first_name) !== 'string') throw new Error('Please enter valid first name');
        if (user.first_name.trim().toLowerCase() == 'null' || user.first_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid first name');
        }
        if (!user.last_name) throw new Error('Please enter valid last name');
        if (typeof (user.last_name) !== 'string') throw new Error('Please enter valid last name');
        if (user.last_name.trim().toLowerCase() == 'null' || user.last_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid last name');
        }
        // if (!user.age) throw new Error('Please enter valid age');
        // if (typeof (user.age) !== 'number')throw new Error('Please enter valid age');

        data = {
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          dob: user.dob ? new Date(user.dob) : null,
          location: user.location,//{city:'',state: '', country: ''}
          about_me: user.about_me,
          causes: user.causes,//['cause 1', 'cause 2', ...]
          influence: user.influence,
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'non_profit') {
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.category) throw new Error('Please select valid category');
        if (!user.sub_category) throw new Error('Please select valid sub category');
        if (!user.ein) throw new Error('Please enter valid EIN number');
        if (!user.mission) throw new Error('Please enter valid mission');
        if (!user.area_served) throw new Error('Please select valid area searved');
        if (user.area_served.length == 0) throw new Error('Please select valid area searved');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        if (!user.tax_returns) throw new Error('Please enter valid tax returns');
        if (!user.annual_reports) throw new Error('Please enter valid annual reports');

        if (parseFloat(user.administration_funds_amt) < 0) throw new Error('Please enter valid Funds used for administration');
        if (typeof (user.administration_funds_amt) !== 'number') throw new Error('Please enter valid Funds used for administration');

        if (parseFloat(user.administration_funds_per) < 0) throw new Error('Please enter valid Funds(%) used for administration');
        if (typeof (user.administration_funds_per) !== 'number') throw new Error('Please enter valid Funds(%) used for administration)');

        if (parseFloat(user.fundraising_fund_amt) < 0) throw new Error('Please enter valid Funds used for fundraising');
        if (typeof (user.fundraising_fund_amt) !== 'number') throw new Error('Please enter valid Funds used for fundraising');

        if (parseFloat(user.fundraising_fund_per) < 0) throw new Error('Please enter valid Funds(%) used for fundraising');
        if (typeof (user.fundraising_fund_per) !== 'number') throw new Error('Please enter valid Funds(%) used for fundraising');

        if (parseFloat(user.direct_programs_fund_amt) < 0) throw new Error('Please enter valid Funds used for Direct Programs');
        if (typeof (user.direct_programs_fund_amt) !== 'number') throw new Error('Please enter valid Funds used for Direct Programs');

        if (parseFloat(user.direct_programs_fund_per) < 0) throw new Error('Please enter valid Funds(%) used for Direct Programs');
        if (typeof (user.direct_programs_fund_per) !== 'number') throw new Error('Please enter valid Funds(%) used for Direct Programs');

        data = {
          company_name: user.company_name,
          website: user.website,
          ein: user.ein,
          category: user.category,
          sub_category: user.sub_category,
          // category: new ObjectID(user.category),
          // sub_category: new ObjectID(user.sub_category),
          mission: user.mission,
          vision: user.vision,
          area_served: user.area_served, //['area 1', 'area 2', ...]
          established_in: new Date(user.established_in),
          facts_accomplishments: user.facts_accomplishments,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          tax_returns: user.tax_returns, //[{year: 0000, file_name: 'date.toString()+_+filename.extension'}, ...]
          annual_reports: user.annual_reports, //[{year: 0000, file_name: ''}, ...]
          administration_funds_amt: user.administration_funds_amt, // rs.
          administration_funds_per: user.administration_funds_per, //%
          fundraising_fund_amt: user.fundraising_fund_amt,// rs.
          fundraising_fund_per: user.fundraising_fund_per,// %
          direct_programs_fund_amt: user.direct_programs_fund_amt,// rs.
          direct_programs_fund_per: user.direct_programs_fund_per,//%
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'for_profit') {
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.ein) throw new Error('Please enter valid EIN number');
        if (!user.product_services) throw new Error('Please enter valid product services');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          company_name: user.company_name,
          website: user.website,
          ein: user.ein,
          mission: user.mission,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          product_services: user.product_services,
          industry: user.industry,
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'government') {
        var types = ['local', 'state', 'federal/national', 'international'];
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.gov_type) throw new Error('Please select valid government type (local, state, federal/national, international)');
        if (!(types.includes(user.gov_type.toLowerCase()))) throw new Error('Please select valid government type (local, state, federal/national, international)');
        if (!user.mission) throw new Error('Please enter valid mission');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          company_name: user.company_name,
          website: user.website,
          mission: user.mission,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          gov_type: user.gov_type, //local,state,federal/national, international
          updated_at: new Date()
        };
      } else if (current_user[0].user_type.trim().toLowerCase() == 'foundation') {
        if (!user.company_name) throw new Error('Please enter valid company name');
        if (typeof (user.company_name) !== 'string'
          || user.company_name.trim().toLowerCase() == 'null'
          || user.company_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid company name');
        }
        if (!user.ein) throw new Error('Please enter valid EIN number');
        if (!user.mission) throw new Error('Please enter valid mission');
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          company_name: user.company_name,
          website: user.website,
          ein: user.ein,
          mission: user.mission,
          vision: user.vision,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          social_media_accounts: user.social_media_accounts, // [{account: '', link:''}, ...]
          updated_at: new Date()
        };
      } else {
        if (!user.first_name) throw new Error('Please enter valid first name');
        if (typeof (user.first_name) !== 'string') throw new Error('Please enter valid first name');
        if (user.first_name.trim().toLowerCase() == 'null' || user.first_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid first name');
        }
        if (!user.last_name) throw new Error('Please enter valid last name');
        if (typeof (user.last_name) !== 'string') throw new Error('Please enter valid last name');
        if (user.last_name.trim().toLowerCase() == 'null' || user.last_name.trim().toLowerCase() == 'undefined') {
          throw new Error('Please enter valid last name');
        }
        if (!user.address) throw new Error('Please enter valid address');
        if (!user.address.address_line1) throw new Error('Please enter valid address line 1');
        // if (!user.address.address_line2) throw new Error('Please enter valid address line 2');
        if (!user.address.city) throw new Error('Please enter valid city');
        if (!user.address.state) throw new Error('Please enter valid state');
        if (!user.address.country) throw new Error('Please enter valid country');
        data = {
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          address: user.address, // {address_line1: '', address_line2: '', city: '', state: '', country: ''}
          updated_at: new Date()
        };
      }
      return this.repository.edit(user_id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  async editProfileImg(user_id, body) {
    var current_user = await this.findById(user_id);
    if (current_user.length > 0) {
      var data = {
        profile_img: body.profile_img,
        updated_at: new Date()
      };
      return this.repository.edit(user_id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  async deleteProfile(user_id, req_user_id) {
    if (req_user_id) {
      var req_user = await adminUserService.findById(req_user_id);
      if (!req_user[0].role_data[0].frontend_user.delete) throw new Error('Access Denied!');
    }

    var current_user = await this.findById(user_id);
    if (current_user.length > 0) {
      var item = {
        // email: null,
        // phone: null,
        age: null,
        dob: null,
        is_verified: null,
        verification_token: null,
        admin_verification: null,
        deactivate: null,
        salt: null,
        passwordHash: null,
        profile_img: null,
        location: null,
        about_me: null,
        causes: null,
        influence: null,
        social_media_accounts: null,
        website: null,
        ein: null,
        category: null,
        sub_category: null,
        mission: null,
        vision: null,
        area_served: null,
        established_in: null,
        facts_accomplishments: null,
        address: null,
        tax_returns: null,
        annual_reports: null,
        administration_funds_amt: null,
        administration_funds_per: null,
        fundraising_fund_amt: null,
        fundraising_fund_per: null,
        direct_programs_fund_amt: null,
        direct_programs_fund_per: null,
        product_services: null,
        industry: null,
        gov_type: null,
        updated_at: new Date(),
        deleted_at: new Date()
      };
      return this.repository.deleteProfile(current_user[0]._id, item)
        // .then(() => {
        //   if (current_user[0].user_type.trim().toLowerCase() === 'donor')
        //     return emailService.sendDeleteProfileEmail(current_user[0].first_name + ' ' + current_user[0].last_name, current_user[0].email);
        //   else
        //     return emailService.sendDeleteProfileEmail(current_user[0].company_name, current_user[0].email);
        // });
    } else {
      throw new Error('Current user does not exist');
    }
  }

  async deactivateProfile(user_id, body) {
    var current_user = await this.findById(user_id);
    if (current_user.length > 0) {
      var data = {
        deactivate: body.deactivate,
        updated_at: new Date()
      };
      return this.repository.edit(user_id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  async blockAccount(user_id, body) {
    var current_user = await adminUserService.findById(user_id);
    var selected_user = await this.findById(body.user_id);
    if (current_user.length > 0) {
      if (selected_user.length > 0) {
        if (current_user[0].role_data[0].frontend_user.update) {
          var data = {
            is_blocked: body.is_blocked,
            internal_comments: body.internal_comments,
            updated_at: new Date()
          };
          return this.repository.edit(body.user_id, data)
            .then(() => {
              if (body.is_blocked) {
                if (selected_user[0].user_type.trim().toLowerCase() === 'donor')
                  return emailService.sendBlockUserEmail(selected_user[0].first_name + ' ' + selected_user[0].last_name, selected_user[0].email, body.internal_comments)
                else
                  return emailService.sendBlockUserEmail(selected_user[0].company_name, selected_user[0].email, body.internal_comments)
              }
            });
        } else {
          throw new Error('Access Denied!');
        }
      } else {
        throw new Error('Selected user does not exist');
      }
    } else {
      throw new Error('Current user does not exist');
    }
  }

  async updateUserTokenByEmail(body) {
    var current_user = await this.findByEmail(body.email);
    var data = {};
    if (current_user) {
      if (body.provider.trim().toLowerCase() === 'google') {
        data = {
          google_token: body.provider_token,
          updated_at: new Date()
        }
      } else if (body.provider.trim().toLowerCase() === 'facebook') {
        data = {
          facebook_token: body.provider_token,
          updated_at: new Date()
        }
      } else if (body.provider.trim().toLowerCase() === 'apple') {
        data = {
          apple_token: body.provider_token,
          updated_at: new Date()
        }
      }
      return this.repository.updateUserTokenByEmail(body.email, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  async insertUserTokenByEmail(body) {
    var data = {};
    if (body.provider.trim().toLowerCase() === 'google') {
      data = {
        google_token: body.provider_token,
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        user_type: 'donor',
        is_verified: true,
        admin_verification: true,
        created_at: new Date()
      }
    } else if (body.provider.trim().toLowerCase() === 'facebook') {
      data = {
        facebook_token: body.provider_token,
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        user_type: 'donor',
        is_verified: true,
        admin_verification: true,
        created_at: new Date()
      }
    } else if (body.provider.trim().toLowerCase() === 'apple') {
      data = {
        apple_token: body.provider_token,
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        user_type: 'donor',
        is_verified: true,
        admin_verification: true,
        created_at: new Date()
      }
    }
    return this.repository.add(data)
  }

  mapUserToDto(user) {
    return user ? {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      created_timestamp: user.created_timestamp,
      updated_timestamp: user.updated_timestamp,
      salt: user.salt,
      passwordHash: user.passwordHash
    } : {};
  }

  search(req) {
    return this.repository.search(req)
      .then(result => result);
  }

  // retrieve deleted profile - admin
  async retrieveProfile(req) {
    var current_user = await adminUserService.findById(req.user.id);
    if (current_user.length == 0) throw new Error('Current user does not exist');
    if (!current_user[0].role_data[0].frontend_user.delete) throw new Error('Access Denied!');

    var data = {
      deleted_at: null
    };

    return this.repository.edit(req.body.user_id, data)
  }
}

module.exports = UserService;
