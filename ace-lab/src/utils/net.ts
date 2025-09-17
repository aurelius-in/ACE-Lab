export async function fetchJsonWithRetry<T = any>(input: RequestInfo | URL, init: RequestInit = {}, opts: { retries?: number; backoffMs?: number } = {}): Promise<T> {
    const retries = opts.retries ?? 3;
    const backoff = opts.backoffMs ?? 400;
    let attempt = 0;
    let lastErr: any;
    while (attempt <= retries) {
        try {
            const res = await fetch(input, init);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return (await res.json()) as T;
        } catch (e) {
            lastErr = e;
            if (attempt === retries) break;
            await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt)));
            attempt++;
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}


