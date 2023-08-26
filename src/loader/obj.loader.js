
export async function loadObj(path) {
    const text = await fetch(path).then(res => res.text())
    const lines = text.split('\n')
}