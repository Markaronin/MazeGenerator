import { Color } from "./Color";
import { Direction } from "./Direction";

export class Cell {
    public walls: Record<Direction, boolean> = {
        up: true,
        down: true,
        left: true,
        right: true,
    };
    public visited = false;
    constructor(public x: number, public y: number, public color: Color) {}
}
