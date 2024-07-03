const user = require("../model/user");
const OTP = require('../model/otpSchema');
const bcrypt = require("bcrypt");
const category = require("../model/categorySchema");
const products = require('../model/productSchema');
const wishlist = require('../model/wishlistSchema');
const sendOTP = require('../controller/otpcontroller');
const helpers = require('../controller/helpers');
const crypto = require('crypto')
const { ObjectId } = require("mongodb");
const { error } = require("console");
const product = require("../model/productSchema");


// const toGuestPageGet = async (req, res) => {
//   try {
//     const categoryData = await category.find({status: true});
//     const productData = await products.find({status: true}).limit(4);
//     res.render("./user/homePage", {UsercategoryData, productData, title: "userhome" });
//   } catch (error) {
//     console.log(error);
//   }
// };

const toLoginPageGet = (req, res) => {
  try {
   if(req.session.userlogged){
   res.redirect('/')
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


// Google authentication functions

// random password for creating new user with google

function generateRandomPassword(length) {
  return crypto.randomBytes(length).toString('hex');
}

const successGoogleLogin = async (req, res) => {
  try {

    if (!req.user) {
      return res.redirect('/failure');
    }
    // console.log(req.user);
    const googleEmail = req.user.email;


    const existUser = await user.findOne({ email: googleEmail });
    if (!existUser) {
      const randomPassword = generateRandomPassword(8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10); // Hash the password

      const newUser = await new user({
        name: req.user.displayName,
        email: req.user.email,
        mobile: '',
        password: hashedPassword // Save the hashed password
      }).save();
      
      req.session.name = req.user.displayName;
      req.session.email = req.user.email;
      req.session.userId = newUser._id;
      req.session.userlogged = true;
      res.redirect('/');
    } else {
      const googleEmail = req.user.email
      const isUser = await user.findOne({ email: googleEmail })
      if (isUser) {
        req.session.name = req.user.displayName;
        req.session.email = req.user.email;
        req.session.userId = isUser._id
        req.session.userlogged = true;
        res.redirect('/');
      }
    }
  } catch (error) {
    console.error('Error during Google login:', error);
    res.redirect('/failure');
  }
}


const failureGoogleLogin = (req, res) => {
  console.log('failureeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
  res.send('Error')
}






// User home page get

const homePageGet = async (req, res) => {
  try {
    
    const User  = await user.findOne({ email: req.session.email } )
    const cartCount = await helpers.getCartCount(req.session.email)

    const categoryData = await category.find({status: true});
    const productData = await products.find({status: true});

    res.render("./user/homePage",{User, cartCount, productData, categoryData, title: "home"});
  } catch (error) {
    console.log(error);
  }
};

const toSignupPost = async (req, res) => {
  try {
    const { username, email, mobile, password } = req.body;
    const existUser = await user.findOne({ email: email });

    if (existUser) {
      req.flash('block_message', 'User already exist. please login')
       return res.redirect("/userlogin");
    }

    const saltround = 10;
    const hashpass = await bcrypt.hash(password, saltround);

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

    req.session.data = userData;
    req.session.username = req.body.name;
    req.session.email = req.body.email;
    req.session.signOtp = true;
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
      const otp = await OTP.findOne({ email: data.email });
      if(Date.now() > otp.expireAt) {
        await OTP.deleteOne({email})
      }else{
        const hashedOtp = otp.otp
        const userEnteredOtp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
        const compareOtp = await bcrypt.compare(userEnteredOtp, hashedOtp);
        req.session.email = data.email;
        if(compareOtp) {
          const newUser = await new user({
            name: data.username,
            email: data.email,
            mobile: data.mobile,
            password: data.password
          }).save()
          
          req.session.userlogged = true;
          req.session.userId = newUser._id
          req.session.signOtp = false;

          res.redirect('/')
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

      if (Date.now() > otp.expireAt) {
        await OTP.deleteOne({ email })
      } else {
        const hashedOtp = otp.otp;
        const userEnteredOtp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;

        const compareOtp = await bcrypt.compare(userEnteredOtp, hashedOtp);

        if (compareOtp) {
          req.session.forget = false;
          const message = req.flash('success');
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


    if (checkEmail) {

      const userData = {
        email: checkEmail.email,
        username: checkEmail.name,
        _id: checkEmail._id
      }

      const email = req.body.email
      req.session.data = userData;
      req.session.email = email;
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
    const confirmPassword = req.body.confirmPassword;
    
    if (password === confirmPassword) {
      const hashedpassword = await bcrypt.hash(req.body.password, 10);
      const email = req.session.email;
      const updatePassword = await user.updateOne({ email}, {$set: {password: hashedpassword }});
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
      const passmatch = await bcrypt.compare(password, isUser.password);
      if (passmatch) {
        if (isUser.status == true) {
          req.session.email = req.body.email;
          req.session.userId = isUser._id
          req.session.userlogged = true;

          res.redirect("/");
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
    req.session.destroy((error) => {
      if (error) {
        console.log(error);
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
    const User = await user.findOne({ email: req.session.email })
    const cartCount = await helpers.getCartCount(req.session.email)
    const allProducts = await products.find({ status: true })
    const productCategory = await products.distinct('category')
    const productBrand = await products.distinct('brand')

    res.render('./user/viewallProducts',{User, cartCount, allProducts, productCategory, productBrand, title: 'all products'})
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}







// get method for product details page


const productDetails = async (req,res) => {

  try {
    const User  = await user.findOne({ email: req.session.email } )
    const cartCount = await helpers.getCartCount(req.session.email);
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).render('user/404')
  }
    const productDetailsData = await products.findOne({ _id: id })

    res.render('./user/productdetails',{User, cartCount, productDetailsData, title: 'productDetails'})

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
    const User = await user.findOne({ email })

    if (!User || User === null) {
      res.redirect("/userlogin")
    }

    const cartCount = await helpers.getCartCount(req.session.email)

    res.render('./user/userProfile',{title: 'my-profile', User, cartCount })
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
    const User = await user.findOne({ email: req.session.email });
    const cartCount = await helpers.getCartCount(req.session.email);
    const addressErrorMessage = req.flash('maxAddressError')
    res.render('./user/manageAddress', { title: 'userAddress', User, cartCount, addressErrorMessage })
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}





// post method for user new address add

const addNewAddress = async (req, res) => {
  try {
      const { name, address, city, state, pincode, phone } = req.body;
      let email = req.session.email;

      const addressData = {
          name,
          address,
          city,
          state,
          pincode,
          phone
      }

      const User = await user.findOne({ email });
      if (!User) {
          return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (User.address.length >= 3) {
          req.flash('success', "Max Address limit reached!!! please delete existing address to add more");
          res.redirect('/checkout');
      } else {
        User.address.push(addressData);
          await User.save();
  
          res.redirect('/checkout');
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

      const email = req.session.email;

      const userFind = await user.findOne({ email });

      if (!userFind) {
          return res.status(404).json({ message: "No user found" })
      }

      const deleteAddress = await user.updateOne({ email },
          {
              $pull: { 'address': {_id: addressId }}
          });

          res.status(200).json({ success: true, message: "Address deleted successfully"})
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}








// post method for user Add address add

const addAddress = async (req, res) => {
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

      const userData = await user.findOne({ email })
      if (userData.address.length >= 3) {
          req.flash('maxAddressError', "Max Address limit reached!!! please delete existing address to add more");
          res.redirect('/manageAddress')
      } else {
        userData.address.push(addressData);
          await userData.save();
 
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

    const addressData = {
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      phone: req.body.phone
    }


    const email = req.session.email;
    const userData = await user.findOne({ email })

    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const addressToUpdata = userData.address.id(addressId)
    if (!addressToUpdata) {
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

    const imageData = req.file; // Use req.file instead of req.body.imageData


    // Check if imageData is valid
    if (imageData) {
      const updatedProfile = await user.findOneAndUpdate(
        { email: req.session.email },
        { profilePhoto: req.file },
        { new: true }
      )

      if (updatedProfile) {
        const userData = await user.findOne({ email: req.session.email })

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




// get method for user wallet history

const getWallet = async (req, res) => {
  try {
    const User = await user.findOne({ email: req.session.email });
    if (!User) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.render('./user/wallet', {title: "user-wallet", User})
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

  try {
    const { priceLowToHigh, priceHighToLow, category, brand } = req.body;

      const allProducts = await products.find();
      let filteredProducts = [...allProducts];

      // Filter by price
      if (priceLowToHigh) {

        filteredProducts.sort((a,b) => a.price - b.price);
      } else if (priceHighToLow) {

        filteredProducts.sort((a,b) => b.price - a.price);
      }

      // Filter by category
      if (category && category !== 'ALL') {

        filteredProducts = filteredProducts.filter(product => product.category === category);
      }

      // Filter by brand
      if (brand && brand !== 'ALL') {

        filteredProducts = filteredProducts.filter(product => product.brand === brand);
      }

      res.json({ success: true, data: filteredProducts });


  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}


// get method for wishlist page

const getWishlist = async (req, res) => {
  try {
    const User = await user.findOne({ email: req.session.email })
    const cartCount = await helpers.getCartCount(req.session.email)
    const userId = User._id;
    // console.log(userId,'uuuuuuuuuuuiiiiiiiiiiiii');
    const wishlistDatas = await wishlist.find({ userId }).populate('productId')
    // console.log(wishlistDatas,'wwwwwwwwwwwwwwwwddddddddddddddddddd');
    let productData = [];
    for (const i of wishlistDatas) {
      const product = await products.findById(i.productId);
      if (product) {
        productData.push(product)
      }
    }
    // console.log(productData,'pppppppppppddddddddddddddddd');
    
    res.render('./user/wishlist', { title: 'wishlist', productData, User, cartCount})
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}


// post method for add wishlist

const addWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;

    // Find the user by their email in the session
    const User = await user.findOne({ email: req.session.email });
    if (!User) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = User._id;

    // Find the product by its ID
    let productData = await product.findById(productId);
    if (!productData) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if the product already exists in the wishlist
    const existWishlistData = await wishlist.findOne({ userId, productId });
    // console.log(existWishlistData, 'eeeeeeeeexxxxxxxxxxxxxxxxxxxxiiiiiiiiiiiiiii');
    if (existWishlistData) {
      // If the product is already in the wishlist, remove it
      // await wishlist.deleteOne({ userId, productId });
      // console.log('Product removed from the wishlist');
      // return res.json({ success: true, message: 'Removed from your Wishlist', action: 'removed' });
      return res.json({ success: false, message: 'Product already exist'});
    } else {
      // If the product is not in the wishlist, add it
      const wishlistItem = new wishlist({
        userId,
        productId: productData._id
      });
      await wishlistItem.save();
      // console.log('Wishlist item created', wishlistItem);
      return res.json({ success: true, message: 'Added to your Wishlist', action: 'added' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};



// post method for remove product from wishlist

const removeFromWishlist = async (req, res) => {
  try {

    const productId = req.params.id
    // console.log(productId,'iiiiiiiiiiiiii');
    const userId = req.session.userId;
    // console.log(userId,'uuuuuuuuuuuuuuuuuuuuuuuu');
    await wishlist.findOneAndDelete({ userId, productId })

    res.status(200).json({ success: true, message: 'Product removed from wishlist' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}


























module.exports = {
  toLoginPageGet,
  toSignUpPageGet,
  successGoogleLogin,
  failureGoogleLogin,
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
  getWallet,
  searchProducts,
  filterProducts,
  getWishlist,
  addWishlist,
  removeFromWishlist
};
