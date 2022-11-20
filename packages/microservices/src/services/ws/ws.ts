import { GatewayIntentBits, GatewayReadyDispatchData } from "discord-api-types/v10";
import { convenient_quick_bot_function } from "./shard-spawner.impl";

/*
convenient_quick_bot_function(
    "...",
    GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
    function(_shard, payload) {
        if (payload.t === "READY") {
            const data = payload.d as GatewayReadyDispatchData;

            console.log("Logged in as %s", data.user.username);
        }
    }
);*/

export {}
