const mongoose = require("mongoose");

mongoose.set("debug", true);
mongoose.set("useUnifiedTopology", true);
mongoose.Promise = global.Promise;

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/nightlifeapp", {
    useNewUrlParser: true,
  })
  .then(() => {
    return console.log("Connected to Mongo DB");
  })
  .catch((err) => {
    console.log(`Error: ${err}`);
  });

module.exports.Users = require("./UsersModel");
module.exports.Bars = require("./BarsModel");
