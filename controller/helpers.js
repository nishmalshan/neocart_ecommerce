const {ObjectId} = require('mongodb');
const cart = require('../model/cartSchema');
const user = require('../model/user');







// function for cart product details

const getProductData = async (userid) => {
    try {
        const cartData = await cart.aggregate([
            {
                $match: { userId: new ObjectId(userid) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.productId',
                    quantity: '$products.quantity',
                    size: '$products.size'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'cartItems'
                }
            },
            {
                $project: {
                    item: 1,
                    quantity: 1,
                    size: 1,
                    product: { $arrayElemAt: ['$cartItems', 0] }
                }
            },
            {
                $match: {
                    'product.status': true
                }
            }
        ]);

        return cartData;
    } catch (error) {
        console.error(error);
        throw error; // Throw the error to be caught by the calling function
    }
};




// function for total amount of cart product

const totalAmount = async (userid) => {
    try {
        const totalAmount = await cart.aggregate([
            {
                $match: { userId: new ObjectId(userid) }
            },
            {
                $unwind: "$products" // Unwind the products array
            },
            {
                $lookup: {
                    from: "products", // Assuming your product collection is named "products"
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product" // Unwind the product array
            },
            {
                $project: {
                    _id: 0,
                    quantity: "$products.quantity",
                    price: "$product.price"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: { $multiply: ["$quantity", "$price"] } }
                }
            }
        ]);
        return totalAmount
    } catch (error) {
        console.log(error);
    }
}





const eachProductPrice = async (userId) => {
    try {
        const eachAmount = await cart.aggregate([
            {
                $match: { userId: new ObjectId(userId) }
            },
            {
                $unwind: "$products"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                    _id: 0,
                    productId: "$products.productId",
                    quantity: "$products.quantity",
                    price: "$product.price",
                    totalProductPrice: {
                        $cond: {
                            if: { $gt: ["$products.quantity", 1] },
                            then: { $multiply: ["$products.quantity", "$product.price"] },
                            else: "$product.price"
                        }
                    }
                }
            }
        ]);
        
        if (eachAmount.length > 0) {
            // const eachProductPrices = eachAmount.map(product => product.totalProductPrice);
            // console.log(eachProductPrices, "eeeeeeeeeeeeeeeeeeeeeeeeeeee");
            return eachAmount;
        } else {
            return []; // If the cart is empty or no matching user found
        }
        
    } catch (error) {
        console.log(error);
    }
};






const getCartCount = async (sessionEmail) => {
    try {
        const userData = await user.findOne({ email: sessionEmail})
        let count = 0;
        if (!userData) {

            return count;

        }else{
            const cartData = await cart.findOne({ userId: new ObjectId(userData._id)});
            if (cartData) {
                count = cartData.products.length;
                return count;
            }
        }
        
    }catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}




















module.exports = {
    getProductData,
    totalAmount,
    eachProductPrice,
    getCartCount
}