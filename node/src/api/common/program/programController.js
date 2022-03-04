const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');

const ProgramService = require('./programService');
const programService = new ProgramService();

// save program
router.post('/add', [
  body('name', 'Please enter valid program name. Min. length 3').isString().trim().isLength({ min: 3 }),
  body('category', 'Please select valid category').isString().trim().isLength({ min: 1 }),
  body('sub_category', 'Please select valid NCCS IRS Activity Code/Sub Category ').isString().trim().isLength({ min: 1 }),
  body('problem', 'Please enter valid problem. Min. length 10').isString().trim().isLength({ min: 10 }),
  body('approach', 'Please enter valid approach. Min. length 10').isString().trim().isLength({ min: 10 }),
  // body('area_served', 'Please enter valid area served').isArray(),
  body('area_served', 'Please enter valid area served. Min. length 10').isString().trim().isLength({ min: 10 }),
  body('program_fund_amt', 'Please enter valid Funds used for this Program (Amount)').isInt().not().isString(),
  body('program_fund', 'Please enter valid Funds used for this Program (%)').isInt().not().isString(),
  body('status', 'Please select valid status').isString().trim().isLength({ min: 3 }),
  body('start_date', 'Please select valid start date (yyyy-mm-dd)').isISO8601()
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
    programService
      .saveProgram(req.body, req.user.id)
      .then(() => res.status(200).send(
        {
          status: 200,
          data: "Program created successfully!"
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

// get program information
router.get('/info/:id', param('id', 'Please select valid program').isMongoId(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var err_array = errors.array();
    res.status(422).send(
      {
        status: 422,
        err_msg: err_array[0].msg
      });
  } else {
    programService
      .findById(req.params.id)
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
  }
});

// get all programs
router.get('/list', (req, res) => {
  programService
    .list(req)
    .then(result => res.status(200).send(
      {
        status: 200,
        data: result
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// get all programs followed by current user
router.get('/followed-programs', (req, res) => {
  programService
    .getFollowedPrograms(req)
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


// edit user program
router.put('/update', [
  body('id', 'Please select valid program').isMongoId(),
  body('name', 'Please enter valid program name. Min. length 3').isString().trim().isLength({ min: 3 }),
  body('category', 'Please select valid category').isString().trim().isLength({ min: 1 }),
  body('sub_category', 'Please select valid NCCS IRS Activity Code/Sub Category ').isString().trim().isLength({ min: 1 }),
  body('problem', 'Please enter valid problem. Min. length 10').isString().trim().isLength({ min: 10 }),
  body('approach', 'Please enter valid approach. Min. length 10').isString().trim().isLength({ min: 10 }),
  body('area_served', 'Please enter valid area served. Min. length 10').isString().trim().isLength({ min: 10 }),
  body('program_fund_amt', 'Please enter valid Funds used for this Program (Amount)').isInt().not().isString(),
  body('program_fund', 'Please enter valid Funds used for this Program (%)').isInt().not().isString(),
  body('status', 'Please select valid status').isString().trim().isLength({ min: 3 }),
  body('start_date', 'Please select valid start date (yyyy-mm-dd)').isISO8601()
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
    programService
      .editProgramProfile(req.user.id, req.body)
      .then(result => res.send(
        {
          status: 200,
          data: "Program has been updated successfully"
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

// edit program profile image
router.put('/profile-img',
  body('id', 'Please select valid program').isMongoId(),
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
      programService
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

// edit program status
router.put('/status',
  body('id', 'Please select valid program').isMongoId(),
  body('status', 'Please select valid status').isString().trim().isLength({ min: 5 }),
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
      programService
        .editStatus(req.user.id, req.body)
        .then(result => res.send(
          {
            status: 200,
            data: "Program status has been updated successfully"
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

// delete program profile: update deleted_at field
router.put('/deleted-at', body('id', 'Please select valid program').isMongoId(), (req, res) => {
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
    programService
      .deleteProgram(req.user.id, req.body.id)
      .then(result => res.send(
        {
          status: 200,
          data: "Program has been deleted successfully"
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

router.post('/follow', body('id', 'Please select valid program').isMongoId(), (req, res) => {
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
    programService
      .followProgram(req.user.id, req.body.id)
      .then((result) => res.status(200).send(
        {
          status: 200,
          data: 'Followed'
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

router.post('/unfollow', body('id', 'Please select valid program').isMongoId(), (req, res) => {
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
    programService
      .unfollowProgram(req.user.id, req.body.id)
      .then((result) => res.status(200).send(
        {
          status: 200,
          data: 'Unfollowed'
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

module.exports = router;
