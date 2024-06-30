const dbConnection = require("../config/connection");
const session = require("express-session");
const user = require("../model/user");

const credential = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
};

// get method for admin login page

const adminLoginPageGet = (req, res) => {
  try {
    res.render("./admin/adminloginpage", { title: "adminLogin" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// post method for admin login

const adminLoginPost = (req, res) => {
  try {
    const { email, password } = req.body;
    if (credential.email === email && credential.password === password) {
      req.session.email = req.body.email;
      req.session.adminlogged = true;
      res.redirect("/admin/dashboard");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//get method for admin dashboard

const adminDashboard = (req, res) => {
  try {
    res.render("./admin/admindashboard", { title: "adminhome" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// list the users who signed Up

const userManagement = async (req, res) => {
  try {
    let i = 0;
    const userData = await user.find();

    res.render("./admin/usermanagement", {
      title: "usermanagement",
      userData,
      i,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Blocking users

const blockUser = async (req, res) => {
  try {
    const id = req.params.id;

    const block = await user.updateOne(
      { _id: id },
      { $set: { status: false } }
    );

    res.redirect("/admin/userList");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Unblocking users

const unblockUser = async (req, res) => {
  try {
    const id = req.params.id;

    const unblock = await user.updateOne(
      { _id: id },
      { $set: { status: true } }
    );
    res.redirect("/admin/userList");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// post method for admin logout

const adminLogoutPost = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  adminLoginPageGet,
  adminLoginPost,
  adminDashboard,
  userManagement,
  blockUser,
  unblockUser,
  adminLogoutPost,
};
