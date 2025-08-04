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

// Error handling for development environment

const sendErrorDev = (err, res) => {
    console.error("Error:", err);
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    // Log the error for production
    console.error("Error:", err);
    // Send a generic error message to the client
    if (err.isOperational) {
        // Operational errors are expected and handled gracefully
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
        // eslint-disable-next-line no-else-return
    } else {
        res.status(500).json({
            // For programming or unknown errors, don't leak details to the client
            status: "error",
            message: "Something went very wrong!",
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = { ...err }; // Shallow copy of the error object
        // Handle specific error types
        if (err.name === "CastError") {
            // Handle MongoDB CastError
            error = handleCastErrorDB(error);
        }
        if (error.code === 11000) {
            // Handle MongoDB Duplicate Key Error
            error = handleDuplicateFieldsDB(error);
        }
        if (err.name === "ValidationError") {
            error = handleValidationErrorDB(error);
        }
        sendErrorProd(error, res);
    }
};
