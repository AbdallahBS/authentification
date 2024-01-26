import UserModel from "../model/User.model.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ENV from '../config.js';
import otpGenerator from 'otp-generator' 
/**midlware for verify user*/

export async function verifyUser(req,res,next){
    try{
        const {username} = req.method == "GET" ? req.query : req.body;
        //check if the user exist

        let exist = await UserModel.findOne({username});
        if(!exist) return res.status(404).send({error : "Can't find user"});
        next();
    }
    catch(error){
        return res.status(404).send({error : "Authentication Error"});
    }
}
/** POST: http://localhost:8080/api/register 
 * 
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Kulas Light, Gwenborough",
  "profile": ""
}
*/
export async function register(req,res){
    try {
        const { username, password, profile, email } = req.body;        

        // check the existing user
const existUsername = UserModel.findOne({ username })
.then(user => {
    if (user) {
        throw { status: 400, response: { error: "Please use a unique username" } };
    }
});

// check for existing email
const existEmail = UserModel.findOne({ email })
.then(existingEmail => {
    if (existingEmail) {
        throw { status: 400, response: { error: "Please use a unique email" } };
    }
});

Promise.all([existUsername, existEmail])
.then(() => {
    // Continue with user registration logic
    if (password) {
        bcrypt.hash(password, 10)
            .then(hashedPassword => {
                const user = new UserModel({
                    username,
                    password: hashedPassword,
                    profile: profile || '',
                    email
                });

                user.save()
                    .then(result => res.status(201).send({ msg: "User Registered Successfully" }))
                    .catch(error => res.status(500).send({ error }));
            })
            .catch(error => {
                return res.status(500).send({
                    error: "Unable to hash the password"
                });
            });
    }
})
.catch(error => {
    const status = error.status || 500;
    const response = error.response || { error: 'Error during registration' };
    return res.status(status).send(response);
});


    } catch (error) {
        return res.status(500).send(error);
    }
}
/** POST: http://localhost:8080/api/login 
 * @param : {
  "username" : "example123",
  "password" : "admin123"
}
*/
export async function login(req, res) {
    const { username, password } = req.body;
    try {
        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(404).send({ error: "Username not found" });
        }

        const passwordCheck = await bcrypt.compare(password, user.password);

        if (!passwordCheck) {
            return res.status(400).send({ error: "Incorrect password" });
        }

        // JWT token
        const token = jwt.sign({
            userid: user._id,
            username: user.username
        }, ENV.JWT_SECRET, { expiresIn: "24h" });

        return res.status(200).send({
            msg: "Login successful",
            username: user.username,
            token
        });
    } catch (error) {
        console.error('Error in login:', error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}
/** GET: http://localhost:8080/api/user/example123 */
export async function getUser(req, res) {
    const { username } = req.params;

    try {
        if (!username) {
            return res.status(400).send({ error: "Invalid Username" });
        }

        const user = await UserModel.findOne({ username }).exec();

        if (!user) {
            return res.status(404).send({ error: "Couldn't find the user" });
        }

        // Remove password from user
        const { password, ...rest } = user.toJSON();

        return res.status(200).send(rest);
    } catch (error) {
        console.error('Error in getUser:', error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}

/** PUT: http://localhost:8080/api/updateuser 
 * @param: {
  "header" : "<token>"
}
body: {
    firstName: '',
    address : '',
    profile : ''
}
*/
export async function updateUser(req, res) {
    try {

        const {userid} = req.user
        if (userid) {
            const body = req.body;

            // update the data
            try{
            const updatedUser = await UserModel.updateOne({ _id: userid }, { $set: body });
            
            
                    return res.status(200).send({ msg: "Record Updated...!" });
            }catch(error) {
                return res.status(404).send({ error: "User not found or no changes made..." });
            }
        } else {
            return res.status(401).send({ error: "User Not Found...!" });
        }
    } catch (error) {
        console.error('Error in updateUser:', error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}
/** GET: http://localhost:8080/api/generateOTP */
export async function generateOTP(req,res){
   req.app.locals.OTP= await otpGenerator.generate(6,{lowerCaseAlphabets : false , upperCaseAlphabets : false ,specialChars : false})
   res.status(201).send({code : req.app.locals.OTP})
}
/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req,res){
   const {code} = req.query;
   console.log(code);
   if(code && parseInt(req.app.locals.OTP)===parseInt(code)){
    req.app.locals.OTP =null;//reset the OTP value
    req.app.locals.resetSession = true ; // start the session of reset password 
    return res.status(201).send ({msg : "verified succesfully"});
   }
   return res.status(400).send({error : "Invalid OTP "})
}
// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req,res){
    if(req.app.locals.resetSession){
         // alow acces only once
        return res.status(200).send({flag : req.app.locals.resetSession}) 
    }
    return res.status(440).send({error : "Session expired ! "})
}

// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword */
export async function resetPassword(req, res) {
    try {
        if(!req.app.locals.resetSession)    return res.status(440).send({error : "Session expired ! "})
        
        const { username, password } = req.body;
        try {
            const user = await UserModel.findOne({ username });
            
            if (!user) {
                return res.status(404).send({ error: "Username not found" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            await UserModel.updateOne({ username: user.username }, { password: hashedPassword });

            return res.status(201).send({ msg: "Record updated...!" });
        } catch (error) {
            return res.status(500).send({ error: "Unable to update password" });
        }
    } catch (error) {
        return res.status(401).send({ error });
    }
}