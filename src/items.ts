import Trade from "./trade";

export default class TradeItem {

    getItem(actor: StoredDocument<Actor>, itemId: string) {
        return actor.items.get(itemId);
    }

    getItemName(itemId: string) {

    }

    itemDefault(item: HTMLElement, actorId: string) {
        const edit: JQuery<HTMLElement> = $(".item-control.item-edit", item);
        const icon: HTMLElement = $(`<a class="item-control item-trade" title="${game.i18n.localize("PCTRADES.send")}">
        <i class="fas fa-balance-scale-right"></i></a>`)[0];

        icon.dataset.itemId = item.dataset.itemId;
        icon.dataset.actorId = actorId;
        icon.addEventListener("click", async (event: Event) => {
            await this.onItemTradeClick(event);
        });

        if (edit[0]) {
            edit[0].after(icon);
        }
    }

    onItemTradeClick(event: Event) {
        event.preventDefault();
        if (event.currentTarget instanceof Element) {
            const ele: HTMLElement = event.currentTarget.closest(".item-trade") as HTMLElement;
            const actorId: string = ele.dataset.actorId as string;
            const itemId: string = ele.dataset.itemId as string;
            new Trade(actorId, itemId);
        }
    }
}