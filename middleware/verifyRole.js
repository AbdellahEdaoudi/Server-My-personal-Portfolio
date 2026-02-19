const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.user?.role) {
            return res.sendStatus(401);
        }
        const result = allowedRoles.includes(req.user.role);
        if (!result) {
            return res.sendStatus(401);
        }
        next();
    }
}

module.exports = { verifyRole };
