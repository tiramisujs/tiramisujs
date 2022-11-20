/**
 * @declarations - ephemeral comment
 *
 * 1. all exposed functions must be asynchronous, even if the storage is not asynchronous.
 * 2. the cache shall allow loading custom resources.
 * 3. the cache as well as the rest shall allow to fetch data collections using relationships e.g. relationships: ["roles"].
 * 4. the cache should allow disabling by resources, limiting them in quantity and more options.
 */

export * from './cache.service';
export * from './interfaces';
