const vscode = acquireVsCodeApi();

const canvas = document.getElementById('canvasEl');
const tempCanvas = document.getElementById('textCanvasEl');
const canvasContext = canvas.getContext('2d');
const tempCanvasContext = tempCanvas.getContext('2d');


function clear(canvasContext) {
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
}

function drawCircle(canvasContext, color, centerX, centerY, radius) {
    canvasContext.fillStyle = getHex(color);
    aliasedStrokeCircle(Math.floor(centerX), Math.floor(centerY), radius);
}

function fillCircle(canvasContext, color, centerX, centerY, radius) {
    canvasContext.fillStyle = getHex(color);
    aliasedFilledCircle(Math.floor(centerX), Math.floor(centerY), radius);
}

function drawLine(canvasContext, tempCanvasContext, lineColor, pos1X, pos1Y, pos2X, pos2Y) {
    tempCanvasContext.clearRect(
        0,
        0,
        tempCanvasContext.canvas.width,
        tempCanvasContext.canvas.height
    );

    const imgData = tempCanvasContext.getImageData(
        0,
        0,
        canvasContext.canvas.width,
        canvasContext.canvas.height
    );
    const data = imgData.data;

    aliasedLine(Math.floor(pos1X), Math.floor(pos1Y), Math.floor(pos2X), Math.floor(pos2Y), lineColor, data);

    tempCanvasContext.putImageData(imgData, 0, 0);
    canvasContext.drawImage(tempCanvasContext.canvas, 0, 0);
}

