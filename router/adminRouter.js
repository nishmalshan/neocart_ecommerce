const express = require("express");
const admin = express.Router();

const adminController = require("../controller/adminController");
const adminAuthentication = require("../middleware/adminAuth");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController")
const upload=require("../middleware/addCategoryMulter")
const productUploads = require("../middleware/product-multer");





const uploadfields=[
    {name:"mainImage",maxCount:1},
    {name:"image1",maxCount:1},
    {name:"image2",maxCount:1},
    {name:"image3",maxCount:1},
    {name:"image4",maxCount:1},
]








admin.get('/',adminController.adminLoginPageGet);
admin.post('/adminlogin',adminController.adminLoginPost);
admin.get('/dashboard',adminController.adminDashboard);
admin.get('/userlist',adminController.userManagement);




// route for Block & Unblock users
admin.post('/blockuser/:id',adminController.blockUser);
admin.post('/unblockuser/:id',adminController.unblockUser);




// route for Category 
admin.get('/category',categoryController.categoryPageGet);
admin.get('/addcategory',categoryController.addCategoryPageGet);
admin.post('/addNewCategory',upload.single('categoryImage'),categoryController.addCategoryPost);
admin.get('/editCategory/:id',categoryController.editCategory);
admin.post('/editcategory/:id',upload.single('categoryImage'),categoryController.editCategoryPost);
admin.post('/blockcategory/:id',categoryController.blockCategory);
admin.post('/unblockcategory/:id',categoryController.unblockCategory);
admin.delete('/deletecategory/:id',categoryController.deleteCategory);




// route for product

admin.get('/product-manage',productController.productPageGet);
admin.get('/add-product',productController.addProductPage);
admin.post('/add-product',productUploads.fields(uploadfields),productController.addProductPost);
admin.post('/blockproduct/:id',productController.blockProduct);
admin.post('/unblockproduct/:id',productController.unblockProduct)
admin.get('/edit-product/:id',productController.editProductGet);
admin.post('/edit-product/:id',productUploads.fields(uploadfields),productController.editProductPost);
admin.post('/delete-product/:id',productController.deleteProduct);











module.exports = admin;