const mongoose = require('mongoose')

const barSchema = new mongoose.Schema({
  barId: {
    type: String,
    required: true
  },
  peopleHere: []
},
{timestamps: true}
)

module.exports = mongoose.model('Bar', barSchema)

