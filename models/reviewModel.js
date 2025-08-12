const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, "Review can not be empty"],
            trim: true,
            validate: {
                validator: function (val) {
                    return /^[a-zA-Z0-9\s.,!?'"-]+$/.test(val);
                },
                message:
                    "Review name can only contain letters, numbers, spaces, and punctuation marks",
            },
            minlength: [
                1,
                "A Review must have more or equal than 5 characters",
            ],
            maxlength: [
                1000,
                "A Review must have less or equal than 100 characters",
            ],
        },
        rating: {
            type: Number,
            default: 4.5,
            required: [true, "Review must have a rating"],
            min: [1, "rating must be above 1"],
            max: [5, "rating must be below 5"],
            set: (val) => Math.round(val * 10) / 10, // Round to one decimal place
            validate: {
                validator: function (val) {
                    // This is a custom validator to check if the rating is a number
                    return typeof val === "number";
                },
                message: "Rating must be a number",
            },
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: "Tour",
            required: [true, "Review must belong to a tour."],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: [true, "Review must belong to a user."],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "tour user",
        select: "name photo",
    });
    next();
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
