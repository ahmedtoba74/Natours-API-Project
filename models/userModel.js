/* eslint-disable import/no-extraneous-dependencies */
const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userScema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A user must have a name"],
        trim: true,
        maxlength: [
            40,
            "A user name must have less or equal than 40 characters",
        ],
        minlength: [3, "A user name must have more or equal than 3 characters"],
        validate: {
            validator: function (val) {
                // This is a custom validator to check if the name contains only letters and spaces
                return /^[a-zA-Z\s]+$/.test(val);
            },
            message: "User name must only contain letters and spaces",
        },
    },
    email: {
        type: String,
        required: [true, "A user must have an email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email address"],
        // {
        //     validator: function (val) {
        //         // This is a custom validator to check if the email is validated
        //         return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
        //             val,
        //         );
        //     },
        //     message: "Please provide a valid email address",
        // },
    },
    photo: String,
    role: {
        type: String,
        enum: ["user", "guide", "lead-guide", "admin"],
        default: "user",
    },
    password: {
        type: String,
        required: [true, "A user must have a password"],
        minlength: 8,
        select: false, // This will not return the password in queries
        validate: [validator.isStrongPassword, "Password is not strong enough"],
        // {
        //     // This is a custom validator to check if the password is strong enough
        //     validator: function (val) {
        //         return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(
        //             val,
        //         );
        //     },
        //     message:
        //         "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
        // },
    },
    passwordConfirm: {
        type: String,
        required: [true, "A user must confirm the password"],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function (val) {
                return val === this.password; // 'this' points to the current document
            },
            message: "Passwords are not the same!",
        },
    },
    passwordChangedAt: {
        type: Date,
        default: Date.now,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
});

// Middleware to hash the password before saving the user
userScema.pre("save", async function (next) {
    // Only hash the password if it has been modified (or is new)
    // This prevents hashing the password again if the user is updated without changing the password
    if (!this.isModified("password")) return next();
    // Hash the password with a cost factor of 12
    // This is a good default value for bcrypt
    // It can be adjusted based on the performance requirements of your application
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined; // We don't need to store the passwordConfirm in the database
    next();
});

userScema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure the token is created after the password change
    next();
});

userScema.methods.correctPassword = async function (
    candicatePassord,
    userPassword,
) {
    return await bcrypt.compare(candicatePassord, userPassword);
};

userScema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10,
        ); // Convert to seconds
        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp; // If JWT timestamp is less than the changed timestamp, password was changed after the token was issued
    }

    return false;
};

userScema.methods.createPasswordResetToken = function () {
    // Create a reset token and hash it
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    console.log("Reset Token:", { resetToken }, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    // Return the plain token to send to the user
    return resetToken;
};

const User = mongoose.model("User", userScema);
module.exports = User;
