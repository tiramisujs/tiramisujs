import { delay, BaseBucket } from '@tiramisujs/common';

/**
 * I forgot what this does
 */
export type PickPartial<T, K extends keyof T> = {
	[P in keyof T]?: T[P] | undefined;
} & { [P in K]: T[P] };

/**
 * TODO: clean this shit
 */
export type BucketOptions =
    & Omit<PickPartial<BaseBucket, 'max' | 'refillInterval' | 'refillAmount'>, 'tokens'>
    & {
        /** Current tokens in the bucket.
         * @default max
         */
        tokens?: number;
    };

export class Bucket implements BaseBucket {
    constructor({
        max,
        refillInterval,
        refillAmount,
        tokens,
        waiting,
        ...rest
    }: BucketOptions) {
        this.max = max;
		this.refillInterval = refillInterval;
		this.refillAmount = refillAmount > max ? max : refillAmount;
        this.availableTokens = tokens ?? max;
        this.waiting = waiting ?? [];
        Object.assign(this, rest);
    }

    max: number;
    refillAmount: number;
    refillInterval: number;
    lastRefill: number = performance.now();
    allowAcquire: boolean = true;
    availableTokens: number;
    waiting: ((_?: unknown) => void)[];

    tokens() {
        return this.updateTokens();
    }

    nextRefill(): number {
        // Since this bucket is lazy update the tokens before calculating the next refill.
        this.updateTokens();

        return performance.now() - this.lastRefill + this.refillInterval;
    }

    updateTokens(): number {
        const timePassed = performance.now() - this.lastRefill;
        const missedRefills = Math.floor(timePassed / this.refillInterval);

        // The refill shall not exceed the max amount of tokens.
        this.availableTokens = Math.min(
            this.availableTokens + this.refillAmount * missedRefills,
            this.max
        );
        this.lastRefill += this.refillInterval * missedRefills;

        return this.availableTokens;
    }

    async acquire(amount: number, highPriority = false): Promise<void> {
        // To prevent the race condition of 2 acquires happening at once,
        // check whether its currently allowed to acquire.
        if (!this.allowAcquire) {
            // create, push, and wait until the current running acquiring is finished.
            await new Promise(resolve => {
                if (highPriority) {
                    this.waiting.unshift(resolve);
                } else {
                    this.waiting.push(resolve);
                }
            });

            // Somehow another acquire has started,
            // so need to wait again.
            if (!this.allowAcquire) {
                return await this.acquire(amount);
            }
        }

        this.allowAcquire = false;

        // Since the bucket is lazy update the tokens now,
        // and also get the current amount of available tokens
        const currentTokens = this.updateTokens();

        // It's possible that more than available tokens have been acquired,
        // so calculate the amount of milliseconds to wait until this acquire is good to go.
        if (currentTokens < amount) {
            const tokensNeeded = amount - currentTokens;
            const refillsNeeded = Math.ceil(tokensNeeded / this.refillAmount);

            const waitTime = this.refillInterval * refillsNeeded;
            await delay(waitTime);

            // Update the tokens again to ensure nothing has been missed.
            this.updateTokens();
        }

        // In order to not subtract too much from the tokens,
        // calculate what is actually needed to subtract.
        const toSubtract = amount % this.refillAmount || amount;
        this.availableTokens -= toSubtract;

        // Allow the next acquire to happen.
        this.allowAcquire = true;

        // If there is an acquire waiting, let it continue.
        this.waiting.shift()?.();
    }
}
