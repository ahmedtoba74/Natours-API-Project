const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() +
                process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions);

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

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
    createSendToken(newUser, 201, res);
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
    user.password = undefined;
    // console.log("User found:", user);
    createSendToken(user, 200, res);
});

exports.logout = catchAsync((req, res, next) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({ status: "success" });
});

exports.protect = catchAsync(async (req, res, next) => {
    // Check if token is provided
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(
            new AppError(
                "You are not logged in! Please log in to get access.",
                401,
            ),
        );
    }
    // Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                "The user belonging to this token does not exist.",
                401,
            ),
        );
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                "User recently changed password! Please log in again.",
                401,
            ),
        );
    }
    // Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser; // Make user available in response locals
    next();
});

// Only for renderd pages, no erors!
exports.isLoggedIn = async (req, res, next) => {
    // Check if token is provided
    if (req.cookies.jwt) {
        try {
            // Verfiy token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET,
            );
            // Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            // There is a logged in user
            res.locals.user = currentUser; // Make user available in response locals
            return next();
        } catch (err) {
            return next();
        }
    }
    return next();
};

exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        // roles is an array e.g. ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    "You do not have permission to perform this action",
                    403,
                ),
            );
        }
        next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user || user.length === 0) {
        return next(
            new AppError("There is no user with that email address", 404),
        );
    }
    // Generate a reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get(
        "host",
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. If you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 min)",
            message,
        });

        res.status(200).json({
            status: "success",
            message: "Token sent to email!",
        });
    } catch (err) {
        // console.error("EMAIL SENDING ERROR:", err);  Log the error for debugging
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
            new AppError(
                "There was an error sending the email. Try again later!",
                500,
            ),
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // Get the token from the URL

    const resetToken = req.params.token;
    // Hash the token to compare with the stored hashed token
    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    // Find the user with the hashed token and check if the token is still valid
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }, // Check if the token is still valid
    });
    if (!user) {
        return next(new AppError("Token is invalid or has expired", 400));
    }
    // Update the user's password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // Save the updated user
    // Generate a new JWT token for the user
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const { passwordCurrent } = req.body;
    const { password } = req.body;
    const { passwordConfirm } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
        return next(new AppError("Your current password is wrong", 401));
    }
    user.password = password;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    user.password = undefined;
    createSendToken(user, 200, res);
});
