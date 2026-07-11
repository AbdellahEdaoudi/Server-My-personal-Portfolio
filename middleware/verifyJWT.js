const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = null;

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({
            code: "TOKEN_MISSING",
            message: "No access token"
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, 
        (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    code: "ACCESS_TOKEN_EXPIRED",
                    message: "Access token expired"
                });
            }

            return res.status(401).json({
                code: "ACCESS_TOKEN_INVALID",
                message: "Invalid access token"
            });
        }

        req.user = decoded;
        next();
    });
};

module.exports = { verifyJWT };
