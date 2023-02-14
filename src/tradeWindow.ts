import {CFG} from "./config.js";
import {ICharData} from "./player";
import Trade, {ITradeData} from "./trade";

interface ITradeWindow {
    actorId: string,
    item: Item,
    characters: Array<ICharData>
}

/**
 * A window where the users select a character to send an item.
 *
 */
export default class TradeWindow extends Application {
    private data: ITradeWindow;
    private _selectedActor: ICharData | null;
    private quantity: number | undefined;

    constructor(data: ITradeWindow, options?: Partial<ApplicationOptions>) {
        super(options);
        this.data = data;
        this._selectedActor = null;
        if (this.data.item) {
            // @ts-ignore - ItemWfrp4e not available, and Item does not have system
            this.quantity = this.data.item.system.quantity.value;
        }
    }

    /**
     * @override
     * */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: CFG.tradeWindowTemplate,
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
        return game.i18n.localize("PCTRADES.window.title");
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
    activateListeners(html: JQuery) {
        console.log("activateListeners() Start");
        super.activateListeners(html);
        html.find("li.actor.directory-item").on("click", this._selectActor.bind(this));
        // @ts-ignore
        html.find("button.cancel").on("click", this.close.bind(this));
        html.find("button.submit").on("click", this._submit.bind(this));
        html.find(".quantity-input").on("change", this._changeQuantity.bind(this));
        html.find(".quantity-quick-btn").on("click", this._quickChangeQuantity.bind(this));
        console.log("activateListeners() End");
    }

    /**
     * Handles the change in quantity
     * @private
     */
    _changeQuantity(event: Event): void {
        event.preventDefault();
        if (event.target != null && (event.target as HTMLTextAreaElement).value != null) {
            this.updateQuantity(parseInt((event.target as HTMLTextAreaElement).value));
        }
    }

    /**
     * Handles quick quantity buttons (one, half, all)
     * @private
     */
    _quickChangeQuantity(event: Event): void {
        event.preventDefault();
        let qsize: string = "";
        if (event.currentTarget != null) {
            qsize = (event.currentTarget as HTMLDataElement).dataset.qsize as string;
        }
        // @ts-ignore
        let qmax = this.data.item.system.quantity.value;
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
    updateQuantity(newQuantity: number): void {
        // @ts-ignore
        newQuantity = Math.min(Math.max(newQuantity, 1), this.data.item.system.quantity.value);
        this.quantity = newQuantity;
        (this.element.find(".quantity-input")[0] as HTMLInputElement).value = this.quantity.toString();
    }

    /**
     * Selects the target character.
     * @private
     */
    async _selectActor(event: {
        preventDefault: () => void;
        currentTarget: {
            closest: (arg0: string) => HTMLElement;
        };
    }): Promise<void> {
        console.log("_selectActor() Start");
        event.preventDefault();
        let actorElement: HTMLElement = event.currentTarget.closest(".actor.directory-item");
        this._selectedActor = this.data.characters.find(c => c.id === actorElement.dataset.actorId) as ICharData;
        this.element.find(".actor.directory-item").removeClass("active");
        actorElement.classList.add("active");

        if (this.selectedActor) {
            console.log(this.selectedActor);
            this.element.find("button.submit").removeAttr("disabled");
        }
        console.log("_selectActor() End");
    }

    async _submit(event: Event) {
        console.log("_submit() Start");
        event.preventDefault();
        if (this.selectedActor) {
            let tradeData: ITradeData = {
                srcUserId: game.userId as string,
                srcActorId: this.data.actorId,
                destActorId: this.selectedActor.id,
                destUserId: this.selectedActor.userId
            }
            if (this.data.item) {
                tradeData.itemId = this.data.item.id as string;
                tradeData.quantity = this.quantity;
            }
            await new Trade(tradeData).request();
            await this.close();
        }
        console.log("_submit() End");
    }
}