const jwt = require('jsonwebtoken')

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(" ")[1]
    const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SIGNATURE);
    req.user = decoded;
    next()

}

module.exports = authMiddleware;