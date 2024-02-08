const category = require("../model/categorySchema");
require("dotenv").config();






// get method for category page

const categoryPageGet = async (req, res) => {
  try {
    let i=0;
    const categoryData = await category.find().sort({ name: 1})
    res.render("./admin/categorymanage", {categoryData,i, title: 'categoryManagement'});
    // console.log(categoryData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// get method for Add category page

const addCategoryPageGet = (req, res) => {
  try {
    res.render("./admin/addcategory", { title: "addcategory" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




// post method for Add category

const addCategoryPost = async (req, res) => {
    try {
        // console.log(req.body,"gggggggggggggg");
        const { categoryName } = req.body;
        const image = req.file ? req.file.filename : null;
    // console.log(req.body);
        const lowerCaseName = categoryName.toLowerCase();
    
        const existCategory = await category.findOne({ name: lowerCaseName });
    
        if (existCategory) {
            // req.flash("success", "Category with the same name already exists");
            res.redirect("/admin/addNewCategory");
        } else {
            if (image !== null) {
                const newCategory = await category.create({
                    name: lowerCaseName,
                    image: image,
                });
                // console.log(newCategory);
                // req.flash("success", "Category added successfully");
                res.redirect("/admin/category");
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
    // console.log(id, "ididididididididididid");
    const categoryData = await category.findOne({ _id: id })
    // console.log(categoryData,"cacacacacacaca");
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
    console.log(req.params.id,"ididididididid");
  const name = req.body.categoryName;
  const lowerCaseName = name.toLowerCase();

  console.log(name,"namenamenamenamenamename");
  const newImage = req.file?req.file.filename:undefined;
  
console.log(newImage,"imimimimimimimimimim");
  const updatedCategory = await category.findByIdAndUpdate(id,{
    
    $set: {
    name: lowerCaseName,
    image: newImage
  }
})
console.log(updatedCategory);

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
    console.log(id,"idididididididid");
    const block = await category.updateOne({ _id:id }, {$set: { status: false }});
    console.log(block,"blblblblblblblbl");
    res.redirect("/admin/category")

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}





// post method for unblock category


const unblockCategory = async (req,res) => {
  
  try {
    
    const id = req.params.id;
    console.log(id,"idididididididid");
    const unblock = await category.updateOne({ _id:id }, {$set: { status: true }});
    console.log(unblock,"ununununununun");
    res.redirect("/admin/category")

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}



// post method for delete category 

const deleteCategory = async (req,res) => {

  try {
    
    const id = req.params.id;
    console.log(id,"idididididididi");
    const deleteCategory = await category.deleteOne({ _id: id });
    console.log(deleteCategory,"deldeldeldeldeldel");
    res.redirect('/admin/category');

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
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
