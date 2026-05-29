const cookieParser = require('cookie-parser')
const express = require('express')

const app = express()

app.use(express.urlencoded(true))
app.use(express.json())
app.use(cookieParser())

app.get('/api/v1/health', (req,res) => {
    res.status(200)
    .json({msg:"server is up & healthy !"})
})

module.exports = app;
