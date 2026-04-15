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

export const sendWelcomeEmail = async (email,name) =>{
    const recipient =[{email}];

    try{
      const response =  await mailtrapClient.send({
            from:sender,
            to:recipient,
            template_uuid:"6e44a728-bc59-4112-a4a7-ba2e259d42e8",
             template_variables: {
         "company_info_name": "Test_Auth_Company"}
        })
        console.log("welcome Email sent successfully",response)
    }catch(error){
        console.error("Error sending welcome email",error)
        throw new Error (`Error sending welcome email:${error}`)
    }
}