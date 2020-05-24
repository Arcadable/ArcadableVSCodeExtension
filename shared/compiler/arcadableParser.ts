import { InstructionType } from '../model/instructions/instruction';
import { ValueType } from '../model/values/value';
import { FunctionParseResult, ParseFunction, ParseImport, ParseValueAnalog, ParseValueConfig, ParseValueDigital, ParseValueEval, ParseValueListAnalog, ParseValueListConfig, ParseValueListDigital, ParseValueListEval, ParseValueListNumber, ParseValueListPixel, ParseValueListString, ParseValueNumber, ParseValuePixel, ParseValueString, ValueParseResult, ParseValueListValue } from './parseFunctions';

export class ArcadableParser {
    tempContent = '';
    parsed: ParsedFile = new ParsedFile();
    constructor() {}


    parse(fileName: string, lines: string[]): ParsedFile {
    	const lineCount = lines.length;
    	this.parsed.filePath = fileName;

    	for (let lineNumber = 0; lineNumber < lineCount;) {

    		const line = lines[lineNumber];
    		const codeLine = line.split(/\/\//g)[0];

    		const sections = codeLine.split(/;/g);
    		let totalPosition = 0;
    		let parsedLinesCount = 1;
    		sections.forEach((section: string) => {

    			section += 'END_OF_SECTION';
    			let position = 0;
    			let char = section.charAt(position);
    			while (char.match(/\s/g)) {
    				position++;
    				char = section.charAt(position);
    			}

    			const importMatch = section.substr(position).match(/^import/g) as RegExpMatchArray;
    			const otherMatch = section.substr(position).match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:/g) as RegExpMatchArray;

    			if (importMatch) {
    				const importParseResult = ParseImport(section.substr(position));
    				if (importParseResult.import && importParseResult.import.length > 0) {
    					this.parsed.imports.push(importParseResult.import);
    				}
    				if (importParseResult.errors && importParseResult.errors.length > 0) {
    					this.parsed.errors.push(...importParseResult.errors.map(e => ({
    						file: fileName,
    						line: lineNumber + 1,
    						pos: position + totalPosition + e.pos,
    						error: e.error
    					})));
    				}
    			} else if (otherMatch) {
    				const otherMatchWithType = section.substr(position).match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*( *):( *)(Number|Analog|Digital|Pixel|Config|String|Eval|StaticEval|Function|ListValue|List<( *)(Number|Analog|Digital|Pixel|Config|String|Eval|StaticEval)( *)>)/g) as RegExpMatchArray;
    				if (otherMatchWithType) {
    					const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
    					const type = values[1];
    					let valueParseResult: {parseResult: ValueParseResult|null, line: number, pos: number, file: string}[] = [{
    						parseResult: null,
    						line: lineNumber + 1,
    						pos: position + totalPosition,
    						file: fileName
    					}];
    					let functionParseResult: {functions: FunctionParseResult[], errors: {error: string, pos: number, line: number}[]} = {
    						functions: [],
    						errors: []
    					};
    					switch (type) {
    						case 'Number': {
    							valueParseResult[0].parseResult = ParseValueNumber(section.substr(position), otherMatchWithType);
    							break;
    						}
    						case 'Analog': {
    							valueParseResult[0].parseResult = ParseValueAnalog(section.substr(position), otherMatchWithType);
    							break;
    						}
    						case 'Digital': {
    							valueParseResult[0].parseResult = ParseValueDigital(section.substr(position), otherMatchWithType);
    							break;
    						}
    						case 'Pixel': {
    							valueParseResult = ParseValuePixel(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'Config': {
    							valueParseResult[0].parseResult = ParseValueConfig(section.substr(position), otherMatchWithType);
    							break;
    						}
    						case 'String': {
    							valueParseResult[0].parseResult = ParseValueString(section.substr(position), otherMatchWithType);
    							break;
    						}
    						case 'Eval': {
    							valueParseResult = ParseValueEval(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'Function': {
    							valueParseResult = [];
    							const res = ParseFunction(section.substr(position), otherMatchWithType, lineNumber, lines);
    							functionParseResult = res;
    							parsedLinesCount = res.parsedCount;
    							break;
							}
							case 'ListValue': {
								valueParseResult = ParseValueListValue(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
							}
    						case 'List<Number>': {
    							valueParseResult = ParseValueListNumber(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'List<Analog>': {
    							valueParseResult = ParseValueListAnalog(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'List<Digital>': {
    							valueParseResult = ParseValueListDigital(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'List<Pixel>': {
    							valueParseResult = ParseValueListPixel(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'List<Config>': {
    							valueParseResult = ParseValueListConfig(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'List<String>': {
    							valueParseResult = ParseValueListString(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    						case 'List<Eval>': {
    							valueParseResult = ParseValueListEval(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							}));
    							break;
    						}
    					}

    					if (functionParseResult && functionParseResult.functions.length > 0) {

    						this.parsed.instructionSets.push(
    							...functionParseResult.functions.map(f => ({
    								name: f.name,
    								instructions: f.instructions.map(i => ({
    									line: i.line,
    									pos: i.pos,
    									file: fileName,
    									type: i.type,
    									params: i.params
    								}))
    							}))
    						);

    						this.parsed.errors.push(
    							...functionParseResult.errors
    								.map(e => ({
    									file: fileName,
    									line: e.line,
    									pos: e.pos,
    									error: e.error
    								}
    								))
    						);

    						this.parsed.errors.push(
    							...functionParseResult.functions
    								.reduce((acc, curr) => [...acc, ...curr.errors.map(e => ({
    									file: fileName,
    									line: e.line,
    									pos: e.pos,
    									error: e.error
    								}))], [] as {
                                    file: string;
                                    line: number;
                                    pos: number;
                                    error: string;
                                }[])
    						);

    						valueParseResult.push(...functionParseResult.functions.reduce((acc, curr) => [...acc, ...curr.values.map(v => ({
    							parseResult: {
    								value: {
    									type: v.type,
    									value: v.value,
    									name: v.name,
    								},
    								errors: []
    							},
    							line: v.line,
    							pos: v.pos,
    							file: fileName
    						}))], [] as {
                                parseResult: ValueParseResult | null;
                                line: number;
                                pos: number;
                                file: string;
                            }[]));
    					}


    					if (valueParseResult && valueParseResult.length > 0) {
    						this.parsed.values.push(...valueParseResult.filter(v => !!v.parseResult && !!v.parseResult.value).map(v => ({
    							name: ((v.parseResult as ValueParseResult).value as any).name,
    							type: ((v.parseResult as ValueParseResult).value as any).type,
    							value: ((v.parseResult as ValueParseResult).value as any).value,
    							line: v.line,
    							pos: v.pos + position + totalPosition,
    							file: v.file
    						})));
    						this.parsed.errors.push(
    							...valueParseResult
    								.filter(v => !!v.parseResult)
    								.reduce((acc, curr) => [
    									...acc,
    									...(curr.parseResult as ValueParseResult).errors.map(e => ({
    										file: curr.file,
    										line: curr.line,
    										pos: e.pos + position + totalPosition,
    										error: e.error
    									}))
    								], [] as {
                                    file: string;
                                    line: number;
                                    pos: number;
                                    error: string;
                                }[])
    						);
    					}
    				} else {
    					this.parsed.errors.push({
    						file: fileName,
    						line: lineNumber + 1,
    						pos: position + totalPosition,
    						error: 'Unexpected type'
    					});
    				}
    			} else {
    				let s = section.substr(position).replace('END_OF_SECTION', '');
    				if (s.length > 0) {
    					if (s.length > 20) {
    						s = s.substr(0, 17) + '...';
    					}
    					this.parsed.errors.push({
    						file: fileName,
    						line: lineNumber + 1,
    						pos: position + totalPosition,
    						error: `Unexpected token "${s}"`
    					});
    				}
    			}
    			totalPosition += section.replace('END_OF_SECTION', '').length + 1;

    		});

    		lineNumber += parsedLinesCount;
    	}
    	return this.parsed;
    }


    
}
export class ParsedFile {
	filePath: string = '';
    imports: string[] = [];
    values: {
        name: string;
        type: ValueType;
        value: any;
        line: number;
        pos: number;
		file: string;
		compressedIndex?: number;
    }[] = [];
    instructionSets: {
        name: string;
        instructions: {
            line: number;
            pos: number;
            file: string;
            type: InstructionType;
			params: string[];
			compressedIndex?: number;
		}[];
		compressedIndex?: number;
    }[] = [];
    compressedValues: {
        type: ValueType,
		value: any,
		mutatable: boolean,
        linked:{
            name: string;
            line: number;
            pos: number;
            file: string;
		}[];
		compressedIndex?: number;
    }[] = [];
    compressedInstructions: {
        type: InstructionType,
        params: string[],
        linked:{
            line: number;
            pos: number;
            file: string;
        }[]
    }[] = [];
    compressedInstructionSets: {
		instructions: number[],
		linked: {
			name: string;
		}[]
    }[] = [];
    errors: {
        file: string;
        line: number;
        pos: number;
        error: string;
    }[] = [];
    constructor() {
    }
}