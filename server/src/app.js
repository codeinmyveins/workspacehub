const cookieParser = require('cookie-parser')
const express = require('express')
const authRouter = require('./routes/authRoutes.js')
const testRouter = require('./routes/protectedTestRoute.js')
const errorMiddleware = require('./middlewares/errorMiddleware.js')
const app = express()

app.use(express.urlencoded(true))
app.use(express.json())
app.use(cookieParser())

app.use('/api/v1',authRouter);
app.use('/api/v1',testRouter);


app.get('/api/v1/health', (req,res) => {
    res.status(200)
    .json({msg:"server is up & healthy !"})
})

app.use(errorMiddleware)
module.exports = app;
