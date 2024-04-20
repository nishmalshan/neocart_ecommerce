const { name } = require("ejs");
const dbConnection = require("../config/connection");
const user = require("../model/user");
const OTP = require('../model/otpSchema');
const bcrypt = require("bcrypt");
const session = require("express-session");
const category = require("../model/categorySchema");
const products = require('../model/productSchema');
const sendOTP = require('../controller/otpcontroller');
const helpers = require('../controller/helpers');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');


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
    const passwordMessage = req.flash('passwordUpdateMsg');
    const block_message = req.flash('block_message')
    res.render("./user/loginPage", {passwordMessage, block_message, title: "login" });
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
    const cartCount = await helpers.getCartCount(req.session.email)
    // console.log(cartCount,"cccccccccaaaaaaarrrrrrrrtttttttttt");
    const categoryData = await category.find({status: true});
    const productData = await products.find({status: true}).limit(4);
    // console.log(categoryData);
    res.render("./user/homePage",{cartCount, productData, categoryData, title: "home"});
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
       return res.redirect("/userlogin");
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
    if(req.session.signOtp || req.session.forget) {
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
    if (req.session.signOtp || req.session.forget) {
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
      const otp = await OTP.findOne({ email: data.email });
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
  } else if (req.session.forget) {
    try {
      const email = req.session.email;
      const data = req.session.data;

      const otp = await OTP.findOne({ email: data.email });
      console.log(otp,"oooooooooooooooooooooooootp");

      if (Date.now() > otp.expireAt) {
        await OTP.deleteOne({ email })
      } else {
        const hashedOtp = otp.otp;
        console.log(hashedOtp,"hhhhhhhhhhhhhhhhhhhhhhhhhhh");
        const userEnteredOtp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
        console.log(userEnteredOtp,"ueueeueueueueueueueueue");

        const compareOtp = await bcrypt.compare(userEnteredOtp, hashedOtp);

        if (compareOtp) {
          req.session.forget = false;
          const message = req.flash('success');
          console.log(message,'ffffffffffffffffffffffffffffff');
          res.render('./user/resetPassword', {message})
        } else {
          req.session.err = "Invalid OTP"
          console.log('Invalid OTP');
          res.render('./user/otp', {err: "Invalid OTP"})
        }

      }
    } catch (error) {
      console.error(error);
    }
  }
}





// get method for forget password

const toGetForgetPassword = (req, res) => {
  try {
    req.session.forget = true;
    const message = req.flash('success')
    res.render('./user/forgetPassword', {message})
  } catch (error) {
    console.error(error);
  }
}





// post method for forget password

const forgetPassword = async (req, res) => {
  try {
    const checkEmail = await user.findOne({ email: req.body.email});
    console.log(checkEmail,"ccccccccccccccccccccccccccc");

    if (checkEmail) {

      const userData = {
        email: checkEmail.email,
        username: checkEmail.name,
        _id: checkEmail._id
      }
      // console.log(userData,"UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU");
      const email = req.body.email
console.log(email,"eeeeeeeeeeeeeeeeeeee");
      req.session.data = userData;
      req.session.email = email;
      // console.log(req.session.data,"ddddddddddddddddddddddddddddd");
      // console.log(req.session.email,"eeeeeeeeeeeeeeeeeeeeeeeeeeee");
      res.redirect('/otpSending')

    } else {
      req.flash("success", "No user found with this email Address");
      res.redirect('/forgetPassword');
    }
  } catch (error) {
    console.error(error);
  }
}





// post method for reset password

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    console.log(req.body.password);
    const confirmPassword = req.body.confirmPassword;
    console.log(password,"password");
    console.log(confirmPassword,"confirm password");
    
    if (password === confirmPassword) {
      const hashedpassword = await bcrypt.hash(req.body.password, 10);
      console.log(hashedpassword, "hashed password");
      const email = req.session.email;
      const updatePassword = await user.updateOne({ email}, {$set: {password: hashedpassword }});
      console.log(updatePassword, "updated");
      req.flash('passwordUpdateMsg', "Password updated successfully")
      res.redirect('/userlogin')
    } else {
      res.render('./user/resetPassword', {message: "New password and confirm password does not match"});
    }
  } catch (error) {
    console.error(error);
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
          res.redirect("/userlogin");
        }
      } else {
        req.flash('block_message', 'Invalid password')
        res.redirect("/userlogin");
      }
    } else {
      req.flash('block_message', 'User not found')
      res.redirect("/userlogin");
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
        res.redirect("/");
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
    const cartCount = await helpers.getCartCount(req.session.email)
    const allProducts = await products.find({ status: true })
    const productCategory = await products.distinct('category')
    const productBrand = await products.distinct('brand')
    // console.log(productCategory,'pppppppppppppppppppppppppppppppppp');
    // console.log(allProducts,"aaaaaaaaaaaaaaaaaaaaaaa");
    res.render('./user/viewallProducts',{cartCount, allProducts, productCategory, productBrand, title: 'all products'})
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}







