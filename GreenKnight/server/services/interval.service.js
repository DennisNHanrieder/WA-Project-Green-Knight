
export function addInterval(date, every, unit) {
    const d = new Date(date);
    const n = Number(every);
    if (!Number.isFinite(n) || n <= 0) return null;

    if (unit === "day") {
        d.setDate(d.getDate() + n);
        return d;
    }

    if (unit === "month") {
        d.setMonth(d.getMonth() + n);
        return d;
    }

    return null;
}
