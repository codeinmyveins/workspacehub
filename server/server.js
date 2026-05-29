const app = require('./src/app.js')
const connectDB = require('./src/config/dbConnect.js')

const PORT = process.env.PORT || 5000

const startServer = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        await app.listen(PORT, () => {
            console.log(`server listening on http://localhost:${PORT}`)
        });
    } catch (error) {
        console.error(`Server did not start due to ${error}`)
        process.exit(1)
    }
}

startServer();