function drawPixel(canvasContext, pixelColor, x, y) {
    canvasContext.fillStyle = getHex(pixelColor);
    canvasContext.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

function drawRect(canvasContext, color, topLeftDrawX, topLeftDrawY, width, height) {
    canvasContext.strokeStyle = getHex(color);
    canvasContext.strokeRect(
        Math.floor(topLeftDrawX) + 0.5,
        Math.floor(topLeftDrawY) + 0.5,
        width - 1,
        height - 1
    );
}

function fillRect(canvasContext, color, topLeftDrawX, topLeftDrawY, width, height) {
    canvasContext.strokeStyle = getHex(color);
    canvasContext.fillStyle = getHex(color);
    canvasContext.fillRect(
        Math.floor(topLeftDrawX) + 0.5,
        Math.floor(topLeftDrawY) + 0.5,
        width - 1,
        height - 1
    );
    canvasContext.strokeRect(
        Math.floor(topLeftDrawX) + 0.5,
        Math.floor(topLeftDrawY) + 0.5,
        width - 1,
        height - 1
    );
}

function drawText(canvasContext, tempCanvasContext, color, text, scale, pixelTextX, pixelTextY) {
    tempCanvasContext.font = 'lighter ' + (8 * scale) + 'px "Lucida Console", Monaco, monospace';

    tempCanvasContext.clearRect(
        0,
        0,
        tempCanvasContext.canvas.width,
        tempCanvasContext.canvas.height
    );

    for (let i = 0; i < text.length; i++) {
        tempCanvasContext.fillText(
            text.charAt(i),
            Math.floor(pixelTextX) + i * (5 * scale) - 0.5,
            Math.floor(pixelTextY)
        );
    }

    const tempImgData = tempCanvasContext.getImageData(
        0,
        0,
        tempCanvasContext.canvas.width,
        tempCanvasContext.canvas.height
    );
    const tempData = tempImgData.data;

    const imgData = canvasContext.getImageData(
        0,
        0,
        canvasContext.canvas.width,
        canvasContext.canvas.height
    );
    const data = imgData.data;
    for (let i = 0; i < tempData.length; i += 4) {
        if (tempData[i + 3] > 95) {
            const pixelIndex = i / 4;
            const pixelY = Math.floor(pixelIndex / canvasContext.canvas.width);
            const pixelX = pixelIndex - canvasContext.canvas.width * pixelY;
            setPixel(pixelX, pixelY, color, data);
        }
    }
    canvasContext.putImageData(imgData, 0, 0);

}

function drawTriangle(canvasContext, tempCanvasContext, triangleColor, pixel1X, pixel1Y, pixel2X, pixel2Y, pixel3X, pixel3Y) {
    tempCanvasContext.clearRect(
        0,
        0,
        tempCanvasContext.canvas.width,
        tempCanvasContext.canvas.height
    );

    const imgData = tempCanvasContext.getImageData(
        0,
        0,
        canvasContext.canvas.width,
        canvasContext.canvas.height
    );
    const data = imgData.data;
    aliasedStrokeTriangle(
        Math.floor(pixel1X),
        Math.floor(pixel1Y),
        Math.floor(pixel2X),
        Math.floor(pixel2Y),
        Math.floor(pixel3X),
        Math.floor(pixel3Y),
        triangleColor,
        data
    );
    tempCanvasContext.putImageData(imgData, 0, 0);
    canvasContext.drawImage(tempCanvasContext.canvas, 0, 0);
}

function fillTriangle(canvasContext, tempCanvasContext, triangleColor, pixel1X, pixel1Y, pixel2X, pixel2Y, pixel3X, pixel3Y) {
    tempCanvasContext.clearRect(
        0,
        0,
        tempCanvasContext.canvas.width,
        tempCanvasContext.canvas.height
    );

    const imgData = tempCanvasContext.getImageData(
        0,
        0,
        canvasContext.canvas.width,
        canvasContext.canvas.height
    );
    const data = imgData.data;
    aliasedFillTriangle(
        Math.floor(pixel1X),
        Math.floor(pixel1Y),
        Math.floor(pixel2X),
        Math.floor(pixel2Y),
        Math.floor(pixel3X),
        Math.floor(pixel3Y),
        triangleColor,
        data
    );
    tempCanvasContext.putImageData(imgData, 0, 0);
    canvasContext.drawImage(tempCanvasContext.canvas, 0, 0);
}

function setRotation(canvasContext, tempCanvasContext, rotation) {
    canvasContext.resetTransform();
    canvasContext.translate(
        canvasContext.canvas.width / 2,
        canvasContext.canvas.height / 2
    );
    canvasContext.rotate(-90 * rotation * Math.PI / 180);
    canvasContext.translate(
        -(rotation % 2 === 0 ?
            canvasContext.canvas.width :
            canvasContext.canvas.height
        ) / 2,
        -(rotation % 2 === 0 ?
            canvasContext.canvas.height :
            canvasContext.canvas.width
        ) / 2
    );
    tempCanvasContext.resetTransform();
    tempCanvasContext.translate(
        tempCanvasContext.canvas.width / 2,
        tempCanvasContext.canvas.height / 2);
    tempCanvasContext.rotate(-90 * rotation * Math.PI / 180);
    tempCanvasContext.translate(
        -(rotation % 2 === 0 ?
            tempCanvasContext.canvas.width :
            tempCanvasContext.canvas.height
        ) / 2,
        -(rotation % 2 === 0 ?
            tempCanvasContext.canvas.height :
            tempCanvasContext.canvas.width
        ) / 2
    );
}



function getHex(value) {
    let hex = value.toString(16);
    const len = hex.length;
    if (len < 6) {
        for (let i = 0; i < 6 - len; i++) {
            hex = '0' + hex;
        }
    }
    return '#' + hex;
}
function aliasedStrokeTriangle(
    x0, y0, x1, y1, x2, y2, color, data
) {
    aliasedLine(x0, y0, x1, y1, color, data);
    aliasedLine(x1, y1, x2, y2, color, data);
    aliasedLine(x2, y2, x0, y0, color, data);
}
function aliasedFillTriangle(
    x0, y0, x1, y1, x2, y2, color, data
) {
    aliasedLine(x0, y0, x1, y1, color, data);
    aliasedLine(x1, y1, x2, y2, color, data);

    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = (dx > dy ? dx : -dy) / 2;
    while (true) {
        aliasedLine(x0, y0, x2, y2, color, data);
        aliasedLine(x0, y0, x1, y1, color, data);

        if (x0 === x1 && y0 === y1) {
            break;
        }
        const e2 = err;
        if (e2 > -dx) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dy) {
            err += dx;
            y0 += sy;
        }
    }
}
function aliasedLine(x0, y0, x1, y1, color, data) {
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = (dx > dy ? dx : -dy) / 2;
    while (true) {
        setPixel(x0, y0, color, data);
        if (x0 === x1 && y0 === y1) {
            break;
        }
        const e2 = err;
        if (e2 > -dx) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dy) {
            err += dx;
            y0 += sy;
        }
    }
}
function setPixel(x, y, color, data) {
    const n = (y * canvasContext.canvas.width + x) * 4;
    data[n] = color >> 16;
    data[n + 1] = (color & 0x00FF00) >> 8;
    data[n + 2] = color & 0x0000FF;
    data[n + 3] = 255;
}
function aliasedFilledCircle(xc, yc, r) {
    let x = r;
    let y = 0;
    let cd = 0;

    canvasContext.fillRect(xc - x, yc, r << 1, 1);

    while (x > y) {
        cd -= (--x) - (++y);
        if (cd < 0) {
            cd += x++;
        }
        canvasContext.fillRect(xc - y, yc - x, y << 1, 1);
        canvasContext.fillRect(xc - x, yc - y, x << 1, 1);
        canvasContext.fillRect(xc - x, yc + y, x << 1, 1);
        canvasContext.fillRect(xc - y, yc + x, y << 1, 1);
    }
}
function aliasedStrokeCircle(xc, yc, r) {
    let x = r;
    let y = 0;
    let cd = 0;

    canvasContext.fillRect(xc - x, yc, 1, 1);
    canvasContext.fillRect(xc + x - 1, yc, 1, 1);

    while (x > y) {
        cd -= (--x) - (++y);
        if (cd < 0) {
            cd += x++;
        }
        canvasContext.fillRect(xc - y, yc - x, 1, 1);
        canvasContext.fillRect(xc - x, yc - y, 1, 1);
        canvasContext.fillRect(xc - x, yc + y, 1, 1);
        canvasContext.fillRect(xc - y, yc + x, 1, 1);

        canvasContext.fillRect(xc + y - 1, yc - x, 1, 1);
        canvasContext.fillRect(xc + x - 1, yc - y, 1, 1);
        canvasContext.fillRect(xc + x - 1, yc + y, 1, 1);
        canvasContext.fillRect(xc + y - 1, yc + x, 1, 1);
    }
}