// get method for product details page


const productDetails = async (req,res) => {

  try {
    const cartCount = await helpers.getCartCount(req.session.email);
    const id = req.params.id;
    const productDetailsData = await products.findOne({ _id: id})
    // console.log(productDetailsData,"dddddddddddd");
    res.render('./user/productdetails',{cartCount, productDetailsData, title: 'productDetails'})

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}







// <-------------------------------------------------- User profile---------------------------------------------------------->



// get method for userprofile

const getUserProfile = async (req, res) => {
  try {
    const email = req.session.email
    const userData = await user.findOne({ email })
    // console.log(userData,"uuuuuuuuuuuuuuuuuuuuuuu");

    const cartCount = await helpers.getCartCount(req.session.email)

    res.render('./user/userProfile',{title: 'my-profile', cartCount, userData })
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}




// put method for update user name

const updateUserName = async (req, res) => {
  try {
    const email = req.session.email;
    const userData = await user.findOne({ email })
    const userId = userData._id;
    const {newName} = req.body;
    console.log(newName,"nnnnnnnnnnnnnnnnnnnnnnnnnnnn");
    if (newName) {
      const updateName = await user.findByIdAndUpdate(userId, { name: newName });
      updateName.save();
      res.status(200).json({ success: true, message: "User name updated successfully", updateName})
    }

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}






// get method for manage address page

const manageAddress = async (req, res) => {
  try {
    const addressData = await user.findOne({ email: req.session.email });
    const cartCount = await helpers.getCartCount(req.session.email);
    const addressErrorMessage = req.flash('maxAddressError')
    res.render('./user/manageAddress', { title: 'userAddress', addressData, cartCount, addressErrorMessage })
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}





// post method for user new address add

const addNewAddress = async (req, res) => {
  try {
      const  { name, address, city, state, pincode, phone } = req.body;
      let email = req.session.email;
      const addressData = {
          name,
          address,
          city,
          state,
          pincode,
          phone
      }

      const user = await user.findOne({ email })
      if (user.address.length >= 3) {
          req.flash('success', "Max Address limit reached!!! please delete existing address to add more");
          res.redirect('/checkout')
      } else {
          user.address.push(addressData);
          await user.save();
          console.log("address addred succesfulllllly");
          res.redirect('/checkout')
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}





// delete method for delete user address 

const deleteUserAddress = async (req, res) => {
  try {
      const addressId = req.params.addressId;
      console.log(addressId,"idididididididididididid");
      const email = req.session.email;
console.log(email,"eeeeeeeeeeeeeeeeeeeeeeeeeeee");
      const userFind = await user.findOne({ email });
      // console.log(userFind,"uuuuuuuuuuuuuuuuuuuuuuuuuuuu");
      if (!userFind) {
          return res.status(404).json({ message: "No user found" })
      }

      const deleteAddress = await user.updateOne({ email },
          {
              $pull: { 'address': {_id: addressId }}
          });
          console.log(deleteAddress,"ddddddddddddddddddddddddd");
          res.status(200).json({ success: true, message: "Address deleted successfully"})
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}








// post method for user Add address add

const addAddress = async (req, res) => {
  try {
    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
      const  { name, address, city, state, pincode, phone } = req.body;
      let email = req.session.email;
      const addressData = {
          name,
          address,
          city,
          state,
          pincode,
          phone
      }

      const userData = await user.findOne({ email })
      if (userData.address.length >= 3) {
          req.flash('maxAddressError', "Max Address limit reached!!! please delete existing address to add more");
          res.redirect('/manageAddress')
      } else {
        userData.address.push(addressData);
          await userData.save();
          console.log("address added succesfulllllly");
          res.redirect('/manageAddress')
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}



// post method for edit user address
const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    console.log(addressId,"idididididididididididid");
    const addressData = {
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      phone: req.body.phone
    }
    console.log(addressData,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

    const email = req.session.email;
    const userData = await user.findOne({ email })

    if (!userData) {
      console.log('User not found');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const addressToUpdata = userData.address.id(addressId)
    if (!addressToUpdata) {
      console.log('Address not found');
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    addressToUpdata.set(addressData)
    const savedUpdatedAddress = await userData.save()

    

    if (savedUpdatedAddress) {
      res.redirect('/manageAddress')
    } else {
      console.log('address not edited');
    }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}





// post method for edit user profile image


const editProfileImage = async (req, res) => {
  try {
    console.log('Request received to edit profile image');
    const imageData = req.file; // Use req.file instead of req.body.imageData
    console.log(imageData, 'iiiiiiiiiiiiiiiii');
    // const imageBuffer = fs.readFileSync(imageData.path);

    // Check if imageData is valid
    if (imageData) {
      const updatedProfile = await user.findOneAndUpdate(
        { email: req.session.email },
        { profilePhoto: req.file },
        { new: true }
      )

      if (updatedProfile) {
        const userData = await user.findOne({ email: req.session.email })
        // console.log(userData,'uuuuuuuuuuuuuuuuuuuuuuuuuuu');
        return res.json({ success: true, message: 'Profile image saved successfully' });
      } else {
        res.status(400).json({ error: "user not found" })
      }
    } else {
      throw new Error('No image data received');
    }
    

    // Send response
    res.json({ imageData });
  } catch (error) {
    console.error('Error editing profile image:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}






// patch method for user password change 



const changePassword = async (req, res) => {
  try {
    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    const email = req.session.email;

    const userData = await user.findOne({ email })
    
    if (userData) {
      const checkPassword = await bcrypt.compare(req.body.oldPassword, userData.password);

      if (checkPassword) {
        const hashedpassword = await bcrypt.hash(req.body.newPassword, 10);
        const updatePassword = await user.updateOne({email}, {$set:{password: hashedpassword}});
        return res.json({success: true, message: "Password updated successfully"})
      } else {
        return res.json({ success: false, error: "Old password is Wrong" })
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}





// get method for product search

const searchProducts = async (req, res) => {

  const query = req.query.q;

  try {

    const regex = new RegExp(query, 'i');
    const searchResult = await products.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { brand: {$regex: regex } },
        { category: {$regex: regex } }
      ]
    }).exec();

    res.json({ success: true, data: searchResult })
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}




// post method for filter products

const filterProducts = async (req, res) => {
  console.log('0000000000000000000000000000000000');
  try {
    const { priceLowToHigh, priceHighToLow, category, brand } = req.body;
    console.log(priceLowToHigh, priceHighToLow, category, brand);
    console.log('111111111111111111111111111111111');
      const allProducts = await products.find();
      let filteredProducts = [...allProducts];
      console.log('2222222222222222222222222222222');
      // Filter by price
      if (priceLowToHigh) {
        console.log('ltlltltltltltltltltltltltltltlt');
        filteredProducts.sort((a,b) => a.price - b.price);
      } else if (priceHighToLow) {
        console.log('hthththththththththththththt');
        filteredProducts.sort((a,b) => b.price - a.price);
      }

      // Filter by category
      if (category && category !== 'ALL') {
        console.log('cccccccccccccccccccccccccccccccccccccccc');
        filteredProducts = filteredProducts.filter(product => product.category === category);
      }

      // Filter by brand
      if (brand && brand !== 'ALL') {
        console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
        filteredProducts = filteredProducts.filter(product => product.brand === brand);
      }

      res.json({ success: true, data: filteredProducts });


  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
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
  otpConfirmation,
  toGetForgetPassword,
  forgetPassword,
  resetPassword,
  getUserProfile,
  updateUserName,
  manageAddress,
  addNewAddress,
  deleteUserAddress,
  addAddress,
  editAddress,
  editProfileImage,
  changePassword,
  searchProducts,
  filterProducts
};
