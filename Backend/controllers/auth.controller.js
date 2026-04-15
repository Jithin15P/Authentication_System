import { User } from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import {generateVerificationCode} from '../utils/generateVerificationCode.js'
import {generatetokenAndSetCookie} from '../utils/generatetokenAndSetCookie.js'
import { sendVerificationEmail } from "../mailtrap/emails.js"; 
import { sendWelcomeEmail } from "../mailtrap/emails.js";

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
  res.send("Signup route");
};

//Logout
export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({success:true,message:"Logged out successfully"})
};
