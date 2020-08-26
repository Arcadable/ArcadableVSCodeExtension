import { InstructionType } from '../model/instructions/instruction';
import { ValueType } from '../model/values/value';
import { FunctionParseResult, GetParseFunctionExecutable, ParseImport, ParseValueAnalog, ParseValueConfig, ParseValueDigital, ParseValueEval, ParseValueListAnalog, ParseValueListConfig, ParseValueListDigital, ParseValueListEval, ParseValueListNumber, ParseValueListPixel, ParseValueListString, ParseValueNumber, ParseValuePixel, ParseValueString, ValueParseResult, ParseValueListValue } from './parseFunctions';

export class ArcadableParser {
    tempContent = '';
    parsed: ParsedFile = new ParsedFile();
    constructor() {}


    parse(fileName: string, lines: string[]): ParsedFile {
    	const lineCount = lines.length;
    	this.parsed.filePath = fileName;
		const functionParseResults: {functionParseExecutable: () => FunctionParseResult[], errors: {error: string, pos: number, line: number}[]}[] = [];
		const valueParseResults: {parseResult: ValueParseResult|null, line: number, pos: number, file: string}[] = [];
		
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

    					switch (type) {
    						case 'Number': {
								valueParseResults.push({
									parseResult: ParseValueNumber(section.substr(position), otherMatchWithType),
									line: lineNumber + 1,
									pos: position + totalPosition,
									file: fileName
								});
    							break;
    						}
    						case 'Analog': {
								valueParseResults.push({
									parseResult: ParseValueAnalog(section.substr(position), otherMatchWithType),
									line: lineNumber + 1,
									pos: position + totalPosition,
									file: fileName
								});
    							break;
    						}
    						case 'Digital': {
    							valueParseResults.push({
									parseResult: ParseValueDigital(section.substr(position), otherMatchWithType),
									line: lineNumber + 1,
									pos: position + totalPosition,
									file: fileName
								});
    							break;
    						}
    						case 'Pixel': {
    							valueParseResults.push(...ParseValuePixel(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'Config': {
    							valueParseResults.push({
									parseResult: ParseValueConfig(section.substr(position), otherMatchWithType),
									line: lineNumber + 1,
									pos: position + totalPosition,
									file: fileName
								});
    							break;
    						}
    						case 'String': {
    							valueParseResults.push({
									parseResult: ParseValueString(section.substr(position), otherMatchWithType),
									line: lineNumber + 1,
									pos: position + totalPosition,
									file: fileName
								});
    							break;
    						}
    						case 'Eval': {
    							valueParseResults.push(...ParseValueEval(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'Function': {
								const res = GetParseFunctionExecutable(section.substr(position), otherMatchWithType, lineNumber, lines);
    							functionParseResults.push(res);
    							parsedLinesCount = res.parsedCount;
    							break;
							}
							case 'ListValue': {
								valueParseResults.push(...ParseValueListValue(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
							}
    						case 'List<Number>': {
    							valueParseResults.push(...ParseValueListNumber(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'List<Analog>': {
    							valueParseResults.push(...ParseValueListAnalog(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'List<Digital>': {
    							valueParseResults.push(...ParseValueListDigital(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'List<Pixel>': {
    							valueParseResults.push(...ParseValueListPixel(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'List<Config>': {
    							valueParseResults.push(...ParseValueListConfig(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'List<String>': {
    							valueParseResults.push(...ParseValueListString(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
    						case 'List<Eval>': {
    							valueParseResults.push(...ParseValueListEval(section.substr(position), otherMatchWithType).map(r => ({
    								parseResult: {
    									value: r.value,
    									errors: r.errors
    								},
    								line: lineNumber + 1,
    								pos: position + totalPosition,
    								file: fileName
    							})));
    							break;
    						}
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

		functionParseResults.forEach(functionParseResult => {
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
		});
		this.parsed.errors.push(
			...valueParseResults
				.filter(v => !!v.parseResult)
				.reduce((acc, curr) => [
					...acc,
					...(curr.parseResult as ValueParseResult).errors.map(e => ({
						file: curr.file,
						line: curr.line,
						pos: e.pos,
						error: e.error
					}))
				], [] as {
				file: string;
				line: number;
				pos: number;
				error: string;
			}[])
		);

		this.parsed.functionParseResults = functionParseResults.map(f => f.functionParseExecutable);
		this.parsed.valueParseResults = valueParseResults;

    	return this.parsed;
    }


    
}
export class ParsedFile {
	filePath: string = '';
	imports: string[] = [];
	valueParseResults: {
		parseResult: ValueParseResult | null;
		line: number;
		pos: number;
		file: string;
	}[] = [];
	functionParseResults: (() => FunctionParseResult[])[] = [];
    errors: {
        file: string;
        line: number;
        pos: number;
        error: string;
    }[] = [];
    constructor() {
    }
}