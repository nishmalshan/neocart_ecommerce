const mongoose = require('mongoose');
const user = require('../model/user');
const orders = require('../model/orderSchema');
const product = require('../model/productSchema');





async function getTotalUsers() {
    try {
        const totalUsers = await user.countDocuments({});
        console.log(`Total Users: ${totalUsers}`);

        return totalUsers;
    } catch (err) {
        console.error(err);
    }
}


async function getTotalOrders() {
    try {
        const totalOrders = await orders.countDocuments();

        return totalOrders;
    } catch (err) {
        console.error(err);
    }
}



async function getTotalProductsSold() {
    try {
        const totalOrderedProducts = await orders.aggregate([
            { $unwind: '$items'},
            {$group: { _id: null, totalOrdersCount: { $sum: '$items.quantity' } } }
        ]);
        console.log(totalOrderedProducts,'totalOrderedProducts');
        return totalOrderedProducts.length > 0 ? totalOrderedProducts[0].totalOrdersCount : 0;

    } catch (err) {
        console.error(err);
    }
}


async function getRecentOrders() {
    try {
        const recentOrders = await orders.find({})
            .sort({ orderDate: -1 })
            .limit(5);

        return recentOrders;
    } catch (err) {
        console.error(err);
    }
}



async function getTopSellingProducts() {
    try {
        const topSellingProducts = await orders.aggregate([
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.productId",
                totalQuantitySold: { $sum: "$items.quantity" }
              }
            },
            { $sort: { totalQuantitySold: -1 } },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productDetails"
              }
            },
            { $unwind: "$productDetails" },
            {
              $project: {
                _id: 1,
                totalQuantitySold: 1,
                productName: "$productDetails.name",
                productBrand: "$productDetails.brand",
                productCategory: "$productDetails.category",
                productPrice: "$productDetails.price"
              }
            }
          ]);

          return topSellingProducts;
          
    } catch (err) {
        console.error(err);
    }
}



async function getTopSellingCategories() {
    try {
        const topSellingCategories = await orders.aggregate([
            // Unwind the items array to work with individual items
            { $unwind: "$items" },
            // Lookup to join with the products collection
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            // Unwind the productDetails array to get product info
            { $unwind: "$productDetails" },
            // Group by the product category name, and sum the quantities
            {
                $group: {
                    _id: "$productDetails.category",
                    totalQuantity: { $sum: "$items.quantity" },
                    categoryId: { $first: "$productDetails._id" }
                }
            },
            // Project the result to include category ID, category name, and total quantity
            {
                $project: {
                    _id: 0,
                    categoryId: 1,
                    categoryName: "$_id",
                    totalQuantity: 1
                }
            },
            // Sort the results by total quantity in descending order to get the top-selling categories
            { $sort: { totalQuantity: -1 } }
        ]);

        return topSellingCategories;
    } catch (err) {
        console.error(err);
    }
}












module.exports = {
    getTotalUsers,
    getTotalOrders,
    getTotalProductsSold,
    getRecentOrders,
    getTopSellingProducts,
    getTopSellingCategories
}