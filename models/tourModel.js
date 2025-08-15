const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel");
// const validator = require("validator");

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "A tour must have a name"],
            unique: true,
            trim: true,
            maxlength: [
                40,
                "A tour name must have less or equal than 40 characters",
            ],
            minlength: [
                10,
                "A tour name must have more or equal than 10 characters",
            ],
            // validate: [
            //     validator.isAlpha,
            //     "Tour name must only contain letters",
            // ],
            validate: {
                validator: function (val) {
                    // This is a custom validator to check if the name contains only letters and spaces
                    return /^[a-zA-Z\s]+$/.test(val);
                },
                message: "Tour name must only contain letters and spaces",
            },
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, "A tour must have a duration"],
            min: [1, "Duration must be above 0"],
            validate: {
                validator: function (val) {
                    // This is a custom validator to check if the duration is a number
                    return typeof val === "number";
                },
                message: "Duration must be a number",
            },
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have a group size"],
            min: [1, "Group size must be above 0"],
            validate: {
                validator: function (val) {
                    // This is a custom validator to check if the group size is a Number
                    return typeof val === "number";
                },
                message: "Group size must be a number",
            },
        },
        difficulty: {
            type: String,
            required: [true, "A tour must have a difficulty"],
            enum: {
                values: ["easy", "medium", "difficult"],
                message: "Difficulty is either: easy, medium, or difficult",
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, "Rating must be above 1.0"],
            max: [5, "Rating must be below 5.0"],
            set: (val) => Math.round(val * 10) / 10, // Round to one decimal place
            validate: {
                validator: function (val) {
                    // This is a custom validator to check if the rating is a number
                    return typeof val === "number";
                },
                message: "Rating must be a number",
            },
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
            validate: {
                validator: function (val) {
                    // This is a custom validator to check if the quantity is a non-negative integer
                    return Number.isInteger(val) && val >= 0;
                },
                message: "Ratings quantity must be a non-negative integer",
            },
        },
        price: {
            type: Number,
            required: [true, "A tour must have a price"],
            min: [0, "Price must be above 0"],
            validate: {
                validator: function (val) {
                    // This is a custom validator to check if the price is a number
                    return typeof val === "number";
                },
                message: "Price must be a number",
            },
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this only points to current doc on NEW document creation
                    return val < this.price;
                },
                message:
                    "Discount price ({VALUE}) should be below regular price",
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, "A tour must have a summary"],
            maxlength: [
                100,
                "A tour summary must have less or equal than 100 characters",
            ],
            minlength: [
                10,
                "A tour summary must have more or equal than 10 characters",
            ],
        },
        description: {
            type: String,
            trim: true,
            required: [true, "A tour must have a description"],
        },
        imageCover: {
            type: String,
            required: [true, "A tour must have a cover image"],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, // Exclude from output by default
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: "Point",
                enum: ["Point"],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: "Point",
                    enum: ["Point"],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function () {
    return this.duration / 7;
});

//  Virtual populate
tourSchema.virtual("reviews", {
    ref: "Review",
    foreignField: "tour",
    localField: "_id",
});

// Document middleware: runs before .save() and .create()
tourSchema.pre("save", function (next) {
    // Perform any pre-save operations here, if needed
    this.slug = slugify(this.name, { lower: true });
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v -passwordChangedAt -tour",
    });
    next();
});

// tourSchema.pre("save", async function (next) {
//     const guidesPromises = this.guides.map(
//         async (id) => await User.findById(id),
//     );
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre("save", function (next) {
//     console.log("Will save document...");
//     next();
// });

// tourSchema.post("save", function (doc, next) {
//     console.log(doc);
//     next();
// });

// Query middleware
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } }); // Exclude secret tours from all find queries
    this.start = Date.now();
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next();
});

// Aggregation middleware
// tourSchema.pre("aggregate", function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // Exclude secret tours from aggregation
//     console.log(this.pipeline());
//     next();
// });

const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;
