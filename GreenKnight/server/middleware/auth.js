import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Keine Authorization vorhanden" });
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "Ungültiger Authorization-Header" });
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ error: "Token ungültig oder abgelaufen" });
        }

        req.user = {
            id: payload.sub,
            username: payload.username,
            roles: payload.roles || [],
        };
        next();
    });
}
