import { Bucket, Defaults, Shard, WsAdapter } from '@tiramisujs/common';
import { WsOptions } from './interfaces';

export class WsService implements WsAdapter {
	static readonly DEFAULTS: Defaults<WsOptions> = {
		/** TODO: add options */
		opt: '',
	};

	readonly options: Required<WsOptions>;

	readonly buckets: Record<number, Bucket> = [];
	readonly shards: Record<number, Shard> = [];

	constructor(options?: WsOptions) {
		this.options = { ...WsService.DEFAULTS, ...options };
	}

	init() {}
}
