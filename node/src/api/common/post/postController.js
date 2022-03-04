const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');

const PostService = require('./postService');
const postService = new PostService();

// save post
router.post('/add', [
  body('message').custom((value, { req }) => {
    if (!req.body.post_img && !req.body.post_video && !req.body.post_link && !value) throw new Error('Please enter valid post');
   
    return true;
  }),
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
    postService
      .savePost(req)
      .then(() => res.status(200).send(
        {
          status: 200,
          data: "Post created successfully!"
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

// get posts of current user
router.get('/list', (req, res) => {
  postService
    .list(req)
    .then(posts => res.status(200).send(
      {
        status: 200,
        data: posts
      }
    ))
    .catch(err => res.status(400).send(
      {
        status: 400,
        err_msg: err.message
      }
    ));
});

// get post by id
router.get('/:id', [
  param('id', 'Please select valid post').isMongoId(),
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
    postService
      .findById(req.params.id, req)
      .then(posts => res.status(200).send(
        {
          status: 200,
          data: posts
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

// edit user post
router.put('/post', [
  body('id', 'Please select valid post').isMongoId(),
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
    postService
      .editPost(req.user.id, req.body, req)
      .then(result => res.send(
        {
          status: 200,
          data: "Post has been updated successfully"
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

// delete post
router.delete('/post/:id', [
  param('id', 'Please select valid post').isMongoId(),
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
    postService
      .deletePost(req.user.id, req.params.id, req)
      .then((result) => res.status(200).send(
        {
          status: 200,
          data: "Post deleted successfully"
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
