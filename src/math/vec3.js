export class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(vector) {
        return new Vec3(
            this.x + vector.x,
            this.y + vector.y,
            this.z + vector.z
        )
    }

    subtract(vector) {
        return new Vec3(
            this.x - vector.x,
            this.y - vector.y,
            this.z - vector.z
        )
    }

    normalize() {
        let length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        return new Vec3(
            this.x / length,
            this.y / length,
            this.z / length
        )
    }

    cross(vector) {
        return new Vec3(
            this.y * vector.z - this.z * vector.y,
            this.z * vector.x - this.x * vector.z,
            this.x * vector.y - this.y * vector.x
        )
    }

    negate() {
        return new Vec3(
            -this.x,
            -this.y,
            -this.z
        )
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z
    }

    mul(scalar) {
        return new Vec3(
            this.x * scalar,
            this.y * scalar,
            this.z * scalar
        )
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    distance(vector) {
        return Math.sqrt(
            Math.pow(this.x - vector.x, 2) +
            Math.pow(this.y - vector.y, 2) +
            Math.pow(this.z - vector.z, 2)
        )
    }

    to_array() {
        return [this.x, this.y, this.z]
    }

    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`
    }
}
