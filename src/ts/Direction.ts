export type Direction = "up" | "down" | "left" | "right";

export const oppositeDirection: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
};
