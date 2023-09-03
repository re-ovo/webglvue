export class Controls {
    constructor(canvas, camera) {
        this.canvas = canvas
        this.camera = camera

        this.forward = 0
        this.strafe = 0
        this.up = 0

        this.mouveMoveXVelocity = 0
        this.mouveMoveYVelocity = 0

        this.speed = 0.1
        this.sensitivity = 0.002

        this.init()
    }

    init() {
        let focused = false

        const mouseMove = (e) => {
            this.camera.rotate(e.movementX, e.movementY, this.sensitivity)
            this.mouveMoveXVelocity = e.movementX
            this.mouveMoveYVelocity = e.movementY
        }

        this.canvas.addEventListener('mousedown', (e) => {
            focused = true
            e.preventDefault()
        })

        this.canvas.addEventListener('mouseup', (e) => {
            focused = false
            e.preventDefault()
        })

        this.canvas.addEventListener('mousemove', (e) => {
            if (focused) {
                mouseMove(e)

                e.preventDefault()
            }
        })

        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'w':
                    this.forward = 1
                    break
                case 's':
                    this.forward = -1
                    break
                case 'a':
                    this.strafe = -1
                    break
                case 'd':
                    this.strafe = 1
                    break
                case 'q':
                    this.up = -1
                    break
                case 'e':
                    this.up = 1
                    break
            }
        })

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'w':
                case 's':
                    this.forward = 0
                    break
                case 'a':
                case 'd':
                    this.strafe = 0
                    break
                case 'q':
                case 'e':
                    this.up = 0
                    break
            }
        })

        document.addEventListener('wheel', (e) => {
            this.forward = e.deltaY > 0 ? -1 : 1
            setTimeout(() => {
                this.forward = 0
            }, 100)
        })
    }

    update() {
        this.camera.move(this.forward, this.strafe, this.speed)
        this.camera.moveUp(this.up * this.speed)

        if (Math.abs(this.mouveMoveXVelocity) > 0.01 || Math.abs(this.mouveMoveYVelocity) > 0.01) {
            this.camera.rotate(this.mouveMoveXVelocity, this.mouveMoveYVelocity, this.sensitivity)

            this.mouveMoveXVelocity *= 0.9
            this.mouveMoveYVelocity *= 0.9
        }
    }
}
