import { Cell } from "./Cell";
import { Color, colorToColorString } from "./Color";
import { config } from "./config";
import { Direction, oppositeDirection } from "./Direction";

export class MazeGenerator {
    private cells: Cell[][];
    private cursorLocation: Cell;
    private cursorPreviousCellsVisited: Cell[];

    private lastTimestamp;
    private doneGenerating;
    private doneSolving;

    private timeSinceLastTick;
    private timePerTick;

    private restartMaze() {
        const cells: Cell[][] = [];
        for (let x = 0; x < config.mazeSize.width; x++) {
            cells.push([]);
            for (let y = 0; y < config.mazeSize.height; y++) {
                cells[x].push(new Cell(x, y, { r: 0, g: 0, b: 0 }));
            }
        }
        const cursorLocation = cells[0][0];
        cursorLocation.generated = true;
        cursorLocation.color = {
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255),
        };
        const cursorPreviousCellsVisited: Cell[] = [];
        const lastTimestamp = performance.now();
        const doneGenerating = false;
        const doneSolving = false;
        const timeSinceLastTick = 0;
        const timePerTick = 0.005;
        return {
            cells,
            cursorLocation,
            cursorPreviousCellsVisited,
            lastTimestamp,
            doneGenerating,
            doneSolving,
            timeSinceLastTick,
            timePerTick,
        };
    }

    constructor(private readonly canvas: HTMLCanvasElement, private readonly context2d: CanvasRenderingContext2D) {
        ({
            cells: this.cells,
            cursorLocation: this.cursorLocation,
            cursorPreviousCellsVisited: this.cursorPreviousCellsVisited,
            lastTimestamp: this.lastTimestamp,
            doneGenerating: this.doneGenerating,
            doneSolving: this.doneSolving,
            timeSinceLastTick: this.timeSinceLastTick,
            timePerTick: this.timePerTick,
        } = this.restartMaze());
        window.requestAnimationFrame(this.loop.bind(this));
    }

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

    private tick(elapsedTime: number) {
        this.timeSinceLastTick += elapsedTime;
        while (this.timeSinceLastTick >= this.timePerTick) {
            this.timeSinceLastTick -= this.timePerTick;
            if (!this.doneGenerating) {
                this.generateNextCell();
            } else if (!this.doneSolving) {
                this.doAThing();
            } else {
                ({
                    cells: this.cells,
                    cursorLocation: this.cursorLocation,
                    cursorPreviousCellsVisited: this.cursorPreviousCellsVisited,
                    lastTimestamp: this.lastTimestamp,
                    doneGenerating: this.doneGenerating,
                    doneSolving: this.doneSolving,
                    timeSinceLastTick: this.timeSinceLastTick,
                    timePerTick: this.timePerTick,
                } = this.restartMaze());
            }
        }
    }

    private doAThing() {
        // First, check if we're already at the exit
        if (this.cursorLocation.x === config.mazeSize.width - 1 && this.cursorLocation.y === config.mazeSize.height - 1) {
            this.doneSolving = true;
            this.cursorPreviousCellsVisited.push(this.cursorLocation);
        } else {
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
                    !this.cursorLocation.walls[coords.dir as Direction] &&
                    !this.cells[coords.x][coords.y].notTheWayTowardsTheExit &&
                    !this.cells[coords.x][coords.y].visitedOnTheWayToTheExit,
            ) as { x: number; y: number; dir: Direction }[];
            if (coordsAndDirOfCellsToVisit.length > 0) {
                const coordsOfCellToVisit = coordsAndDirOfCellsToVisit[Math.floor(Math.random() * coordsAndDirOfCellsToVisit.length)];
                this.cursorPreviousCellsVisited.push(this.cursorLocation);
                this.cursorLocation = this.cells[coordsOfCellToVisit.x][coordsOfCellToVisit.y];
                this.cursorLocation.visitedOnTheWayToTheExit = true;
            } else {
                this.cursorLocation.notTheWayTowardsTheExit = true;
                const potentialCursorLocation = this.cursorPreviousCellsVisited.pop();
                if (potentialCursorLocation) {
                    this.cursorLocation = potentialCursorLocation;
                } else {
                    throw new Error("Oops");
                }
            }
        }
    }

    private generateNextCell() {
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
                !this.cells[coords.x][coords.y].generated,
        ) as { x: number; y: number; dir: Direction }[];
        if (coordsAndDirOfCellsToVisit.length > 0) {
            const coordsOfCellToVisit = coordsAndDirOfCellsToVisit[Math.floor(Math.random() * coordsAndDirOfCellsToVisit.length)];
            this.cursorPreviousCellsVisited.push(this.cursorLocation);
            this.cursorLocation.walls[coordsOfCellToVisit.dir] = false;
            this.cursorLocation = this.cells[coordsOfCellToVisit.x][coordsOfCellToVisit.y];
            this.cursorLocation.walls[oppositeDirection[coordsOfCellToVisit.dir]] = false;
            this.cursorLocation.generated = true;
            this.cursorLocation.color = this.newRandomColor(this.cursorPreviousCellsVisited[this.cursorPreviousCellsVisited.length - 1].color);
        } else {
            this.cursorLocation.color = { r: 100, g: 100, b: 100 };
            const potentialCursorLocation = this.cursorPreviousCellsVisited.pop();
            if (potentialCursorLocation) {
                this.cursorLocation = potentialCursorLocation;
            } else {
                this.doneGenerating = true;
            }
        }
    }

    private render() {
        this.context2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const cellSize = {
            width: this.canvas.width / config.mazeSize.width,
            height: this.canvas.height / config.mazeSize.height,
        };
        for (let x = 0; x < config.mazeSize.width; x++) {
            for (let y = 0; y < config.mazeSize.height; y++) {
                const cell = this.cells[x][y];
                this.context2d.fillStyle = colorToColorString(cell.color);
                this.context2d.fillRect(cellSize.width * x, cellSize.height * y, cellSize.width + 1, cellSize.height + 1);
                this.context2d.strokeStyle = config.wallColor;
                if (cell.walls.down) {
                    this.context2d.beginPath();
                    this.context2d.moveTo(cellSize.width * x, cellSize.height * (y + 1));
                    this.context2d.lineTo(cellSize.width * (x + 1), cellSize.height * (y + 1));
                    this.context2d.stroke();
                }
                if (cell.walls.left) {
                    this.context2d.beginPath();
                    this.context2d.moveTo(cellSize.width * x, cellSize.height * y);
                    this.context2d.lineTo(cellSize.width * x, cellSize.height * (y + 1));
                    this.context2d.stroke();
                }
            }
        }
        if (this.doneGenerating) {
            this.context2d.strokeStyle = "red";
            this.cursorPreviousCellsVisited.forEach((cell, i) => {
                if (i < this.cursorPreviousCellsVisited.length - 1) {
                    const nextCell = this.cursorPreviousCellsVisited[i + 1];
                    this.context2d.beginPath();
                    this.context2d.moveTo(cellSize.width * (cell.x + 0.5), cellSize.height * (cell.y + 0.5));
                    this.context2d.lineTo(cellSize.width * (nextCell.x + 0.5), cellSize.height * (nextCell.y + 0.5));
                    this.context2d.stroke();
                }
            });
        }
    }
}
