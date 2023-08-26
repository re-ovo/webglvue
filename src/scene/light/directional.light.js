import {Light} from "./light.js";
import {Vec3} from "../../math/vec3.js";

export class DirectionalLight extends Light {
    constructor() {
        super();

        this.direction = new Vec3(0, 0, 1);
    }
}