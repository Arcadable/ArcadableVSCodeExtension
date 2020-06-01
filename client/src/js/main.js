const vscode = acquireVsCodeApi();

const canvas = document.getElementById('canvasEl');
const tempCanvas = document.getElementById('textCanvasEl');
const canvasContext = canvas.getContext('2d');
const tempCanvasContext = tempCanvas.getContext('2d');



function exportByteCode() {
    vscode.postMessage({
        command: 'export'
    })
}

renderInstructions = [];

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'renderDone': {
            renderInstructions.forEach(r => {
                r();
            });
            renderInstructions = [];
            break;
        }
        case 'setDimensions':
            canvas.setAttribute('width', message.width);
            canvas.setAttribute('height', message.height);
            tempCanvas.setAttribute('width', message.width);
            tempCanvas.setAttribute('height', message.height);
            break;
        case 'getPixel':
            const data = canvasContext.getImageData(
                message.x,
                message.y,
                1,
                1
            ).data;

            const color = (data[0] << 16) + (data[1] << 8) + (data[2]);
            vscode.postMessage({
                command: 'getPixelResult',
                color
            })
            break;
        case 'clear':
            renderInstructions.push(() => {
                clear(canvasContext);
            });
            break;
        case 'drawCircle':
            renderInstructions.push(() => {
                drawCircle(canvasContext, message.color, message.centerX, message.centerY, message.radius);
            });
            break;
        case 'fillCircle':
            renderInstructions.push(() => {
                fillCircle(canvasContext, message.color, message.centerX, message.centerY, message.radius);
            });
            break;
        case 'drawLine':
            renderInstructions.push(() => {
                drawLine(canvasContext, tempCanvasContext, message.lineColor, message.pos1X, message.pos1Y, message.pos2X, message.pos2Y);
            });
            break;
        case 'drawPixel':
            renderInstructions.push(() => {
                drawPixel(canvasContext, message.pixelColor, message.x, message.y);
            });
            break;
        case 'drawRect':
            renderInstructions.push(() => {
                drawRect(canvasContext, message.drawRectColor, message.topLeftDrawX, message.topLeftDrawY, message.width, message.height);
            });
            break;
        case 'fillRect':
            renderInstructions.push(() => {
                fillRect(canvasContext, message.drawRectColor, message.topLeftDrawX, message.topLeftDrawY, message.width, message.height);
            });
            break;
        case 'drawText':
            renderInstructions.push(() => {
                drawText(canvasContext, tempCanvasContext, message.textColor, message.text, message.scale, message.pixelTextX, message.pixelTextY);
            });
            break;
        case 'drawTriangle':
            renderInstructions.push(() => {
                drawTriangle(canvasContext, tempCanvasContext, message.triangleColor, message.pixel1X, message.pixel1Y, message.pixel2X, message.pixel2Y, message.pixel3X, message.pixel3Y);
            });
            break;
        case 'fillTriangle':
            renderInstructions.push(() => {
                fillTriangle(canvasContext, tempCanvasContext, message.triangleColor, message.pixel1X, message.pixel1Y, message.pixel2X, message.pixel2Y, message.pixel3X, message.pixel3Y);
            });
            break;
        case 'setRotation':
            renderInstructions.push(() => {
                setRotation(canvasContext, tempCanvasContext, message.rotation);
            });
            break;
    }
});
