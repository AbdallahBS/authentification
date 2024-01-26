import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import ENV from '../config.js'

let nodeConfig = {
    
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          // TODO: replace `user` and `pass` values from <https://forwardemail.net>
          user: ENV.EMAIL,
          pass: ENV.PASSWORD,
        },
      }
let transporter  = nodemailer.createTransport(nodeConfig);
let MailGenerator = new Mailgen({
    theme : "Default",
    product : {
        name : "Mailgen",
        link  : 'https://mailgen.js/'
    }
})
/** POST: http://localhost:8080/api/registreMail
 * @param : {
  "username" : "exemplae123",
  "userEmail" : "admin123",
  "text" :"",
   "subject" :""
}
*/ 
export const registerMail = async (req,res)=>{
    const { username,userEmail,text,subject}=req.body;
    console.log("test this email",username)
    // body of the email  
    var email  = {body : {name : username,
                          intro : text|| "Welcome to daily tutution",
                          outro : "need help ?"  }}
    var emailBody = MailGenerator.generate(email);
    console.log("writing of the message")
    let message = {
        from  : ENV.EMAIL,
        to:userEmail,
        subject : subject || "signup succefull",
        html : emailBody
    }
    //send mail 
    console.log("sending mail ...")
    transporter.sendMail(message)
    .then(()=> {console.log("email sent ") ;
    return res.status(200).send({msg :"you should recive an email from us "})})
    .catch(error=> res.status(500).send({error}))
}