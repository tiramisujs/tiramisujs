import type { BaseShard, GatewayPayload } from './shard.spec';
import type { GatewayIntentBits, APIGatewayBotInfo } from 'discord-api-types/v10';
import type { MakePresence } from './etc.spec';
import type { BaseBucket } from './bucket.spec';

export interface BaseShardSpawnerWorkersOptions {
	/**
	 * Number of shards per worker
	 * @default 25
	 */
	shards: number;

	/**
	 * Number of workers
	 * @default 5
	 */
	amount: number;

	/**
	 * Waiting time between workers
	 * @default 5000
	 */
	delay: number;
}

export interface BaseShardSpawnerShardsOptions {
	/**
	 * Waiting time to receive the ready event.
	 * @default 15000
	 */
	timeout: number;

	/**
	 * Waiting time between shards
	 * @default 5000
	 */
	delay: number;
}

export interface BaseShardSpawnerOptions {
    /** Function for interpretation of messages from discord */
	handleDiscordPayload: (shard: BaseShard, payload: GatewayPayload) => unknown;

	/** Based on the information in Get Gateway */
	gateway: APIGatewayBotInfo;

	/** Workers options */
	workers: BaseShardSpawnerWorkersOptions;

	/** Authentication */
	config: {
		intents?: GatewayIntentBits;
		token: string;
	};

	/** Presence on identify */
	makePresence?: MakePresence;

	/** Options shards */
	shards: BaseShardSpawnerShardsOptions;
}

export interface BaseShardSpawner {
    options: BaseShardSpawnerOptions;
    buckets: Map<number, { leak: BaseBucket }>;
    shards: Map<number, BaseShard>; 
    respawns(): Promise<void>;
    spawns(): Promise<void>;
    // connect(id: number): Promise<BaseShard>;
}
