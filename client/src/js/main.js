const vscode = acquireVsCodeApi();

const canvas = document.getElementById('canvasEl');
const tempCanvas = document.getElementById('textCanvasEl');
const canvasContext = canvas.getContext('2d');
const tempCanvasContext = tempCanvas.getContext('2d');
let volume = 0.5;
document.getElementById('volumneslider').oninput = (event) => {
    volume = Number.parseInt(event.target.value) / 100;
};

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
            setDimensions(message.width, message.height);
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
                clear();
            });
            break;
        case 'drawCircle':
            renderInstructions.push(() => {
                drawCircle(message.centerX, message.centerY, message.radius, message.color);
            });
            break;
        case 'fillCircle':
            renderInstructions.push(() => {
                fillCircle(message.centerX, message.centerY, message.radius, message.color);
            });
            break;
        case 'drawLine':
            renderInstructions.push(() => {
                drawLine(message.pos1X, message.pos1Y, message.pos2X, message.pos2Y, message.lineColor);
            });
            break;
        case 'drawPixel':
            renderInstructions.push(() => {
                drawPixel(message.x, message.y, message.pixelColor);
            });
            break;
        case 'drawRect':
            renderInstructions.push(() => {
                drawRect(message.topLeftDrawX, message.topLeftDrawY, message.width, message.height, message.drawRectColor);
            });
            break;
        case 'fillRect':
            renderInstructions.push(() => {
                fillRect(message.topLeftDrawX, message.topLeftDrawY, message.width, message.height, message.drawRectColor);
            });
            break;
        case 'drawText':
            renderInstructions.push(() => {
                drawText(message.pixelTextX, message.pixelTextY, message.scale, message.textColor, message.textvalue);
            });
            break;
        case 'drawImage':
            renderInstructions.push(() => {
                drawImage(message.x, message.y, message.w, message.h, message.keyColor, message.data);
            });
            break;
        case 'drawTriangle':
            renderInstructions.push(() => {
                drawTriangle(message.pixel1X, message.pixel1Y, message.pixel2X, message.pixel2Y, message.pixel3X, message.pixel3Y, message.triangleColor);
            });
            break;
        case 'fillTriangle':
            renderInstructions.push(() => {
                fillTriangle(message.pixel1X, message.pixel1Y, message.pixel2X, message.pixel2Y, message.pixel3X, message.pixel3Y, message.triangleColor);
            });
            break;
        case 'setRotation':
            renderInstructions.push(() => {
                setRotation(message.rotation);
            });
            break;
        case 'tone':
            beep(message.volume * volume, message.frequency, message.duration);
            break;
    }
});
