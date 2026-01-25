
import jwt from "jsonwebtoken";

export function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            username: user.username,
            roles: user.roles || ["user"],
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
}

export function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user._id.toString() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
}
