const mongoose = require("mongoose");
const Tour = require("./tourModel");

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

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "tour user",
        select: "name photo",
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const id = mongoose.Types.ObjectId.isValid(tourId)
        ? new mongoose.Types.ObjectId(tourId)
        : tourId;
    // console.log("tourId:", id);
    const stats = await this.aggregate([
        {
            $match: { tour: id },
        },
        {
            $group: {
                _id: "$tour",
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" },
            },
        },
    ]);
    // console.log("States: ", stats);

    await Tour.findByIdAndUpdate(id, {
        ratingsQuantity: stats.length > 0 ? stats[0].nRating : 0,
        ratingsAverage: stats.length > 0 ? stats[0].avgRating : 4.5,
    });
};

reviewSchema.post("save", function () {
    // this point to current review
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.model.findOne(this.getQuery());
    // console.log(this.r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
