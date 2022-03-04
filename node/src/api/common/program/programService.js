const ProgramRepository = require('./programRepository');
const UserService = require('../user/userService');
const userService = new UserService();
const { ObjectID } = require('mongodb');
const ProgramResourceRepository = require('../programResource/programResourceRepository');
// const user_types = require('config').get('user_types');
const user_types = process.env.USER_TYPES;

class ProgramService {
  constructor() {
    this.repository = new ProgramRepository();
    this.programResourceRepository = new ProgramResourceRepository();
  }

  // get all programs
  list(req) {
    return this.repository.getAllPrograms(req);
  }

  // get count
  getCount() {
    return this.repository.getCount();
  }

  // get program by id
  findById(id) {
    return this.repository.findById(id)
      .then(program => program);
  }

  // save program
  async saveProgram(program, user_id) {
    var user_data = await userService.findById(user_id);
    if (user_data.length == 0) throw new Error('Current user does not exist');
    if (user_data[0].user_type.trim().toLowerCase() !== 'non_profit') throw new Error('Access Denied');

    var newProgram = {
      name: program.name,
      user_id: new ObjectID(user_id),
      profile_img: program.profile_img,
      // category: new ObjectID(program.category),
      // sub_category: new ObjectID(program.sub_category),
      category: program.category,
      sub_category: program.sub_category,
      problem: program.problem,
      goal: program.goal,
      approach: program.approach,
      area_served: program.area_served,
      program_fund_amt: program.program_fund_amt,
      program_fund: program.program_fund,
      status: program.status,
      start_date: new Date(program.start_date),
      end_date: program.end_date ? new Date(program.end_date) : null,
      created_at: new Date(),
      updated_at: null
    };
    return this.repository.add(newProgram)
      .then(data => {
        var newProgramResource = {
          money: 0,
          time: 0,
          products: "",
          address : "",
          program_id: new ObjectID(data.ops[0]._id),
          user_id: new ObjectID(user_id),
          created_at: new Date(),
          updated_at: null
        };
        return this.programResourceRepository.add(newProgramResource);
      });
  }

  addMany(programs) {
    return this.repository.addMany(programs);
  }

  // edit program profile basic info
  async editProgramProfile(user_id, program) {
    var data = {};
    var current_program = await this.findById(program.id);
    if (current_program.length === 0) throw new Error('Program does not exist')
    if (current_program[0].status.trim().toLowerCase() === 'retired') throw new Error('Program is already retired! You can not update the retired program.')
    var current_user = await userService.findById(user_id);
    if (current_user.length > 0) {
      if (current_user[0].user_type.trim().toLowerCase() === 'non_profit' && current_program[0].user_id == user_id) {
        data = {
          name: program.name,
          // category: new ObjectID(program.category),
          // sub_category: new ObjectID(program.sub_category),
          category: program.category,
          sub_category: program.sub_category,
          problem: program.problem,
          goal: program.goal,
          approach: program.approach,
          area_served: program.area_served,
          program_fund_amt: program.program_fund_amt,
          program_fund: program.program_fund,
          status: program.status,
          start_date: new Date(program.start_date),
          end_date: program.end_date ? new Date(program.end_date) : null,
          updated_at: new Date()
        };
      } else {
        throw new Error('Access denied');
      }
      return this.repository.edit(program.id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  // edit program image
  async editProfileImg(user_id, program) {
    var data = {};
    var current_program = await this.findById(program.id);
    if (current_program.length === 0) throw new Error('Program does not exist')
    if (current_program[0].status.trim().toLowerCase() === 'retired') throw new Error('Program is already retired! You can not update the retired program.')

    var current_user = await userService.findById(user_id);
    if (current_user.length > 0) {
      if (current_user[0].user_type.trim().toLowerCase() === 'non_profit' && current_program[0].user_id == user_id) {
        data = {
          profile_img: program.profile_img,
          updated_at: new Date()
        };
      } else {
        throw new Error('Access denied');
      }
      return this.repository.edit(program.id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  // edit program status
  async editStatus(user_id, program) {
    var data = {};
    var current_program = await this.findById(program.id);
    if (current_program.length === 0) throw new Error('Program does not exist')

    var current_user = await userService.findById(user_id);
    if (current_user.length > 0) {
      if (current_user[0].user_type.trim().toLowerCase() === 'non_profit' && current_program[0].user_id == user_id) {
        data = {
          status: program.status,
          updated_at: new Date()
        };
      } else {
        throw new Error('Access denied');
      }
      return this.repository.edit(program.id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  // delete program
  async deleteProgram(user_id, program_id) {
    var data = {};
    var current_program = await this.findById(program_id);
    if (current_program.length === 0) throw new Error('Program does not exist')

    var current_user = await userService.findById(user_id);
    if (current_user.length > 0) {
      if (current_user[0].user_type.trim().toLowerCase() === 'non_profit' && current_program[0].user_id == user_id) {
        data = {
          name: current_program[0].name + '_' +  new Date().getTime(),
          updated_at: new Date(),
          deleted_at: new Date()
        };
      } else {
        throw new Error('Access denied');
      }
      return this.repository.edit(program_id, data)
    } else {
      throw new Error('Current user does not exist');
    }
  }

  // follow program
  async followProgram(current_user_id, program_id) {
    const current_user = await userService.findById(current_user_id);
    const program_data = await this.findById(program_id);

    if (current_user.length <= 0) throw new Error('Current user does not exist');
    if (!(user_types).includes(current_user[0].user_type.trim().toLowerCase())) throw new Error('Access denied');
    if (program_data.length <= 0) throw new Error('Selected program does not exist');
    if (program_data[0].deleted_at) throw new Error('Selected program does not exist');

    return this.repository.followProgram(current_user_id, program_id)
      .then(user => user);
  }

  // unfollow program
  async unfollowProgram(current_user_id, program_id) {
    const current_user = await userService.findById(current_user_id);
    const program_data = await this.findById(program_id);

    if (current_user.length <= 0) throw new Error('Current user does not exist');
    if (program_data.length <= 0) throw new Error('Selected program does not exist');
    if (program_data[0].deleted_at) throw new Error('Selected program does not exist');

    return this.repository.unfollowProgram(current_user_id, program_id)
      .then(user => user);
  }

  // get all programs followed by current user
  async getFollowedPrograms(req) {
    const current_user = await userService.findById(req.user.id);
    if (current_user.length <= 0) throw new Error('Current user does not exist');

    return this.repository.getFollowedPrograms(req)
      .then(user => user);
  }

}

module.exports = ProgramService;
