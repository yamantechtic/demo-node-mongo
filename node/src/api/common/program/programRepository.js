const { ObjectID } = require('mongodb');
const emailService = require('../../../utils/emailService');
const BaseRepository = require('../../../db/baseRepository');
// const file_path = require('config').get('file_path').path;
const file_path = process.env.FILE_PATH;

class ProgramRepository extends BaseRepository {
  constructor() {
    super('cl_program');
  }
  
  // get all programs
  async getAllPrograms(req) {
    var sorting_field = req.query.sorting_field ? req.query.sorting_field : 'created_at';
    var sorting_direction = req.query.sorting_direction ? req.query.sorting_direction : 'desc';
    var filter_fields = req.query.filter_fields;
    var filter_val = req.query.filter;
    var filter_data = [];
    var filter_condition;

    if(filter_fields) {
      var regex = new RegExp(filter_val, "i")
      for (let i = 0; i < filter_fields.length; i++) {
        filter_data.push({ [filter_fields[i]]: regex });
      }
      filter_data.push({ 'user_data.company_name': regex });
    }
    
    var sort_by = { [sorting_field]: sorting_direction == 'desc' ? -1 : 1 };
    filter_condition = (filter_data.length > 0) ? { $or: filter_data } : {};

    var filter = [{ $or: [{ "deleted_at": null }, { "deleted_at": undefined }, { "deleted_at": "" }] }];
    filter.push({ "is_suspended": {$ne: true} });
    var field_group = {};
    var match_cond = {};
    if(req.query.id) filter.push({_id: new ObjectID(req.query.id)});
    if(req.query.program_id) filter.push({_id:  { $ne: ObjectID(req.query.program_id) } });
    if(req.query.category) filter.push({category: req.query.category});
    if(req.query.user_id) filter.push({user_id: new ObjectID(req.query.user_id)});
    if(filter_condition) filter.push(filter_condition);
    if(filter.length>0) match_cond = {$and: filter};

    field_group = {
      _id: "$_id",
      name: { $first: "$name" },
      user_id: { $first: "$user_id" },
      user_data: { $first: "$user_data" },
      category: { $first: "$category" },
      // cat_data: { $first: "$cat_data" },
      sub_category: { $first: "$sub_category" },
      // sub_cat_data: { $first: "$sub_cat_data" },
      profile_img: { $first: "$profile_img" },
      problem: { $first: "$problem" },
      goal: { $first: "$goal" },
      approach: { $first: "$approach" },
      area_served: { $first: "$area_served" },
      program_fund_amt: { $first: "$program_fund_amt" },
      program_fund: { $first: "$program_fund" },
      status: { $first: "$status" },
      start_date: { $first: "$start_date" },
      end_date: { $first: "$end_date" },
      // followers: { $first: "$followers" },
      followers: { $first: "$followers_data" },
      is_suspended: { $first: "$is_suspended" },
      created_at: { $first: "$created_at" },
      updated_at: { $first: "$updated_at" },
      deleted_at: { $first: "$deleted_at" },
      file_path: { $first: file_path },
      reported_content_data: { $first: "$reported_content_data" }
    };

    // Count how many programs were found
    const numOfPrograms = await this.dbClient.then(db => db.collection(this.collection).find(match_cond).count());
    // const numOfPrograms = await this.dbClient.then(db => db.collection(this.collection).find().count());

    // const skip = (parseInt(req.query.page) - 1) * parseInt(req.query.limit);
    const skip = (parseInt(req.query.page? req.query.page: 0)) * parseInt(req.query.limit ? req.query.limit: numOfPrograms == 0 ? 1: numOfPrograms);
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          {
            $lookup:
            {
              from: "cl_user",
              localField: "user_id",
              foreignField: "_id",
              as: "user_data"
            }
          },
          { $match: match_cond },
          // {
          //   $lookup:
          //   {
          //     from: "cl_non_profit_category",
          //     localField: "category",
          //     foreignField: "_id",
          //     as: "cat_data"
          //   }
          // },
          // {
          //   $lookup:
          //   {
          //     from: "cl_non_profit_sub_category",
          //     localField: "sub_category",
          //     foreignField: "_id",
          //     as: "sub_cat_data"
          //   }
          // },
          {
            $lookup:
            {
              from: "cl_user",
              localField: "followers",
              foreignField: "_id",
              as: "followers_data"
            }
          },
          {
            $lookup:
            {
              from: "cl_reported_content",
              localField: "_id",
              foreignField: "module_id",
              as: "reported_content_data"
            }
          },
          {
            $project: {
              "_id": 1,
              "name": 1,
              "user_id": 1,
              "category": 1,
              // "cat_data": 1,
              "sub_category": 1,
              // "sub_cat_data": 1,
              "profile_img": 1,
              "problem": 1,
              "goal": 1,
              "approach": 1,
              "area_served": 1,
              "program_fund_amt": 1,
              "program_fund": 1,
              "status": 1,
              "start_date": 1,
              "end_date": 1,
              "is_suspended": 1,
              "created_at": 1,
              "updated_at": 1,
              "deleted_at": 1,
              "followers_data._id": 1,
              "followers_data.first_name": 1,
              "followers_data.last_name": 1,
              "followers_data.company_name": 1,
              "followers_data.email": 1,
              "followers_data.phone": 1,
              "followers_data.user_type": 1,
              "user_data._id": 1,
              "user_data.first_name": 1,
              "user_data.last_name": 1,
              "user_data.company_name": 1,
              "user_data.email": 1,
              "user_data.phone": 1,
              "user_data.user_type": 1,
              "reported_content_data._id": 1,
              "reported_content_data.reporter_user_id": 1,
              "reported_content_data.module_id": 1,
              "reported_content_data.type": 1,
              "reported_content_data.message": 1,
            }
          },
          {
            $group: field_group
          },
          { $sort: sort_by },
          { $skip: skip ? skip : 0 },
          { $limit: parseInt(req.query.limit ? req.query.limit: numOfPrograms == 0 ? 1: numOfPrograms) }
        ])
        .toArray()
      )
      .then(data => {
        return {
          meta: {
            "total": parseInt(numOfPrograms),
            "per_page": parseInt(req.query.limit ? req.query.limit: numOfPrograms == 0 ? 1: numOfPrograms),
            "current_page": parseInt(req.query.page ? req.query.page : 0)
          },
          data: data
        };
      });
  }

  // get program by id
  async findById(id) {
    var field_group = {
      _id: "$_id",
      name: { $first: "$name" },
      user_id: { $first: "$user_id" },
      user_data: { $first: "$user_data" },
      category: { $first: "$category" },
      // cat_data: { $first: "$cat_data" },
      sub_category: { $first: "$sub_category" },
      // sub_cat_data: { $first: "$sub_cat_data" },
      profile_img: { $first: "$profile_img" },
      problem: { $first: "$problem" },
      goal: { $first: "$goal" },
      approach: { $first: "$approach" },
      area_served: { $first: "$area_served" },
      program_fund_amt: { $first: "$program_fund_amt" },
      program_fund: { $first: "$program_fund" },
      status: { $first: "$status" },
      start_date: { $first: "$start_date" },
      end_date: { $first: "$end_date" },
      // followers: { $first: "$followers" },
      is_suspended: { $first: "$is_suspended" },
      followers: { $first: "$followers_data" },
      created_at: { $first: "$created_at" },
      updated_at: { $first: "$updated_at" },
      deleted_at: { $first: "$deleted_at" },
      file_path: { $first: file_path }
    };

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
          // {
          //   $lookup:
          //   {
          //     from: "cl_non_profit_category",
          //     localField: "category",
          //     foreignField: "_id",
          //     as: "cat_data"
          //   }
          // },
          // {
          //   $lookup:
          //   {
          //     from: "cl_non_profit_sub_category",
          //     localField: "sub_category",
          //     foreignField: "_id",
          //     as: "sub_cat_data"
          //   }
          // },
          {
            $lookup:
            {
              from: "cl_user",
              localField: "followers",
              foreignField: "_id",
              as: "followers_data"
            }
          },
          {
            $project: {
              "_id": 1,
              "name": 1,
              "user_id": 1,
              "category": 1,
              // "cat_data": 1,
              "sub_category": 1,
              // "sub_cat_data": 1,
              "profile_img": 1,
              "problem": 1,
              "goal": 1,
              "approach": 1,
              "area_served": 1,
              "program_fund_amt": 1,
              "program_fund": 1,
              "status": 1,
              "start_date": 1,
              "end_date": 1,
              "is_suspended": 1,
              "created_at": 1,
              "updated_at": 1,
              "deleted_at": 1,
              "followers_data._id": 1,
              "followers_data.first_name": 1,
              "followers_data.last_name": 1,
              "followers_data.company_name": 1,
              "followers_data.email": 1,
              "followers_data.phone": 1,
              "followers_data.user_type": 1,
              "user_data._id": 1,
              "user_data.first_name": 1,
              "user_data.last_name": 1,
              "user_data.company_name": 1,
              "user_data.email": 1,
              "user_data.phone": 1,
              "user_data.user_type": 1
            }
          },
          {
            $group: field_group
          }
        ])
        .toArray()
      )
      .then(data => {
        return data;
      });
  }

   // get all programs followed by current user
  async getFollowedPrograms(req) {
    var field_group = {
      _id: "$_id",
      name: { $first: "$name" },
      user_id: { $first: "$user_id" },
      user_data: { $first: "$user_data" },
      category: { $first: "$category" },
      // cat_data: { $first: "$cat_data" },
      sub_category: { $first: "$sub_category" },
      // sub_cat_data: { $first: "$sub_cat_data" },
      profile_img: { $first: "$profile_img" },
      problem: { $first: "$problem" },
      goal: { $first: "$goal" },
      approach: { $first: "$approach" },
      area_served: { $first: "$area_served" },
      program_fund_amt: { $first: "$program_fund_amt" },
      program_fund: { $first: "$program_fund" },
      status: { $first: "$status" },
      start_date: { $first: "$start_date" },
      end_date: { $first: "$end_date" },
      // followers: { $first: "$followers" },
      followers: { $first: "$followers_data" },
      created_at: { $first: "$created_at" },
      updated_at: { $first: "$updated_at" },
      deleted_at: { $first: "$deleted_at" },
      file_path: { $first: file_path }
    };
    // Count how many programs were found
    const numOfPrograms = await this.dbClient.then(db => db.collection(this.collection).find({ $and: [{ followers: ObjectID(req.user.id) }, { $or: [{ "deleted_at": null }, { "deleted_at": undefined }, { "deleted_at": "" }] }] }).count());
   
    const skip = (parseInt(req.query.page ? req.query.page: 0)) * parseInt(req.query.limit ? req.query.limit: numOfPrograms == 0 ? 1: numOfPrograms);
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { $and: [{ followers: ObjectID(req.user.id) }, { $or: [{ "deleted_at": null }, { "deleted_at": undefined }, { "deleted_at": "" }] }] } },
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
          // {
          //   $lookup:
          //   {
          //     from: "cl_non_profit_category",
          //     localField: "category",
          //     foreignField: "_id",
          //     as: "cat_data"
          //   }
          // },
          // {
          //   $lookup:
          //   {
          //     from: "cl_non_profit_sub_category",
          //     localField: "sub_category",
          //     foreignField: "_id",
          //     as: "sub_cat_data"
          //   }
          // },
          {
            $lookup:
            {
              from: "cl_user",
              localField: "followers",
              foreignField: "_id",
              as: "followers_data"
            }
          },
          {
            $project: {
              "_id": 1,
              "name": 1,
              "user_id": 1,
              "category": 1,
              // "cat_data": 1,
              "sub_category": 1,
              // "sub_cat_data": 1,
              "profile_img": 1,
              "problem": 1,
              "goal": 1,
              "approach": 1,
              "area_served": 1,
              "program_fund_amt": 1,
              "program_fund": 1,
              "status": 1,
              "start_date": 1,
              "end_date": 1,
              "created_at": 1,
              "updated_at": 1,
              "deleted_at": 1,
              "followers_data._id": 1,
              "followers_data.first_name": 1,
              "followers_data.last_name": 1,
              "followers_data.company_name": 1,
              "followers_data.email": 1,
              "followers_data.phone": 1,
              "followers_data.user_type": 1,
              "user_data._id": 1,
              "user_data.first_name": 1,
              "user_data.last_name": 1,
              "user_data.company_name": 1,
              "user_data.email": 1,
              "user_data.phone": 1,
              "user_data.user_type": 1
            }
          },
          {
            $group: field_group
          },
          { $sort: { created_at: -1 } },
          { $skip: skip ? skip : 0 },
          { $limit: parseInt(req.query.limit ? req.query.limit: numOfPrograms == 0 ? 1: numOfPrograms) }
        ])
        .toArray()
      )
      .then(data => {
        return {
          meta: {
            "total": parseInt(numOfPrograms),
            "per_page": parseInt(req.query.limit ? req.query.limit: numOfPrograms == 0 ? 1: numOfPrograms),
            "current_page": parseInt(req.query.page ? req.query.page : 0)
          },
          data: data
        };
      });
  }

  // follow a program
  followProgram(current_user_id, program_id) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .updateOne({ _id: ObjectID(program_id) }, { 
          $push: { followers: ObjectID(current_user_id) },
          $set: { updated_at: new Date()}
        } , { upsert: false })
      )
      .then(data => {
        return data
      });
  }

  // unfollow a program
  unfollowProgram(current_user_id, program_id) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .updateOne({ _id: ObjectID(program_id) }, { 
          $pullAll: { followers: [ObjectID(current_user_id)] }, 
          $set: { updated_at: new Date() } 
        } , { upsert: false })
      )
      .then(data => {
        return data
      });
  }
}

module.exports = ProgramRepository;
