import {CFG} from "./config"
import TradeItem from "./trade/items"
import Trade from "./trade/trade";
import Container from "./lootcontainer/containerBuilder";

Hooks.once("setup", async function () {
    Hooks.on("renderActorSheetWfrp4eCharacter", await renderInjectionHook);
    Hooks.on('renderActorDirectory', (_app: ActorSheet, html: JQuery) => {
        if (game.user!.can('ACTOR_CREATE')) {
            renderContainerButton(html, 'PCTRADES.actor.directory.button', async() => {
                await Container.create()
                .then(actor => {
                    ui.notifications.info(
                        game.i18n.format('PCTRADES.notification.actor.created', {
                            name: actor.name,
                        })
                    )
                })
                .catch((e) => {
                    console.error(e);
                })
            });
        }
    });

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



// @ts-ignore
export class LootContainerSheet extends ActorSheetWfrp4e {

    /**
     * Get the correct HTML template path to use for rendering this particular sheet
     * @type {String}
     */
    get template() {
        if (!game.user!.isGM && this.actor.limited) return "systems/wfrp4e/templates/actors/actor-limited.hbs";
        return "modules/wfrp4e-pc-trades/templates/lootcontainer.html";
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options,
            {
                classes: options.classes.concat(["pc-trades","loot-container"]),
                width: 610,
                height: 740
            });
        return options;
    }



    async getData() {
        let sheetData = await super.getData();
        return sheetData;
    }

    async _handleEnrichment()
    {
        let enrichment = {};
        enrichment["system.details.description.value"] = await TextEditor.enrichHTML(this.actor.system.details.description.value, {async: true});
        enrichment["system.details.gmnotes.value"] = await TextEditor.enrichHTML(this.actor.system.details.gmdescription.value, {async: true});

        return expandObject(enrichment)
    }


    _addEncumbranceData(sheetData)
    {
        sheetData.system.status.encumbrance.max = sheetData.system.status.carries.max;
        sheetData.system.status.encumbrance.pct = sheetData.system.status.encumbrance.over / sheetData.system.status.encumbrance.max * 100;
        sheetData.system.status.encumbrance.carryPct = sheetData.system.status.encumbrance.current / sheetData.system.status.carries.max * 100;
        if (sheetData.system.status.encumbrance.pct + sheetData.system.status.encumbrance.carryPct > 100) {
            sheetData.system.status.encumbrance.penalty = Math.floor(((sheetData.system.status.encumbrance.carryPct + sheetData.system.status.encumbrance.pct) - 100) / 10);
            sheetData.system.status.encumbrance.message = `Handling Tests suffer a -${sheetData.system.status.encumbrance.penalty} SL penalty.`;
            sheetData.system.status.encumbrance.overEncumbered = true;
        }
        else {
            sheetData.system.status.encumbrance.message = `Encumbrance below maximum: No Penalties`;
            if (sheetData.system.status.encumbrance.pct + sheetData.system.status.encumbrance.carryPct == 100 && sheetData.system.status.encumbrance.carryPct)
                sheetData.system.status.encumbrance.carryPct -= 1;
        }
        sheetData.system.status.encumbrance.total = sheetData.system.status.encumbrance.current + sheetData.system.status.encumbrance.over;
        sheetData.system.status.encumbrance.modMsg = game.i18n.format("VEHICLE.ModEncumbranceTT", { amt: sheetData.system.status.encumbrance.over }),
            sheetData.system.status.encumbrance.carryMsg = game.i18n.format("VEHICLE.CarryEncumbranceTT", { amt: Math.round(sheetData.system.status.encumbrance.current * 10) / 10 });
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers
    /* -------------------------------------------- */

    /**
     * Activate event listeners using the prepared sheet HTML
     * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html: JQuery) {
        super.activateListeners(html);

        // Do not proceed if sheet is not editable
        //if (!this.options.editable) return;

        html.find(".cargo .inventory-list .name").mousedown(this._onCargoClick.bind(this));
    }

    _onCargoClick(ev) {
        if (ev.button != 2) return;
        new Dialog({
            title: game.i18n.localize("SHEET.SplitTitle"),
            content: `
                <p>${game.i18n.localize("SHEET.SplitPrompt")}</p>
                <div class="form-group">
                    <input name="split-amt" type="text" />
                </div>`,
            buttons: {
                split: {
                    label: "Split",
                    callback: (dlg) => {
                        let amt = Number(dlg.find('[name="split-amt"]').val());
                        if (isNaN(amt)) return
                        this.splitItem(this._getItemId(ev), amt);
                    }
                }
            }
        }).render(true);
    }
}


// @ts-ignore - type is taken from extended object, will fit
Actors.registerSheet("wfrp4e", LootContainerSheet, {
    types: ["npc"],
    makeDefault: false
})



async function renderInjectionHook(sheet: any, element: Element) {
    const actorId: string = sheet.actor.id;

    let items:JQuery<HTMLElement> = $(".tab.inventory .item", element);

    for (let item of items) {
        try {
            await new TradeItem().itemDefault(item, actorId);
        } catch (e) {
            console.error("WFRP4e PC Trades | Failed to inject onto item: ", item);
        }
    }
    console.log("WFRP4e PC Trades | Added trade icons to sheet for actor " + actorId);
}

function renderContainerButton(html: JQuery, label: string, onClick: () => void) {
    const button = document.createElement('button');
    button.style.width = '95%';
    button.innerHTML = game.i18n.localize(label);
    button.addEventListener('click', () => {
        onClick();
    });
    html.find('.header-actions').after(button);
}
