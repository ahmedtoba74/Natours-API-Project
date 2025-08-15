const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError(`document with that ID not found`, 404)); // Use AppError for consistent error handling
        }
        res.status(204).json({
            status: "success",
            data: null,
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!doc) {
            return next(new AppError("document not found", 404)); // Use AppError for consistent error handling
        }
        res.status(200).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) {
            query = query.populate(popOptions);
        }
        const doc = await query;

        if (!doc) {
            return next(new AppError("document with that ID not found", 404)); // Use AppError for consistent error handling
        }
        res.status(200).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });

exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews on tour
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        // Execute query
        const features = new APIFeatures(Model.find(filter), req.query);
        features.filter();
        features.sort();
        features.limitFields();
        features.paginate();
        const { query } = features;
        const doc = await query;

        // Send response
        res.status(200).json({
            requestedAt: req.requestTime,
            status: "success",
            results: doc.length,
            data: {
                data: doc,
            },
        });
    });
