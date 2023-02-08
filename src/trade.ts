import {CFG} from "./config";
import {ICharData, getOnlinePlayers} from "./utility";
import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

export async function openItemTrade(actorId: string, itemId: string) {
    try {
        const item: Item | undefined = game.actors!.get(actorId)!.items.get(itemId);
        const characters: Array<ICharData> = getOnlinePlayers(actorId);

        if (characters.length === 0) {
            ui.notifications.warn(game.i18n.localize("LetsTrade5E.NoPCToTradeWith"));
        }
        else {
       //     const tw = new TradeWindow({
       //          actorId,
       //          item,
       //          characters
       //      });
       //      tw.render(true);
        }
    } catch {
        console.error("Was unable to complete trade for item: ", itemId);
    }

}

