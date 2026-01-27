export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        const roles = req.user?.roles || [];
        if (!roles.some((r) => allowedRoles.includes(r))) {
            return res.status(403).json({ error: "Keine Berechtigung" });
        }
        next();
    };
}
