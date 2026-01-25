export function parseJwt(token) {
    try {
        const [, payloadBase64] = token.split(".");
        const payload = JSON.parse(atob(payloadBase64));
        return payload;
    } catch {
        return null;
    }
}