function exportByteCode() {
    vscode.postMessage({
        command: 'export'
    })
}


window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
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
            clear(canvasContext);
            break;
        case 'drawCircle':
            drawCircle(canvasContext, message.color, message.centerX, message.centerY, message.radius);
            break;
        case 'fillCircle':
            fillCircle(canvasContext, message.color, message.centerX, message.centerY, message.radius);
            break;
        case 'drawLine':
            drawLine(canvasContext, tempCanvasContext, message.lineColor, message.pos1X, message.pos1Y, message.pos2X, message.pos2Y);
            break;
        case 'drawPixel':
            drawPixel(canvasContext, message.pixelColor, message.x, message.y);
            break;
        case 'drawRect':
            drawRect(canvasContext, message.drawRectColor, message.topLeftDrawX, message.topLeftDrawY, message.width, message.height);
            break;
        case 'fillRect':
            fillRect(canvasContext, message.drawRectColor, message.topLeftDrawX, message.topLeftDrawY, message.width, message.height);
            break;
        case 'drawText':
            drawText(canvasContext, tempCanvasContext, message.textColor, message.text, message.scale, message.pixelTextX, message.pixelTextY);
            break;
        case 'drawTriangle':
            drawTriangle(canvasContext, tempCanvasContext, message.triangleColor, message.pixel1X, message.pixel1Y, message.pixel2X, message.pixel2Y, message.pixel3X, message.pixel3Y);
            break;
        case 'fillTriangle':
            fillTriangle(canvasContext, tempCanvasContext, message.triangleColor, message.pixel1X, message.pixel1Y, message.pixel2X, message.pixel2Y, message.pixel3X, message.pixel3Y);
            break;
        case 'setRotation':
            setRotation(canvasContext, tempCanvasContext, message.rotation);
            break;
    }
});
