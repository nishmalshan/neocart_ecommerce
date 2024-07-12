const dbConnection = require("../config/connection");
const session = require("express-session");
const user = require("../model/user");
const orders = require("../model/orderSchema");

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





// -------------------------------- Admin side order management ----------------------------- //



// get method for order management

const getOrderManagement = async (req, res) => {
  try {
    let i = 0;
    const orderedDetails = await orders.find().sort({ orderDate: -1 });
    res.render("./admin/ordermanage", {
      title: "order-management",
      orderedDetails,
      i,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// post method for update order status 

const updateUserOrderStatus = async (req, res) => {
  try {
    const newStatus = req.body.status;
    const orderId = req.params.orderId;
    // console.log(newStatus,'nnnnnnnnssssssssssss');
    // console.log(orderId,'ooooooooooiiiiiiiiiiiiiiiii');

    const updateStatus = await orders.findByIdAndUpdate(orderId, {
      status: newStatus,
    });

    if (updateStatus) {
      // console.log(updateStatus,'uuuuuuuuuuuuuuuuuuuuu');
      res.json({ success: true, message: "Order status updated successfully" });
    } else {
      res.json({ success: false, message: "Failed to update order status" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};





// get method for return management page

const getReturnManagement = async (req, res) =>{
  try {
    const orderedDetails = await orders.find().sort({ orderDate: -1 });
    res.render('./admin/returnmanage', { title: 'order-manage', orderedDetails })

  } catch (error) {
  console.error(error);
  res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}



// post method for update return status

const updateReaturnOrderStatus = async (req, res) => {
  try {
    const { status, orderId, itemId } = req.body;
    console.log(status,'ssssssssssssssssssss');
    console.log(orderId,'ooooooooooooiiiiiiiiiiiiiiii');
    console.log(itemId,'iiiiiiiiiiiiiii');
    const productData = await orders.findById(orderId)
    if (productData) {
      for (const item of productData.items) {
        if (item.id === itemId) {
          console.log('yyyyyyyyeeeeeeeeeeeeessssssssssssssssss');
          item.status = status
        }
      }
      await productData.save()
      console.log(productData,'ppppppppppppppdddddddddddddddddd');
      res.status(200).json({ success: true, message: 'Order returned successfully'})
    } else {
      console.log('noooooooooooooooooooooooo');
      res.status(400).json({ success: false, message: 'Product data not found'})
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

















module.exports = {
  adminLoginPageGet,
  adminLoginPost,
  adminDashboard,
  userManagement,
  blockUser,
  unblockUser,
  adminLogoutPost,
  getOrderManagement,
  updateUserOrderStatus,
  getReturnManagement,
  updateReaturnOrderStatus
};
