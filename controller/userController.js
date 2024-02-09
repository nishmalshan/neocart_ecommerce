const { name } = require("ejs");
const dbConnection = require("../config/connection");
const user = require("../model/user");
const bcrypt = require("bcrypt");
const session = require("express-session");
const category = require("../model/categorySchema");
const products = require('../model/productSchema');



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
    res.render("./user/loginPage", { title: "login" });
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
    console.log(categoryData);
    res.render("./user/homePage",{productData, categoryData, title: "home"});
  } catch (error) {
    console.log(error);
  }
};

const toSignupPost = async (req, res) => {
  try {
    console.log(req.body);
    const { username, email, mobile, password } = req.body;
    const existUser = await user.findOne({ email: email });
    console.log(username, email, mobile, password);
    if (existUser) {
       return res.redirect("/userlogin?message=user Already exist");
    }

    const saltround = 10;
    console.log();
    const hashpass = await bcrypt.hash(password, saltround);
    console.log(hashpass);
    const newUser = new user({
      name: username,
      email: email,
      mobile: mobile,
      password: hashpass,
    });
    await newUser.save();
    console.log(newUser,"nooooooooooooo");

    req.session.email = req.body.email;
    req.session.userlogged = true;
    res.redirect("/home");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};




// user login post

const toLoginPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const isUser = await user.findOne({ email });
    if (isUser) {
      console.log(isUser,"AASSDFF");
      const passmatch = await bcrypt.compare(password, isUser.password);
      console.log(passmatch,"abc");
      if (passmatch) {
        console.log(passmatch,"abcfds");
        if (isUser.status == true) {
          req.session.email = req.body.email;
          req.session.userlogged = true;
          console.log(req.session,"asaafdfda");

          res.redirect("/home");
        } else {
          res.redirect("/userlogin?message=user is Blocked");
        }
      } else {
        res.redirect("/userlogin?message=Invalid password");
      }
    } else {
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
    console.log(allProducts,"aaaaaaaaaaaaaaaaaaaaaaa");
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
    console.log(productDetailsData,"dddddddddddd");
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
  productDetails
};
