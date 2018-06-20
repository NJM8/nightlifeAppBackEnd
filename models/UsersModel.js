const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  lastSearchedLocation: {
    type: String
  }
},
{timestamps: true}
)

userSchema.pre('save', function (next) {
  let user = this
  if (!user.isModified('password')) {
    return next()
  }
  bcrypt.hash(user.password, 10).then(function (hashedPassword) {
    user.password = hashedPassword
    return next()
  }, function (err) {
    return next(err)
  })
})

userSchema.pre('remove', function (next) {
  Polls.find({user: this.id}).then(polls => {
    polls.forEach(poll => {
      poll.remove()
    })
    return next()
  }).catch(err => {
    return next(err)
  })
})

userSchema.methods.comparePassword = function (candidatePassword, next) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) {
      return next(err)
    }
    return next(null, isMatch)
  })
}

module.exports = mongoose.model('User', userSchema)
