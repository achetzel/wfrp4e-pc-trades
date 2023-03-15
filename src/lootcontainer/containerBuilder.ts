import {
    ActorDataConstructorData
} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/actorData";

export default class Container {

    public static async buildData() {
        // vehicle is best choice atm for a random container w/ moveable items
        const name: string = "container";
        const type: string = "vehicle";

        let data: ActorDataConstructorData = {
            name: name,
            type: type
        }

        return Promise.resolve(data);
    }

    public static async create(){
        const buildData = await this.buildData();

        console.log(buildData);

        let actor: Actor = <Actor>await Actor.create(buildData);
        return Promise.resolve(actor);
    }
}