export interface BaseBucket {
    max: number;

    refillAmount: number;

    refillInterval: number;

    acquire(amount: number, highPriority?: boolean): Promise<void>;

    nextRefill(): number;

    tokens(): number;

    lastRefill: number;

    allowAcquire: boolean;

    availableTokens: number;

    waiting: ((_?: unknown) => void)[];
}

export function delay(ms: number): Promise<void> {
    return new Promise(result => setTimeout(() => result(), ms));
}
