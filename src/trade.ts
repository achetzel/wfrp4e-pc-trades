import {CFG} from "./config";
import Player, {ICharData} from "./player";
import TradeWindow from "./tradeWindow"
import TradeItem from "./items";

export interface ITradeData {
    srcUserId: string,
    srcActorId: string,
    destUserId: string,
    destActorId: string,
    itemId?: string,
    quantity?: number
}

export default class Trade {
    private tradeData: ITradeData | undefined;
    private tradeItem: Item | undefined;
    private srcActor: StoredDocument<Actor> | undefined;
    private destActor: StoredDocument<Actor> | undefined;

    constructor(actorId: string, itemId: string);
    constructor(activeTrade: ITradeData);
    constructor(actorOrTrade: string | ITradeData, itemId?: string) {
        if (typeof actorOrTrade === 'string') {
            this.init(actorOrTrade, itemId as string).catch(e => {
                console.error(game.i18n.localize("PCTRADES.error.init"));
            });
        } else {
            let player: Player = new Player();
            this.tradeData = actorOrTrade;
            this.srcActor = player.getActor(this.tradeData.srcActorId) as StoredDocument<Actor>;
            this.destActor = player.getActor(this.tradeData.destActorId) as StoredDocument<Actor>;
            this.tradeItem = new TradeItem().getItem(this.srcActor, this.tradeData.itemId as string) as Item;
        }
    }


    async init(actorId: string, itemId: string) {
        try {
            const item: Item = game.actors!.get(actorId)!.items.get(itemId) as Item;
            const characters: Array<ICharData> = await new Player().getOnlinePlayers(actorId);

            if (characters.length === 0) {
                ui.notifications.warn(game.i18n.localize("PCTRADES.error.noOtherPC"));
            } else {
                const tw = new TradeWindow({
                    actorId,
                    item,
                    characters
                });
                tw.render(true);
                console.log("init trade finished")
            }
        } catch {
            ui.notifications.error(game.i18n.localize("PCTRADES.error.init"));
        }

    }

    async request() {
        if (await this.isValid()) {
            ui.notifications.notify(game.i18n.localize("PCTRADES.trade.tradeSent"));

            if (this.tradeData?.srcUserId === this.tradeData?.destUserId) {
                // Local pathway
                await this.receive();
            } else {
                game.socket!.emit(CFG.socket, {
                    data: this.tradeData,
                    handler: this.tradeData?.destUserId,
                    type: "request"
                });
            }
        } else {
            ui.notifications.error(game.i18n.localize("PCTRADES.error.tradeNoLongerValid"));
        }
    }

    async complete() {
        await this.removeFromSource();
        let actorName: string = new Player().getActorName(this.tradeData?.destActorId as string);
        ui.notifications.notify(game.i18n.format("PCTRADES.trade.accepted", {name: actorName}));
    }

    async deny() {
        //await this.request();
        let actorName: string = new Player().getActorName(this.tradeData?.destActorId as string);
        ui.notifications.notify(game.i18n.format("PCTRADES.trade.rejected", { name: actorName }));
    }

    async receive(): Promise<void> {
        // Only handle if we're the target user.
        if (this.tradeData?.destUserId === game.userId) {
            let actorName: string = new Player().getActorName(this.tradeData?.srcActorId as string);
            let itemName: string = new TradeItem().getItemName(this.tradeData?.srcActorId as string, this.tradeData.itemId as string);
            let d = new Dialog({
                title: game.i18n.localize("PCTRADES.trade.incomingTradeTitle"),
                content: "<p>" + game.i18n.format("PCTRADES.trade.incomingTradeDescription", {
                    name: actorName,
                    item: itemName
                }) + "</p>",
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("PCTRADES.trade.confirm"),
                        callback: async () => await this.confirmed()
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("PCTRADES.trade.deny"),
                        callback: async () => await this.tradeDenied()
                    }
                },
                default: "two",
            });
            d.render(true);
        }
    }

    private async confirmed() {
        if (await this.isValid()) {
            await this.applyToDestination();
            // if isValid is true there is absolutely tradeData
            await new Player().sendChatMessage(
                this.srcActor as StoredDocument<Actor>,
                this.destActor as StoredDocument<Actor>,
                this.tradeItem as Item
            );

            if (this.tradeData!.srcUserId === this.tradeData!.destUserId) {
                await this.complete();
            } else {
                game.socket!.emit(CFG.socket, {
                    data: this.tradeData,
                    handler: this.tradeData!.srcUserId,
                    type: "accepted"
                });
            }
        }
        else {
            ui.notifications.error(game.i18n.localize("PCTRADES.trade.noLongerValid"));
        }
    }

    async tradeDenied() {
        console.log("tradeDenied() Start");
        game.socket!.emit(CFG.socket, {
            data: this.tradeData,
            handler: this.tradeData!.srcUserId,
            type: "denied"
        });
        console.log("tradeDenied() End");
    }

    private async isValid() {
        // Ensure both source and destination users are logged in.
        if (this.tradeData) {

            if (!((game.users!.get(this.tradeData.srcUserId) as User).active)) {
                return false;
            }

            if (!((game.users!.get(this.tradeData.destUserId) as User).active)) {
                return false;
            }

            this.srcActor = new Player().getActor(this.tradeData.srcActorId) as StoredDocument<Actor>;
            this.destActor = new Player().getActor(this.tradeData.destActorId) as StoredDocument<Actor>;

            // Actors should still exist.
            if (!this.srcActor || !this.destActor) {
                return false;
            }

            if (this.tradeItem) {
                // Item should exist and have a valid quantity
                // @ts-ignore - ItemWfrp4e has system, but not available
                if (this.tradeItem.system.quantity.value < this.tradeData.quantity) {
                    console.error("Quantity mismatch");
                    return false;
                }
            }
            return true;
        } else {
            console.error("Could not find trade data");
            return false;
        }
    }

    private async removeFromSource(): Promise<void> {
        if (this.tradeItem) {

            // @ts-ignore - ItemWfrp4e has system, but not available
            if (this.tradeItem.system.quantity.value <= this.tradeData.quantity) {
                this.srcActor!.deleteEmbeddedDocuments("Item", [this.tradeItem.id as string]);
            }
            else {
                this.tradeItem.update({data: {
                    // @ts-ignore - ItemWfrp4e has system, but not available
                    quantity: this.tradeItem.system.quantity.value - this.tradeData.quantity
                }});
            }
        } else {
            console.error("Could not find item being traded on source");
        }
    }

    private async applyToDestination(): Promise<void> {
        if (this.tradeItem) {
            let itemData = duplicate(this.tradeItem);
            // @ts-ignore - ItemWfrp4e has system, but not available
            itemData.system.quantity.value = this.tradeData.quantity;
            this.destActor!.createEmbeddedDocuments("Item", [itemData]);
        } else {
            console.error("Could not find item being traded to destination");
        }

    }
}
