const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const config = require('config');
// const { domain } = config.get('frontEnd');
const domain = process.env.FRONTEND_URL;
const user_types = process.env.USER_TYPES;

const AuthService = require('./authService');
const authService = new AuthService();

const UserService = require('../user/userService');
const userService = new UserService();

const AdminUserService = require('../adminUser/adminUserService');
const adminUserService = new AdminUserService()

const NotificationService = require('../notification/notificationService');
const notificationService = new NotificationService();

//-----------------------------------------
// User APIs
//-----------------------------------------

// register
router.post('/register', [
  body('user_type', 'Please select valid user type').isString().trim().isIn(user_types),

  body('first_name').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'donor' && !value) throw new Error('Please enter valid first name');
    if (req.body.user_type.toLowerCase() === 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid first name');
    if (req.body.user_type.toLowerCase() === 'donor' && (value.trim().length<=2 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) {
      throw new Error('Please enter valid first name');
    }
    return true;
  }),

  body('last_name').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'donor' && !value) throw new Error('Please enter valid last name');
    if (req.body.user_type.toLowerCase() === 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid last name');
    if (req.body.user_type.toLowerCase() === 'donor' && (value.trim().length<=2 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) {
      throw new Error('Please enter valid last name');
    }
    return true;
  }),

  body('age').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'donor' && !value) throw new Error('Please enter valid age. Min 13 years');
    if (req.body.user_type.toLowerCase() === 'donor' && typeof (value) !== 'number') throw new Error('Please enter valid age. Min 13 years');
    if (req.body.user_type.toLowerCase() === 'donor' && value <=13 ) throw new Error('Please enter valid age. Min 13 years');
    return true;
  }),

  body('company_name').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid company name');
    if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid company name');
    if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<=2 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) {
      throw new Error('Please enter valid company name');
    }
    return true;
  }),

  body('email', 'Please enter valid email').trim().isEmail(),
  body('password', 'Password should contain at lease one uppercase character, one number and one special character.').matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i"),
  // body('phone', 'Please enter valid phone').trim().isMobilePhone(),
  body('category').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) {
      throw new Error('Please select valid category');
    }
    return true;
  }),
  body('sub_category').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please select valid sub category');
    return true;
  }),
  body('mission').custom((value, { req }) => {
    var types = ['non_profit', 'foundation', 'government'];
    if (types.includes(req.body.user_type.toLowerCase()) && !value) throw new Error('Please enter valid mission');
    if (types.includes(req.body.user_type.toLowerCase()) && typeof (value) !== 'string') throw new Error('Please enter valid first name');
    if (types.includes(req.body.user_type.toLowerCase()) && (value.trim().length<10 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) {
      throw new Error('Please enter valid mission(Min. length 10)');
    }
    return true;
  }),
  body('address.address_line1').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid address line 1');
    if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid address line 1');
    if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid address line 1');
    return true;
  }),
  // body('address.address_line2').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid address line 2');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid address line 2');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 ||value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid address line 2');
  //   return true;
  // }),
  body('address.city').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid city');
    if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid city');
    if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid city');
    return true;
  }),
  body('address.state').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid state');
    if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid state');
    if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid state');
    return true;
  }),
  body('address.country').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid country');
    if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid country');
    if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid country');
    return true;
  }),
  body('area_served').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please select valid area served');
    // if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'object') throw new Error('Please select valid area served');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'string') throw new Error('Please select valid area served');
    if (req.body.user_type.toLowerCase() === 'non_profit' && value.length == 0) throw new Error('Please select valid area served');
    return true;
  }),
  body('tax_returns').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please select valid tax returns');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'object') throw new Error('Please select valid tax returns');
    if (req.body.user_type.toLowerCase() === 'non_profit' && (value.length<1)) throw new Error('Please enter valid tax returns');
    return true;
  }),
  body('annual_reports').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please select valid annual reports');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'object') throw new Error('Please select valid annual reports');
    if (req.body.user_type.toLowerCase() === 'non_profit' && (value.length<1)) throw new Error('Please enter valid annual reports');
    return true;
  }),
  body('administration_funds_amt').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds used for administration');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'number') throw new Error('Please enter valid Funds used for administration');
    return true;
  }),
  body('administration_funds_per').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds(%) used for administration');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'number') throw new Error('Please enter valid Funds(%) used for administration');
    return true;
  }),
  body('fundraising_fund_amt').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds used for fundraising');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof (value) !== 'number') throw new Error('Please enter valid Funds used for fundraising');
    return true;
  }),
  body('fundraising_fund_per').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds(%) used for fundraising');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof (value) !== 'number') throw new Error('Please enter valid Funds(%) used for fundraising');
    return true;
  }),
  body('direct_programs_fund_amt').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds used for Direct Programs');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof (value) !== 'number') throw new Error('Please enter valid Funds used for Direct Programs');
    return true;
  }),
  body('direct_programs_fund_per').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds(%) used for Direct Programs');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof (value) !== 'number') throw new Error('Please enter valid Funds(%) used for Direct Programs');
    return true;
  }),
  body('ein').custom((value, { req }) => {
    var types = ['for_profit', 'non_profit', 'foundation'];
    if (types.includes(req.body.user_type.toLowerCase()) && !value) throw new Error('Please enter valid EIN Number');
    if (types.includes(req.body.user_type.toLowerCase()) && typeof (value) !== 'string') throw new Error('Please enter valid EIN Number');
    if (types.includes(req.body.user_type.toLowerCase()) && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) {
      throw new Error('Please enter valid EIN Number');
    }
    return true;
  }),
  body('product_services').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'for_profit' && !value) {throw new Error('Please enter valid product/services');}
    if (req.body.user_type.toLowerCase() === 'for_profit' && typeof (value) !== 'string') throw new Error('Please enter valid product/services');
    if (req.body.user_type.toLowerCase() === 'for_profit' && (value.trim().length<3 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) {
      throw new Error('Please enter valid mission(Min. length 3)');
    }
    return true;
  }),
  body('gov_type').custom((value, { req }) => {
    var types = ['local', 'state', 'federal/national', 'international'];
    if (req.body.user_type.toLowerCase() === 'government' && !value) {
      throw new Error('Please select valid government type (local, state, federal/national, international)');
    }
    // if (req.body.user_type.toLowerCase() === 'government' && typeof (value) !== 'string') {
    if (req.body.user_type.toLowerCase() === 'government' && !(types.includes(value.toLowerCase()))) {
      throw new Error('Please select valid government type (local, state, federal/national, international)');
    }
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err_array = errors.array();
    res.status(422).send(
      {
        status: 422,
        err_msg: err_array[0].msg
      });
  } else {
    userService
      .register_user(req.body)
      .then(() => res.status(200).send(
        {
          status: 200,
          data: "You have been registered successfully! Please verify your email."
        }
      ))
      .catch(err => res.status(400).send(
        {
          status: 400,
          err_msg: err.message
        }
      ));
  }
});

