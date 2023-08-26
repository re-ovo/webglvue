import {Actor} from "../actor.js";
import {Vec3} from "../../math/vec3.js";

export class Light extends Actor {
    constructor() {
        super();

        this.color = new Vec3(1, 1, 1);
        this.intensity = 1.0;
    }
}