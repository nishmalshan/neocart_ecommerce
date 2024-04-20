const cart = require('../model/cartSchema');
const product = require('../model/productSchema');
const users = require('../model/user');
const helpers = require('../controller/helpers');
const { ObjectId } = require('mongodb');
const user = require('../router/userRouter');






// post method for add to cart
const postaddToCart = async (req, res) => {
    try {
        const user = await users.findOne({ email: req.session.email });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const { productId, selectedSize } = req.body;
        const userId = user._id;
        const cartData = await cart.findOne({ userId: userId });

        if (cartData) {
            // Check if the product with the same size already exists in the cart
            const existingProductIndex = cartData.products.findIndex(
                (product) => product.productId == productId && product.size == selectedSize
            );
            console.log(existingProductIndex,'eeeeeeeeeeeeeeeeeeeeeeeeee');

            if (existingProductIndex !== -1) {
                // If the product already exists, increment the quantity
                cartData.products[existingProductIndex].quantity += 1;
            } else {
                // If the product does not exist, add it to the cart
                cartData.products.push({
                    productId: productId,
                    quantity: 1,
                    size: selectedSize,
                });
            }

            await cartData.save();
            return res.status(200).json({ success: true, message: "Item added to the cart." });
        } else {
            // If the cart does not exist, create a new cart
            const newCart = await cart.create({
                userId: userId,
                products: [{
                    productId: productId,
                    quantity: 1,
                    size: selectedSize,
                }],
            });
            return res.status(200).json({ success: true, message: "Updated cart item." });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};



  



// get method for add to cart

const getaddToCart = async (req, res) => {
    try {
        const cartCount = await helpers.getCartCount(req.session.email);
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        if (cartCount === 0) {
            res.render('./user/cart', { cartCount });
            console.log('cart is empty');
        } else {
            const user = await users.findOne({ email: req.session.email });
            const userId = user._id;

            // Fetch the cart data for the user
            const cartData = await helpers.getProductData(userId);
            // console.log(cartData,"cccccccccccccccccccccccccccccccc");
            const total = await helpers.totalAmount(userId);
            // console.log(total[0],"total");
            // console.log(typeof(total),"ttttttttttttttt");
            if (!total || total.length === 0 || total[0] === undefined) {
                // console.log('Error: Total amount is undefined or empty.');
                // Handle the error condition here, e.g., redirect to an error page
                return res.render('./user/cart', { cartCount, total });
            } else {
                const taxAmount = Math.round(((total[0].totalAmount * 18) / 100));
                // console.log(taxAmount,"taatatatatatatatatatatat");
                // console.log(total[0].totalAmount,"ttttttttttttttttttttttttttttttt");
                const grandTotal = total[0].totalAmount + taxAmount;
                const eachProductPrice = await helpers.eachProductPrice(userId);
        
                let i = 0;
                // Pass the cart data, eachProductPrice, and other necessary data to the rendering of the cart page
                res.render('./user/cart', { title: 'Shopping cart', total, cartCount, taxAmount, grandTotal, cartData, eachProductPrice, i });
            }
        }
    } catch (error) {
        console.log('Error:', error.message);
        // Handle other errors here, e.g., redirect to an error page
        res.status(500).send('An unexpected error occurred.');
    }
};








// delete method for delete cart item

const deleteCartItem = async (req, res) => {
    try {
        const {productId} = req.params;

        const user = await users.findOne({ email: req.session.email });
        const userId = user._id;

        // Remove the product from the cart
        await cart.updateOne(
            { userId },
            { $pull: { products: { productId: new ObjectId(productId) } } }
        )
        return res.status(200).json({ success: true, message: 'item removed from the cart'});

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}





// post method for change quantity

const changeQuantity = async (req, res) => {
    try {
        const { userId, productId, quantity, action } = req.body;
console.log(quantity,"qqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
        // Find the user's cart using the email stored in the session
        const userData = await users.findOne({ email: req.session.email });
        const userid = userData._id;

        // Find the cart corresponding to the user
        const cartData = await cart.findOne({ userId: userid });
        // console.log(cartData.products, "cccccccccccccccccccccccccccccccccccccc");

        if (!cartData) {
            return res.status(404).json({ success: false, error: "Cart not found" });
        }

        // Find the product in the cart
        const productInCart = cartData.products.find(product => product.productId.toString() === productId.toString());
        console.log(productInCart, "Product in cart");
console.log(productInCart.size,'cart product size');
        // If product not found, handle the error
        if (!productInCart) {
            return res.status(404).json({ success: false, error: "Product not found in the cart" });
        }

        if (action === 'increase') {
            // Update quantity and check maximum stock
            const productData = await product.findById(productId);
            console.log(productData.variant,'dddddddddddddddddddddddddddd');
            const matchSize = productData.variant.find((variant) => variant.size === productInCart.size)
            if (matchSize) {
                console.log(matchSize,'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm');
            }
            const updatedQuantity = productInCart.quantity + quantity;
            console.log(updatedQuantity,'UUUUUUUUUUUUUUUUUUUUUUUUUUUU');
            console.log(matchSize.quantity,'mqmqmqmqmqqmqmqmqmq');
            if (productData && updatedQuantity > matchSize.quantity) {
                console.log('maximum stock');
                return res.status(400).json({ success: false, error: 'Maximum stock reached' });
            }
            productInCart.quantity = updatedQuantity;
        } else if (action === 'decrease') {
            // Update quantity and remove product if quantity becomes zero or negative
            productInCart.quantity -= quantity;
            if (productInCart.quantity <= 0) {
                cartData.products = cartData.products.filter(product => product.productId.toString() !== productId.toString());
            }
        }

        // Save the updated cart
        await cartData.save();

        // Send success response
        res.status(200).json({ success: true, message: 'Quantity updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}







// get method for cart checkout 

const checkout = async (req, res) => {
    try {
        const user = await users.findOne({ email: req.session.email });
        if (!user) {
            // Handle case where user is not found
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const userId = user._id;

        const cartCount = await helpers.getCartCount(req.session.email);
        console.log(cartCount,"ccccccccccccccccccccc");
        const cartProductData = await helpers.getProductData(userId)
        console.log(cartProductData,"CPCPPCPCPCPCPCPCPCPCPCPCPCP");
        let i=0;
        const totalAmount = await helpers.totalAmount(userId);
        console.log(totalAmount,"ttttttttttttttttttttttttt");
        req.session.totalAmount = totalAmount;
        res.render('./user/checkout',{title: 'checkout', totalAmount, user, cartCount, i})
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
















module.exports = {
    postaddToCart,
    getaddToCart,
    deleteCartItem ,
    changeQuantity,
    checkout

}