const cart = require('../model/cartSchema');
const product = require('../model/productSchema');
const user = require('../model/user');
const helpers = require('./helpers');
const orders = require('../model/orderSchema');
const { ObjectId } = require('mongodb')









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

        // Check if user is found
        if (!User) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userId = User._id;
        const selectedAddressId = req.body.address;
        const paymentMethod = req.body.paymentMethod;

        // Check if user has addresses
        if (!User.address || User.address.length === 0) {
            return res.status(400).json({ success: false, message: "No addresses found for user" });
        }

        const selectedAddress = User.address.find((x) => x._id == selectedAddressId);

        // Check if the selected address is found
        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: "Selected address not found" });
        }

        const totalAmount = req.session.totalAmount;

        // Check if totalAmount is valid
        if (totalAmount < 0 || totalAmount == undefined) {
            return res.status(400).json({ success: false, message: "Invalid total amount" });
        }

        const grandTotal = totalAmount;
        const products = await helpers.getProductData(userId);
        const orderDate = new Date();
        const arrivingDate = new Date(orderDate);
        arrivingDate.setDate(orderDate.getDate() + 4);
console.log(products,'ppppppppppppppppppppppppppp');
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
            paymentStatus: "Pending",
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

            if (paymentMethod === 'COD') {
                return res.json({ success: true, message: 'Order placed successfully' });
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
}







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

            orderData.save();

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
    orderConfirmation,
    orderList,
    orderDetails,
    cancelOrder,
    getOrderManagement,
    updateUserOrderStatus
}