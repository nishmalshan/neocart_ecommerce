const cart = require('../model/cartSchema');
const product = require('../model/productSchema');
const user = require('../model/user');
const helpers = require('./helpers');
const orders = require('../model/orderSchema');
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY } = process.env;


let razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_SECRET_KEY
  })






// get method for order confirmation

const orderConfirmation = (req, res) => {
    try {
        res.render('./user/orderConfirmation')
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}






// post method for place order


const placeOrder = async (req, res) => {
    try {
        const User = await user.findOne({ email: req.session.email });

        if (!User) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userId = User._id;
        const selectedAddressId = req.body.address;
        const paymentMethod = req.body.paymentMethod;

        if (!User.address || User.address.length === 0) {
            return res.status(400).json({ success: false, message: "No addresses found for user" });
        }

        const selectedAddress = User.address.find((x) => x._id == selectedAddressId);

        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: "Selected address not found" });
        }

        const totalAmount = req.session.totalAmount;

        if (totalAmount < 0 || totalAmount == undefined) {
            return res.status(400).json({ success: false, message: "Invalid total amount" });
        }

        const grandTotal = totalAmount;
        const products = await helpers.getProductData(userId);
        const orderDate = new Date();
        const arrivingDate = new Date(orderDate);
        arrivingDate.setDate(orderDate.getDate() + 4);

        const items = products.map((productItem) => ({
            productId: productItem.item,
            name: productItem.product.name,
            image: productItem.product.images[0],
            size: productItem.size,
            quantity: productItem.quantity,
        }));

        const newOrder = new orders({
            userId,
            items,
            paymentMethod,
            // paymentStatus: "Pending",
            address: [{
                name: selectedAddress.name,
                address: selectedAddress.address,
                city: selectedAddress.city,
                state: selectedAddress.state,
                pincode: selectedAddress.pincode,
                phone: selectedAddress.phone,
            }],
            totalPrice: grandTotal,
            orderDate,
            arrivingDate,
        });

        const saveOrder = await newOrder.save();

        if (saveOrder) {
            await cart.findOneAndDelete({ userId });

            for (const item of products) {
                const { item: productId, size, quantity: purchasedQuantity } = item;
                await product.updateOne(
                    { _id: productId, 'variant.size': size },
                    { $inc: { 'variant.$.quantity': -purchasedQuantity } }
                );
            }
        }
            if (paymentMethod === 'COD') {
                return res.json({ codSuccess: true, message: 'Order placed successfully' });
            } else if (paymentMethod === 'Online') {
                console.log('payment online');
                const options = {
                    amount: grandTotal * 100,
                    currency: 'INR',
                    receipt: saveOrder._id.toString()
                };

                razorpayInstance.orders.create(options, (err, order) => {
                    if (!err) {
                        console.log('1111111111111111111111111111111111');
                        res.status(200).send({
                            online: true,
                            msg: 'Order Created',
                            order_id: order.id,
                            amount: order.amount,
                            key_id: RAZORPAY_KEY_ID,
                            produc_name: saveOrder.items[0].name,
                            contact: saveOrder.address[0].phone,
                            name: saveOrder.address[0].name,
                            email: req.session.email
                        });
                    } else {
                        res.status(400).send({ online: false, message: 'Something went wrong' });
                    }
                });
            } else if (paymentMethod === 'Wallet') {
                User.wallet.balanceAmount -= grandTotal;
                User.wallet.transaction.push({
                    amount: grandTotal,
                    transactionType: "debit",
                    description: "Payment for order",
                    timestamp: new Date()
                })
                await User.save();

                newOrder.paymentMethod = "Wallet"
                newOrder.paymentStatus = "Paid"
                await newOrder.save();
                res.json({walletSuccess:true,message:"Order Success"})
            }
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
};





// post method for verify payment

