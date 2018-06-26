const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const Router = require('./routes/Router')
const dotenv = require('dotenv')
const cors = require('cors')
const PORT = process.env.PORT || 8000
const app = express()
dotenv.load()

app.use(cors({
  origin: app.get('env') === 'development' ? 'http://localhost:8080' : 'https://natethedev-votingappfrontend.herokuapp.com'
}))

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(morgan('tiny'))

app.use('/', Router)

// catch 404 and send to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  return next(err)
})

// error handler
app.use((err, req, res, next) => {
  let mode = app.get('env')
  if (mode === 'development') {
    console.log(err)
  }
  return res.status(err.status || 500).send(err)
})

app.listen(PORT, () => {
  console.log(`App is being served on port ${PORT}`)
})
