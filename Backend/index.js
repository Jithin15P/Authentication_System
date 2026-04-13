import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { connectDB } from "./db/connectDB.js";


const app=express();

app.get("/",(req,res)=>{
    res.send("Hello World!")
})

app.listen(3000,()=>{
    connectDB();
    console.log("server is running on port 3000")
})

//vZ1sASB7GnduegFO
//pjithinnavodaya_db_user

//