const verifyPayment = async (req, res, next) => {
    try {
        console.log('66666666666666666666666666666666');
        const { order_id, payment_id, signature } = req.body;
        console.log(order_id, 'oooooooooooooooooooooiiiiiiiiiiiiiiiiiiii');
        console.log(payment_id, 'pppppppppppppppppppppppppppppiiiiiiiiiiiiiiiiiiiiiiiiii');
        console.log(signature, 'ssssssssssssssssssssiiiiiiiiiiiiiiiiiii');
        const shasum = crypto.createHmac('sha256', RAZORPAY_SECRET_KEY);
        shasum.update(`${order_id}|${payment_id}`);
        const digest = shasum.digest('hex');
        console.log('7777777777777777777777777777777777777777777');
        console.log(digest, 'digest');

        if (digest === signature) {
            const updateOrder = await orders.findOneAndUpdate(
                { razorpayOrderId: order_id },
                {
                    paymentMethod: "Online",
                    paymentStatus: "Paid"
                }
            ).then(() => {
                res.json({ success: true, message: 'Payment verified successfully' });
            }).catch(error => {
                console.error(error);
                res.status(500).json({ success: false, message: 'Error updating order status' });
            });

            console.log('888888888888888888888888888888888888888888888888');
            console.log(updateOrder, 'uuuuuuuuuuuuuoooooooooooooo');
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
};








// get method for order lists page

const orderList = async (req, res) => {
    try {

        const User = await user.findOne({ email: req.session.email });
        if (User) {
            const userId = User._id
            const orderDetails = await orders.find({ userId }).sort({ orderDate: -1 });
            let i = 0;
            const cartCount = await helpers.getCartCount(req.session.email)
            res.render('./user/orderedList', {title: 'order-List', User, orderDetails, cartCount, i})
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}



// get method for order details page

const orderDetails = async (req, res) => {
    try {
        const User  = await user.findOne({ email: req.session.email });
        const productId = req.params.id;
        const email = req.session.email;
        const cartCount = await helpers.getCartCount(req.session.email)
        if (!ObjectId.isValid(productId)) {
            return res.status(400).render('user/404')
        }

        console.log(productId,'ppppppppppppppppppiiiiiiiiiiiiiiiiii');
        const orderDetails = await orders.findOne({ _id: productId })
        console.log(orderDetails,'pppppppppppppdddddddddddddd');
        res.render('./user/orderDetails', {title: 'order-Details', User, orderDetails, cartCount, email})
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}



// post method for cancel order

const cancelOrder = async (req,res) => {
    try {
        const id = req.body.orderId;


        const orderData = await orders.findById(id);

        if (orderData.status !== 'Delivered') {
            orderData.status = 'Cancelled';
            orderData.reason = req.body.cancellationReason;

            if (orderData.paymentMethod === 'Online' || orderData.paymentMethod === 'Wallet') {
                const userData = await user.findOne({ email: req.session.email });
                userData.wallet.balanceAmount += parseInt(orderData.totalPrice)
                userData.wallet.transaction.push({
                    amount: parseInt(orderData.totalPrice),
                    transactionType: 'credit',
                    timestamp: new Date(),
                    description: 'Order cancellation refund'
                })
                await userData.save()
                console.log(userData,'uuuuuuuuuuuuuuuuu');
            }
            await orderData.save();

            for (const item of orderData.items) {
                if (item.productId) {
                    const productData = await product.findById(item.productId);

                    if (productData) {
                        const variant = productData.variant.find((variant) => variant.size === item.size);
                        
                        if (variant) {
                            variant.quantity += item.quantity
                            await productData.save();
                        }
                    }
                }
            }

            res.json({ success: true, message: 'Order has been cancelled' })
            
        } else {
            res.json({ success: false, message: 'Cannot cancel the delivered order'})
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}



// patch method for return order

const returnOrder = async (req, res) => {
    try {
        const { orderId, itemId, reason } = req.body;

        // console.log(orderId,'ooooooooiiiiiiiiiii');
        // console.log(reason,'rrrrrrrrrrrrrrrrrrrrrr');
        // console.log(itemId,'iiiiiiiiiiiiiiii');

        const update = await orders.updateOne(
            { _id: orderId, "items._id": itemId },
            {
                $set: {
                    "items.$status": "Returned",
                    "items.$.Returnreason": reason
                }
            }
        );

        // if (update.nModified === 0) {
        //     return res.status(404).json({ success: false, error: 'Order or Item not found'})
        // }

        const orderData = await orders.findById(orderId)
        console.log(orderData,'ooooooooooooorrrrrrrrrrr');
            const userData = await user.findOne({ email: req.session.email })
            userData.wallet.balanceAmount += parseInt(orderData.totalPrice)
            userData.wallet.transaction.push({
                amount: parseInt(orderData.totalPrice),
                transactionType: "credit",
                timestamp: new Date(),
                description: "Refund for returned order item"
            })
            await userData.save()


        for (const item of orderData.items) {
            if (item.productId) {
                const productData = await product.findById(item.productId)
                
                if (productData) {
                    const variant = productData.variant.find((variant) => variant.size === item.size)

                    if (variant) {
                        variant.quantity += itme.quantity
                        await productData.save()
                    }
                }
            }
        }

        res.status(200).json({success: true, message: 'Order has been returned'})

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}




// -------------------------------- Admin side order management ----------------------------- //

// get method for order management

const getOrderManagement = async (req, res) => {
    try {
            let i = 0;
            const orderedDetails = await orders.find().sort({ orderDate: -1 })
            res.render('./admin/ordermanage', { title: 'order-management', orderedDetails, i})

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}
 



const updateUserOrderStatus = async (req, res) => {
    try {
        const newStatus = req.body.status;
        const orderId = req.params.orderId;

        const updateStatus = await orders.findByIdAndUpdate(orderId, { status: newStatus });

        if (updateStatus) {
            res.json({ success: true, message: 'Order status updated successfully' })
        } else {
            res.json({ success: false, message: 'Failed to update order status' })
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}















module.exports = {
    placeOrder,
    verifyPayment,
    orderConfirmation,
    orderList,
    orderDetails,
    cancelOrder,
    returnOrder,
    getOrderManagement,
    updateUserOrderStatus
}