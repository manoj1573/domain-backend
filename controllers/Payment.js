const {instance} = require('../config/razorpay');
const { packageMailTemplate } = require('../mail/templates/packageMail');
const mailSender = require('../utils/mailSender');
const {paymentSuccessEmail} = require('../mail/templates/paymentSuccessMail')
const { bundles } = require('../constants/constant')
const crypto = require('crypto')
require('dotenv').config();

//purchasing multiple courses in one go without using web hook
let bundle = null;
exports.capturePayment = async(req,res) =>{

    const {amount,bundleName,isTimeUp} = req.body;
    // console.log(amount)

    // console.log(bundles);
    // set the amount
    bundles.forEach(bd => {
        if(bd.bundleName === bundleName){
            bundle = bd
        }
    })

    //create order or initiate payment
    const options = {
        amount: isTimeUp ? bundle.regularAmount*100 : bundle.discountedAmount*100, //amount is multiplied by 100 and then sent to razorpay
        currency:"INR",
        receipt: Math.random(Date.now()).toString()
    }

    try{

        const paymentResponse = await instance.orders.create(options);
        if(paymentResponse)
            return res.status(200).json({
                success:true,
                data: paymentResponse
            });

    }catch(err){
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Could no initiate order"
        })
    }
}

//if payment successful then send the mail to user
exports.sendPaymentSuccessfullEmail = async(req,res)=>{
    const {orderId,paymentId,amount,name,email} = req.body;
    console.log("paymemt mail ",req.body)

    // console.log("details: ",orderId,paymentId,amount,userId);

    if(!orderId || !paymentId || !amount){
        return res
        .status(404).json({success:false,message:"Please provide all details"});
    }
    
    try{
        const body = paymentSuccessEmail(
            name,
            amount/100,orderId,paymentId
        );
        
        //send mail to user for confirming successfull payment
        await mailSender(
            email,
            `Payment Received`,
            body
        );

    }catch(err){
        console.log("error in sending mail", err)
        return res
          .status(400)
          .json({ success: false, message: "Could not send email" })
    }
}

//verify the payment and enroll student if verified
exports.verifySignature = async(req,res) =>{
    const razorpay_order_id = req?.body?.razorpay_order_id;
    const razorpay_payment_id = req?.body?.razorpay_payment_id;
    const razorpay_signature = req?.body?.razorpay_signature;
    const {name,email} = req.body;

    console.log("Verify ",req.body)
    // console.log("details",razorpay_order_id,razorpay_payment_id,razorpay_signature,userId);

    //validating data
    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
    )
        return res.status(404).json({success:false,message:"Payment Failed"});
    
    //attaching order_id and payment_id as one through OR operator
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
        .createHmac("sha256",process.env.RAZORPAY_SECRET) //Encrypting the razorpay secret
        .update(body.toString()) //attching body in string format with encrypted key
        .digest("hex"); //now again applying the cryptographic algorithm on complete string
    
    //the above signature expected is created and compared with the signature received 
    if(expectedSignature === razorpay_signature){

        // console.log(req.body);
        //if payment verified now send package link
        const packageLink = bundle.link;
        await sendPackageLink(packageLink,{name,email},res);
        return res.status(200).json({ success: true, message: "Payment Verified" })
    }
    
    return res.status(200).json({ success: false, message: "Payment Failed" })
}

const sendPackageLink = async(packageLink,{name,email},res)=>{
    if(!packageLink || !name || !email)
        return res.
            status(400).json({success:false,message:"Please provide complete details"});

    try{

        //body template for Course Enrollement Mail
        const body = packageMailTemplate(packageLink,name);
        const mailResponse = await mailSender(
            email,
            `Package Link - Maverick`,
            body
        );
        
        console.log("Package sent successfully",mailResponse);

    }catch(err){
        console.log(err);
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
}