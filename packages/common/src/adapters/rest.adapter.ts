import { Bucket } from './interfaces';

export interface RestAdapter {
	buckets: Record<number, Bucket>;

	/** TODO: add logic */
	init: () => void;

	/** TODO: add logic for includes @overwrite options */
	// get: (route: unknown, options: unknown) => unknown;

	/** TODO: add logic for includes @overwrite params */
	// put: (route: unknown, params: unknown, options: unknown) => unknown;

	/** TODO: add logic @overwrite params */
	// post: (route: unknown, params: unknown, options: unknown) => unknown;

	/** TODO: add logic @overwrite params */
	// patch: (route: unknown, params: unknown, options: unknown) => unknown;

	/** TODO: add logic @overwrite options */
	// delete: (route: unknown, options: unknown) => unknown;

	/** TODO: add logic return */
	// request: (options: unknown) => unknown;
}
