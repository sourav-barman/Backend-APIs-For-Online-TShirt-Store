const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const customError = require("../utils/customError");
const cloudinary = require("cloudinary");
const WhereClause = require("../utils/whereClause");

exports.addProduct = BigPromise(async (req, res, next) => {
    let imageArray = [];

    if (!req.files) {
        return next(new customError("images are required", 401));
    }

    if (req.files) {
        for (let index = 0; index < req.files.photos.length; index++) {
            let result = await cloudinary.v2.uploader.upload(req.files.photos[index].tempFilePath, {
                folder: "products"
            });
            imageArray.push({
                id: result.public_id,
                secure_url: result.secure_url
            });            
        }
    }

    req.body.photos = imageArray;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(200).json({
        success: true,
        product
    });
});

exports.getAllProduct = BigPromise(async (req, res, next) => {

    const resultperPage = 6;
    const totalCountProduct = await Product.countDocuments();

    const productsObj = new WhereClause(Product, req.query).search().filter();

    let products = await productsObj.base;
    const filteredProductNumber = products.length;

    productsObj.pager(resultperPage);
    products = await productsObj.base.clone();

    res.status(200).json({
        success: true,
        products,
        filteredProductNumber,
        totalCountProduct
    });
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new customError("No product found with this id", 401));
    }

    res.status(200).json({
        success: true,
        product
    });
});

exports.addReview = BigPromise(async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    };

    let product = await Product.findById(productId);

    const alreadyReviewed = product.reviews.find(
        (rev) => rev.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
        product.reviews.forEach(rev => {
            if (rev.user.toString() === req.user._id.toString()) {
                rev.rating = rating;
                rev.comment = comment;
            }
        });
    } else {
        product.reviews.push(review);
        product.numberOfReviews = product.reviews.length;
    }
    
    //adjust ratings
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.numberOfReviews;

    //save
    product.save({validateBeforeSave: false});

    res.status(200).json({
        success: true
    });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
    const {productId} = req.query;

    let product = await Product.findById(productId);

    product.reviews = product.reviews.filter(
        (rev) => rev.user.toString() !== req.user._id.toString()
    );

    product.numberOfReviews = product.reviews.length;

    //adjust ratings
    product.ratings = (product.numberOfReviews === 0) ?
     0 : product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.numberOfReviews;

    //save
    product.save({validateBeforeSave: false});

    res.status(200).json({
        success: true
    });
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    res.status(200).json({
        success: true,
        reviews: product.reviews
    });
});

exports.adminGetAllProduct = BigPromise(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products
    });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new customError("No product found with this id", 401));
    }

    let imageArray = [];

    if (req.files) {
        //destroy the existing images
        for (let index = 0; index < product.photos.length; index++) {
            await cloudinary.v2.uploader.destroy(product.photos[index].id);            
        }

        for (let index = 0; index < req.files.photos.length; index++) {
            let result = await cloudinary.v2.uploader.upload(req.files.photos[index].tempFilePath, 
            {
                folder: "products",
            });
            
            imageArray.push({
                id: result.public_id,
                secure_url: result.secure_url
            });
        }

        req.body.photos = imageArray;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        product
    });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new customError("No product found with this id", 401));
    }

    //destroy the existing images
    for (let index = 0; index < product.photos.length; index++) {
        await cloudinary.v2.uploader.destroy(product.photos[index].id);            
    }

    await Product.deleteOne({_id: product._id});

    res.status(200).json({
        success: true,
        message: "product was deleted"
    });
});

