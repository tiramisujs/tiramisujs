/**
 * @declarations - ephemeral comment
 *
 * this component must be kept pure, and with as little logic as possible
 *
 * 1. all exposed functions must be asynchronous, even if the storage is not asynchronous.
 * 2. the cache shall allow loading custom resources.
 * 3. the cache as well as the rest shall allow to fetch data collections using relationships e.g. relationships: ["roles"].
 * 4. the cache should allow disabling by resources, limiting them in quantity and more options.
 */

export abstract class AbstractCacheAdapter {
	/** TODO: add logic for automatic relationships (similar to includes) */
	async get(id: unknown, kind?: unknown, options?: unknown) {}

	/** TODO: add logic for automatic relationships (similar to includes) */
	async set(id: unknown, kind?: unknown, options?: unknown) {}

	/** TODO: add logic */
	async delete(id: unknown, kind?: unknown, options?: unknown) {}
}
