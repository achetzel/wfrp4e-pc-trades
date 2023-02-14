import {CFG} from "./config"
import TradeItem from "./items"
import Trade from "./trade";

Hooks.once("setup", async function () {
    Hooks.on("renderActorSheetWfrp4eCharacter", renderInjectionHook);

    game.socket!.on(CFG.socket, async packet => {
        let data = packet.data;
        let type = packet.type;
        let handler = packet.handler;
        if (handler === game.userId) {
            if (type === "request") {
                await new Trade(data).receive();
            }
            if (type === "accepted") {
                await new Trade(data).complete();
            }
            if (type === "denied") {
                await new Trade(data).deny();
            }
        }
    });

    console.log("WFRP4E PC Trades Loaded");
});

async function renderInjectionHook(sheet: any, element: Element) {
    const actorId: string = sheet.actor.id;

    let items:JQuery<HTMLElement> = $(".tab.inventory .item", element);

    for (let item of items) {
        try {
            await new TradeItem().itemDefault(item, actorId);
        } catch (e) {
            console.error("WFRP4e PC Trades | Failed to inject onto item: ", item);
        }
        console.log("WFRP4e PC Trades | Added trade icons to sheet for actor " + actorId);
    }
}

