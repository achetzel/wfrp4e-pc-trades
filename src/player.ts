export interface ICharData {
    userId: string,
    name: string | null,
    img: string | null,
    id: string
}

export default class Player {

    async getOnlinePlayers(excludedId?: string): Promise<Array<ICharData>> {
        let results: Array<ICharData> = new Array<ICharData>();
        if (game.users !== undefined) {
            game.users.forEach(u => {
                let char = u.character;
                if (u.active && char && char.id !== excludedId) {
                    results.push({
                        "userId": u.id,
                        "name": char.name,
                        "img": char.img,
                        "id": char.id
                    });
                }
            });
        }
        return new Promise<Array<ICharData>>((resolve) => {resolve(results)});
    }

    getActorName(actor: StoredDocument<Actor> | string): string {

        if (typeof actor === "string") {
            let a: StoredDocument<Actor> = game.actors!.get(actor) as StoredDocument<Actor>;
            return a.name as string;
        } else {
            return actor.name as string;
        }
    }

    getActor(actorId: string): StoredDocument<Actor> | undefined {
        return game.actors!.get(actorId);
    }

    async sendChatMessage(srcActor: StoredDocument<Actor>, destActor: StoredDocument<Actor>, tradeItem: Item) {
        let chatMessage = {
            user: game.userId,
            speaker: ChatMessage.getSpeaker(),
            content: game.i18n.format("PCTRADES.player.gmTradeDescription", {
                sender: srcActor.name,
                receiver: destActor.name,
                item: tradeItem.name
            }),
            whisper: game.users?.filter(u => u.isGM).map(u => u.id)
        };

        chatMessage.whisper?.push(srcActor.id);
        await ChatMessage.create(chatMessage);
    }
}