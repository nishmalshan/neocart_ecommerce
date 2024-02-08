const express = require("express");

const user = express.Router()

const userController = require("../controller/userController");
const userAuthentication = require("../middleware/userAuth");

user.get('/',userAuthentication.existUser,userController.toGuestPageGet);
user.get('/userlogin',userController.toLoginPageGet);
user.post('/logintohome',userAuthentication.existUser,userController.toLoginPost);
user.post('/userlogout',userController.userLogOutPost);
user.get('/usersignup',userAuthentication.existUser,userController.toSignUpPageGet);
user.post('/register',userAuthentication.existUser,userController.toSignupPost);
user.get('/home',userAuthentication.verifyingUser,userController.homePageGet);





module.exports = user