import {Actor} from "./actor.js";

export class Group extends Actor {
    constructor() {
        super()
        this.children = []
    }

    add(child) {
        child.parent = this
        this.children.push(child)
    }

    remove(child) {
        const index = this.children.indexOf(child)
        if (index !== -1) {
            this.children.splice(index, 1)
        }
    }
}

export class Scene extends Group {
    constructor() {
        super()
    }
}