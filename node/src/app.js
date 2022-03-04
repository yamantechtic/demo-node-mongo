const express = require('express');
const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
var path = require('path');
const domain  = process.env.FRONTEND_URL;

require('./passport');

// common controllers
const authController = require('./api/common/auth/authController');
const noAuthController = require('./api/common/noAuth/noAuthController');
const userController = require('./api/common/user/userController');
const nonProfitCategoryController = require('./api/common/nonProfitCategory/nonProfitCategoryController');
const nonProfitSubCategoryController = require('./api/common/nonProfitSubCategory/nonProfitSubCategoryController');
const blockedUserController = require('./api/common/blockedUser/blockedUserController');
const profileRestrictionsController = require('./api/common/profileRestrictions/profileRestrictionsController');
const userFeedbackController = require('./api/common/userFeedback/userFeedbackController');
const programController = require('./api/common/program/programController');
const fileUploadController = require('./api/common/FileUpload/fileUploadController');
const countryController = require('./api/common/countryStateCity/countryController');
const codeController = require('./api/common/IRSActivityCode/codeController');
const roleController = require('./api/common/role/roleController');
const adminUserController = require('./api/common/adminUser/adminUserController');
const blogCategoryController = require('./api/common/blogCategory/blogCategoryController');
const blogController = require('./api/common/blog/blogController');
const postController = require('./api/common/post/postController');
const followedUserController = require('./api/common/followedUser/followedUserController');
const postCommentController = require('./api/common/postComment/postCommentController');
const postLikesController = require('./api/common/postLikes/postLikesController');
// const reportUserController = require('./api/common/reportUser/reportUserController');
// const collaborationManagementController = require('./api/common/collaborationManagement/managementController');
const committeeParticipantController = require('./api/common/collaborationCommitteeParticipant/committeeParticipantController');
const notificationController = require('./api/common/notification/notificationController');
const paymentController = require('./api/common/payment/paymentController');
const pageController = require('./api/common/page/pageController');
const templateController = require('./api/common/template/templateController');
const sponsorFeedController = require('./api/common/sponsorFeed/sponsorFeedController');

const SeedService = require('./api/seedService');
const seedService = new SeedService();

const app = express();
// const { port, root } = config.get('api');
const port = process.env.PORT;
const root = process.env.ROOT;

function logErrors(err, req, res, next) {
  logger.error(err);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send('Something went wrong.');
  } else {
    next(err);
  }
}

app.use(cors());
app.use(bodyParser.json());



const auth = passport.authenticate('jwt', { session: false });

// seed data in case of empty data base
seedService.checkAndSeed();

// routes for common controllers
app.use(`${root}/auth`, authController);
app.use(`${root}/noauth`, noAuthController);
app.use(`${root}/country`, countryController);
app.use(`${root}/irs`, codeController);
app.use(`${root}/file`, fileUploadController);
app.use(`${root}/users`, auth, userController);
app.use(`${root}/np-cat`, auth, nonProfitCategoryController);
app.use(`${root}/np-subcat`, auth, nonProfitSubCategoryController);
app.use(`${root}/blocked`, auth, blockedUserController);
app.use(`${root}/followed`, auth, followedUserController);
app.use(`${root}/restrictions`, auth, profileRestrictionsController);
app.use(`${root}/feedback`, auth, userFeedbackController);
app.use(`${root}/program`, auth, programController);
app.use(`${root}/role`, auth, roleController);
app.use(`${root}/admin`, auth, adminUserController);
app.use(`${root}/blog-cat`, auth, blogCategoryController);
app.use(`${root}/blogs`, auth, blogController);
app.use(`${root}/posts`, auth, postController);
app.use(`${root}/post-comment`, auth, postCommentController);
app.use(`${root}/post-like`, auth, postLikesController);
app.use(`${root}/collaboration-activity`, auth, collaborationActivityController);
app.use(`${root}/collaboration-management`, auth, committeeParticipantController);
app.use(`${root}/notification`, auth, notificationController);
app.use(`${root}/payment`, auth, paymentController);
app.use(`${root}/page`, auth, pageController);
app.use(`${root}/template`, auth, templateController);
app.use(`${root}/sponsor`, auth, sponsorFeedController);


app.use(express.static(path.join(__dirname, '../src')));

app.use(logErrors);
app.use(clientErrorHandler);

/*app.get('/', (req, res) => {
  res.send('Spreadbliss Backend!');
});*/

app.use('/admin', express.static(path.join(__dirname, '../admin/dist/fuse/')));

app.get('/admin/*',function(req,res){
  res.sendFile(path.join(__dirname, '../admin/dist/fuse/index.html'));
});

app.use('/', express.static(path.join(__dirname, '../frontend/spreadbliss-frontend/dist/spreadbliss-frontend/')));

app.get('/*',function(req,res){
  res.sendFile(path.join(__dirname, '../frontend/spreadbliss-frontend/dist/spreadbliss-frontend/index.html'));
});

var http = require('http').Server(app);
var io = require('socket.io')(http, {
  allowEIO3: true
},
  {
    cors: {
      origin: domain
    }
  });

io.on('connection', (socket) => {
  console.log("connected!");
  // frontend to frontend
  socket.on('f-to-f', function (data) {
    io.sockets.emit(data.receiver_id, data);
  });

  // frontend to admin
  socket.on('f-to-a', function (data) {
    io.sockets.emit("admin-panel", data);
  });

});

http.listen(`${port}`, () => {
    console.log(new Date())
});
// console.log(`Your port is ${process.env.PORT}`);
logger.info(`Server start listening port: ${port}`);
