const { ObjectID } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');
// const file_path = require('config').get('file_path').path;
const file_path = process.env.FILE_PATH;

class PostRepository extends BaseRepository {
  constructor() {
    super('cl_post');
  }

  // get posts of current user's posts 
  async getPosts(req) {
    var sorting_field = req.query.sorting_field ? req.query.sorting_field : 'created_at';
    var sorting_direction = req.query.sorting_direction ? req.query.sorting_direction : 'desc';
    var filter_fields = req.query.filter_fields;
    var filter_val = req.query.filter;
    var filter_data = [];
    var filter_condition;

    if (filter_fields) {
      var regex = new RegExp(filter_val, "i")
      for (let i = 0; i < filter_fields.length; i++) {
        filter_data.push({ [filter_fields[i]]: regex });
      }
      }
    var sort_by = { [sorting_field]: sorting_direction == 'desc' ? -1 : 1 };
    var filter = [];
    var match_cond = {};

    var user_id = req.user.id;
    if(req.query.user_id) user_id = req.query.user_id;

    if (req.query.user_id) filter.push({ user_id: new ObjectID(req.query.user_id) });
    filter_condition = (filter_data.length > 0) ? { $or: filter_data } : {};

    if(filter_condition) filter.push(filter_condition);
    filter.push({ user_id: ObjectID(user_id), "is_suspended": {$ne: true} })
    if (req.query.user_id) filter.push({ user_id: new ObjectID(req.query.user_id) });
    if (filter.length > 0) match_cond = { $and: filter };
    // Count how many posts were found
    const numOfUsers = await this.dbClient.then(db => db.collection(this.collection).aggregate([{ $match: { user_id: ObjectID(user_id), "is_suspended": {$ne: true} } }]).toArray());
    const skip = parseInt(req.query.page? req.query.page: 0) * parseInt(req.query.limit ? req.query.limit: numOfUsers.length == 0 ? 1: numOfUsers.length);

    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { user_id: ObjectID(user_id), "is_suspended": {$ne: true} } },
          { $match: match_cond },
          {
            $lookup:
            {
              from: "cl_user",
              localField: "user_id",
              foreignField: "_id",
              as: "user_data"
            }
          },
          {
            $project: {
              "user_data.passwordHash": 0,
              "user_data.salt": 0,
              "user_data.verification_token": 0
            }
          },
          {
            $lookup: {
              from: "cl_likes",
              let: { keywordId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post_id", "$$keywordId"] },
                        {
                          $eq: ["$user_id", ObjectID(req.user.id)],
                        },
                        {
                          $eq: ["$post_type", "post"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "like_data",
            },
          },
          {
            $lookup: {
              from: "cl_likes",
              let: { keywordId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post_id", "$$keywordId"] },
                        {
                          $eq: ["$post_type", "post"],
                        },
                      ],
                    },
                  },
                },
                { $count: "likes_count" }
              ],
              as: "total_likes",
            }
          },
          {
            $unwind: {
              "path": "$total_likes",
              "preserveNullAndEmptyArrays": true
            }
          },
          {
            $group:
            {
              _id: "$_id",
              user_id: { $first: "$user_id" },
              user_data: { $first: "$user_data" },
              message: { $first: "$message" },
              post_img: { $first: "$post_img" },
              post_video: { $first: "$post_video" },
              post_link: { $first: "$post_link" },
              is_suspended: { $first: "$is_suspended" },
              like_data: { $first: "$like_data" },
              total_likes: { $first: "$total_likes.likes_count" },
              created_at: { $first: "$created_at" },
              updated_at: { $first: "$updated_at" },
              file_path: { $first: file_path },
            }
          },
          { $sort: sort_by },
          { $skip: skip },
          { $limit: parseInt(req.query.limit ? req.query.limit: numOfUsers.length == 0 ? 1: numOfUsers.length) }
        ])
        .toArray()
      )
      .then(data => {
        return {
          meta: {
            "total": parseInt(numOfUsers.length),
            "per_page": parseInt(req.query.limit ? req.query.limit: numOfUsers.length == 0 ? 1: numOfUsers.length),
            "current_page": parseInt(req.query.page ? req.query.page : 0)
          },
          data: data
        };
      });
  }

  // find by id 
  async findById(id, req) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { _id: ObjectID(id) } },
          {
            $lookup:
            {
              from: "cl_user",
              localField: "user_id",
              foreignField: "_id",
              as: "user_data"
            }
          },
          {
            $project: {
              "user_data.passwordHash": 0,
              "user_data.salt": 0,
              "user_data.verification_token": 0
            }
          },
          {
            $lookup: {
              from: "cl_likes",
              let: { keywordId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post_id", "$$keywordId"] },
                        {
                          $eq: ["$user_id", ObjectID(req.user.id)],
                        },
                        {
                          $eq: ["$post_type", "post"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "like_data",
            },
          },
          {
            $lookup: {
              from: "cl_likes",
              let: { keywordId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$post_id", "$$keywordId"] },
                        {
                          $eq: ["$post_type", "post"],
                        },
                      ],
                    },
                  },
                },
                { $count: "likes_count" }
              ],
              as: "total_likes",
            }
          },
          {
            $unwind: {
              "path": "$total_likes",
              "preserveNullAndEmptyArrays": true
            }
          },
          {
            $group:
            {
              _id: "$_id",
              user_id: { $first: "$user_id" },
              user_data: { $first: "$user_data" },
              message: { $first: "$message" },
              post_img: { $first: "$post_img" },
              post_video: { $first: "$post_video" },
              post_link: { $first: "$post_link" },
              is_suspended: { $first: "$is_suspended" },
              like_data: { $first: "$like_data" },
              total_likes: { $first: "$total_likes.likes_count" },
              created_at: { $first: "$created_at" },
              updated_at: { $first: "$updated_at" },
              file_path: { $first: file_path },
            }
          }
        ])
        .toArray()
      )
      .then(data => {
        return data;
      });
  }

  //  findById(id, req) {
  //   //  console.log(req);
  //   return this.dbClient
  //     .then(db => db
  //       .collection(this.collection)
  //       .aggregate([
  //         { $match: { _id: ObjectID(id) } },
  //         {
  //           $lookup:
  //           {
  //             from: "cl_user",
  //             localField: "user_id",
  //             foreignField: "_id",
  //             as: "user_data"
  //           }
  //         },
  //         {
  //           $project: {
  //             "user_data.passwordHash": 0,
  //             "user_data.salt": 0,
  //             "user_data.verification_token": 0
  //           }
  //         },
  //         {
  //           $lookup: {
  //             from: "cl_likes",
  //             let: { keywordId: "$_id" },
  //             pipeline: [
  //               {
  //                 $match: {
  //                   $expr: {
  //                     $and: [
  //                       { $eq: ["$post_id", "$$keywordId"] },
  //                       {
  //                         $eq: ["$user_id", ObjectID(req.user.id)],
  //                       },
  //                       {
  //                         $eq: ["$post_type", "post"],
  //                       },
  //                     ],
  //                   },
  //                 },
  //               },
  //             ],
  //             as: "like_data",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "cl_likes",
  //             let: { keywordId: "$_id" },
  //             pipeline: [
  //               {
  //                 $match: {
  //                   $expr: {
  //                     $and: [
  //                       { $eq: ["$post_id", "$$keywordId"] },
  //                       {
  //                         $eq: ["$post_type", "post"],
  //                       },
  //                     ],
  //                   },
  //                 },
  //               },
  //               { $count: "likes_count" }
  //             ],
  //             as: "total_likes",
  //           }
  //         },
  //         {
  //           $unwind: {
  //             "path": "$total_likes",
  //             "preserveNullAndEmptyArrays": true
  //           }
  //         },
  //         {
  //           $group:
  //           {
  //             _id: "$_id",
  //             user_id: { $first: "$user_id" },
  //             user_data: { $first: "$user_data" },
  //             message: { $first: "$message" },
  //             post_img: { $first: "$post_img" },
  //             post_video: { $first: "$post_video" },
  //             post_link: { $first: "$post_link" },
  //             like_data: { $first: "$like_data" },
  //             total_likes: { $first: "$total_likes.likes_count" },
  //             created_at: { $first: "$created_at" },
  //             updated_at: { $first: "$updated_at" },
  //             file_path: { $first: file_path },
  //           }
  //         }
  //       ])
  //       .toArray()
  //     )
  //     .then(data => {
  //       return data
  //     });
  // }
  
}

module.exports = PostRepository;
