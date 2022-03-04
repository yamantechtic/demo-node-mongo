const PostRepository = require('./postRepository');
const UserService = require('../user/userService');
const userService = new UserService();
const { ObjectID } = require('mongodb');

class PostService {
  constructor() {
    this.repository = new PostRepository();
  }

  // get posts of current user's posts 
  async list(req) {
    // var user_data = await userService.findById(req.user.id);
    // if (user_data.length == 0) throw new Error('Current user does not exist');
    
    return this.repository.getPosts(req);
  }

  // get count
  getCount() {
    return this.repository.getCount();
  }

  // get post by id
  findById(id, req) {
    return this.repository.findById(id, req)
      .then(post => post);
  }

  // save post
  async savePost(req) {
    var user_data = await userService.findById(req.user.id);
    if (user_data.length == 0) throw new Error('Current user does not exist');

    var newPost = {
      user_id: ObjectID(req.user.id),
      message: req.body.message,
      post_img: req.body.post_img,
      post_video: req.body.post_video,
      post_link: req.body.post_link,
      created_at: new Date(),
      updated_at: null
    };

    return this.repository.add(newPost);
  }

  addMany(posts) {
    return this.repository.addMany(posts);
  }

  // edit post
  async editPost(user_id, post, req) {
    var data = {};
    var current_post = await this.findById(post.id, req);
    if (current_post.length === 0) throw new Error('Post does not exist')
    var current_user = await userService.findById(user_id);
    if (current_user.length > 0) {
      if (current_post[0].user_id == user_id) {
        data = {
          message: post.message,
          post_img: post.post_img,
          post_video: post.post_video,
          post_link: post.post_link,
          updated_at: new Date()
        };
      } else {
        throw new Error('Access denied');
      }
      return this.repository.edit(post.id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  // delete post
  async deletePost(user_id, post_id, req) {
    var data = {};
    var current_post = await this.findById(post_id, req);
    if (current_post.length === 0) throw new Error('Post does not exist')

    var current_user = await userService.findById(user_id);
    if (current_user.length > 0) {
      if (current_post[0].user_id == user_id) {
      return this.repository.delete(post_id)
    } else {
        throw new Error('Access denied');
      }
    } else {
      throw new Error('Current user does not exist');
    }
  }
}

module.exports = PostService;
