import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js"
import { mailtrapClient,sender } from "./mailtrap.config.js"

export const sendVerificationEmail = async (email,verificationCode)=>{
    const recipient =[{email}]

    try{
        const response = await mailtrapClient.send({
            from:sender,
            to:recipient,
            subject:"verify your email",
            html:VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}",verificationCode),
            category:"Email Verification"
        })

        console.log("Email sent successfully",response)
    }catch(error){
        console.error("Error sending verification",error);
        throw new Error (`Errorsending verification email :${error}`)
    }
}