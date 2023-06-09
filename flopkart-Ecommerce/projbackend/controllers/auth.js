
const User = require("../models/user");
const { body, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var expressjwt = require("express-jwt");

//singup controller
exports.signup = (req, res) =>{
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
           error: errors.array()[0].msg
        });
      }

    const user = new User(req.body);
    user.save((err,user) =>{
        if(err){
            return res.status(400).json({
                err:"NOT able save user in DB"
            })
        }
        res.json({
            name: user.name,
            email:user.email,
            id:user._id
        });
    });
};


exports.signin = (req,res) => {
    const errors = validationResult(req);

    const {email, password} = req.body;

    if (!errors.isEmpty()) {
        return res.status(422).json({
           error: errors.array()[0].msg
        });
      }
      //checking user in database..
      User.findOne({email},(err, user) =>{
        if(err || !user){
            return res.status(400).json({
                error:"USER email does not exists"
            })
        }
        if(!user.authenticate(password)){
             return res.status(401).json({
                error: "Email and Password dont match"
             })
        }
// crate token...
     const token = jwt.sign({_id: user._id}, process.env.SECRET);
         //put token in cookie..
         res.cookie("token", token ,  { expire: new Date() + 9999 });

         //send response to  the frontend..
         const { _id, name, email, role } = user;
         return res.json({ token, user:{_id, name, email, role} });
      })

      
};


//signout controller..
exports.signout = (req,res) =>{

    res.clearCookie("token");
    res.json({
        message:"User Signout successfully"
    });
 };


 // protected routes
 exports.isSignedIn = expressjwt({
    secret: process.env.SECRET,
    userProperty:"auth"
 });

 //custom middlewares..

 exports.isAuthenticated = (req, res , next) =>{
    let checker  = req.profile && req.auth && req.profile._id == req.auth._id;
    if(!checker){
        return res.status(403).json({
            error:"ACCESS DENIED"
        });

    }

    next();
 }
 exports.isAdmin = (req,res,next) => {

   if(req.profile.role === 0){
    return res.status(403).json({
        error:"you are not ADMIN,Acess Denied"
    });
   }
    next();
 }