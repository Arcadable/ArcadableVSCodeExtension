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
function clearInputs() {
   document.getElementById('digitalInputContainer').innerHTML = '';
   document.getElementById('analogInputContainer').innerHTML = '';
}
function addDigitalInput(id) {
    var input = document.createElement("INPUT");
    var label = document.createElement("LABEL");
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', 'digital' + id);
    input.setAttribute('name', 'digital' + id);
    label.setAttribute('for', 'digital' + id);
    label.innerText = 'Digital #' + id;
    var container = document.createElement("DIV");
    container.appendChild(input);
    container.appendChild(label);
    document.getElementById('digitalInputContainer').appendChild(container);

    input.onclick = (event) => {
        vscode.postMessage({
            command: 'digitalChanged',
            index: id,
            value: input.checked
        })
    };
}
function addAnalogInput(id) {
    var input = document.createElement("INPUT");
    var label = document.createElement("LABEL");
    input.setAttribute('type', 'range');
    input.setAttribute('id', 'analog' + id);
    input.setAttribute('name', 'analog' + id);
    input.setAttribute('min', 0);
    input.setAttribute('max', 1023);
    input.setAttribute('value', 512);

    label.setAttribute('for', 'analog' + id);
    label.innerText = 'Analog #' + id;
    var container = document.createElement("DIV");
    container.appendChild(input);
    container.appendChild(label);
    document.getElementById('analogInputContainer').appendChild(container);

    input.oninput = (event) => {
        vscode.postMessage({
            command: 'analogChanged',
            index: id,
            value: input.value
        })
    };
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
        case 'setInputs': {
            clearInputs();
            for(let i = 0; i < message.digitalInputs; i++) {
                addDigitalInput(i);
            }
            for(let i = 0; i < message.analogInputs; i++) {
                addAnalogInput(i);
            }
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
                drawText(canvasContext, tempCanvasContext, message.textColor, message.textvalue, message.scale, message.pixelTextX, message.pixelTextY);
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
