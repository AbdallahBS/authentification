import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import router from './router/route.js';
const app  =express();

//**data base connection */
mongoose.connect('mongodb+srv://tunintelligentsia:tunintelligentsia@tunintelligentsia.rx0rqoq.mongodb.net/')
.then(()=>{
    console.log("data base connected");
})
/**midlware */
app.use(express.json({limit :'10mb'}));
app.use(cors());
app.use(morgan('tiny'));
app.disable('x-powered-by');
const port = 8080;


//**http get request */
app.get('/',(req,res)=>{
    res.status(201).json("Home GET Request");
});

/**api routes */

app.use('/api',router)



/**port listen */
app.listen(port,()=>{
    console.log("server running");
})