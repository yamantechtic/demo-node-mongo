const { ObjectID } = require('mongodb');
const emailService = require('../../../utils/emailService');
const BaseRepository = require('../../../db/baseRepository');
// const file_path = require('config').get('file_path').path;
const file_path = process.env.FILE_PATH;

class UserRepository extends BaseRepository {
  constructor() {
    super('cl_user');
  }

  // user email confirmation
  confirm_user(email, token) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { email: email, verification_token: token } },
          { $sort: { name: -1 } }
        ])
        .toArray()
      )
      .then(data => {
        var updated_data = {
          is_verified: true,
          updated_at: new Date()
        }
        if (data.length > 0) {
          if (data[0].user_type.trim().toLowerCase() === "donor") {
            updated_data.admin_verification = true;
          }
          return this.dbClient
            .then(db => db
              .collection(this.collection)
              .updateOne({ _id: data[0]._id },
                { $set: updated_data })
            )
          // .then(() => {
          //   if (data[0].user_type.trim().toLowerCase() === 'donor' || data[0].user_type.trim().toLowerCase().includes('admin'))
          //     return emailService.sendNewUserEmail(data[0].first_name + " " + data[0].last_name, data[0].email);
          //   else
          //     return emailService.sendNewUserEmail(data[0].company_name, data[0].email);
          //   //return 'Your email has been verified successfully!.'; 
          // });
        } else {
          throw new Error('Invalid user');
        }
      });
  }

  // get all users
  async getAllUsers(req,blockedusers) {
    // console.log(req.query.filter_fields);
    // var user_type_filter = {}
    // var field_group = {};
    // var sort_by = { company_name: -1 };

    // if (req.query.user_type) {
    //   user_type_filter = { user_type: req.query.user_type };
    // }

    var sorting_field = req.body.sorting_field ? req.body.sorting_field : ((req.body.user_type && (req.body.user_type.trim().toLowerCase() === 'donor')) ? 'first_name' : 'company_name');

    var sorting_direction = req.body.sorting_direction ? req.body.sorting_direction : 'desc';
    var filter_fields = req.body.filter_fields;
    var filter_val = req.body.filter;
    var filter_data = [];
    var filter_condition;

    if (filter_fields) {
      var regex = new RegExp(filter_val, "i")
      for (let i = 0; i < filter_fields.length; i++) {
        filter_data.push({ [filter_fields[i]]: regex });
      }
    }
    let exxtraSprt = '';
    if(sorting_field == 'first_name' || sorting_field == 'last_name'){
      exxtraSprt = 'company_name';
      var sort_by = { [sorting_field]: sorting_direction == 'desc' ? -1 : 1,  [exxtraSprt]: sorting_direction == 'desc' ? -1 : 1,};
    } else if(sorting_field == 'company_name'){
      exxtraSprt = 'first_name';
      var sort_by = { [sorting_field]: sorting_direction == 'desc' ? -1 : 1,  [exxtraSprt]: sorting_direction == 'desc' ? -1 : 1,};
    } else {
      var sort_by = { [sorting_field]: sorting_direction == 'desc' ? -1 : 1 };
    }
    var field_group = {};
    // var user_type_filter = {}
    var field_group = {};
    // var sort_by = { company_name: -1 };

    filter_condition = (filter_data.length > 0) ? { $or: filter_data } : {};

    if (req.body.user_type) {
      // user_type_filter = { user_type: req.body.user_type };
      filter_condition = { $and: [{ user_type: req.body.user_type }, filter_condition] };
    }
    // filter_condition = { $and: [{ is_verified: true, admin_verification: true }, { $or: [{ deleted_at: { $exists: false }, deleted_at: null, deleted_at: undefined }] }, filter_condition] };
    if (req.body.is_admin) {
      filter_condition = { $and: [{ "is_suspended": {$ne: true}}, filter_condition] };
    } else {
      filter_condition = { $and: [{ is_verified: true, admin_verification: true, _id: { $ne: ObjectID(req.user.id) } }, { "is_suspended": {$ne: true} }, { $or: [{ deleted_at: { $exists: false }, deleted_at: null, deleted_at: undefined }] }, filter_condition] };
    }
    if (req.body.user_type && req.body.user_type.trim().toLowerCase() === "donor") {
      field_group = {
        _id: "$_id",
        google_token: { $first: "$google_token" },
        facebook_token: { $first: "$facebook_token" },
        apple_token: { $first: "$apple_token" },
        first_name: { $first: "$first_name" },
        middle_name: { $first: "$middle_name" },
        last_name: { $first: "$last_name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        // age: { $first: "$age" },
        dob: { $first: "$dob" },
        user_type: { $first: "$user_type" },
        is_verified: { $first: "$is_verified" },
        is_suspended: { $first: "$is_suspended" },
        admin_verification: { $first: "$admin_verification" },
        deactivate: { $first: "$deactivate" },
        // profile_img: { $first: { $concat: ["/uploads/", "$profile_img"] } },
        profile_img: { $first: "$profile_img" },
        location: { $first: "$location" },
        about_me: { $first: "$about_me" },
        causes: { $first: "$causes" },
        influence: { $first: "$influence" },
        social_media_accounts: { $first: "$social_media_accounts" },
        internal_comments: { $first: "$internal_comments" },
        created_at: { $first: "$created_at" },
        updated_at: { $first: "$updated_at" },
        deleted_at: { $first: "$deleted_at" },
        restrictions_data: { $first: "$restrictions_data" },
        file_path: { $first: file_path }
      };
      // sort_by = { first_name: -1 };
    } else if (req.body.user_type && req.body.user_type.trim().toLowerCase() === "non_profit") {
      field_group = {
        _id: "$_id",
        google_token: { $first: "$google_token" },
        facebook_token: { $first: "$facebook_token" },
        apple_token: { $first: "$apple_token" },
        company_name: { $first: "$company_name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        user_type: { $first: "$user_type" },
        is_verified: { $first: "$is_verified" },
        is_suspended: { $first: "$is_suspended" },
        admin_verification: { $first: "$admin_verification" },
        deactivate: { $first: "$deactivate" },
        profile_img: { $first: "$profile_img" },
        website: { $first: "$website" },
        ein: { $first: "$ein" },
        category: { $first: "$category" },
        // cat_data: { $addToSet: { $arrayElemAt: ["$cat_data", 0] } },
        sub_category: { $first: "$sub_category" },
        // sub_cat_data: { $addToSet: { $arrayElemAt: ["$sub_cat_data", 0] } },
        mission: { $first: "$mission" },
        vision: { $first: "$vision" },
        area_served: { $first: "$area_served" },
        established_in: { $first: "$established_in" },
        facts_accomplishments: { $first: "$facts_accomplishments" },
        address: { $first: "$address" },
        social_media_accounts: { $first: "$social_media_accounts" },
        tax_returns: { $first: "$tax_returns" },
        // tax_returns: {
        //   $push: {
        //     year: "$tax_returns.year",
        //     file_name: { $concat: ["/uploads/", "$tax_returns.file_name"] }
        //   }
        // },
        annual_reports: { $first: "$annual_reports" },
        administration_funds_amt: { $first: "$administration_funds_amt" },
        administration_funds_per: { $first: "$administration_funds_per" },
        fundraising_fund_amt: { $first: "$fundraising_fund_amt" },
        fundraising_fund_per: { $first: "$fundraising_fund_per" },
        direct_programs_fund_amt: { $first: "$direct_programs_fund_amt" },
        direct_programs_fund_per: { $first: "$direct_programs_fund_per" },
        internal_comments: { $first: "$internal_comments" },
        created_at: { $first: "$created_at" },
        updated_at: { $first: "$updated_at" },
        deleted_at: { $first: "$deleted_at" },
        restrictions_data: { $first: "$restrictions_data" },
        file_path: { $first: file_path }
      };
    } else if (req.body.user_type && req.body.user_type.trim().toLowerCase() === "for_profit") {
      field_group = {
        _id: "$_id",
        google_token: { $first: "$google_token" },
        facebook_token: { $first: "$facebook_token" },
        apple_token: { $first: "$apple_token" },
        company_name: { $first: "$company_name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        user_type: { $first: "$user_type" },
        is_verified: { $first: "$is_verified" },
        is_suspended: { $first: "$is_suspended" },
        admin_verification: { $first: "$admin_verification" },
        deactivate: { $first: "$deactivate" },
        profile_img: { $first: "$profile_img" },
        website: { $first: "$website" },
        ein: { $first: "$ein" },
        mission: { $first: "$mission" },
        address: { $first: "$address" },
        social_media_accounts: { $first: "$social_media_accounts" },
        product_services: { $first: "$product_services" },
        industry: { $first: "$industry" },
        internal_comments: { $first: "$internal_comments" },
        created_at: { $first: "$created_at" },
        updated_at: { $first: "$updated_at" },
        deleted_at: { $first: "$deleted_at" },
        restrictions_data: { $first: "$restrictions_data" },
        file_path: { $first: file_path }
      };
    } else if (req.body.user_type && req.body.user_type.trim().toLowerCase() === "foundation") {
      field_group = {
        _id: "$_id",
        google_token: { $first: "$google_token" },
        facebook_token: { $first: "$facebook_token" },
        apple_token: { $first: "$apple_token" },
        company_name: { $first: "$company_name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        user_type: { $first: "$user_type" },
        is_verified: { $first: "$is_verified" },
        is_suspended: { $first: "$is_suspended" },
        admin_verification: { $first: "$admin_verification" },
        deactivate: { $first: "$deactivate" },
        profile_img: { $first: "$profile_img" },
        website: { $first: "$website" },
        ein: { $first: "$ein" },
        mission: { $first: "$mission" },
        vision: { $first: "$vision" },
        address: { $first: "$address" },
        social_media_accounts: { $first: "$social_media_accounts" },
        internal_comments: { $first: "$internal_comments" },
        created_at: { $first: "$created_at" },
        updated_at: { $first: "$updated_at" },
        deleted_at: { $first: "$deleted_at" },
        restrictions_data: { $first: "$restrictions_data" },
        file_path: { $first: file_path }
      };
    } else if (req.body.user_type && req.body.user_type.trim().toLowerCase() === "government") {
      field_group = {
        _id: "$_id",
        google_token: { $first: "$google_token" },
        facebook_token: { $first: "$facebook_token" },
        apple_token: { $first: "$apple_token" },
        company_name: { $first: "$company_name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        user_type: { $first: "$user_type" },
        is_verified: { $first: "$is_verified" },
        is_suspended: { $first: "$is_suspended" },
        admin_verification: { $first: "$admin_verification" },
        deactivate: { $first: "$deactivate" },
        profile_img: { $first: "$profile_img" },
        website: { $first: "$website" },
        mission: { $first: "$mission" },
        address: { $first: "$address" },
        social_media_accounts: { $first: "$social_media_accounts" },
        gov_type: { $first: "$gov_type" },
        internal_comments: { $first: "$internal_comments" },
        created_at: { $first: "$created_at" },
        updated_at: { $first: "$updated_at" },
        deleted_at: { $first: "$deleted_at" },
        restrictions_data: { $first: "$restrictions_data" },
        file_path: { $first: file_path }
      };
    } else {
      field_group = {
        _id: "$_id",
        google_token: { $first: "$google_token" },
        facebook_token: { $first: "$facebook_token" },
        company_name: { $first: "$company_name" },
        first_name: { $first: "$first_name" },
        middle_name: { $first: "$middle_name" },
        last_name: { $first: "$last_name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        about_me: { $first: "$about_me" },
        user_type: { $first: "$user_type" },
        is_verified: { $first: "$is_verified" },
        is_suspended: { $first: "$is_suspended" },
        admin_verification: { $first: "$admin_verification" },
        deactivate: { $first: "$deactivate" },
        profile_img: { $first: "$profile_img" },
        location: { $first: "$location" },
        address: { $first: "$address" },
        internal_comments: { $first: "$internal_comments" },
        created_at: { $first: "$created_at" },
        updated_at: { $first: "$updated_at" },
        deleted_at: { $first: "$deleted_at" },
        restrictions_data: { $first: "$restrictions_data" },
        file_path: { $first: file_path }
      };
      // sort_by = { first_name: -1 };
    }


    // Count how many users were found
    if(req.body.is_admin) { 
    const numOfUsers = await this.dbClient.then(db => db.collection(this.collection).find(filter_condition).count());
    
    const skip = ((parseInt(req.body.page || 0)) * parseInt(req.body.limit || numOfUsers));
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: filter_condition },   
          {
            $lookup:
            {
              from: "cl_profile_restriction",
              localField: "_id",
              foreignField: "user_id",
              as: "restrictions_data"
            }
          },
          {
            $group: field_group
          },
          { $sort: sort_by },
          { $skip: skip },
          { $limit: parseInt(req.body.limit || numOfUsers) }
        ])
        .toArray()
      ).then(data => {
          return {
            meta: {
              "total": parseInt(numOfUsers),
              "per_page": parseInt(req.body.limit || numOfUsers),
              
              "current_page": parseInt(req.body.page) || 0
            },
            data: data
          };
        });
    }
    else {
    let blockedData = blockedusers[0]
    let blockedIds = blockedData && blockedData.map((item) => item._id)
    if(blockedIds) {
    let filterData = await this.dbClient.then(db => db.collection(this.collection).find({$and: [filter_condition,{"_id": {"$nin": blockedIds}}]}).toArray())
    const skip = ((parseInt(req.body.page || 0)) * parseInt(req.body.limit || filterData.length));
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: {$and: [filter_condition,{"_id": {"$nin": blockedIds}}]} },   
          {
            $lookup:
            {
              from: "cl_profile_restriction",
              localField: "_id",
              foreignField: "user_id",
              as: "restrictions_data"
            }
          },
          {
            $group: field_group
          },
          { $sort: sort_by },
          { $skip: skip },
          { $limit: parseInt(req.body.limit || filterData.length) }
        ])
        .toArray()
      ).then(data => {
          return {
            meta: {
              "total": parseInt(filterData.length),
              "per_page": parseInt(req.body.limit || filterData.length),
              
              "current_page": parseInt(req.body.page) || 0
            },
            data: data
          };
        });
      } else {
        const numOfUsers = await this.dbClient.then(db => db.collection(this.collection).find(filter_condition).count());
    
        const skip = ((parseInt(req.body.page || 0)) * parseInt(req.body.limit || numOfUsers));
        return this.dbClient
          .then(db => db
            .collection(this.collection)
            .aggregate([
              { $match: filter_condition },   
              {
                $lookup:
                {
                  from: "cl_profile_restriction",
                  localField: "_id",
                  foreignField: "user_id",
                  as: "restrictions_data"
                }
              },
              {
                $group: field_group
              },
              { $sort: sort_by },
              { $skip: skip },
              { $limit: parseInt(req.body.limit || numOfUsers) }
            ])
            .toArray()
          ).then(data => {
              return {
                meta: {
                  "total": parseInt(numOfUsers),
                  "per_page": parseInt(req.body.limit || numOfUsers),
                  
                  "current_page": parseInt(req.body.page) || 0
                },
                data: data
              };
            });
          }
    }
  }

  // get user by id
  findById(id) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { _id: ObjectID(id) } },
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
          // {
          //   $unwind: {
          //     "path": "$tax_returns",
          //     "preserveNullAndEmptyArrays": true
          //   }
          // },
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
            $lookup:
            {
              from: "cl_profile_restriction",
              localField: "_id",
              foreignField: "user_id",
              as: "restrictions_data"
            }
          },
          {
            $project:
            {
              _id: 1,
              google_token: 1,
              facebook_token: 1,
              apple_token: 1,
              first_name: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$user_type', 'donor'] },
                      { $eq: ['$user_type', 'admin'] },
                    ]
                  }, then: '$first_name', else: "$REMOVE"
                }
              },
              // first_name: {
              //   $cond: {
              //     if: { $regexMatch: { input: "$first_name", regex: '/admin/i' } },
              //     then: '$first_name',
              //     else: "$REMOVE"
              //   }
              // },
              middle_name: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$user_type', 'donor'] },
                      { $eq: ['$user_type', 'admin'] },
                    ]
                  }, then: '$middle_name', else: "$REMOVE"
                }
              },
              last_name: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$user_type', 'donor'] },
                      { $eq: ['$user_type', 'admin'] },
                    ]
                  }, then: '$last_name', else: "$REMOVE"
                }
              },
              company_name: {
                $cond: { if: { $ne: ['$user_type', 'donor'] }, then: '$company_name', else: "$REMOVE" }
              },
              email: 1,
              phone: 1,
              // age: {
              //   $cond: { if: { $eq: ['$user_type', 'donor'] }, then: '$age', else: "$REMOVE" }
              // },
              dob: {
                $cond: { if: { $eq: ['$user_type', 'donor'] }, then: '$dob', else: "$REMOVE" }
              },
              reported_content_data: 1,
              restrictions_data:1,
              user_type: 1,
              is_verified: 1,
              is_suspended: 1,
              admin_verification: 1,
              deactivate: 1,
              // // profile_img: { $first: { $concat: ["/uploads/", "$profile_img"] } },
              profile_img: 1,
              website: {
                $cond: { if: { $ne: ['$user_type', 'donor'] }, then: '$website', else: "$REMOVE" }
              },
              location: {
                $cond: { if: { $eq: ['$user_type', 'donor'] }, then: '$location', else: "$REMOVE" }
              },
              about_me: {
                $cond: { if: { $eq: ['$user_type', 'donor'] }, then: '$about_me', else: "$REMOVE" }
              },
              causes: {
                $cond: { if: { $eq: ['$user_type', 'donor'] }, then: '$causes', else: "$REMOVE" }
              },
              influence: {
                $cond: { if: { $eq: ['$user_type', 'donor'] }, then: '$influence', else: "$REMOVE" }
              },
              ein: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$user_type', 'non_profit'] },
                      { $eq: ['$user_type', 'for_profit'] },
                      { $eq: ['$user_type', 'foundation'] }
                    ]
                  }, then: '$ein', else: "$REMOVE"
                }
              },
              category: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$category', else: "$REMOVE" }
              },
              // cat_data: {
              //   $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$cat_data', else: "$REMOVE" }
              // },
              sub_category: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$sub_category', else: "$REMOVE" }
              },
              // sub_cat_data: {
              //   $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$sub_cat_data', else: "$REMOVE" }
              // },
              mission: {
                $cond: { if: { $ne: ['$user_type', 'donor'] }, then: '$mission', else: "$REMOVE" }
              },
              vision: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$user_type', 'non_profit'] },
                      { $eq: ['$user_type', 'foundation'] }
                    ]
                  }, then: '$vision', else: "$REMOVE"
                }
              },
              area_served: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$area_served', else: "$REMOVE" }
              },
              established_in: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$established_in', else: "$REMOVE" }
              },
              facts_accomplishments: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$facts_accomplishments', else: "$REMOVE" }
              },
              address: {
                $cond: { if: { $ne: ['$user_type', 'donor'] }, then: '$address', else: "$REMOVE" }
              },
              social_media_accounts: 1,
              tax_returns: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$tax_returns', else: "$REMOVE" }
              },
              // tax_returns: {
              //   $push: {
              //     year: "$tax_returns.year",
              //     file_name: { $concat: ["/uploads/", "$tax_returns.file_name"] }
              //   }
              // },
              annual_reports: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$annual_reports', else: "$REMOVE" }
              },
              administration_funds_amt: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$administration_funds_amt', else: "$REMOVE" }
              },
              administration_funds_per: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$administration_funds_per', else: "$REMOVE" }
              },
              fundraising_fund_amt: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$fundraising_fund_amt', else: "$REMOVE" }
              },
              fundraising_fund_per: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$fundraising_fund_per', else: "$REMOVE" }
              },
              direct_programs_fund_amt: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$direct_programs_fund_amt', else: "$REMOVE" }
              },
              direct_programs_fund_per: {
                $cond: { if: { $eq: ['$user_type', 'non_profit'] }, then: '$direct_programs_fund_per', else: "$REMOVE" }
              },
              product_services: {
                $cond: { if: { $eq: ['$user_type', 'for_profit'] }, then: '$product_services', else: "$REMOVE" }
              },
              industry: {
                $cond: { if: { $eq: ['$user_type', 'for_profit'] }, then: '$industry', else: "$REMOVE" }
              },
              gov_type: {
                $cond: { if: { $eq: ['$user_type', 'government'] }, then: '$gov_type', else: "$REMOVE" }
              },
              internal_comments: 1,
              created_at: 1,
              updated_at: 1,
              deleted_at: 1,
              file_path: file_path
            }
            // $group:
            // {
            //   _id: "$_id",
            //   first_name: { $first: "$first_name" },
            //   middle_name: { $first: "$middle_name" },
            //   last_name: { $first: "$last_name" },
            //   company_name: { $first: "$company_name" },
            //   email: { $first: "$email" },
            //   phone: { $first: "$phone" },
            //   age: { $first: "$age" },
            //   user_type: { $first: "$user_type" },
            //   is_verified: { $first: "$is_verified" },
            //   admin_verification: { $first: "$admin_verification" },
            //   deactivate: { $first: "$deactivate" },
            //   // profile_img: { $first: { $concat: ["/uploads/", "$profile_img"] } },
            //   profile_img: { $first: "$profile_img" },
            //   website: { $first: "$website" },
            //   location: { $first: "$location" },
            //   about_me: { $first: "$about_me" },
            //   causes: { $first: "$causes" },
            //   influence: { $first: "$influence" },
            //   ein: { $first: "$ein" },
            //   category: { $first: "$category" },
            //   non_profit_cat_data: { $addToSet: { $arrayElemAt: ["$cat_data", 0] } },
            //   sub_category: { $first: "$sub_category" },
            //   non_profit_sub_cat_data: { $addToSet: { $arrayElemAt: ["$sub_cat_data", 0] } },
            //   mission: { $first: "$mission" },
            //   vision: { $first: "$vision" },
            //   area_served: { $first: "$area_served" },
            //   established_in: { $first: "$established_in" },
            //   facts_accomplishments: { $first: "$facts_accomplishments" },
            //   address: { $first: "$address" },
            //   social_media_accounts: { $first: "$social_media_accounts" },
            //   tax_returns: { $first: "$tax_returns" },
            //   // tax_returns: {
            //   //   $push: {
            //   //     year: "$tax_returns.year",
            //   //     file_name: { $concat: ["/uploads/", "$tax_returns.file_name"] }
            //   //   }
            //   // },
            //   annual_reports: { $first: "$annual_reports" },
            //   administration_funds_amt: { $first: "$administration_funds_amt" },
            //   fundraising_fund_amt: { $first: "$fundraising_fund_amt" },
            //   direct_programs_fund_amt: { $first: "$direct_programs_fund_amt" },
            //   product_services: { $first: "$product_services" },
            //   industry: { $first: "$industry" },
            //   gov_type: { $first: "$gov_type" },
            //   internal_comments: { $first: "$internal_comments" },
            //   created_at: { $first: "$created_at" },
            //   updated_at: { $first: "$updated_at" },
            //   deleted_at: { $first: "$deleted_at" },
            //   file_path: { $first: file_path }
            // }
          }
        ])
        .toArray()
      )
      .then(data => {
        return data
      });
  }


  // get user by email
  findByEmail(email) {
    // var regex = new RegExp(["^", email, "$"].join(""), "i")
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        // .findOne({ email: regex }));
        .findOne({ email: email }));
  }

  // get user by phone
  findByPhone(phone) {
    var regex = new RegExp(phone, "i");
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ phone: regex }));
  }

  // get user by email and provider_token
  findByEmailProvider(search) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ search }));
  }

  // change user password
  changePassword(id, salt, passwordHash) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .updateOne({ _id: ObjectID(id) }, { $set: { salt, passwordHash } }));
  }

  updateUserTokenByEmail(email, item) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .updateOne({ email: email }, { $set: item }, { upsert: false }));
  }


  // search
  //  async search(req) {
  async search(req) {

    // var sorting_field = req.body.sorting_field ? req.body.sorting_field : ((req.body.user_type && (req.body.user_type.trim().toLowerCase() === 'donor')) ? 'first_name' : 'company_name');
    // var sorting_direction = req.body.sorting_direction ? req.body.sorting_direction : 'asc';
    // var filter_fields = req.body.filter_fields;
    // var filter_val = req.body.filter;
    // var filter_data = [];
    // var filter_condition;

    // if (filter_fields) {
    //   var regex = new RegExp(filter_val, "i")
    //   for (let i = 0; i < filter_fields.length; i++) {
    //     filter_data.push({ [filter_fields[i]]: regex });
    //   }
    // }
    // var sort_by = { [sorting_field]: sorting_direction == 'desc' ? -1 : 1 };

    // filter_condition = (filter_data.length > 0 ) ? { $or: filter_data } : {};

    // if (req.body.user_type) {
    //   filter_condition = {$and:[ { user_type: req.body.user_type }, filter_condition]};
    // }
    // filter_condition = {$and:[ { is_verified: true, admin_verification: true }, {$or:[{deleted_at: { $exists: false},deleted_at: null, deleted_at: undefined}]}, filter_condition]};

    // const numOfUsers = await this.dbClient.then(db => db.collection(this.collection).find(filter_condition).count());
    // const skip = ((parseInt(req.body.page || 0)) * parseInt(req.body.limit || numOfUsers));
    const skip = parseInt(req.query.page) * parseInt(req.query.limit)
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate(
          [
            { "$limit": 1 },
            {
              "$facet": {
                "users": [
                  {
                    "$lookup": {
                      "from": "cl_user",
                      "pipeline": [
                        {
                          "$match": {
                            // $and: [ {
                            $or: [
                              { "first_name": new RegExp(req.query.search_term, "i") },
                              { "middle_name": new RegExp(req.query.search_term, "i") },
                              { "last_name": new RegExp(req.query.search_term, "i") },
                              {
                                "$expr": {
                                  "$regexMatch": {
                                    "input": { "$concat": ["$first_name", " ", "$last_name"] },
                                    "regex": req.query.search_term,
                                    "options": "i"
                                  }
                                }
                              },
                              {
                                "$expr": {
                                  "$regexMatch": {
                                    "input": { "$concat": ["$first_name", " ", "$middle_name", " ", "$last_name"] },
                                    "regex": req.query.search_term,
                                    "options": "i"
                                  }
                                }
                              },
                              { "company_name": new RegExp(req.query.search_term, "i") },
                              { "email": new RegExp(req.query.search_term, "i") }
                            ],
                            // "is_verified": true,
                            // "admin_verification": true,
                            // "deactivate": false,
                            // "is_blocked": false,
                            // }]
                          }
                        },
                        { "$skip": skip },
                        { "$limit": parseInt(req.query.limit) },
                        {
                          "$project": {
                            "verification_token": 0,
                            "salt": 0,
                            "passwordHash": 0,
                            "google_token": 0,
                            "facebook_token": 0,
                          }
                        },
                      ],
                      "as": "user_data"
                    }
                  },
                  // { "$unwind": "$user_data" }
                ],
                "users_count": [
                  {
                    "$lookup": {
                      "from": "cl_user",
                      "pipeline": [
                        {
                          "$match": {
                            // $and: [ {
                            $or: [
                              { "first_name": new RegExp(req.query.search_term, "i") },
                              { "middle_name": new RegExp(req.query.search_term, "i") },
                              { "last_name": new RegExp(req.query.search_term, "i") },
                              {
                                "$expr": {
                                  "$regexMatch": {
                                    "input": { "$concat": ["$first_name", " ", "$last_name"] },
                                    "regex": req.query.search_term,
                                    "options": "i"
                                  }
                                }
                              },
                              {
                                "$expr": {
                                  "$regexMatch": {
                                    "input": { "$concat": ["$first_name", " ", "$middle_name", " ", "$last_name"] },
                                    "regex": req.query.search_term,
                                    "options": "i"
                                  }
                                }
                              },
                              { "company_name": new RegExp(req.query.search_term, "i") },
                              { "email": new RegExp(req.query.search_term, "i") }
                            ],
                            // "is_verified": true,
                            // "admin_verification": true,
                            // "deactivate": false,
                            // "is_blocked": false,
                            // }]
                          }
                        },
                        { "$count": "users" }
                      ],
                      "as": "users_count"
                    }
                  },
                  { "$unwind": "$users_count" },
                ],
                "programs": [
                  {
                    "$lookup": {
                      "from": "cl_program",
                      "pipeline": [
                        {
                          "$match": {
                            $or: [
                              { "name": new RegExp(req.query.search_term, "i") },
                              { "problem": new RegExp(req.query.search_term, "i") },
                              { "goal": new RegExp(req.query.search_term, "i") },
                              { "approach": new RegExp(req.query.search_term, "i") },
                              { "category": new RegExp(req.query.search_term, "i") },
                              { "sub_category": new RegExp(req.query.search_term, "i") },
                              { "status": new RegExp(req.query.search_term, "i") },
                            ]
                          }
                        },
                        { "$skip": skip },
                        { "$limit": parseInt(req.query.limit) },
                      ],
                      "as": "program_data"
                    }
                  },
                  // { "$unwind": "$program_data" }
                ],
                "programs_count": [
                  {
                    "$lookup": {
                      "from": "cl_program",
                      "pipeline": [
                        {
                          "$match": {
                            $or: [
                              { "name": new RegExp(req.query.search_term, "i") },
                              { "problem": new RegExp(req.query.search_term, "i") },
                              { "goal": new RegExp(req.query.search_term, "i") },
                              { "approach": new RegExp(req.query.search_term, "i") },
                              { "category": new RegExp(req.query.search_term, "i") },
                              { "sub_category": new RegExp(req.query.search_term, "i") },
                              { "status": new RegExp(req.query.search_term, "i") },
                            ]
                          }
                        },
                        { "$count": "programs" },
                      ],
                      "as": "programs_count"
                    }
                  },
                  { "$unwind": "$programs_count" }
                ],
                "collaborations": [
                  {
                    "$lookup": {
                      "from": "cl_collaboration",
                      "pipeline": [
                        {
                          "$match": {
                            $or: [
                              { "name": new RegExp(req.query.search_term, "i") },
                              { "problem": new RegExp(req.query.search_term, "i") },
                              { "goal": new RegExp(req.query.search_term, "i") },
                              { "approach": new RegExp(req.query.search_term, "i") },
                              { "guiding_principle": new RegExp(req.query.search_term, "i") },
                              { "status": new RegExp(req.query.search_term, "i") },
                            ]
                          }
                        },
                        { "$skip": skip },
                        { "$limit": parseInt(req.query.limit) },
                      ],
                      "as": "collaboration_data"
                    },
                  },
                  // { "$unwind": "$collaboration_data" }
                ],
                "collaborations_count": [
                  {
                    "$lookup": {
                      "from": "cl_collaboration",
                      "pipeline": [
                        {
                          "$match": {
                            $or: [
                              { "name": new RegExp(req.query.search_term, "i") },
                              { "problem": new RegExp(req.query.search_term, "i") },
                              { "goal": new RegExp(req.query.search_term, "i") },
                              { "approach": new RegExp(req.query.search_term, "i") },
                              { "guiding_principle": new RegExp(req.query.search_term, "i") },
                              { "status": new RegExp(req.query.search_term, "i") },
                            ]
                          }
                        },
                        { "$count": "collaborations" },
                      ],
                      "as": "collaborations_count"
                    },
                  },
                  { "$unwind": "$collaborations_count" }
                ]
              }
            },
            {
              "$project": {
                "_id": 0
              }
            },
            {
              $group:
              {
                _id: "$_id",
                users: { $first: "$users.user_data" },
                users_count: { $first: "$users_count.users_count.users" },
                programs: { $first: "$programs.program_data" },
                programs_count: { $first: "$programs_count.programs_count.programs" },
                collaborations: { $first: "$collaborations.collaboration_data" },
                collaborations_count: { $first: "$collaborations_count.collaborations_count.collaborations" },
              }
            },
            { "$unwind": "$users" },
            { "$unwind": "$programs" },
            { "$unwind": "$collaborations" }
          ]
        )
        .toArray()
      )
      .then(data => {

        return data;
        // return {
        //   meta: {
        //     "total": parseInt(numOfUsers),
        //     "per_page": parseInt(req.body.limit || numOfUsers),
        //     "current_page": parseInt(req.body.page) || 0
        //   },
        //   data: data
        // };
      });
  }

  deleteProfile(id, unset_items) {
      return this.dbClient
        .then(db => db
          .collection(this.collection)
          .updateOne({ _id: ObjectID(id) },{ $set: unset_items }, { upsert: false }))
          .then(()=> {
            this.dbClient
              .then(db => db
                .collection(this.collection)
                .createIndex({ "deleted_at": 1 }, { expireAfterSeconds: 7776000 })
              );
          });
  }

  deleteUser(req) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .remove({ _id: ObjectID(req._id) }));
  }

  listFiltered(filter) {
    filter.query = {};

    if (filter.filterByfirstName) {
      filter.query.firstName = { $regex: filter.filterByfirstName, $options: '-i' };
    }
    if (filter.filterBylastName) {
      filter.query.lastName = { $regex: filter.filterBylastName, $options: '-i' };
    }
    if (filter.filterByuserName) {
      filter.query.fullName = { $regex: filter.filterByuserName, $options: '-i' };
    }
    if (filter.filterByemail) {
      filter.query.email = { $regex: filter.filterByemail, $options: '-i' };
    }
    return super.listFiltered(filter);
  }

  getCount(req) {
    var match_cond = {}
    if (req.body.user_type) match_cond = { user_type: req.body.user_type };
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .countDocuments({$and: [{ is_verified: true, admin_verification: true }, { $or: [{ deleted_at: { $exists: false }, deleted_at: null, deleted_at: undefined }] }, match_cond]}));
  }
}

module.exports = UserRepository;
