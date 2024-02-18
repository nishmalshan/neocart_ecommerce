const { name } = require("ejs");
const dbConnection = require("../config/connection");
const user = require("../model/user");
const OTP = require('../model/otpSchema');
const bcrypt = require("bcrypt");
const session = require("express-session");
const category = require("../model/categorySchema");
const products = require('../model/productSchema');
const sendOTP = require('../controller/otpcontroller');



const toGuestPageGet = async (req, res) => {
  try {
    const categoryData = await category.find({status: true});
    const productData = await products.find({status: true}).limit(4);
    res.render("./user/guestuserpage", {categoryData, productData, title: "userhome" });
  } catch (error) {
    console.log(err);
  }
};

const toLoginPageGet = (req, res) => {
  try {
   if(req.session.userlogged){
   res.redirect('/home')
   }else{
    res.render("./user/loginPage", {block_message: req.flash('block_message'), title: "login" });
   }
  } catch (error) {
    console.log(error);
  }
};

const toSignUpPageGet = (req, res) => {
  try {
    res.render("./user/signupPage", { title: "signup" });
  } catch (error) {
    console.log(error);
  }
};

// User home page get

const homePageGet = async (req, res) => {
  try {
    const categoryData = await category.find({status: true});
    const productData = await products.find({status: true}).limit(4);
    // console.log(categoryData);
    res.render("./user/homePage",{productData, categoryData, title: "home"});
  } catch (error) {
    console.log(error);
  }
};

const toSignupPost = async (req, res) => {
  try {
    const { username, email, mobile, password } = req.body;
    const existUser = await user.findOne({ email: email });
    // console.log(username, email, mobile, password);
    if (existUser) {
      req.flash('block_message', 'User already exist. please login')
       return res.redirect("/userlogin?message=User already exist. please login");
    }

    const saltround = 10;
    const hashpass = await bcrypt.hash(password, saltround);
    // console.log(hashpass);
    // const newUser = new user({
    //   name: username,
    //   email: email,
    //   mobile: mobile,
    //   password: hashpass,
    // });
    // await newUser.save();
    let userData = {
      username: username,
      email: email,
      mobile: mobile,
      password: hashpass
    }
    // console.log(newUser,"nooooooooooooo");

    req.session.data = userData;
    req.session.username = req.body.name;
    req.session.email = req.body.email;
    req.session.signOtp = true;
    console.log(req.session.signOtp);
    res.redirect("/otpSending");

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};




// get method for otp page 

const toGetOtpPage = (req,res) => {
  try {
    if(req.session.signOtp) {
      res.render('./user/otp',{otpErrorMessage: req.flash('otpErrorMessage'),title: 'otp'})
    }else{
      res.redirect('/signup')
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}




const otpSending = async (req, res) => {
  try {
    if (req.session.signOtp) {
      try {
        const email = req.session.email
        const otpSending = await sendOTP(email)
        console.log(otpSending,"oooooooooooooooooooooooooooooooooooo");

        res.redirect('/otp')
      } catch (error) {
        console.log(error);
        req.session.err = "sorry can't send otp"
      }
    }
  } catch (error) {
    console.log(error);
  }
}






// post method for otp confirmation

const otpConfirmation = async (req,res) => {

  if (req.session.signOtp) {
    try {
      const data = req.session.data;
      console.log(data,"session data");
      const otp = await OTP.findOne({email: data.email});
      if(Date.now() > otp.expireAt) {
        await OTP.deleteOne({email})
      }else{
        const hashedOtp = otp.otp
        console.log("hashed otp",hashedOtp);
        const userEnteredOtp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
        console.log("user entered otp",userEnteredOtp);
        const compareOtp = await bcrypt.compare(userEnteredOtp, hashedOtp);
        console.log("compare otp",compareOtp);
        req.session.email = data.email;
        if(compareOtp) {
          const newUser = await new user({
            name: data.username,
            email: data.email,
            mobile: data.mobile,
            password: data.password
          }).save()
          
          console.log(newUser,"new user");
          req.session.userlogged = true;
          req.session.signOtp = false;
          res.redirect('/home')
        }else{
          req.session.err = "Invalid OTP"
          req.flash('otpErrorMessage','Invalid OTP')
          console.log("Invalid OTP");
          res.redirect('/otp')
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}


















// user login post

const toLoginPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const isUser = await user.findOne({ email });
    if (isUser) {
      // console.log(isUser,"AASSDFF");
      const passmatch = await bcrypt.compare(password, isUser.password);
      // console.log(passmatch,"abc");
      if (passmatch) {
        // console.log(passmatch,"abcfds");
        if (isUser.status == true) {
          req.session.email = req.body.email;
          req.session.userlogged = true;
          // console.log(req.session,"asaafdfda");

          res.redirect("/home");
        } else {
          req.flash('block_message', 'User is blocked')
          res.redirect("/userlogin?message=user is Blocked");
        }
      } else {
        req.flash('block_message', 'Invalid password')
        res.redirect("/userlogin?message=Invalid password");
      }
    } else {
      req.flash('block_message', 'User not found')
      res.redirect("/userlogin?message=User not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};




// User loguot post

const userLogOutPost = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/?message=success");
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};







// get method for view all products page get


const viewAllProducts = async (req,res) => {

  try {
    
    const allProducts = await products.find({ status: true })
    // console.log(allProducts,"aaaaaaaaaaaaaaaaaaaaaaa");
    res.render('./user/viewallProducts',{allProducts, title: 'all products'})
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}







// get method for product details page


const productDetails = async (req,res) => {

  try {
    
    const id = req.params.id;
    const productDetailsData = await products.findOne({ _id: id})
    // console.log(productDetailsData,"dddddddddddd");
    res.render('./user/productdetails',{productDetailsData, title: 'productDetails'})

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}

























module.exports = {
  toGuestPageGet,
  toLoginPageGet,
  toSignUpPageGet,
  toSignupPost,
  homePageGet,
  toLoginPost,
  userLogOutPost,
  viewAllProducts,
  productDetails,
  toGetOtpPage,
  otpSending,
  otpConfirmation
};
