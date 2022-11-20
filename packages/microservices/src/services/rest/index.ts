/**
 * @declarations - ephemeral comment
 *
 * 1. the request operations should be dynamic, any error in the requests should be returned and notified and a retry should be added.
 * 2. when the speed limit is exceeded, the request must be queued.
 * 3. to fetch extra data in the requests includes should be used, to allow to fetch example channels from a guild using includes: ["channels"].
 * 4. it will check if you are using a transporter e.g. redis and send it too.
 */

export * from './interfaces';
export * from './rest.service';
