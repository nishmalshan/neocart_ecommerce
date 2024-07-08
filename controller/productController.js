const product = require("../model/productSchema")
const offers = require("../model/productOfferSchema");







// get method for product manage page


const productPageGet = async(req,res) => {

    try {
        let i=0;
        const productData = await product.find().sort({ name: 1 })
        res.render("./admin/productmanage",{productData,i,title: 'productManagement'})
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}



// get method for add product page

const addProductPage = (req,res) => {

    try {
        
        res.render("./admin/addProduct",{title: 'add products'})

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}




// Post method for add product


const addProductPost = async (req,res) => {

    try {

        const {name, description, brand, category, color, price} = req.body

        const existProduct = await product.findOne({ name: name});

        if(existProduct) {
            res.redirect('/admin/product-manage?message=Product already exist')
        }else{

            let obj = []
            for(let i=0; i<req.body.variant.size.length; i++) {
                obj.push({
                    size: req.body.variant.size[i],
                    quantity: req.body.variant.quantity[i]
                })
            }

            const images = req.files;


            const allImages = [].concat(...Object.values(images).map(arr => arr.map(file => file.filename)));


            const newProduct = await product.create({
                name,
                description,
                brand,
                category,
                color,
                price,
                images: allImages,
                variant: obj
            })

            if(newProduct) {
                res.redirect('/admin/product-manage')
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}





// Post method for block product

const blockProduct = async(req,res) => {

    try {

        const id = req.params.id;
        const blockProduct = await product.updateOne({_id: id},{$set:{status : false }});

        res.redirect('/admin/product-manage?message=productBlockedSuccessful')

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}





// post method for unblock product


const unblockProduct = async (req,res) => {

    try {
        
        const id = req.params.id;
        const unblockProduct = await product.updateOne({_id: id},{$set: { status: true}})
        res.redirect('/admin/product-manage?message=productUnblockedSuccessful')

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}





// get method for edit product page

const editProductGet = async (req,res) => {

    try {
        const id = req.params.id;
        const productData = await product.findOne({_id: id})

        res.render('./admin/editproduct',{productData, title: 'editProduct'})
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}






// post method for edit product

const editProductPost = async (req, res) => {
    try {
        const id = req.params.id;
        const productDetails = req.body;
        const files = req.files;

        console.log("Received files:", files);

        let obj = [];
        for (let i = 0; i < req.body.variant.size.length; i++) {
            obj.push({
                size: req.body.variant.size[i],
                quantity: req.body.variant.quantity[i]
            });
        }

        const productData = await product.findById(id);
        console.log(productData.images,'pppppppppppppppppiiiiiiiiiiiiiiiiiiii');

        if (!productData) {
            console.log('data not found');
            res.status(404).send("Product not found");
            return;
        }

        const updateData = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            brand: req.body.brand,
            category: req.body.category,
            color: req.body.color,
            variant: obj,
            images: productData.images.slice()  // Clone the existing images array
        };

        console.log("Initial updateData.images:", updateData.images);

        // Update the main image (index 0)
        // if (files && files.image1) {
        //     updateData.images[0] = files.image1[0].filename;
        // } else {
        //     updateData.images[0] = productData.images[0] || null;
        // }

        // Update the other images (indices 1 to 4)
        let j =0;
        for (let i = 1; i <= 5; i++) {
            const imageName = `image${i}`;
            console.log(`Processing ${imageName}`);
            if (files && files[imageName]) {
                console.log(`Updating image ${i} with file ${files[imageName][0].filename}`);
                updateData.images[j] = files[imageName][0].filename;
                j++
            } else {
                console.log(`Keeping existing image ${i}: ${productData.images[i]}`);
                updateData.images[j] = productData.images[j] || null;
                j++
            }
        }

        console.log("Final updateData.images:", updateData.images);

        const uploaded = await product.updateOne({ _id: id }, { $set: updateData });

        if (uploaded) {
            res.redirect('/admin/product-manage?message=successfullyEdited');
        } else {
            console.log('Failed to update product');
            res.status(500).send("Failed to update product");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};







// post method for delete product

const deleteProduct = async (req,res) => {

    try {
        
        const id = req.params.id;
        const deleteProduct = await product.deleteOne({ _id: id });
        res.redirect('/admin/product-manage?message=productDeleteSuccessful')

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }

}



// get method for offer product page

const getOfferPage = async (req, res) => {
    try {
        const productsData = await product.find();
        // console.log(productsData,'ppppppppppppppppdddddddddddddddddddd');
        const offerData = await offers.find()
        

        res.render('./admin/productOfferManage', { title: 'offer-product', productsData, offerData })
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}



// post method for create offer

const createOffer = async (req, res) => {
    try {
        const { discount, startDate, endDate, productId } = req.body;

        const existProductOffer = await offers.findOne({ product: productId });

        if (existProductOffer) {
            existProductOffer.discountPrecentage = discount
            existProductOffer.startDate = startDate
            existProductOffer.expiryDate = endDate
            console.log('offer updated');
            await existProductOffer.save()
            return res.json({ success: true, message: 'Offer updated succesfully' });
        } else {
            console.log('fffffffffffffffffffffff');
            
            const newOffer = new offers({
                product: productId,
                discountPrecentage: discount,
                startDate: startDate,
                expiryDate: endDate
            });

            await newOffer.save();

            res.json({ success: true, message: 'Offer created successfully' });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};





// delete method for delete offer

const deleteOffer = async (req, res) => {
    try {
        const productId = req.params.productId;
        console.log(productId,'ooooooooooooooofffffffffffffffffffff');

        const offer = await offers.findOne({product: productId});
        if (offer) {
            const deleteOffer = await offers.findByIdAndDelete(offer.id)

            if (deleteOffer) {
                console.log('success');
                res.json({ success: true, message: 'Offer deleted successfully' });
              } else {
                res.json({ success: false, message: 'Offer not found' });
              }
        }
        // const deleteOffer = await offers.findByIdAndDelete(offerId)
        
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}





















module.exports = {
    productPageGet,
    addProductPage,
    addProductPost,
    blockProduct,
    unblockProduct,
    editProductGet,
    editProductPost,
    deleteProduct,
    getOfferPage,
    createOffer,
    deleteOffer
}