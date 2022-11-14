import { Bucket, Defaults, RestAdapter } from '@tiramisujs/common';
import { RestOptions } from './interfaces';

export class RestService implements RestAdapter {
	static readonly DEFAULTS: Defaults<RestOptions> = {
		/** TODO: add options */
		opt: '',
	};

	readonly options: Required<RestOptions>;

	readonly buckets: Record<number, Bucket> = [];

	constructor(options?: RestOptions) {
		this.options = { ...RestService.DEFAULTS, ...options };
	}

	init() {}
}
