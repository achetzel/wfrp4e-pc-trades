export interface ICharData {
    userId: string,
    name: string | null,
    img: string | null,
    id: string
}

export function getOnlinePlayers(excludedId?: string): Array<ICharData> {
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
    return results;
}