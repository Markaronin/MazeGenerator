import React, { Component, createElement } from "react";
import ReactDOM from "react-dom";
import { MazeGenerator } from "./MazeGenerator";

class MainDiv extends Component<{}, {}> {
    private readonly canvasRef = React.createRef<HTMLCanvasElement>();

    componentDidMount() {
        const canvas = this.canvasRef.current!;
        const context2d = canvas.getContext('2d')!;
        new MazeGenerator(canvas, context2d);
    }

    render() {
        return <canvas ref={this.canvasRef} width="1000" height="1000">Canvas not working</canvas>;
    }
}

const domContainer = document.querySelector("#reactDom");
ReactDOM.render(createElement(MainDiv), domContainer);
