const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
// Function to handle user signup

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    if (!newUser) {
        return next(new AppError("User creation failed", 400));
    }
    // Remove sensitive information before sending the response
    // Note: In a real application, you would also want to handle password hashing and token generation here.
    newUser.password = undefined; // Remove password from response
    newUser.role = undefined; // Remove role from response

    // Generate a JWT token for the user
    const token = signToken(newUser._id);

    res.status(201).json({
        status: "success",
        token,
        data: {
            user: newUser,
        },
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }
    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    // Check if user exists and if the password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }
    // Generate a JWT token for the user
    console.log("User found:", user);
    const token = signToken(user._id);
    res.status(200).json({
        status: "success",
        token,
    });
});
