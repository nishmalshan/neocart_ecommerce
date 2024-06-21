const cart = require('../model/cartSchema');
const product = require('../model/productSchema');
const users = require('../model/user');
const helpers = require('./helpers');
const orders = require('../model/orderSchema');
const user = require('../router/userRouter');









// get method for order confirmation

const orderConfirmation = (req, res) => {
    try {
        console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
        res.render('./user/orderConfirmation')
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}






// post method for place order

const placeOrder = async (req, res) => {
    try {
        console.log(req.session,'sssssssssssssssssss');
        const user = await users.findOne({ email: req.session.email });
        const userId = user._id;
        const selectedAddressId = req.body.address;
        const paymentMethod = req.body.paymentMethod;
        const selectedAddress = user.address.find((x) => x._id == selectedAddressId);

        console.log(req.session.totalAmount,'tttttttttttttttttttttt');
        const totalAmount = req.session.totalAmount;
        console.log(totalAmount,'ttttttttttttttooooooooooo');
        // Check if totalAmount is not defined, empty, or undefined
        if (totalAmount < 0) {
            console.log('mmmmmmmmmmkmkmkkmmkkmkkm')
        }

        console.log('hhhhhhhhhhhhhhhhhhhh');
       
        const grandTotal = totalAmount;
        console.log(grandTotal,'gggggggggggggggggggggg');
        const products = await helpers.getProductData(userId);
        const orderDate = new Date();
        const arrivingDate = new Date(orderDate);
        arrivingDate.setDate(orderDate.getDate() + 4);

        const items = [];

        for (let i = 0; i < products.length; i++) {
            const product = products[i].product;
            const item = {
                productId: products[i].item,
                name: product.name,
                size: products[i].size,
                quantity: products[i].quantity
            }
            items.push(item);
        }

        const newOrder = new orders({
            userId,
            items,
            paymentMethod,
            paymentStatus: "Pending",
            address: [{
                name: selectedAddress.name,
                address: selectedAddress.address,
                city: selectedAddress.city,
                state: selectedAddress.state,
                pincode: selectedAddress.pincode,
                phone: selectedAddress.phone
            }],
            totalPrice: grandTotal,
            orderDate,
            arrivingDate
        });

        const saveOrder = await newOrder.save();

        if (saveOrder) {
            await cart.findOneAndDelete({ userId });

            for (const item of products) {
                const productId = item.item;
                const size = item.size;
                const purchasedQuantity = item.quantity;
                const result = await product.updateOne(
                    { _id: productId, 'variant.size': size },
                    { $inc: { 'variant.$.quantity': -purchasedQuantity } }
                );         
            }

            if (paymentMethod == 'COD') {
                res.json({ codeSuccess: true, message: 'order success' });
            }
        }
    } catch (error) {
        // Handle the error
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}






// get method for order details page

const orderDetails = async (req, res) => {
    try {
        const email = req.session.email;

        const isUser = await users.findOne({ email });
        if (isUser) {
            // console.log(isUser,'uuuuuuuuuuuuuuuuuuuuuuuuuuuuu');
            const userId = isUser._id
            // console.log(userId,'ididiidididiidididididididididid');
            const orderDetails = await orders.find({ userId }).sort({ orderDate: -1 });
            let i = 0;
            const cartCount = await helpers.getCartCount(req.session.email)
            res.render('./user/orderedlist', {title: 'order-Details', orderDetails, cartCount, i})
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}



// post method for cancel order

const cancelOrder = async (req,res) => {
    try {
        const id = req.body.orderId;
        console.log('req.body.orderId',id);

        const orderData = await orders.findById(id);

        if (orderData.status !== 'Delivered') {
            orderData.status = 'Cancelled';
            orderData.reason = req.body.cancellationReason;

            orderData.save();

            for (const item of orderData.items) {
                if (item.productId) {
                    const productData = await product.findById(item.productId);

                    if (productData) {
                        const variant = productData.variant.find((variant) => variant.size === item.size);
                        
                        if (variant) {
                            variant.quantity += item.quantity
                            console.log(variant,'vvvvvvvvvvvvvvvvvvvvvvvvvvvv');
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




// -------------------------------- Admin side order management ----------------------------- //

// get method for order management

const getOrderManagement = async (req, res) => {
    try {
        // console.log('||||||||||||||');
            let i = 0;
            const orderedDetails = await orders.find().sort({ orderDate: -1 })
            console.log(orderedDetails,'ooooooooooooorrrrrrrrrrrrrr');
            res.render('./admin/ordermanage', { title: 'order-management', orderedDetails, i})

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}
 



const updateUserOrderStatus = async (req, res) => {
    try {
        const newStatus = req.body.status;
        console.log('newStatus', newStatus);
        const orderId = req.params.orderId;
        console.log('orderId',orderId);

        const updateStatus = await orders.findByIdAndUpdate(orderId, { status: newStatus });
        console.log('updateStatus',updateStatus);

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
    orderConfirmation,
    orderDetails,
    cancelOrder,
    getOrderManagement,
    updateUserOrderStatus
}