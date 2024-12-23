const express = require('express');
const app = express();

const paymentRoutes = require('./routes/Payment');

//this package enables both front end and backend at different ports simultaneously 
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);

app.use(express.json());

app.use('/api/v1/payment',paymentRoutes);

app.get('/',(req,res) =>{
    res.json({
        success: true,
        message: "Your server is up and running...."
    });
});

app.listen(PORT,()=>{
    console.log(`App is running at ${PORT}`);
});