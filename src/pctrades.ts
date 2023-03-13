import {CFG} from "./config"
import TradeItem from "./trade/items"
import Trade from "./trade/trade";
//import ActorSheetWfrp4eVehicle from "/home/ac/foundryuserdata/Data/systems/wfrp4e/wfrp4e.js";
//import Container from "./lootcontainer/containerBuilder";

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



// export class LootContainerSheet extends ActorSheetWfrp4eVehicle {
//     static get defaultOptions() {
//         const options = super.defaultOptions;
//         mergeObject(options,
//             {
//                 classes: options.classes.concat(["loot-container"]),
//                 width: 610,
//                 height: 740,
//             });
//         return options;
//     }
//
//     get template() {
//         const path = "systems/wfrp4e/templates/actors/"
//         // @ts-ignore - global actor var
//         if (!game.user!.isGM && this.actor.limited) return path + "limited-sheet.html";
//         return "modules/wfrp4e-pc-trades/templates/lootcontainer.html";
//
//     }
//
//     getData() {
//         const sheetData = super.getData();
//         return sheetData;
//     }
//
//     activateListeners(html: HTMLElement) {
//         super.activateListeners(html);
//     }
//
//
// }

// @ts-ignore - type is taken from extended object, will fit
// Actors.registerSheet("wfrp4e", LootContainerSheet, {
//     types: ["vehicle"],
//     makeDefault: false
// })

// Hooks.on('renderActorDirectory', (_app: ActorSheet, html: JQuery) => {
//     if (game.user!.can('ACTOR_CREATE')) {
//         addActorActionButton(html, 'PCTRADES.actor.directory.button', async() => {
//             await Container.create();
//                 // .then(actor => {
//                 //     ui.notifications.info(
//                 //         game.i18n.format('PCTRADES.notification.actor.created', {
//                 //             name: actor.name,
//                 //         })
//                 //     )
//                 // })
//                 // .catch((e) => {
//                 //     console.error(e);
//                 // })
//         });
//     }
// });

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

// function addActorActionButton(html: JQuery, label: string, onClick: () => void) {
//     const button = document.createElement('button');
//     button.style.width = '95%';
//     button.innerHTML = game.i18n.localize(label);
//     button.addEventListener('click', () => {
//         onClick();
//     });
//     html.find('.header-actions').after(button);
// }
