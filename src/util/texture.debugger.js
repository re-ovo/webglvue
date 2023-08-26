/**
 * Show image in the page
 *
 * @param image ImageBitmap
 */

const size = 150
let startY = 0

export function showTexture(image, name) {
    const element = document.createElement('canvas')
    element.style = `
        position: absolute;
        top: ${startY}px;
        left: 0;
        width: ${size}px;
        height: ${size}px;
        background-color: #fff;
        border: 1px solid #000;
    `.trim()
    startY += size
    document.body.appendChild(element)

    const ctx = element.getContext('2d')
    image && ctx.drawImage(image, 0, 0)
    ctx.font = '14px Arial'
    ctx.fillStyle = '#000'
    ctx.fillText(name, 0, 12)
}