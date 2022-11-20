import { CacheAdapter, Defaults } from '@tiramisujs/common';
import { CacheOptions } from './interfaces';

export class CacheService implements CacheAdapter {
	static readonly DEFAULTS: Defaults<CacheOptions> = {
		/** TODO: add options */
		opt: '',
	};

	readonly options: Required<CacheOptions>;

	constructor(options?: CacheOptions) {
		this.options = { ...CacheService.DEFAULTS, ...options };
	}

	init() {}
}
