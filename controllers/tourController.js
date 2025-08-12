/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-object-spread */
/* eslint-disable prettier/prettier */

const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5"; // Limit to 5 results
    req.query.sort = "price,-ratingsAverage"; // Sort by price ascending and ratings descending
    req.query.fields = "name,price,ratingsAverage,summary,difficulty"; // Limit fields to these
    next(); // Call next middleware
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {
    path: "reviews",
    select: "-__v -tour",
});

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }, // Match tours with average rating >= 4.5
        },
        {
            $group: {
                _id: "$difficulty", // Group by difficulty
                numTours: { $sum: 1 },
                numRatings: { $sum: "$ratingsQuantity" },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
            },
        },
        {
            $sort: { avgPrice: 1 }, // Sort by average price ascending
        },
    ]);
    res.status(200).json({
        status: "success",
        data: {
            stats,
        },
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1; // Convert year to number

    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates", // Unwind the startDates array
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`), // Match dates greater than or equal to January 1st of the year
                    $lte: new Date(`${year}-12-31`), // Match dates less than or equal to December 31st of the year
                },
            },
        },
        {
            $group: {
                _id: { $month: "$startDates" }, // Group by month
                numTours: { $sum: 1 }, // Count the number of tours
                tours: { $push: "$name" }, // Collect tour names
            },
        },
        {
            $addFields: { month: "$_id" }, // Add month field
        },
        {
            $project: {
                _id: 0, // Exclude _id field
            },
        },
        {
            $sort: { month: 1 }, // Sort by month ascending
        },
        {
            $limit: 12, // Limit to 12 months
        },
    ]);

    res.status(200).json({
        status: "success",
        data: { plan },
    });
});
