/**
 * @declarations - ephemeral comment
 *
 * this component must be kept pure, and with as little logic as possible
 *
 * 1. the request operations should be dynamic, any error in the requests should be returned and notified and a retry should be added.
 * 2. when the speed limit is exceeded, the request must be queued.
 * 3. to fetch extra data in the requests includes should be used, to allow to fetch example channels from a guild using includes: ["channels"].
 * 4. it will check if you are using a transporter e.g. redis and send it too.
 */

export abstract class AbstractRestAdapter {
	/** TODO: add logic for includes @overwrite options */
	async get(route: unknown, options: unknown) {}

	/** TODO: add logic for includes @overwrite params */
	async put(route: unknown, params: unknown, options: unknown) {}

	/** TODO: add logic @overwrite params */
	async post(route: unknown, params: unknown, options: unknown) {}

	/** TODO: add logic @overwrite params */
	async patch(route: unknown, params: unknown, options: unknown) {}

	/** TODO: add logic @overwrite options */
	async delete(route: unknown, options: unknown) {}

	/** TODO: add logic return */
	async request(options: unknown) {}
}
