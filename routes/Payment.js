const express = require('express');
const router = express.Router();

const {
    capturePayment,
    verifySignature,
    sendPaymentSuccessfullEmail
} = require('../controllers/Payment')

router.post('/capturePayment',capturePayment);
router.post('/verifySignature',verifySignature);
router.post('/sendPaymentSuccessEmail',sendPaymentSuccessfullEmail);

module.exports = router;