const mongoose = require('mongoose')

const connectDB = async (url) => {
    try {
        await mongoose.connect(url)
        console.log('DB Connected Successfully :)')
    } catch (error) {
        console.error('DB Connection Failed :( due to ', error)
    }
}

module.exports = connectDB;