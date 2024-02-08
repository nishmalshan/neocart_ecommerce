const product = require("../model/productSchema")








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
            console.log(images,"ffffffffffffffffffffffffffff");

            const allImages = [].concat(...Object.values(images).map(arr => arr.map(file => file.filename)));
            console.log(allImages,"alalalalalalalalalalalal");

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
            console.log(newProduct);
            if(newProduct) {
                console.log('Product added');
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
        console.log(blockProduct,"bbbbbbbbbbbbbbbbbbbbbbbbbb");
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
        console.log(unblockProduct,"uuuuuuuuuuuuuuuuuuuuuuuu");
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

const editProductPost = async (req,res) => {

}






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




















module.exports = {
    productPageGet,
    addProductPage,
    addProductPost,
    blockProduct,
    unblockProduct,
    editProductGet,
    editProductPost,
    deleteProduct
}