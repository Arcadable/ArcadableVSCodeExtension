"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const systemConfig_1 = require("./model/systemConfig");
const arcadableCompiler_1 = require("./compiler/arcadableCompiler");
let currentPanel = undefined;
let getPixelCallback;
let instructionSubscription;
function activate(context) {
    let disposable = vscode.commands.registerCommand('arcadable-emulator.start', () => {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
        }
        else {
            currentPanel = initExtensionLayout(context, columnToShowIn);
            currentPanel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'getPixelResult':
                        const color = message.color;
                        getPixelCallback(color);
                        return;
                }
            }, undefined, context.subscriptions);
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
                instructionSubscription.unsubscribe();
            }, null, context.subscriptions);
            currentPanel.onDidChangeViewState(e => {
                const visible = e.webviewPanel.visible;
            }, null, context.subscriptions);
            vscode.workspace.onDidSaveTextDocument((document) => {
                if ((document.fileName.endsWith('.arc') || document.fileName.endsWith('arcadable.config.json')) && document.uri.scheme === "file") {
                    loadGame();
                }
            });
            loadGame();
        }
    });
}
exports.activate = activate;
function loadGame() {
    const game = compile();
    if (game) {
        instructionSubscription = game.drawInstruction.subscribe((instruction) => {
            if (instruction.command = 'getPixel') {
                getPixelCallback = instruction.callback;
            }
            currentPanel.webview.postMessage(instruction);
        });
        currentPanel.webview.postMessage({
            command: 'setDimensions',
            width: game.systemConfig.screenWidth,
            height: game.systemConfig.screenHeight
        });
        console.log(game);
    }
}
function compile() {
    var _a, _b;
    const configDoc = vscode.workspace.textDocuments.find(t => t.fileName == vscode.workspace.rootPath + '/arcadable.config.json');
    let config;
    if (configDoc) {
        config = JSON.parse(configDoc.getText());
        const configTest = checkConfig(config);
        if (configTest !== 'ok') {
            vscode.window.showErrorMessage(configTest);
            return undefined;
        }
    }
    else {
        vscode.window.showErrorMessage(`No config file found at path: "${vscode.workspace.rootPath}/arcadable.config.json"`);
        return undefined;
    }
    const mainPath = vscode.workspace.rootPath + config.project.main;
    const mainDoc = vscode.workspace.textDocuments.find(t => t.fileName == mainPath);
    if (!mainDoc) {
        vscode.window.showErrorMessage(`No main file found at path: "${mainPath}"`);
        return undefined;
    }
    const docs = vscode.workspace.textDocuments.filter(t => t.fileName.endsWith('.arc')).reduce((acc, curr) => (Object.assign(Object.assign({}, acc), { [curr.fileName]: curr.getText() })), {
        'main': mainDoc.getText()
    });
    const compileResult = new arcadableCompiler_1.ArcadableCompiler(new systemConfig_1.SystemConfig(config.system.screenWidth, config.system.screenHeight, Math.floor(1000 / config.system.targetFramerate), false, config.system.digitalInputAmount, config.system.analogInputAmount, 0), docs).startCompile();
    if (((_a = compileResult.errors) === null || _a === void 0 ? void 0 : _a.length) !== undefined && ((_b = compileResult.errors) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        compileResult.errors.forEach(e => {
            vscode.window.showErrorMessage(e);
        });
    }
    if (!compileResult.game) {
        vscode.window.showErrorMessage('Could not complete code compilation.');
        return undefined;
    }
    vscode.window.showInformationMessage('Arcadable compiled succesSfully!');
    return compileResult.game;
}
function checkConfig(config) {
    let result = 'Config missing property: ';
    if (!config.project) {
        result = '"project", ';
    }
    else {
        if (!config.project.name) {
            result = '"project.name", ';
        }
        if (!config.project.version) {
            result = '"project.version", ';
        }
        if (!config.project.main) {
            result = '"project.main", ';
        }
    }
    if (!config.system) {
        result = '"system", ';
    }
    else {
        if (!config.system.screenWidth) {
            result = '"system.screenWidth", ';
        }
        if (!config.system.screenHeight) {
            result = '"system.screenHeight", ';
        }
        if (!config.system.targetFramerate) {
            result = '"system.targetFramerate", ';
        }
        if (!config.system.digitalInputAmount) {
            result = '"system.digitalInputAmount", ';
        }
        if (!config.system.analogInputAmount) {
            result = '"system.analogInputAmount", ';
        }
    }
    if (result === 'Config missing property: ') {
        result = 'ok';
    }
    return result;
}
function initExtensionLayout(context, columnToShowIn) {
    currentPanel = vscode.window.createWebviewPanel('ArcadableEmulator', 'Arcadable Emulator', columnToShowIn, {
        enableScripts: true
    });
    const templateFilePath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'html', 'index.html'));
    const styleSrcUrl = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'src', 'css', 'style.css'))).toString();
    const scriptSrcUrl = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'src', 'js', 'main.js'))).toString();
    currentPanel.webview.html = fs.readFileSync(templateFilePath.fsPath, 'utf8')
        .replace('{{styleSrc}}', styleSrcUrl)
        .replace('{{scriptSrc}}', scriptSrcUrl);
    return currentPanel;
}
//# sourceMappingURL=extension.js.map