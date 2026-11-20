const leaseMs = 5_000;

export function createReceiptJob() {
    let status = "queued";
    let attempt = 0;
    let deadlineMs = null;
    let lastChangeMs = 0;

    function apply(event) {
        const { type, atMs, attempt: eventAttempt } = event;
        if (!Number.isSafeInteger(atMs) || atMs < 0) {
            throw new TypeError("Expected a nonnegative integer time in milliseconds.");
        }
        if (atMs < lastChangeMs) {
            return false;
        }

        switch (type) {
            case "claim":
                if (status !== "queued" || atMs > Number.MAX_SAFE_INTEGER - leaseMs) {
                    return false;
                }
                attempt += 1;
                deadlineMs = atMs + leaseMs;
                status = "claimed";
                break;

            case "dispatch":
                if (status !== "claimed" || eventAttempt !== attempt || atMs >= deadlineMs) {
                    return false;
                }
                status = "dispatching";
                break;

            case "acknowledge":
                if (status !== "dispatching" || eventAttempt !== attempt || atMs >= deadlineMs) {
                    return false;
                }
                status = "accepted-by-transport";
                deadlineMs = null;
                break;

            case "report-uncertain":
                if (status !== "dispatching" || eventAttempt !== attempt) {
                    return false;
                }
                status = "uncertain";
                deadlineMs = null;
                break;

            case "expire":
                if (deadlineMs === null || eventAttempt !== attempt || atMs < deadlineMs) {
                    return false;
                }
                // A dispatch may already have produced paper. Only an unsent claim can requeue.
                status = status === "dispatching" ? "uncertain" : "queued";
                deadlineMs = null;
                break;

            default:
                throw new TypeError("Unknown demo event.");
        }

        lastChangeMs = atMs;
        return true;
    }

    return {
        apply,
        get snapshot() {
            return { status, attempt, deadlineMs };
        },
    };
}
