import type {
      ShardStatus
    , BaseShard
    , BaseShardOptions
    , BaseBucket
    , GatewayPayload
    } from '@tiramisujs/common';
import { Bucket } from './bucket.impl';
import { GatewayHelloData, GatewayOpcodes } from 'discord-api-types/v10';
import { WebSocket } from 'ws';

export interface UseZLib {
    /**
     * @default false
     */
    use_zlib?: boolean;
}

export class Shard implements BaseShard {
    constructor(options: Partial<BaseShardOptions> & UseZLib) {
        this.options = Object.assign(Object.create(Shard.DEFAULTS), options);
        this.bucket = new Bucket({
            max: 120,
            refillInterval: 60000,
            refillAmount: 120,
        });

        // TODO: use this because ppl complain about zlib
        this.use_zlib = options.use_zlib ?? false;
    }

    textDecoder = new TextDecoder();

    static readonly DEFAULTS = {};
    readonly options: BaseShardOptions;

    /** TODO: type this thing */
    heartbeatInterval: any | null = null;
    heartbeatAck = false;

	heartbeatAt = -1;
	interval = 45000;

	resumeURL?: string;
	sessionID?: string;

	sequence = 0;
    use_zlib = false;

	resolves: Map<string, (payload?: unknown) => void> = new Map();

	status: ShardStatus = 'Disconnected';

	bucket: BaseBucket;

    /** TODO: type this thing */
	trace: any = null;

    /** TODO: type this thing */
	ws: WebSocket | null = null;

    
	resume() {
		this.status = 'Resuming';

		this.send({
			op: GatewayOpcodes.Resume,
			d: {
				token: `Bot ${this.options.config.token}`,
				session_id: this.sessionID,
				seq: this.sequence,
			}
		});
	}

	destroy() {
		this.ws = null;

		this.bucket = new Bucket({
			max: 120,
			refillInterval: 60000,
			refillAmount: 120,
		});

		this.sequence = 0;
		this.resumeURL = undefined;
		this.sessionID = undefined;

		this.heartbeatInterval = null;
	}

	connect() {
		if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
			return;
		}

		this.status = 'Connecting';

		if (this.sessionID && this.resumeURL) {
			this.ws = new WebSocket(this.resumeURL);
		} else {
			this.ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
		}

		this.ws.on('message', this.onMessage.bind(this));
		this.ws.on('close', this.onClose.bind(this));
		this.ws.on('error', this.onError.bind(this));
		this.ws.on('open', this.onOpen.bind(this));

