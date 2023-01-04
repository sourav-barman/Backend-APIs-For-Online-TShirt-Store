const BigPromise = require("../middlewares/bigPromise");
const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.sendStripeKey = BigPromise(async (req, res, next) => {
    res.status(200).json({
        success: true,
        stripekey: process.env.STRIPE_API_KEY
    });
});

exports.captureStripePayment = BigPromise(async (req, res, next) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: 'inr',
        automatic_payment_methods: {enabled: true},

        //optional
        metadeta: {integration_check: 'accept_a_payment'}
      });

      res.status(200).json({
        success: true,
        amount: req.body.amount,
        client_secret: paymentIntent.client_secret
        //you can optionally send id as well
      });
});

exports.sendRazorpayKey = BigPromise(async (req, res, next) => {
    res.status(200).json({
        success: true,
        razorpaykey: process.env.RAZORPAY_API_KEY
    });
});

exports.captureRazorpayPayment = BigPromise(async (req, res, next) => {
    var instance = new Razorpay({ 
        key_id: process.env.RAZORPAY_API_KEY, 
        key_secret: process.env.RAZORPAY_SECRET 
    });

    const myOrder = await instance.orders.create({
        amount: req.body.amount,
        currency: "INR",
        //receipt: "receipt#1", --->use nanoid to generate rndm numbr
    });

    res.status(200).json({
        success: true,
        amount: req.body.amount,
        myOrder
      });
});