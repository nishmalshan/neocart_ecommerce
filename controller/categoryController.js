const category = require("../model/categorySchema");
require("dotenv").config();






// get method for category page

const categoryPageGet = async (req, res) => {
  try {
    let i=0;
    const categoryData = await category.find().sort({ name: 1})
    res.render("./admin/categorymanage", {categoryData,i, title: 'categoryManagement'});

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// get method for Add category page

const addCategoryPageGet = (req, res) => {
  try {
    const message = req.flash('success')
    res.render("./admin/addcategory", { message, title: "addcategory" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




// post method for Add category

const addCategoryPost = async (req, res) => {
    try {

        const { categoryName } = req.body;
        const image = req.file ? req.file.filename : null;

    const lowerCaseName = categoryName.toLowerCase()

    const existCategory = await category.findOne({ name: lowerCaseName });
    

    
        if (existCategory) {
            req.flash("success", "Category with the same name already exists");
            res.redirect("/admin/addcategory");
        } else {
            if (image !== null) {
                const newCategory = await category.create({
                    name: categoryName,
                    image: image,
                });
                
                res.redirect("/admin/category?success=Category added successfully");
            } else {
                // req.flash("error", "Image is required for the category");
                res.redirect("/addcategory");
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
    
};




// get method for admin edit category

const editCategory = async (req,res) => {
  try {

    const id = req.params.id;

    const categoryData = await category.findOne({ _id: id })

    res.render('./admin/editcategory',{categoryData, title: 'editCategory'})
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}



// post method for admin edit category

const editCategoryPost = async (req,res) =>{

  try {
    
    const id = req.params.id;

  const name = req.body.categoryName;
  const lowerCaseName = name.toLowerCase();

  const newImage = req.file?req.file.filename:undefined;
  
  const updatedCategory = await category.findByIdAndUpdate(id,{
    
    $set: {
    name: lowerCaseName,
    image: newImage
  }
})


res.redirect('/admin/category');

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }

}



// post method for block category

const blockCategory = async (req,res) => {
  
  try {
    
    const id = req.params.id;

    const block = await category.updateOne({ _id:id }, {$set: { status: false }});

    res.redirect("/admin/category?message=Category successfully blocked")

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}





// post method for unblock category


const unblockCategory = async (req,res) => {
  
  try {
    
    const id = req.params.id;

    const unblock = await category.updateOne({ _id:id }, {$set: { status: true }});

    res.redirect("/admin/category?message=Category successfully unblocked")

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}



// post method for delete category 

const deleteCategory = async (req,res) => {

  try {
    
    const id = req.params.id;

    const deleteCategory = await category.deleteOne({ _id: id });

    // res.redirect('/admin/category?message=Category successfully deleted');
    res.json({ success: true, message: 'Item deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}





















module.exports = {
  categoryPageGet,
  addCategoryPageGet,
  addCategoryPost,
  editCategory,
  editCategoryPost,
  blockCategory,
  unblockCategory,
  deleteCategory
};