// confirmation
router.get('/confirmation/:email/:token', async (req, res) => {
  var user_data = await userService.findByEmail(req.params.email);
  if (!user_data) {
    res.status(404).send(
      {
        status: 404,
        err_msg: "User does not exist"
      }
    )
  }
  userService
    .confirm_user(req.params.email, req.params.token)
    .then(async () => {
      if (user_data.user_type.trim().toLowerCase() != "donor") {
        var notification = {
          body: {
            type: "new-registration",
            module_id: user_data._id,
            message: "New registration",
            is_admin_noti: true
          },
          user: req.user
        };
        await notificationService.saveNotification(notification);
      }
    res.status(200);
    // res.setHeader("confirm-msg","Your email has been confirmed successfully!");
    res.redirect(domain + '/login?c=1');
    // .send(
    //   {
    //     status: 200,
    //     data: 'Your email has been verified successfully!'
    //   })
    })
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// user login
router.post('/login', async (req, res) => {
  var user_data;
  var user_data_by_phone = await userService.findByPhone(req.body.email);
  var user_data_by_email = await userService.findByEmail(req.body.email);

  if (user_data_by_phone) user_data = user_data_by_phone;
  else user_data = user_data_by_email;

  if (user_data) {
    if (user_data.is_verified && user_data.admin_verification && !user_data.deleted_at && !user_data.is_blocked && !user_data.is_suspended) {
      if (user_data_by_email) {
        passport.authenticate('user-email-local', { session: false }, (err, user) => {
          if (err || !user) {
            return res.status(401).send(
              err ? err.message :
                {
                  status: 401,
                  err_msg: 'Invalid login credentials'
                },
            );
          }
          req.login(user, { session: false }, (error) => {
            if (error) {
              res.status(400).send(error);
            }
            // const token = jwt.sign(user, config.get('auth.jwt.secret'), { expiresIn: config.get('auth.jwt.expiresIn') });
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            userService.findById(user.id)
              .then(user_data => {
                if (user_data) {
                  userService.deactivateProfile(req.user.id, {deactivate: false})
                  .then(() => {
                    return res.send({
                      status: 200,
                      data: {
                        token, user: user_data
                      }
                    });
                  });
                }
                else {
                  return res.status(404).send(
                    {
                      status: 404,
                      err_msg: 'User does not exists'
                    }
                  )
                }
              });
          });
        })(req, res);
      } else {
        passport.authenticate('user-phone-local', { session: false }, (err, user) => {
          if (err || !user) {
            return res.status(401).send(
              err ? err.message :
                {
                  status: 401,
                  err_msg: 'Invalid login credentials'
                },
            );
          }
          req.login(user, { session: false }, (error) => {
            if (error) {
              res.status(400).send(error);
            }
            // const token = jwt.sign(user, config.get('auth.jwt.secret'), { expiresIn: config.get('auth.jwt.expiresIn') });
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            userService.findById(user.id)
              .then(data => {
                if (data) {
                  userService.deactivateProfile(req.user.id, {deactivate: false})
                  .then(() => {
                    return res.send({
                      status: 200,
                      data: {
                        token, user: data
                      }
                    });
                  });
                }
                else {
                  return res.status(404).send(
                    {
                      status: 404,
                      err_msg: 'User does not exists'
                    }
                  )
                }
              });
          });
        })(req, res);
      }
    } else {
      var err_msg = '';
      if(user_data.is_suspended) err_msg = "Your account has been suspended! Please contact administrator for further assistance."
      else err_msg = 'You are not verified user of the system. Please check your email or contact admin for the verification'
        
      return res.status(400).send(
        {
          status: 400,
          err_msg: err_msg
        }
      )
    }
  } else {
    return res.status(404).send(
      {
        status: 404,
        err_msg: 'User does not exists'
      }
    )
  }
});

//  user login
router.post('/social-login', [
  body('email', 'Please enter valid email').trim().isEmail(),
  body('first_name', 'Please enter valid first_name').isString().trim().isLength({ min: 3 }),
  body('last_name', 'Please enter valid last_name').isString().trim().isLength({ min: 3 }),
  body('provider', 'Please enter valid provider').isString().trim().isIn(['facebook', 'google', 'apple']),
  body('provider_token', 'Please enter valid provider token').isString().trim().isLength({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err_array = errors.array();
    res.status(422).send(
      {
        status: 422,
        err_msg: err_array[0].msg
      });
  } else {
    var user_data = await userService.findByEmail(req.body.email);
    if (user_data) {
      if (user_data.is_verified && user_data.admin_verification && !user_data.deleted_at && !user_data.is_blocked && !user_data.is_suspended) {
        userService.findByEmailProvider(req.body)
          .then((user) => {
            if (user) {
              // const token = jwt.sign({ id: user._id }, config.get('auth.jwt.secret'), { expiresIn: config.get('auth.jwt.expiresIn') });
            const token = jwt.sign({ id: user_data._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            userService.findById(user_data._id)
                .then(user_data => {
                  if (user_data) {
                    return res.send({
                      status: 200,
                      data: {
                        token, user: user_data
                      }
                    });
                  }
                  else {
                    return res.status(404).send(
                      {
                        status: 404,
                        err_msg: 'User does not exists'
                      }
                    )
                  }
                });
            } else {
              //update and generate token
              userService.updateUserTokenByEmail(req.body)
                .then(() => {
                  // generate token
                  // const token = jwt.sign({ id: user_data._id }, config.get('auth.jwt.secret'), { expiresIn: config.get('auth.jwt.expiresIn') });
                  const token = jwt.sign({ id: user_data._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
                  userService.findById(user_data._id)
                    .then(user_data => {
                      if (user_data) {
                        return res.send({
                          status: 200,
                          data: {
                            token, user: user_data
                          }
                        });
                      }
                      else {
                        return res.status(404).send(
                          {
                            status: 404,
                            err_msg: 'User does not exists'
                          }
                        )
                      }
                    });
                })
                .catch(err => {
                  return res.status(404).send(
                    {
                      status: 404,
                      err_msg: err
                    }
                  )
                });
            }
          })
          .catch(err => {
            return res.status(404).send(
              {
                status: 404,
                err_msg: err
              }
            )
          });
      } else {
        var err_msg = "";
        if(user_data.is_suspended) err_msg = "Your account has been suspended! Please contact administrator for further assistance."
        else 'You are not verified user of the system. Please check your email or contact admin for the verification'
        return res.status(400).send(
          {
            status: 400,
            err_msg: err_msg
          }
        )
      }
    } else {
      // insert new document with provider
      //return generated token
      userService.insertUserTokenByEmail(req.body)
        .then(() => {
          // generate token
          userService.findByEmail(req.body.email)
            .then(user_data => {
              // const token = jwt.sign({ id: user_data._id }, config.get('auth.jwt.secret'), { expiresIn: config.get('auth.jwt.expiresIn') });
              const token = jwt.sign({ id: user_data._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
              if (user_data) {
                return res.send({
                  status: 200,
                  data: {
                    token, user: [user_data]
                  }
                });
              }
              else {
                return res.status(404).send(
                  {
                    status: 404,
                    err_msg: 'User does not exists'
                  }
                )
              }
            });
        })
        .catch(err => {
          return res.status(404).send(
            {
              status: 404,
              err_msg: err
            }
          )
        });
    }
  }
});


// forgot user password
router.post('/forgot-password', body('email', 'Please enter a valid email').trim().isEmail(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err_array = errors.array();
    res.status(422).send({
      status: 422,
      err_msg: err_array[0].msg
    });
  } else {
    const { email } = req.body;
    authService
      .requestUserPassword(email)
      .then(() =>
        res.send({
          status: 200,
          data: `Email with reset password instructions has been sent to email ${email}.`
        })
      )
      .catch(err => res.status(400).send(
        {
          status: 400,
          err_msg: err.message
        }));
  }
});

router.post('/reset-password', [
  body('password', 'Password should contain at lease one uppercase character, one number and one special character.').matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i"),
  body('confirmPassword','Password should contain at least one uppercase character, one number and one special character.').custom((value, { req }) => {
    if (req.body.password !== value) {
      throw new Error('Password and its confirmation do not match.');
    }
    return true;
  }).isString().trim().isLength({ min: 6 }),
  body('resetPasswordToken', 'Please provide valid reset pasword token').trim().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err_array = errors.array();
    res.status(422).send(
      {
        status: 422,
        err_msg: err_array[0].msg
      }
    );
  } else {
    try {
      const { password, confirmPassword, resetPasswordToken } = req.body;
      authService
        .resetPassword(password, confirmPassword, resetPasswordToken)
        .then(() =>
          res.send({
            status: 200,
            data: 'Password updated successfully.'
          })
        )
        .catch(err =>
          res.status(400).send(
            {
              status: 400,
              err_msg: err.message
            }));
    } catch (err) {
      res.status(400).send(
        {
          status: 400,
          err_msg: err.message
        })
    }
  }
});


//------------------
// Admin User
//------------------

// admin user login
router.post('/admin/login', async (req, res) => {
  var user_data;
  var user_data_by_phone = await adminUserService.findByPhone(req.body.email);
  var user_data_by_email = await adminUserService.findByEmail(req.body.email);

  if (user_data_by_phone) user_data = user_data_by_phone;
  else user_data = user_data_by_email;

  if (user_data) {
    if ( !user_data.deleted_at) {
      if (user_data_by_email) {
        passport.authenticate('admin-user-email-local', { session: false }, (err, user) => {
          if (err || !user) {
            return res.status(401).send(
              err ? err.message :
                {
                  status: 401,
                  err_msg: 'Invalid login credentials'
                },
            );
          }
          console.log(user);
          req.login(user, { session: false }, (error) => {
            if (error) {
              res.status(400).send(error);
            }
            // const token = jwt.sign(user, config.get('auth.jwt.secret'), { expiresIn: config.get('auth.jwt.expiresIn') });
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            adminUserService.findById(user.id)
              .then(user_data => {
                if (user_data) {
                  return res.send({
                    status: 200,
                    data: {
                      token, user: user_data
                    }
                  });
                }
                else {
                  return res.status(404).send(
                    {
                      status: 404,
                      err_msg: 'User does not exists'
                    }
                  )
                }
              });
          });
        })(req, res);
      } else {
        passport.authenticate('admin-user-phone-local', { session: false }, (err, user) => {
          if (err || !user) {
            return res.status(401).send(
              err ? err.message :
                {
                  status: 401,
                  err_msg: 'Invalid login credentials'
                },
            );
          }
          req.login(user, { session: false }, (error) => {
            if (error) {
              res.status(400).send(error);
            }
            // const token = jwt.sign(user, config.get('auth.jwt.secret'), { expiresIn: config.get('auth.jwt.expiresIn') });
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            adminUserService.findById(user.id)
              .then(data => {
                if (data) {
                  return res.send({
                    status: 200,
                    data: {
                      token, user: data
                    }
                  });
                }
                else {
                  return res.status(404).send(
                    {
                      status: 404,
                      err_msg: 'User does not exists'
                    }
                  )
                }
              });
          });
        })(req, res);
      }
    } else {
      return res.status(400).send(
        {
          status: 400,
          err_msg: 'You are not verified user of the system. Please check your email or contact admin for the verification'
        }
      )
    }
  } else {
    return res.status(404).send(
      {
        status: 404,
        err_msg: 'User does not exists'
      }
    )
  }
});


// forgot user password
router.post('/admin/forgot-password', body('email', 'Please enter a valid email').trim().isEmail(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err_array = errors.array();
    res.status(422).send({
      status: 422,
      err_msg: err_array[0].msg
    });
  } else {
    const { email } = req.body;
    authService
      .requestAdminUserPassword(email)
      .then(() =>
        res.send({
          status: 200,
          data: `Email with reset password instructions has been sent to email ${email}.`
        })
      )
      .catch(err => res.status(400).send(
        {
          status: 400,
          err_msg: err.message
        }));
  }
});

router.post('/admin/reset-password', [
  body('password', 'Please enter valid password (min 6 characters)').isString().trim().isLength({ min: 6 }),
  body('confirmPassword', 'Please enter valid confirm password (min 6 characters)').custom((value, { req }) => {
    if (req.body.password !== value) {
      throw new Error('Password and its confirmation do not match.');
    }
    return true;
  }).isString().trim().isLength({ min: 6 }),
  body('resetPasswordToken', 'Please provide valid reset pasword token').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err_array = errors.array();
    res.status(422).send(
      {
        status: 422,
        err_msg: err_array[0].msg
      }
    );
  } else {
    try {
      const { password, confirmPassword, resetPasswordToken } = req.body;
      authService
        .resetAdminUserPassword(password, confirmPassword, resetPasswordToken)
        .then(() =>
          res.send({
            status: 200,
            data: 'Password updated successfully.'
          })
        )
        .catch(err =>
          res.status(400).send(
            {
              status: 400,
              err_msg: err.message
            }));
    } catch (err) {
      res.status(400).send(
        {
          status: 400,
          err_msg: err.message
        })
    }
  }
});


// Signout
router.post('/sign-out', (req, res) => {
  res.send({
    status: 200,
    data: "You have uccessfully signed out!"
  });
});


module.exports = router;
