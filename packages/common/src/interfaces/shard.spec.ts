import type { BaseBucket } from './bucket.spec';
import type { MakePresence } from './etc.spec';
import type {
      GatewayIntentBits
    , APIGatewayBotInfo
    , GatewayOpcodes
    , GatewayDispatchEvents
    } from 'discord-api-types/v10';

/** All names of possible incoming events */
export type GatewayEventNames = GatewayDispatchEvents[keyof GatewayDispatchEvents];

/** https://discord.com/developers/docs/topics/gateway#payloads-gateway-payload-structure */
export interface GatewayPayload<D = unknown> {
	/** opcode for the payload */
    op: GatewayOpcodes;

	/** Event data */
    d: D;

	/** Sequence number, used for resuming sessions and heartbeats */
    s: number;

	/** The event name for this payload */
    t: GatewayEventNames | null;
}

export interface ShardDelay {
	/**
	 * Waiting time to receive the ready event.
	 * @default 15000
	 */
	timeout: number;

	/**
	 * Waiting time between shards
	 * @default 5000
	 */
	delay: number;
}

/** Customizable behaviour */
export interface BaseShardOptions {
    id: number;

    gateway: APIGatewayBotInfo;

    shards: ShardDelay;

    config: {
        intents?: GatewayIntentBits;
        token: string;
    };

    presence?: MakePresence;

    handlePayloads: (shard: BaseShard, data: GatewayPayload) => Promise<void>;

    handleIdentify: (id: number) => Promise<void>;
}

export interface BaseShard<WS = unknown> {
    heartbeatInterval?: any;

    /** @default false */
    heartbeatAck: boolean;

    /** @default -1 */
    heartbeatAt: number;

    /** @default 45000 */
    interval: number;

    resumeURL?: string;
    sessionID?: string;

    sequence: number;

    resolves: Map<string, (payload?: unknown) => void>;

    status: ShardStatus;

    bucket: BaseBucket;

    trace?: any;

    ws: WS;

    options: BaseShardOptions;
}

export type ShardStatus = 'Disconnected' | 'Handshaking' | 'Connecting' | 'Heartbeating' | 'Identifying' | 'Resuming' | 'Ready';
