const mongoose = require('mongoose')

mongoose.set('debug', true)
mongoose.Promise = global.Promise

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost/nightlifeapp')
  .then(() => {
    return console.log('Connected to Mongo DB')
  })
  .catch(err => {
    console.log(`Error: ${err}`)
  })

module.exports.Users = require('./UsersModel')
