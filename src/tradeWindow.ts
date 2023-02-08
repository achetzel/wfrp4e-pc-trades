import {CFG} from "./config.js";
import {ICharData} from "./utility";
import {ItemData} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import * as Events from "events";
import {Options} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/dice/roll";

interface Idata {
    actorId: string,
    item: Item,
    characters: Array<Object>
}

/**
 * A window where the users select a character to send an item.
 *
 */
export default class TradeWindow extends Application {
    private data: Idata;
    private _selectedActor: Object | null | undefined;
    private quantity: number | undefined;
    public currency: {} | undefined;

    constructor(data: any, options?: Partial<ApplicationOptions>) {
        super(options);
        this.data = data;
        this._selectedActor = null;
        if (this.data.item) {
            // @ts-ignore
            this.quantity = this.data.item.system.quantity;
        }
    }

    /**
     * @override
     * */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: CFG.socket.TradeWindowTemplate,
            classes: ["pc-trades-window"],
            width: 500,
            jQuery: true
        });
    }

    /**
     * The actor data of the selected trade target
     *
     * @returns {object|null} actor data or null if none were selected.
     */
    get selectedActor() {
        return this._selectedActor;
    }

    /** @override */
    get title() {
        return game.i18n.localize("WFRP4EPCTrades.TradeWindowTitle");
    }

    /** @override */
    getData(options?: Partial<ApplicationOptions>) {
        const data: Record<string, any> = {};
        data.characters = this.data.characters;
        data.quantity = this.quantity;
        data.showquantity = this.quantity !== 1;

        if (this.data.item) {
            data.item = {
                name: this.data.item.name,
                img: this.data.item.img
            };
        }
        return data;
    }

    /** @override */
    activateListeners(html: JQuery<HTMLElement>) {
        super.activateListeners(html);
        html.find("li.actor.directory-item").click(this._selectActor.bind(this));
        html.find("button.cancel").click(this.close.bind(this));
        html.find("button.submit").click(this._submit.bind(this));
        html.find(".currency-input").change(this._changeCurrency.bind(this));
        html.find(".quantity-input").change(this._changeQuantity.bind(this));
        html.find(".quantity-quick-btn").click(this._quickChangeQuantity.bind(this));
    }

    /**
     * Handles the change in quantity
     * @private
     */
    _changeCurrency(event: {
        preventDefault: () => void;
        target: {
            value: string;
            dataset: {
                coin: string;
            };
        };
    }): void {
        event.preventDefault();
        let value: number = parseInt(event.target.value);
        //let coin = event.target.dataset.coin;
        // const sheet = game.actors.get(this.data.actorId).sheet;
        // const compatibility = getCompatibility(sheet);
        // const maxValue: number = compatibility.parseCurrencyMax(this.data.currencyMax[coin]);
        // value = Math.min(Math.max(value, 0), maxValue);
        // if(this.currency[coin] !== undefined) { this.currency[coin] = value };
        event.target.value = value.toString();
    }

    /**
     * Handles the change in quantity
     * @private
     */
    _changeQuantity(event: Event) {
        event.preventDefault();
        this.updateQuantity(parseInt(event.target.value));
    }

    /**
     * Handles quick quantity buttons (one, half, all)
     * @private
     */
    _quickChangeQuantity(event: Event) {
        event.preventDefault();
        let qsize = event.currentTarget.dataset.qsize;
        let qmax = this.data.item.system.quantity;
        let q = 1;
        switch (qsize) {
            case "one":
                q = 1;
                break;
            case "half":
                q = Math.floor(qmax / 2);
                break;
            case "all":
                q = qmax;
                break;
        }
        this.updateQuantity(q);
    }

    /**
     * Updates the quantity
     *
     * @param {number} newQuantity
     */
    updateQuantity(newQuantity) {
        newQuantity = Math.min(Math.max(newQuantity, 1), this.data.item.system.quantity);
        this.quantity = newQuantity;
        this.element.find(".quantity-input")[0].value = this.quantity;
    }

    /**
     * Selects the target character.
     * @private
     */
    async _selectActor(event: { preventDefault: () => void; currentTarget: { closest: (arg0: string) => any; }; }): Promise<void> {
        event.preventDefault();
        let actorElement = event.currentTarget.closest(".actor.directory-item");
        this._selectedActor = this.data.characters.find(c => c.id === actorElement.dataset.actorId);

        this.element.find(".actor.directory-item").removeClass("active");
        actorElement.classList.add("active");

        if (this.selectedActor) {
            this.element.find("button.submit").attr("disabled", false);
        }
    }

    /**
     * Submit the trade request
     * @private
     */
    async _submit() {
        if (this.selectedActor) {
            let tradeData = {
                sourceUserId: game.userId,
                sourceActorId: this.data.actorId,

                destinationActorId: this.selectedActor.id,
                destinationUserId: this.selectedActor.userId,
            };

            if (this.currency) {
                tradeData.currency = this.currency;
            }

            if (this.data.item) {
                tradeData.itemId = this.data.item.id;
                tradeData.quantity = this.quantity;
            }

            sendTradeRequest(new TradeRequest(tradeData));
        }
        await this.close();
    }
}