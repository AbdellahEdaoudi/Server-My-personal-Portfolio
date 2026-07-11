const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.user?.role) {
            return res.status(403).json({
                code: "ROLE_MISSING",
                message: "No role found"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                code: "INSUFFICIENT_PERMISSIONS",
                message: "Insufficient permissions"
            });
        }
        next();
    }
}

module.exports = { verifyRole };
