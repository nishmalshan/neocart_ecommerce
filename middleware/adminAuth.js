



const existAdmin = (req,res,next) => {
    
    if(req.session.adminlogged) {
        
        res.redirect('/home');

    }else{
        
        next()
    }
}




module.exports = {
    existAdmin
}