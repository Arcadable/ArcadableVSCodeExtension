"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.getHex = getHex;
function aliasedStrokeTriangle(x0, y0, x1, y1, x2, y2, color, data) {
    this.aliasedLine(x0, y0, x1, y1, color, data);
    this.aliasedLine(x1, y1, x2, y2, color, data);
    this.aliasedLine(x2, y2, x0, y0, color, data);
}
exports.aliasedStrokeTriangle = aliasedStrokeTriangle;
function aliasedFillTriangle(x0, y0, x1, y1, x2, y2, color, data) {
    this.aliasedLine(x0, y0, x1, y1, color, data);
    this.aliasedLine(x1, y1, x2, y2, color, data);
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = (dx > dy ? dx : -dy) / 2;
    while (true) {
        this.aliasedLine(x0, y0, x2, y2, color, data);
        this.aliasedLine(x0, y0, x1, y1, color, data);
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
exports.aliasedFillTriangle = aliasedFillTriangle;
function aliasedLine(x0, y0, x1, y1, color, data) {
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = (dx > dy ? dx : -dy) / 2;
    while (true) {
        this.setPixel(x0, y0, color, data);
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
exports.aliasedLine = aliasedLine;
function setPixel(x, y, color, data) {
    const n = (y * this.game.canvasContext.canvas.width + x) * 4;
    data[n] = color >> 16;
    data[n + 1] = (color & 0x00FF00) >> 8;
    data[n + 2] = color & 0x0000FF;
    data[n + 3] = 255;
}
exports.setPixel = setPixel;
function aliasedFilledCircle(xc, yc, r) {
    let x = r;
    let y = 0;
    let cd = 0;
    this.game.canvasContext.fillRect(xc - x, yc, r << 1, 1);
    while (x > y) {
        cd -= (--x) - (++y);
        if (cd < 0) {
            cd += x++;
        }
        this.game.canvasContext.fillRect(xc - y, yc - x, y << 1, 1);
        this.game.canvasContext.fillRect(xc - x, yc - y, x << 1, 1);
        this.game.canvasContext.fillRect(xc - x, yc + y, x << 1, 1);
        this.game.canvasContext.fillRect(xc - y, yc + x, y << 1, 1);
    }
}
exports.aliasedFilledCircle = aliasedFilledCircle;
function aliasedStrokeCircle(xc, yc, r) {
    let x = r;
    let y = 0;
    let cd = 0;
    this.game.canvasContext.fillRect(xc - x, yc, 1, 1);
    this.game.canvasContext.fillRect(xc + x - 1, yc, 1, 1);
    while (x > y) {
        cd -= (--x) - (++y);
        if (cd < 0) {
            cd += x++;
        }
        this.game.canvasContext.fillRect(xc - y, yc - x, 1, 1);
        this.game.canvasContext.fillRect(xc - x, yc - y, 1, 1);
        this.game.canvasContext.fillRect(xc - x, yc + y, 1, 1);
        this.game.canvasContext.fillRect(xc - y, yc + x, 1, 1);
        this.game.canvasContext.fillRect(xc + y - 1, yc - x, 1, 1);
        this.game.canvasContext.fillRect(xc + x - 1, yc - y, 1, 1);
        this.game.canvasContext.fillRect(xc + x - 1, yc + y, 1, 1);
        this.game.canvasContext.fillRect(xc + y - 1, yc + x, 1, 1);
    }
}
exports.aliasedStrokeCircle = aliasedStrokeCircle;
//# sourceMappingURL=drawHelp.js.map