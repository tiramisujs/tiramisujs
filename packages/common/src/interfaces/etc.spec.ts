import type { GatewayActivity } from "discord-api-types/v10";

export interface MakePresence {
    status: 'idle' | 'dnd' | 'online' | 'offline';
    afk: boolean;
    since: number | null;
    activities: GatewayActivity[];
}
