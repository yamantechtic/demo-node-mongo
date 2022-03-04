const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
// const user_types = require('config').get('user_types');
const user_types = process.env.USER_TYPES;

const UserService = require('./userService');
const userService = new UserService();

const cipherHelper = require('../auth/cipherHelper');

//get current logged in user
router.get('/current', (req, res) => {
  userService
    .findById(req.user.id)
    .then(user => res.send(
      {
        status: 200,
        data: user
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// create user
router.post('/user', [
  body('user_type', 'Please select valid user type').isString().trim().isIn(user_types),
  // body('user_type').custom((value, { req }) => {
  //   if (!user_types.includes(value.trim().toLowerCase()) || !value.trim().toLowerCase().includes('admin')) throw new Error('Please enter valid user type');
    
  //   return true;
  // }),
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

  // body('age').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() === 'donor' && !value) throw new Error('Please enter valid age');
  //   if (req.body.user_type.toLowerCase() === 'donor' && typeof (value) !== 'number') throw new Error('Please enter valid age');
  //   return true;
  // }),

  body('company_name').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid company name');
    if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid company name');
    if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<=2 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) {
      throw new Error('Please enter valid company name');
    }
    return true;
  }),

  body('email', 'Please enter valid email').trim().isEmail(),
  // body('password', 'Please enter valid password. Alphanumeric, min length. 6').isAlphanumeric().isLength({ min: 6 }),
  body('phone', 'Please enter valid phone').trim().isMobilePhone(),
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
  // body('address.address_line1').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid address line 1');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid address line 1');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid address line 1');
  //   return true;
  // }),
  // body('address.address_line2').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid address line 2');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid address line 2');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 ||value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid address line 2');
  //   return true;
  // }),
  // body('address.city').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid city');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid city');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid city');
  //   return true;
  // }),
  // body('address.state').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid state');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid state');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid state');
  //   return true;
  // }),
  // body('address.country').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() !== 'donor' && !value) throw new Error('Please enter valid country');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && typeof (value) !== 'string') throw new Error('Please enter valid country');
  //   if (req.body.user_type.toLowerCase() !== 'donor' && (value.trim().length<1 || value.trim().toLowerCase() == 'null' || value.trim().toLowerCase() == 'undefined')) throw new Error('Please enter valid country');
  //   return true;
  // }),
  body('area_served').custom((value, { req }) => {
    if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please select valid area served');
    // if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'object') throw new Error('Please select valid area served');
    if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'string') throw new Error('Please select valid area served');
    if (req.body.user_type.toLowerCase() === 'non_profit' && value.length == 0) throw new Error('Please select valid area served');
    return true;
  }),
  // body('tax_returns').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please select valid tax returns');
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'object') throw new Error('Please select valid tax returns');
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && (value.length<1)) throw new Error('Please enter valid tax returns');
  //   return true;
  // }),
  // body('annual_reports').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please select valid annual reports');
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'object') throw new Error('Please select valid annual reports');
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && (value.length<1)) throw new Error('Please enter valid annual reports');
  //   return true;
  // }),
  // body('administration_funds_amt').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds used for administration (%, Amount)');
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && typeof(value) !== 'number') throw new Error('Please enter valid Funds used for administration (%, Amount)');
  //   return true;
  // }),
  // body('fundraising_fund_amt').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds used for fundraising (%, Amount)');
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && typeof (value) !== 'number') throw new Error('Please enter valid Funds used for fundraising (%, Amount)');
  //   return true;
  // }),
  // body('direct_programs_fund_amt').custom((value, { req }) => {
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && !value) throw new Error('Please enter valid Funds used for Direct Programs (%, Amount)');
  //   if (req.body.user_type.toLowerCase() === 'non_profit' && typeof (value) !== 'number') throw new Error('Please enter valid Funds used for Direct Programs (%, Amount)');
  //   return true;
  // }),
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
      .register_user(req.body, req.user.id)
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

