import {CFG} from "./config"
import {itemDefault} from "./items"
import * as Events from "events";
import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

Hooks.once("setup", async function () {
    Hooks.on("renderActorSheetWfrp4eCharacter", renderInjectionHook);

    game.socket!.on(CFG.socket.value, packet => {
        let data = packet.data;
        let type = packet.type;
        let handler = packet.handler;
        // if (handler === game.userId) {
        //     if (type === "request") {
        //         receiveTrade(data);
        //     }
        //     if (type === "accepted") {
        //         completeTrade(data);
        //     }
        //     if (type === "denied") {
        //         denyTrade(data);
        //     }
        // }
    });

    console.log("WFRP4E PC Trades Loaded");
});

async function renderInjectionHook(sheet: any, element: Element) {
    const actorId: string = sheet.actor.id;

    let items:JQuery<HTMLElement> = $(".tab.inventory .item", element);

    for (let item of items) {
        try {
            await itemDefault(item, actorId);
        } catch (e) {
            console.error("WFRP4e PC Trades | Failed to inject onto item: ", item);
        }
        console.log("WFRP4e PC Trades | Added trade icons to sheet for actor " + actorId);
    }
}

