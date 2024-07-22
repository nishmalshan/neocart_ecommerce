const dbConnection = require("../config/connection");
const session = require("express-session");
const user = require("../model/user");
const orders = require("../model/orderSchema");
const dashboard = require("../controller/dashboard")
const product = require("../model/productSchema");

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

const adminDashboard = async (req, res) => {
  try {
    const totalUsers  = await dashboard.getTotalUsers();
    // console.log(totalUsers,'tttttttttttttttttt');
    const totalOrders = await dashboard.getTotalOrders();
    const totalOrderedProduct = await dashboard.getTotalProductsSold();
    const recentOrders = await dashboard.getRecentOrders();
    const topSellingProducts = await dashboard.getTopSellingProducts();
    const topSellingCategories = await dashboard.getTopSellingCategories();
    const selectedTimeInterval = req.body.interval;
    const deliveredOrders = await orders.find({ status: "Delivered" });

    let timeFormat, timeUnit, dateFormat;
      if (selectedTimeInterval === "monthly") {
        timeFormat = "%Y-%m";
        timeUnit = "$month";
        dateFormat = "MMMM YYYY";
      } else if (selectedTimeInterval === "yearly") {
        timeFormat = "%Y";
        timeUnit = "$year";
        dateFormat = "YYYY"
      } else {
        timeFormat = '%Y-%m-%d';
        timeUnit = "$dayOfMonth";
        dateFormat = "MMMM DD, YYYY"
      }
      console.log(deliveredOrders,'deliveredOrders');

      const deliveredOrderIds = deliveredOrders.map(order => order._id);
console.log(deliveredOrderIds,'deliveredOrderIds');
const orderWithDate = await orders.aggregate([
    {
        $match: {
            _id: { $in: deliveredOrderIds },
            orderDate: { $exists: true }
        }
    },
    {
        $addFields: {
            orderDate: { $toDate: '$orderDate' }
        }
    },
    {
        $group: {
            _id: {
                $dateToString: {
                    format: timeFormat, // "%Y-%m-%d" for daily, "%Y-%m" for monthly, "%Y" for yearly
                    date: '$orderDate',
                    timezone: "+0530"
                }
            },
            count: { $sum: 1 }
        }
    },
    {
        $project: {
            _id: 0,
            date: "$_id",
            count: 1
        }
    },
    {
        $sort: {
            date: 1
        }
    }
]).exec();

console.log('orderWithDate', orderWithDate);

const validOrdersWithDate = orderWithDate.filter(
  (order) => order.date && order.date !== null
);

console.log(validOrdersWithDate,'validOrdersWithDate');

const xValues = validOrdersWithDate.map((order) => order.date);
const yValues = validOrdersWithDate.map((order) => order.count);
console.log(xValues,'x values');
console.log(yValues.toString(),'y values');
const recentlyPlacedOrders = await orders
.find()
.sort({ orderDate: -1 })
.populate("items.productId.product")
.limit(5);



console.log(recentlyPlacedOrders,'recentlyPlacedOrders');




    res.render("./admin/admindashboard", {
      title: "adminhome",
      totalUsers,
      totalOrders,
      totalOrderedProduct,
      recentOrders,
      topSellingProducts,
      topSellingCategories,
      orders: deliveredOrders,
      xValues,
      yValues,
      recentlyPlacedOrders,
      selectedTimeInterval,
      dateFormat
    });
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

    res.render("./admin/usermanagement", { title: "usermanagement", userData, i });
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

    const productData = await orders.findById(orderId);
    if (productData) {
      for (const item of productData.items) {
        if (item.id === itemId) {
          item.status = status;
        }
      }
      productData.status = 'Returned';
      await productData.save();

      const orderData = await orders.findById(orderId);
      if (orderData && orderData.items) {
        for (const data of orderData.items) {
          if (data.status === "Accepted") {

            const userData = await user.findOne({ _id: orderData.userId });
            if (!userData) {
              return res.status(404).json({ success: false, message: 'User not found' });
            }

            userData.wallet.balanceAmount += parseInt(orderData.totalPrice);
            userData.wallet.transaction.push({
              amount: parseInt(orderData.totalPrice),
              transactionType: "credit",
              timestamp: new Date(),
              description: "Refund for returned order item",
            });
            await userData.save();

            for (const item of orderData.items) {
              if (item.productId) {
                const productData = await product.findById(item.productId);

                if (productData) {
                  const variant = productData.variant.find(
                    (variant) => variant.size === item.size
                  );

                  if (variant) {
                    variant.quantity += item.quantity;
                    await productData.save();
                  }
                }
              }
            }
          }
        }
      }
      res.status(200).json({ success: true, message: 'Order Returned Successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Product data not found' });
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
