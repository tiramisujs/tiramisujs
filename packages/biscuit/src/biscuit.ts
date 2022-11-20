import { Defaults } from '@tiramisujs/common';
import { BiscuitOptions } from './interfaces';

export class Biscuit {
	static readonly DEFAULTS: Defaults<BiscuitOptions> = {
		/** TODO: add options */
		opt: '',
	};

	readonly services: unknown;

	readonly options: Required<BiscuitOptions>;

	constructor(options?: BiscuitOptions) {
		this.options = { ...Biscuit.DEFAULTS, ...options };
	}

	/** TODO: add logic */
	async disconnect() {}

	/** TODO: add logic */
	async connect() {}
}
