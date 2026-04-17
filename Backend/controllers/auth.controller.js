import bcrypt from 'bcryptjs'
import crypto from "crypto";

import { User } from "../models/user.model.js";

import {generateVerificationCode} from '../utils/generateVerificationCode.js'
import {generatetokenAndSetCookie} from '../utils/generatetokenAndSetCookie.js'
import { sendVerificationEmail } from "../mailtrap/emails.js"; 
import { sendWelcomeEmail } from "../mailtrap/emails.js";
import {sendPasswordResetEmail} from "../mailtrap/emails.js"
import {sendResetSuccessEmail} from "../mailtrap/emails.js"

//SignUp
export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }

    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password,10);
    const verificationCode = generateVerificationCode();
    const user = new User({
        email,
        password: hashedPassword,
        name,
        verificationToken:verificationCode,
        verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 *1000
    })

    await user.save();

    generatetokenAndSetCookie(res,user._id);

    await sendVerificationEmail(user.email,verificationCode)

    res.status(201).json({
        success:true,
        message:"User created successfully",
        user:{
            ...user._doc,
            password:undefined
        }
    })

  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

//Verify
export const verifyEmail = async (req,res)=>{
   const {code}=req.body; 
    try{
        const user = await User.findOne({
            verificationToken:code,
            verificationTokenExpiresAt: {$gt:Date.now()}
        })
        if(!user){
            return res.status(400).json({success:false,message:"Invalid or expired verification code"})
        }
        user.isVerified=true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email,user.name);
        res.status(200).json({success:true,
          message:"Email verified Successfully",
          user:{
            ...user._doc,
            password:undefined,
          }
        })
    }catch(error){
      console.log("Error in verify email is", error)
       res.status(500).json({success:false,message:"Server error"})
    }

}

//Login 
export const login = async (req, res) => {
   const {email,password}=req.body;
   try{
    const user = await User.findOne({email});
    if(!user){
     return res.status(400).json({success:false,message:"Invalid credentials"});
    }
    const isPasswordValid = await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
       return res.status(400).json({success:false,message:"Invalid credentials"});
    }
    generatetokenAndSetCookie(res,user._id);

    user.lastLogin =  new Date();
    await user.save();
    res.status(200).json({
      success:true,
      message:"Logged in successfully",
      user:{
        ...user._doc,
        password:undefined,
      },
    })

   }catch(error){
    console.log("Error in login function",error);
    res.status(400).json({success:false,message:error.message})
   }
};

//Logout
export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({success:true,message:"Logged out successfully"})
};

//Forgot Password
export const forgotPassword = async(req,res)=>{
  const {email} =req.body;
  try{
    const user=await User.findOne({email});
    if(!user){
      return res.status(400).json({success:false,message:"User not found"})
    }

      //Generate Reset Token
      const resetToken = crypto.randomBytes(20).toString("hex");
      const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000 //1hour

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiresAt = resetTokenExpiresAt;

      await user.save();

      //send email
      await sendPasswordResetEmail(user.email,`${process.env.CLIENT_URL}/reset-password/${resetToken}`)

      res.status(200).json({success:true,message:"Password rest link sent to your email"})
  }catch(error){
    console.log(error)
    res.status(400).json({success:false,message:error.message})
  }
}

//Reset Password
export const resetPassword = async(req,res)=>{
  try{
    const {token} = req.params;
    const {password} = req.body;

    const user = await User.findOne({
      resetPasswordToken:token,
      resetPasswordExpiresAt : {$gt:Date.now()},
    });

    if(!user){
      return res.status(400).json({success:false,message:"Invalid or expired reset token"});
    }

    //Update Password
    const hashedPassword = await bcrypt.hash(password,10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    await sendResetSuccessEmail(user.email);

    res.status(200).json({success:true,message:"Password reset successful"})
  }catch(error){
    console.log("Error in resetPassword",error);
    res.status(400).json({success:false,message:error.message})
  }
}

//Authentication
export const checkAuth = async(req,res)=>{
  try{
    const user = await User.findById(req.userId).select("-password")
    if(!user){
      return res.status(400).json({success:false,message:"User not found"});
    }

    res.status(200).json({success:true,user })
  }catch(error){
    console.log("Error in checkAuth ",error);
    res.status(400).json({success:false,message:error.message});
  }
}
