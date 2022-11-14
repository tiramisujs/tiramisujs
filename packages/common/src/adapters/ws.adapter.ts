import { Bucket, Shard } from './interfaces';

export interface WsAdapter {
	buckets: Record<number, Bucket>;
	shards: Record<number, Shard>;

	/** TODO: add logic */
	init: () => void;

	/** TODO: add logic */
	// respawns: (ids?: number[], options?: unknown) => unknown;

	/** TODO: add logic */
	// respawn: (id?: number[], options?: unknown) => unknown;

	/** TODO: add logic */
	// spawns: (ids?: number[], options?: unknown) => unknown;

	/** TODO: add logic */
	// spawn: (id?: number[], options?: unknown) => unknown;
}
