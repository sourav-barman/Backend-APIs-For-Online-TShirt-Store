const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const customError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/mailHelper");
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
    const {name, email, password} = req.body;

    if (!req.files) {
        return next(new customError("photo is required for signup", 400));
    }

    if (!email || !name || !password) {
        return next(new customError("Name, email and password are required", 400));
    }

    let file = req.files.photo;
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
    });

    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url
        }
    });

    cookieToken(user, res);
    
});

exports.login = BigPromise(async (req, res, next) => {
    const {email, password} = req.body;

    //check for presense of email and password
    if (!email || !password) {
        return next(new customError("please provide email and password", 400));
    }

    //get user from DB
    const user = await User.findOne({email}).select("+password");

    //if user not found in DB
    if (!user) {
        return next(new customError("Email or Password does not match", 400));
    }

    //match the password
    const isCorrectPassword = await user.isValidPassword(password);

    //if password do not match
    if (!isCorrectPassword) {
        return next(new customError("Email or Password does not match", 400));
    }

    //if all goes good send the token
    cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logout success"
    });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
    const {email} = req.body;

    const user = await User.findOne({email});
    if (!user) {
        return next(new customError("Email not found as registered", 400));
    }

    const forgotToken = user.getForgotPasswordToken();

    await user.save({validateBeforeSave: false});

    const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;

    const message = `Copy paste this link in your URL and hit enter \n\n ${myUrl}`;

    try {
        await mailHelper({
            email: user.email,
            subject: "LCO TStore - Password reset email",
            message
        });
        res.status(200).json({
            success: true,
            message: "Email sent successfully"
        });      
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({validateBeforeSave: false});

        return next(new customError(error.message, 500));
    }

});

exports.passwordReset = BigPromise(async (req, res, next) => {
    const token = req.params.token;

    const encryptedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        encryptedToken, 
        forgotPasswordExpiry: {$gt: Date.now()}
    });

    if (!user) {
        return next(new customError("Token is invalid or expired", 400));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new customError("Password and Confirm password do not match", 400));
    }

    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save({validateBeforeSave: false});

    //send a JSON response or send Token

    cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });
});

exports.changePassword = BigPromise(async (req, res, next) => {
    const userId = req.user.id;

    const user = await User.findById(userId).select("+password");

    const isCorrectOldPassword = await user.isValidPassword(req.body.oldPassword);

    if (!isCorrectOldPassword) {
        return next(new customError("Old password is incorrect", 400));
    }

    user.password = req.body.newPassword;
    await user.save({validateBeforeSave: false});

    cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
    const newData = {
        name: req.body.name,
        email: req.body.email
    }

    if (!newData.name || !newData.email) {
        return next(new customError("Name or Email can not be empty", 400));
    }

    if (req.files) {
        const user = await User.findById(req.user.id);
        const imageId = user.photo.id;

        //delete photo on cloudinary
        await cloudinary.v2.uploader.destroy(imageId);

        //upload the new photo
        let file = req.files.photo;
        const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
        });

        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        user
    });
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    });
});

exports.admingetOneUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new customError("No user found", 400));
    }

    res.status(200).json({
        success: true,
        user
    });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    };

    if (req.files) {
        const user = await User.findById(req.params.id);
        const imageId = user.photo.id;

        //delete photo on cloudinary
        await cloudinary.v2.uploader.destroy(imageId);

        //upload the new photo
        let file = req.files.photo;
        const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
        });

        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url
        }
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        user
    });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new customError("No such user found", 401));
    }

    const imageId = user.photo.id;

    await cloudinary.v2.uploader.destroy(imageId);

    await User.deleteOne({_id: user._id});

    res.status(200).json({
        success: true,
    });
});

exports.managerAllUser = BigPromise(async (req, res, next) => {
    const users = await User.find({role: "user"});

    res.status(200).json({
        success: true,
        users
    });
});