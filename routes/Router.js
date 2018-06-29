var express = require('express')
var router = express.Router()
var db = require('../models')
var jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.load()
const Yelp = require('yelp-fusion')
const yelp = Yelp.client(process.env.YELP_API_KEY)

router
  .route('/login')
  .post((req, res, next) => {
    db.Users.findOne({ username: req.body.username }).then(user => {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (err) {
          return next(err)
        }
        if (isMatch) {
          const token = jwt.sign({ user_id: user.id }, process.env.SECRET_KEY, { expiresIn: 86400 })
          return res.status(200).json({ 
            idToken: token, 
            expiresIn: 86400, 
            locationsSearched: user.locationsSearched,
            currentLocation: user.currentLocation,
            message: 'Logged In Successfully' })
        } else {
          return res.status(401).send('Invalid Password')
        }
      })
    }).catch(error => {
      res.status(401).send('Invalid Username')
      return next(error)
    })
  })

router
  .route('/signup')
  .post((req, res, next) => {
    db.Users.create(req.body).then(user => {
      const token = jwt.sign({ user_id: user.id }, process.env.SECRET_KEY, { expiresIn: 86400 })
      res.status(200).json({ idToken: token, expiresIn: 86400, message: 'Signed Up Successfully' })
    }).catch(error => {
      if (error.code === 11000) {
        if (error.message.includes('email_1')) {
          return res.status(401).send('Email already taken')
        }
        if (error.message.includes('username_1')) {
          return res.status(401).send('Username already taken')
        }
      }
      return next(error)
    })
  })

router
  .route('/verifyUser')
  .post((req, res, next) => {
    try {
      jwt.verify(req.body.idToken, process.env.SECRET_KEY, function (error, decoded) {
        if (decoded) {
          db.Users.findOne({ _id: decoded.user_id }).then(user => {
            const token = jwt.sign({ user_id: user.id }, process.env.SECRET_KEY, { expiresIn: 86400 })
            return res.status(200).json({
              idToken: token,
              expiresIn: 86400,
              username: user.username,
              locationsSearched: user.locationsSearched,
              currentLocation: user.currentLocation,
              message: `Welcome back ${user.username}!`
            })
          }).catch(error => {
            return next(error)
          })
        } else {
          if (error.name === 'TokenExpiredError') {
            return res.status(401).send({ err: 'login', message: 'Please log in again' })
          }
          return res.status(401).send({ err: 'Invalid Token', message: 'Please log in again' })
        }
      })
    } catch (error) {
      return res.status(401).send({ err: 'Invalid Token', message: 'Please log in again' })
    }
  })

router
  .route('/findBars')
  .post((req, res, next) => {
    const searchTerms = {
      term: 'bar',
      location: req.body.location,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      limit: 40
    }
    yelp.search(searchTerms)
    .then(result => {
      let foundBars = result.jsonBody.businesses
      let barIds = []
      foundBars.forEach(bar => {
        bar.peopleHere = []
        barIds.push(bar.id)
      })
      if (req.body.idToken) {
        const locationSearched = `${foundBars[0].location.city}, ${foundBars[0].location.state}, ${foundBars[0].location.country}`
        try {
          jwt.verify(req.body.idToken, process.env.SECRET_KEY, function(error, decoded) {
            if (decoded) {
              db.Users.findByIdAndUpdate({
                _id: decoded.user_id
              }, {
                $addToSet: {
                  locationsSearched: locationSearched
                }
              }).then(user => {
              }).catch(error => {
                return next(error)
              })
            }
          })
        } catch(error) {
          return next(error)
        }
      }
      db.Bars.find({
        barId: {
          $in: barIds
        }
      }).then(bars => {
        bars.forEach(bar => {
          foundBars.find(fBar => fBar.id === bar.barId).peopleHere = bar.peopleHere
        })
        return res.json(foundBars)
      })
    }).catch(error => {
      if (error.statusCode === 400) {
        return res.status(400).send(JSON.parse(error.response.body).error.description)
      }
      return next(error)
    })
  })

router
  .route('/checkIn')
  .post((req, res, next) => {
    db.Bars.findOneAndUpdate({ 
      barId: req.body.barId 
    }, {
      $addToSet: {
        peopleHere: req.body.peopleHere
      }
    }, {
      upsert:true
    }).then(bar => {
      db.Users.findOneAndUpdate({ 
        username: req.body.peopleHere 
      }, {
        $set: {
          currentLocation: req.body.barId
        }
      }).then(user => {
        return res.status(200).send('check in saved')
      }).catch(error => {
        console.log(error)
      })
    }).catch(error => {
      res.send(error)
      return next(error)
    })
  })

router
  .route('/checkOut')
  .post((req, res, next) => {
    db.Bars.findOneAndUpdate({
      barId: req.body.barId
    }, {
      $pull: {
        peopleHere: req.body.peopleHere
      }
    }).then((err, doc) => {
      res.send('removed')
    }).catch(error => {
      res.send(error)
      return next(error)
    })
  })

module.exports = router
