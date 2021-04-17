export interface Color {
    r: number,
    g: number,
    b: number,
}

export function colorToColorString(color: Color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`
}