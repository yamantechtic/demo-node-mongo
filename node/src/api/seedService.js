const { ObjectID } = require('mongodb');
const cipher = require('./common/auth/cipherHelper');
const logger = require('../utils/logger');
const fs = require('fs');

const AdminUserService = require('./common/adminUser/adminUserService');
const RoleService = require('./common/role/roleService');
const BlogCategoryService = require('./common/blogCategory/blogCategoryService');
const AdminSettingsService = require('./common/adminSettings/adminSettingsService');
const PageService = require('./common/page/pageService');
const TemplateService = require('./common/template/templateService');

adminUserService = new AdminUserService();
roleService = new RoleService();
blogCategoryService = new BlogCategoryService();
adminSettingsService = new AdminSettingsService();
pageService = new PageService();
templateService = new TemplateService();

var roleToAdd = [], usersToAdd = [], blogCategoryToAdd = [], settingsToAdd = [];

class SeedService {
  checkAndSeed() {
    logger.info('Seed Data')
    roleService.getCount()
      .then(count => {
        // console.log(count);
        if (!count) {
          this.seedRoles().then();
        }
      });

    adminUserService.getCount()
      .then(count => {
        // console.log(count);
        if (!count) {
          this.seedUsers().then();
        }
      });

    blogCategoryService.getCount()
      .then(count => {
        // console.log(count);
        if (!count) {
          this.seedBlogCategory().then();
        }
      });

    adminSettingsService.getCount()
      .then(count => {
        // console.log(count);
        if (!count) {
          this.seedAdminSettings().then();
        }
      });

    pageService.getCount()
      .then(count => {
        // console.log(count);
        if (!count) {
          this.seedPage().then();
        }
      });

    templateService.getCount()
      .then(count => {
        // console.log(count);
        if (!count) {
          this.seedTemplates().then();
        }
      });
  }

  // seed
  async seedRoles() {
    try {
      logger.info('Seed Data');
      await this.addRandomRole();
      logger.info('Seed Role Done');
    } catch (err) {
      logger.error(err);
    }
  }

  async seedUsers() {
    try {
      logger.info('Seed Data');
      await this.addRandomUsers();
      logger.info('Seed Users Done');
    } catch (err) {
      logger.error(err);
    }
  }

  async seedBlogCategory() {
    try {
      logger.info('Seed Data');
      await this.addRandomBlogCategory();
      logger.info('Seed Blog Category Done');
    } catch (err) {
      logger.error(err);
    }
  }

  async seedAdminSettings() {
    try {
      logger.info('Seed Data');
      await this.addAdminSettings();
      logger.info('Seed Admin Settings Done');
    } catch (err) {
      logger.error(err);
    }
  }

  async seedPage() {
    try {
      logger.info('Seed Data');
      await this.addPage();
      logger.info('Seed page Done');
    } catch (err) {
      logger.error("err=>", err);
    }
  }

  async seedTemplates() {
    try {
      logger.info('Seed Data');
      await this.addTemplates();
      logger.info('Seed template Done');
    } catch (err) {
      logger.error("err=>", err);
    }
  }

  // add
  addRandomUsers() {
    const hash = cipher.saltHashPassword(`admin`);
    const newUser = {
      _id: ObjectID(),
      role_id: roleToAdd[0]._id,
      first_name: "Admin",
      last_name: "Admin",
      email: "admin@admin.com",
      phone: "9999999999",
      profile_img: null,
      salt: hash.salt,
      passwordHash: hash.passwordHash,
      created_at: new Date()
    };
    usersToAdd.push(newUser);
    return adminUserService.addMany(usersToAdd);
  }

  addRandomRole() {
    const newRole = {
      _id: ObjectID(),
      name: "admin",
      frontend_user: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      backend_user: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      role: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      program: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      collaboration: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      donation: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      blog_category: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      blog: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      settings: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      page: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      template: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      subscription_plan: {
        "read": true,
        "create": true,
        "update": true,
        "delete": true
      },
      created_at: new Date()
    };

    roleToAdd.push(newRole);

    return roleService.addMany(roleToAdd);
  }

  addRandomBlogCategory() {
    const newBlogCategory = {
      _id: ObjectID(),
      name: "unassigned",
      created_at: new Date()
    };
    blogCategoryToAdd.push(newBlogCategory);
    return blogCategoryService.addMany(blogCategoryToAdd);
  }

  addAdminSettings() {
    const newSettings = {
      payment_fees: 0,
      created_at: new Date()
    };
    settingsToAdd.push(newSettings);
    return adminSettingsService.addMany(settingsToAdd);
  }

  addPage() {
    const newPage = fs.readFileSync(__dirname + '/data/page.json', 'utf-8');
    return pageService.addMany(JSON.parse(newPage));
  }

  addTemplates() {
    const newTemplates = fs.readFileSync(__dirname + '/data/templates.json', 'utf-8');
    return templateService.addMany(JSON.parse(newTemplates));
  }
}


module.exports = SeedService;
