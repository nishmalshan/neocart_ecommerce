

const verifyingUser = (req,res,next) => {
    if(req.session.userlogged){

        next()
    }else{
        res.redirect("/userlogin?message=user not logged")
    }
}



const existUser = (req,res,next) => {
    
    if(req.session.userlogged) {
        
        res.redirect('/home');

    }else{
        
        next()
    }
}


module.exports = {
    verifyingUser,
    existUser
}