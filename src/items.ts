import {openItemTrade} from "./trade";

export async function itemDefault(item: HTMLElement, actorId: string) {
    const edit: JQuery<HTMLElement> = $(".item-control.item-edit", item);
    const icon: HTMLElement = $(`<a class="item-control item-trade" title="${game.i18n.localize("PCTrades.send")}">
        <i class="fas fa-balance-scale-right"></i></a>`)[0];

    icon.dataset.itemId = item.dataset.itemId;
    icon.dataset.actorId = actorId;
    icon.addEventListener("click", async (event: Event) => {
        await onItemTradeClick(event);
    });

    if (edit[0]) {
        edit[0].after(icon);
    }
}

export async function onItemTradeClick(event: Event) {
    event.preventDefault();
    if (event.currentTarget instanceof Element) {
        const ele: HTMLElement = event.currentTarget.closest(".item-trade") as HTMLElement;
        const actorId = ele.dataset.actorId as string;
        const itemId = ele.dataset.itemId as string;
        await openItemTrade(actorId, itemId)
    }
}