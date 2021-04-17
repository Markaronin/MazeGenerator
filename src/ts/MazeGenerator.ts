import { Cell } from "./Cell";
import { Color, colorToColorString } from "./Color";
import { config } from "./config";
import { Direction, oppositeDirection } from "./Direction";

export class MazeGenerator {
    private readonly cells: Cell[][] = [];
    private cursorLocation: Cell;
    private cursorPreviousCellsVisited: Cell[] = [];
    private currentColorShades: Color = { r: 0, g: 255, b: 0 };

    constructor(private readonly canvas: HTMLCanvasElement, private readonly context2d: CanvasRenderingContext2D) {
        for (let x = 0; x < config.mazeSize.width; x++) {
            this.cells.push([]);
            for (let y = 0; y < config.mazeSize.height; y++) {
                this.cells[x].push(new Cell(x, y, { r: 0, g: 0, b: 0 }));
            }
        }
        this.cursorLocation = this.cells[0][0];
        this.cursorLocation.visited = true;
        this.cursorLocation.color = this.currentColorShades;
        this.start();
    }

    private start() {
        window.requestAnimationFrame(this.loop.bind(this));
    }

    private lastTimestamp = performance.now();
    private loop(timestamp: number) {
        const elapsedTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        this.tick(elapsedTime);
        this.render();
        window.requestAnimationFrame(this.loop.bind(this));
    }

    private newRandomColor(prevCellColor: Color): Color {
        const whichColorToModify: "r" | "g" | "b" = (["r", "g", "b"] as any)[Math.floor(Math.random() * 3)];
        const newColor = {
            r: prevCellColor.r,
            g: prevCellColor.g,
            b: prevCellColor.b,
        };
        const colorModAmt = 10;
        newColor[whichColorToModify] += Math.random() > 0.5 ? colorModAmt : -colorModAmt;
        if (newColor[whichColorToModify] > 255) {
            newColor[whichColorToModify] -= 2 * colorModAmt;
        } else if (newColor[whichColorToModify] < 0) {
            newColor[whichColorToModify] = Math.abs(newColor[whichColorToModify]);
        }
        return newColor;
    }

    private timeSinceLastTick = 0;
    private timePerTick = 0.005;
    private tick(elapsedTime: number) {
        this.timeSinceLastTick += elapsedTime;
        while (this.timeSinceLastTick >= this.timePerTick) {
            this.timeSinceLastTick -= this.timePerTick;
            const coordsAndDirOfCellsToVisit = [
                { x: this.cursorLocation.x, y: this.cursorLocation.y - 1, dir: "up" },
                { x: this.cursorLocation.x, y: this.cursorLocation.y + 1, dir: "down" },
                { x: this.cursorLocation.x - 1, y: this.cursorLocation.y, dir: "left" },
                { x: this.cursorLocation.x + 1, y: this.cursorLocation.y, dir: "right" },
            ].filter(
                (coords) =>
                    coords.x >= 0 &&
                    coords.x < config.mazeSize.width &&
                    coords.y >= 0 &&
                    coords.y < config.mazeSize.height &&
                    !this.cells[coords.x][coords.y].visited,
            ) as { x: number; y: number; dir: Direction }[];
            if (coordsAndDirOfCellsToVisit.length > 0) {
                const coordsOfCellToVisit = coordsAndDirOfCellsToVisit[Math.floor(Math.random() * coordsAndDirOfCellsToVisit.length)];
                this.cursorPreviousCellsVisited.push(this.cursorLocation);
                this.cursorLocation.walls[coordsOfCellToVisit.dir] = false;
                this.cursorLocation = this.cells[coordsOfCellToVisit.x][coordsOfCellToVisit.y];
                this.cursorLocation.walls[oppositeDirection[coordsOfCellToVisit.dir]] = false;
                this.cursorLocation.visited = true;
                this.cursorLocation.color = this.newRandomColor(this.cursorPreviousCellsVisited[this.cursorPreviousCellsVisited.length - 1].color);
            } else {
                this.cursorLocation.color = { r: 100, g: 100, b: 100 };
                const potentialCursorLocation = this.cursorPreviousCellsVisited.pop();
                if (potentialCursorLocation) {
                    this.cursorLocation = potentialCursorLocation;
                } else {
                    //Done
                }
            }
        }
    }

    private render() {
        this.context2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let x = 0; x < config.mazeSize.width; x++) {
            for (let y = 0; y < config.mazeSize.height; y++) {
                this.context2d.fillStyle = colorToColorString(this.cells[x][y].color);
                const cellSize = {
                    width: this.canvas.width / config.mazeSize.width,
                    height: this.canvas.height / config.mazeSize.height,
                };
                this.context2d.fillRect(cellSize.width * x, cellSize.height * y, cellSize.width, cellSize.height);
                this.context2d.strokeStyle = config.wallColor;
                if (this.cells[x][y].walls.up) {
                    this.context2d.beginPath();
                    this.context2d.moveTo(cellSize.width * x, cellSize.height * y);
                    this.context2d.lineTo(cellSize.width * (x + 1), cellSize.height * y);
                    this.context2d.stroke();
                }
                if (this.cells[x][y].walls.down) {
                    this.context2d.beginPath();
                    this.context2d.moveTo(cellSize.width * x, cellSize.height * (y + 1));
                    this.context2d.lineTo(cellSize.width * (x + 1), cellSize.height * (y + 1));
                    this.context2d.stroke();
                }
                if (this.cells[x][y].walls.left) {
                    this.context2d.beginPath();
                    this.context2d.moveTo(cellSize.width * x, cellSize.height * y);
                    this.context2d.lineTo(cellSize.width * x, cellSize.height * (y + 1));
                    this.context2d.stroke();
                }
                if (this.cells[x][y].walls.right) {
                    this.context2d.beginPath();
                    this.context2d.moveTo(cellSize.width * (x + 1), cellSize.height * y);
                    this.context2d.lineTo(cellSize.width * (x + 1), cellSize.height * (y + 1));
                    this.context2d.stroke();
                }
            }
        }
    }
}