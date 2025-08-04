const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");

dotenv.config({ path: `${__dirname}/../../config.env` });

const DB = process.env.DATABASE.replace(
    "<db_password>",
    process.env.DATABASE_PASSWORD,
);

mongoose
    // .connect(process.env.DATABASE_LOCAL, {
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then(() => {
        console.log("DB connection successfully");
    })
    .catch((err) => console.error("DB connection error:", err));

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8"),
);

const importData = async () => {
    try {
        await Tour.create(tours);
        console.log("Data successfully loaded!");
        process.exit();
    } catch (error) {
        console.error("Error loading data:", error);
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log("Data successfully deleted!");
        process.exit();
    } catch (error) {
        console.error("Error deleting data:", error);
    }
};

if (process.argv[2] === "--import") {
    importData();
}
if (process.argv[2] === "--delete") {
    deleteData();
}

// console.log(process.argv);