		return new Promise(resolve => {
			this.resolves.set('READY', () => {
				setTimeout(() => resolve(true), this.options.shards.timeout);
			});
		});
	}

	identify() {
		this.status = 'Identifying';

		this.send({
			op: GatewayOpcodes.Identify,
			d: {
				token: `Bot ${this.options.config.token}`,
				compress: false,
				properties: {
					os: 'linux',
					device: 'Biscuit',
					browser: 'Biscuit'
				},
				intents: this.options.config.intents,
				shard: [this.options.id, this.options.gateway.shards],
				presence: this.options.presence
			}
		});
	}

	heartbeat(requested = false) {
		if (this.status === 'Resuming' || this.status === 'Identifying') {
			return;
		}

		if (!requested) {
			if (!this.heartbeatAt) {
				// eslint-disable-next-line no-console
				console.log(JSON.stringify({
					heartbeatInterval: this.heartbeatInterval,
					heartbeatAck: this.heartbeatAck,
					timestamp: Date.now(),
					status: this.status
				}));

				this.disconnect();
				return;
			}

			this.heartbeatAck = false;
		}

		this.heartbeatAt = Date.now();

		this.send({
			op: GatewayOpcodes.Heartbeat,
			d: this.sequence,
		}, true);
	}

	disconnect(reconnect = false) {
		if (!this.ws) {
			return;
		}

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.ws.readyState !== WebSocket.CLOSED) {
			this.ws.removeAllListeners();

			if (this.sessionID && reconnect) {
				if (this.ws.readyState !== WebSocket.OPEN) {
					this.ws.close(4999, 'Reconnect');
				} else {
					this.ws.terminate();
				}
			} else {
				this.ws.close(1000, 'Normal Close');
			}
		}

		this.ws = null;

		this.status = 'Disconnected';

		this.resolves = new Map();
		this.heartbeatAck = true;

		if (reconnect) {
			if (this.sessionID) {
				this.connect();
			} else {
				// this.connect();
			}
		} else {
			this.destroy();
		}
	}

	async send(payload: Partial<GatewayPayload>, priority = false) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			await this.bucket.acquire(1, priority);

			this.ws.send(JSON.stringify(payload));
		}
	}

	private async onMessage(data: any, isBinary: boolean) {
		const payload = this.pack(data as Buffer | ArrayBuffer, isBinary);

		if (payload.s != null) {
			this.sequence = payload.s;
		}

		switch (payload.op) {
			case GatewayOpcodes.Dispatch:

				switch (payload.t) {
					case 'READY':
						this.debug([`[READY] shard id: ${this.options.id}`]);

						this.status = 'Ready';

						// @ts-ignore
						this.resumeURL = `${payload.d.resume_gateway_url}/?v=10&encoding=json`;

						// @ts-ignore
						this.sessionID = payload.d.session_id;

						// @ts-ignore
						this.sequence = 0;

						this.resolves.get('READY')?.(payload);
						this.resolves.delete('READY');

						break;

					case 'RESUMED':
						this.status = 'Ready';

						this.resolves.get('RESUMED')?.(payload);
						this.resolves.delete('RESUMED');

						break;
				}

				break;

			case GatewayOpcodes.Heartbeat:
				this.heartbeat(true);

				break;

			case GatewayOpcodes.Reconnect:
				this.disconnect(true);
				break;

			case GatewayOpcodes.InvalidSession:

				if (payload.d) {
					this.resume();
				} else {
					this.sessionID = undefined;
					this.sequence = 0;

					this.identify();
				}

				break;

			case GatewayOpcodes.Hello:
                const actual_payload = payload as GatewayPayload<GatewayHelloData>;

				if (actual_payload.d.heartbeat_interval > 0) {
					if (this.heartbeatInterval) {
						clearInterval(this.heartbeatInterval);
					}

					this.heartbeatInterval = setInterval(() => {
                        this.heartbeat();
                    }, actual_payload.d.heartbeat_interval);

					this.interval = actual_payload.d.heartbeat_interval;
				}

				if (this.status !== 'Resuming') {
					this.bucket = new Bucket({
						max: this.safe(),
						refillInterval: 60000,
						refillAmount: this.safe(),
						waiting: this.bucket.waiting,
					});
				}

				if (this.sessionID) {
					this.resume();
				} else {
					this.identify();
					this.heartbeat();
				}

				break;
			case GatewayOpcodes.HeartbeatAck:
				this.heartbeatAck = true;

				break;

		}

		// @ts-ignore
		if (payload?.d?._trace) {
			// @ts-ignore
			this.trace = JSON.parse(payload.d._trace);
		}

		this.options.handlePayloads(this, payload);
	}

	private async onClose(code: number) {
		this.debug([`[onClose] shard id: ${this.options.id}`, code]);

		switch (code) {
			case 1001:
				// Discord WebSocket requesting client reconnect
				this.disconnect(true);
				break;

			case 1006:
				// problems with connections
				this.disconnect(true);
				break;

			case 4000:
				// Unknown error
				this.disconnect();
				break;

			case 4001:
				// Unknown opcode
				this.disconnect();
				break;

			case 4002:
				// Decode error
				this.disconnect();
				break;

			case 4003:
				// Not authenticated
				this.sessionID = undefined;
				this.disconnect();
				break;

			case 4004:
				// Authentication failed
				this.sessionID = undefined;
				this.disconnect();
				break;

			case 4005:
				// Already authenticated
				this.sessionID = undefined;
				this.disconnect();
				break;

			case 4007:
				// Invalid sequence
				this.sequence = 0;
				this.disconnect();
				break;

			case 4008:
				// Rate limited
				this.disconnect();
				break;

			case 4009:
				// Session timed out
				this.disconnect();
				break;

			case 4010:
				// Invalid shard
				this.sessionID = undefined;
				this.disconnect();
				break;

			case 4011:
				// Sharding required
				this.sessionID = undefined;
				this.disconnect();
				break;

			case 4012:
				// Invalid API version
				this.sessionID = undefined;
				this.disconnect();
				break;

			case 4013:
				// Invalid intent(s)
				this.sessionID = undefined;
				this.disconnect();
				break;

			case 4014:
				// Disallowed intent(s)
				this.sessionID = undefined;
				this.disconnect();
				break;

			default:
				this.disconnect();
				break;
		}
	}

	private async onError(error: Error) {
		this.debug([`[onError] shard id: ${this.options.id}`, error]);
	}

	private async onOpen() {
		this.status = 'Handshaking';
		this.heartbeatAck = true;
	}

    // TODO:
    // THINGS THAT REMAIN FROM THE OLD GATEWAY
    // SOCRAM HACE ALGO POR FAVOR

	/** temporal */
	debug(_messages: unknown[]) {
		// for (let index = 0; index < messages.length; index++) {
		// 	const message = messages[index];

		// 	// eslint-disable-next-line no-console
		// 	console.log(message);
		// }
	}

	/** temporal */
	pack(data: Buffer | ArrayBuffer, _isBinary: boolean): GatewayPayload {
		return JSON.parse(this.textDecoder.decode(new Uint8Array(data))) as GatewayPayload;
	}

    safe() {
		const requests = 120 - Math.ceil(60000 / this.interval) * 2;

		return requests < 0 ? 0 : requests;
	}
}
