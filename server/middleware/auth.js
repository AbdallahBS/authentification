import jwt from 'jsonwebtoken';
import ENV from '../config.js'
export default async function Auth(req,res,next){
    try {
                // acess authorize header to validate requesst
                const token = req.headers.authorization.split(" ")[1];
                //retirive user data
                const decodedToken = await jwt.verify(token,ENV.JWT_SECRET);
                req.user=decodedToken
                next()
    }
    catch(error){
        res.status(401).json({error : "Athentication error"})
    }

}

export function localVariables(req,res,next){
    req.app.locals = { OTP : null,
    resetSession : false }
    next()
}