// edit user (from admin panel)
router.put('/user', (req, res) => {
  userService
    .editUser(req.user.id, req.body)
    .then(result => res.send(
      {
        status: 200,
        data: "User has been updated successfully"
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// delete user: update deleted_at field (from admin panel)
router.put('/user-deleted-at', (req, res) => {
  userService
    .deleteProfile(req.body.id, req.user.id)
    .then(result => res.send(
      {
        status: 200,
        data: "User has been deleted successfully"
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});


// get all users
router.post('/users', (req, res) => {
  userService
    .list(req)
    .then(users => res.status(200).send(
      {
        status: 200,
        data: users
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// get user by id
router.post('/user-by-id', [
  body('id', 'Please select valid user').isMongoId(),
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
    userService
      .findById(req.body.id,req.user.id,req)
      .then(user => res.send(
        {
          status: 200,
          data: user
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

//get-user-info
router.get('/user-info', (req, res) => {
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
    userService
      .userInfoById(req.id)
      .then(user => res.send(
        {
          status: 200,
          data: user
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


// change user password
router.post('/change-password', [
  body('password', 'Please enter valid password (min 6 characters)').isString().trim().isLength({ min: 6 }),
  body('confirmPassword', 'Please enter valid confirm password (min 6 characters)').custom((value, { req }) => {
    if (req.body.password !== value) {
      throw new Error('Password and its confirmation do not match.');
    }
    return true;
  }).isString().trim().isLength({ min: 6 })
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
    userService
      .changePassword(req.user.id, req.body.password)
      .then(() => res.send(
        {
          status: 200,
          data: 'Password updated successfully!'
        }))
      .catch(err => res.status(400).send(
        {
          status: 400,
          err_msg: err.message
        }
      ));
  }
});

// approve user account(profile)
router.put('/approve-reject-account', [
  body('user_id', 'Please select valid user').isMongoId(),
  body('admin_verification', 'Please select valid verification status').not().isString().isBoolean(),
  body('internal_comments').custom((value, { req }) => {
    if (!req.body.admin_verification && !value) {
      throw new Error('Please enter valid comments');
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
      }
    );
  } else {
    userService
      .approveRejectAccount(req.user.id, req.body)
      .then(data => res.send(
        {
          status: 200,
          data: data
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

// edit user profile
router.put('/profile', (req, res) => {
  userService
    .editProfile(req.user.id, req.body)
    .then(result => res.send(
      {
        status: 200,
        data: "Profile has been updated successfully"
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// edit user profile image
router.put('/profile-img',
  body('profile_img', 'Please select valid image').isString().trim().isLength({ min: 5 }),
  (req, res) => {
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
      userService
        .editProfileImg(req.user.id, req.body)
        .then(result => res.send(
          {
            status: 200,
            data: "Profile image has been updated successfully"
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

// delete user profile: update deleted_at field
router.put('/profile-deleted-at', (req, res) => {
  userService
    .deleteProfile(req.user.id)
    .then(result => res.send(
      {
        status: 200,
        data: "Profile has been deleted successfully"
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// retrieve deleted profile - admin
router.put('/retrieve-deleted', (req, res) => {
  userService
    .retrieveProfile(req)
    .then(() => res.send(
      {
        status: 200,
        data: "User profile has been retrieved successfully"
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// deactivate
router.put('/deactivate',
  body('deactivate', 'Please select valid deactivate status').not().isString().isBoolean(),
  (req, res) => {
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
      userService
        .deactivateProfile(req.user.id, req.body)
        .then(result => res.send(
          {
            status: 200,
            data: (req.body.deactivate == true) ? "Profile deactivated!": "Profile activation status has been updated successfully!"
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

// block user account - from admin panel - is_blocked status will be updated
router.put('/block-account', [
  body('user_id', 'Please select valid user').isMongoId(),
  body('is_blocked', 'Please select valid user blocked status').not().isString().isBoolean(),
  body('internal_comments').custom((value, { req }) => {
    if (req.body.is_blocked && !value) {
      throw new Error('Please enter valid comments');
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
      }
    );
  } else {
    userService
      .blockAccount(req.user.id, req.body)
      .then(data => res.send(
        {
          status: 200,
          data: data == true ? "Blocked" : "Unblocked"
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

// get all users
router.get('/search', (req, res) => {
  userService
    .search(req)
    .then(users => res.status(200).send(
      {
        status: 200,
        data: users
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

module.exports = router;
