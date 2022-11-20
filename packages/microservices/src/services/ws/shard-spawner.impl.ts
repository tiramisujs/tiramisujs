import type { BaseShardSpawner, BaseShardSpawnerOptions } from "@tiramisujs/common";
import type { APIGatewayBotInfo, GatewayIntentBits } from "discord-api-types/v10";
import { Bucket } from "./bucket.impl";
import { Shard } from "./shard.impl";

export class ShardSpawner implements BaseShardSpawner {
    constructor(options: Partial<BaseShardSpawnerOptions>) {
        this.options = Object.assign(Object.create(ShardSpawner.DEFAULTS), options);
    }

    static readonly DEFAULTS = {
		workers: {
			shards: 25,
			amount: 5,
			delay: 5000
		},

		shards: {
			timeout: 15000,
			delay: 5000
		}
	};

    readonly options: BaseShardSpawnerOptions;

    readonly buckets: Map<number, {
        workers: { id: number; queue: number[] }[];
        leak: Bucket;
    }> = new Map();

    readonly shards: Map<number, Shard> = new Map();

    /** Invokes internal processing and respawns shards */
	async respawns(): Promise<void> {
		//
	}

	/** Invoke internal processing and spawns shards */
	async spawns(): Promise<void> {
		const { gateway, workers } = this.options;

		/** Creates the necessary buckets according to concurrency */
		for (let i = 0; i < gateway.session_start_limit.max_concurrency; i++) {
			this.buckets.set(i, {
				workers: [],
				leak: new Bucket({
					max: 1,
					refillAmount: 1,
					refillInterval: workers.delay,
				}),
			});
		}

		/** Create the start sequence of the shards inside the buckets. */
		for (let i = 0; i < gateway.shards; i++) {
			const bucketID = i % gateway.session_start_limit.max_concurrency;
			const bucket = this.buckets.get(bucketID);

			if (bucket) {
				const workerID = Math.floor(i / workers.shards);
				const worker = bucket.workers.find(w => w.id === workerID);

				if (worker) {
					worker.queue.push(i);
				} else {
					bucket.workers.push({ id: workerID, queue: [i] });
				}
			}
		}

		/** Route all shards to workers */
		this.buckets.forEach(async bucket => {
			for (const worker of bucket.workers) {

				for (const id of worker.queue) {
					await this.connect(id);
				}

			}
		});
	}

	/** Invokes the bucket to prepare the connection to the shard */
	private async connect(id: number): Promise<Shard> {
		const { gateway } = this.options;

		let shard = this.shards.get(id);

		if (!shard) {
			shard = new Shard({
				id,

				gateway: this.options.gateway,

				shards: this.options.shards,

				config: this.options.config,

				presence: this.options.makePresence,

				handlePayloads: async (shard, payload) => {
					await this.options.handleDiscordPayload(shard, payload); // remove await?
				},

				handleIdentify: async (id: number) => {
					await this.buckets.get(id % gateway.session_start_limit.max_concurrency)!.leak.acquire(1); // remove await?
				}
			});

			this.shards.set(id, shard);
		}

		await shard.connect();

		return shard;
	}
}

// MOVE THIS TO REST

/** https://discord.com/developers/docs/reference#api-reference-base-url */
export const BASE_URL = 'https://discord.com/api';

/** https://discord.com/developers/docs/reference#user-agent */
export const USER_AGENT = `DiscordBot (https://github.com/oasisjs/biscuit, 0.1.0-alpha)`;

/** REMOVE REMOVE REMOVE */
export async function convenient_quick_bot_function(
    token: string,
    intents: GatewayIntentBits,
    eventHandler: BaseShardSpawnerOptions["handleDiscordPayload"]
) {
    const gateway = await fetch(`${BASE_URL}/v10/gateway/bot`, {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${token}`,
            'User-Agent': USER_AGENT
        }
    }).then(data => data.json()) as APIGatewayBotInfo;

    console.log(gateway);

    const ws = new ShardSpawner({
        gateway,
        config: { intents, token },
        handleDiscordPayload: eventHandler,
    });

    await ws.spawns();
}
