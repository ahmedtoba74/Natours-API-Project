const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data: ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
    new AppError("Your token has expired! Please log in again.", 401);
// Error handling for development environment

const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith("/api")) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // RENDERING WEBSITE
        res.status(err.statusCode).render("error", {
            title: "Somthing went wrong",
            msg: err.message,
        });
    }
};

const sendErrorProd = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith("/api")) {
        // Send a generic error message to the client
        if (err.isOperational) {
            // Operational errors are expected and handled gracefully
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        return res.status(500).json({
            // For programming or unknown errors, don't leak details to the client
            status: "error",
            message: "Something went very wrong!",
        });
    }
    // RENDERING WEBSITE
    if (err.isOperational) {
        // console.log(err);
        // Operational errors are expected and handled gracefully
        return res.status(err.statusCode).render("error", {
            title: "Somthing went wrong!",
            msg: err.message,
        });
    }
    return res.status(err.statusCode).render("error", {
        title: "Somthing went wrong!",
        msg: "Please try again later",
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    // console.log("Error name:", err.name);
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = { ...err }; // Shallow copy of the error object
        error.message = err.message;
        // Handle specific error types
        if (err.name === "CastError") {
            // Handle MongoDB CastError
            error = handleCastErrorDB(err);
        }
        if (err.code === 11000) {
            // Handle MongoDB Duplicate Key Error
            error = handleDuplicateFieldsDB(err);
        }
        if (err.name === "ValidationError") {
            error = handleValidationErrorDB(err);
        }
        if (err.name === "JsonWebTokenError") {
            error = handleJWTError();
        }
        if (err.name === "TokenExpiredError") {
            error = handleJWTExpiredError();
        }
        sendErrorProd(error, req, res);
    }
};
