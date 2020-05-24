import { ValueType } from '../model/values/value';
import { SystemConfigType } from '../model/systemConfig';
import { EvaluationOperator } from '../model/values/evaluationValue';
import { InstructionType } from '../model/instructions/instruction';

export interface ImportParseResult {
    import: string;
    errors: { error: string, pos: number }[];
}
export function ParseImport(section: string): ImportParseResult {
	const result: ImportParseResult = {
		import: '',
		errors: []
	};
	const importPathMatch = section.match(/^import( *)"([^\"]*)"/g) as RegExpMatchArray;
	if (importPathMatch) {
		const endImportMatch = section.match(/^import( *)"([^\"]*)"END_OF_SECTION/g);
		if (endImportMatch) {
			result.import = endImportMatch[0].replace('import', '').trim().replace('"', '').replace('"END_OF_SECTION', '');
		} else {
			result.errors.push({ error: 'Missing ";"', pos: importPathMatch[0].length });
		}
	} else {
		result.errors.push({ error: 'Missing import path', pos: 0 });
	}
	return result;
}

export interface ValueParseResult {
    value: {
        name: string,
        type: ValueType,
        value: any,
    } | null;
    errors: { error: string, pos: number }[];
}
export function ParseValueNumber(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult = {
		value: null,
		errors: []
	};
	const numberMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*( *):( *)Number( *)=( *)(([0-9]+(\.([0-9]+))?)|(\.([0-9]+)))END_OF_SECTION$/g) as RegExpMatchArray;
	if (numberMatch) {
		const value = numberMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		result.value = {
			type: ValueType.number,
			value: value,
			name
		};
	} else {
		result.errors.push({ error: 'Incorrect number format or missing ";"', pos: otherMatchWithType[0].length });
	}
	return result;
}

export function ParseValueAnalog(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult = {
		value: null,
		errors: []
	};
	const analogMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*( *):( *)Analog( *)=( *)(([0-9]+))END_OF_SECTION$/g) as RegExpMatchArray;
	if (analogMatch) {
		const value = analogMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		result.value = {
			type: ValueType.analogInputPointer,
			value,
			name
		};
	} else {
		result.errors.push({ error: 'Incorrect analog index format or missing ";"', pos: otherMatchWithType[0].length });
	}
	return result;
}

export function ParseValueDigital(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult = {
		value: null,
		errors: [],
	};
	const digitalMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*( *):( *)Digital( *)=( *)(([0-9]+))END_OF_SECTION$/g) as RegExpMatchArray;
	if (digitalMatch) {
		const value = digitalMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		result.value = {
			type: ValueType.digitalInputPointer,
			value,
			name
		};
	} else {
		result.errors.push({ error: 'Incorrect digital index format or missing ";"', pos: otherMatchWithType[0].length });
	}
	return result;
}

export function ParseValuePixel(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
       
	const pixelMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)Pixel( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|([0-9]+))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|([0-9]+))( *)\])END_OF_SECTION$/g) as RegExpMatchArray;
	if (pixelMatch) {
		const value = pixelMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.replace('[', '').replace(']', '').replace(/\s/g, '').split(',');
		let x = values[0];
		let y = values[1];
		const parsedX = Number.parseInt(x);
		if(!Number.isNaN(parsedX)) {
			const subXName = name + '-x';
			const subXValue: ValueParseResult = {
				value: {
					type: ValueType.number,
					value: parsedX,
					name: subXName
				},
				errors: []
			};
			x = subXName;
			result.push(subXValue);
		}
		const parsedY = Number.parseInt(y);
		if(!Number.isNaN(parsedY)) {
			const subYName = name + '-y';
			const subYValue: ValueParseResult = {
				value: {
					type: ValueType.number,
					value: parsedY,
					name: subYName
				},
				errors: []
			};
			y = subYName;
			result.push(subYValue);
		}

		main.value = {
			type: ValueType.pixelIndex,
			value: {
				x,
				y
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect pixel position format (=[x, y]) or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}

export function ParseValueConfig(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult = {
		value: null,
		errors: []
	};
	const configMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)Config( *)=( *)(ScreenHeight|ScreenWidth|TargetMillisPerFrame|CurrentMillis|IsZigZag)END_OF_SECTION$/g) as RegExpMatchArray;
	if (configMatch) {
		const value = configMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		let configType = getSystemConfigType(value);
		result.value = {
			type: ValueType.systemPointer,
			value: configType,
			name
		};
	} else {
		result.errors.push({ error: 'Unknown system config identifier (known identifiers: ScreenHeight, ScreenWidth, TargetMillisPerFrame, CurrentMillis, IsZigZag) or missing ";"', pos: otherMatchWithType[0].length });
	}
	return result;
}

export function ParseValueString(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult = {
		value: null,
		errors: []
	};
	const stringMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)String( *)=( *)(("([^\"]*)")|('([^\']*)'))END_OF_SECTION$/g) as RegExpMatchArray;
	if (stringMatch) {
		const valueRaw = stringMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const value = valueRaw.charAt(0) === '"' ? valueRaw.replace(/"/g, '') : valueRaw.replace(/'/g, '');
		result.value = {
			type: ValueType.text,
			value,
			name
		};
	} else {
		result.errors.push({ error: 'Incorrect string format or missing ";"', pos: otherMatchWithType[0].length });
	}
	return result;
}

export function ParseValueEval(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
       
	const evalMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)Eval( *)=( *)(static)?( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))END_OF_SECTION$/g) as RegExpMatchArray;
	if (evalMatch) {
		let value = evalMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split(/=(.+)/g)[1];
		const stat = value.startsWith('static');
		if (stat) {
			value = value.replace('static', '');
		}
		const evaluation = (value.match(/(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)/g) as RegExpMatchArray)[0];
		const values = value.split(evaluation);
		let evaluationType = getEvaluationOperator(evaluation);

		let left = values[0];
		let right = values[1];
		const parsedLeft = Number.parseFloat(left);
		if(!Number.isNaN(parsedLeft)) {
			const subLeftName = name + '-left';
			const subLeftValue: ValueParseResult = {
				value: {
					type: ValueType.number,
					value: parsedLeft,
					name: subLeftName
				},
				errors: []
			};
			left = subLeftName;
			result.push(subLeftValue);
		}
		const parsedRight = Number.parseFloat(right);
		if(!Number.isNaN(parsedRight)) {
			const subRightName = name + '-right';
			const subRightValue: ValueParseResult = {
				value: {
					type: ValueType.number,
					value: parsedRight,
					name: subRightName
				},
				errors: []
			};
			right = subRightName;
			result.push(subRightValue);
		}

		main.value = {
			type: ValueType.evaluation,
			value: {
				evaluation: evaluationType,
				left,
				right,
				static: stat
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect evaluation format or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}

export function ParseValueListValue(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
	const listValueMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)ListValue( *)=( *)([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*\[((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+)))\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listValueMatch) {
		const valueRaw = listValueMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const list = valueRaw.split(/\[/g)[0];
		let index = valueRaw.split(/\[/g)[1].replace(/\]/g, '');
		const parsedIndex = Number.parseInt(index);
		if(!Number.isNaN(parsedIndex)) {
			const subIndexName = name + '-y';
			const subIndexValue: ValueParseResult = {
				value: {
					type: ValueType.number,
					value: parsedIndex,
					name: subIndexName
				},
				errors: []
			};
			index = subIndexName;
			result.push(subIndexValue);
		}

		main.value = {
			type: ValueType.listValue,
			value: {
				list,
				index,
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect string format or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}

export function ParseValueListNumber(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
	const listMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)List<( *)Number( *)>( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *))+(,( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+)))))*( *)\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listMatch) {
		const value = listMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.replace('[', '').replace(']', '').replace(/\s/g, '').split(',');
		const actualValues: string[] = [];
		values.forEach((v, i) => {
			const parsed = Number.parseFloat(v);
			if(!Number.isNaN(parsed)) {
				const subName = name + '-sub' + i;
				const subValue: ValueParseResult = {
					value: {
						type: ValueType.number,
						value: parsed,
						name: subName
					},
					errors: []
				};
				actualValues.push(subName);
				result.push(subValue);
			} else {
				actualValues.push(v);
			}
		});
		main.value = {
			type: ValueType.listDeclaration,
			value: {
				values: actualValues,
				type: ValueType.number
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect number list format (List<Number> = [myNumber, anotherNumber]) or incorrect number format or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}

export function ParseValueListAnalog(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
       
	const listMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)List<( *)Analog( *)>( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+)))( *))+(,( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+))))*( *)\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listMatch) {
		const value = listMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.replace('[', '').replace(']', '').replace(/\s/g, '').split(',');
		const actualValues: string[] = [];
		values.forEach((v, i) => {
			const parsed = Number.parseInt(v);
			if(!Number.isNaN(parsed)) {
				const subName = name + '-sub' + i;
				const subValue: ValueParseResult = {
					value: {
						type: ValueType.analogInputPointer,
						value: parsed,
						name: subName
					},
					errors: []
				};
				actualValues.push(subName);
				result.push(subValue);
			} else {
				actualValues.push(v);
			}
		});
		main.value = {
			type: ValueType.listDeclaration,
			value: {
				values: actualValues,
				type: ValueType.analogInputPointer,
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect analog list format (List<Analog> = [myAnalog, 1]) or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}
export function ParseValueListDigital(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
       
	const listMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)List<( *)Digital( *)>( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+)))( *))+(,( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+))))*( *)\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listMatch) {
		const value = listMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.replace('[', '').replace(']', '').replace(/\s/g, '').split(',');
		const actualValues: string[] = [];
		values.forEach((v, i) => {
			const parsed = Number.parseInt(v);
			if(!Number.isNaN(parsed)) {
				const subName = name + '-sub' + i;
				const subValue: ValueParseResult = {
					value: {
						type: ValueType.digitalInputPointer,
						value: parsed,
						name: subName
					},
					errors: []
				};
				actualValues.push(subName);
				result.push(subValue);
			} else {
				actualValues.push(v);
			}
		});
		main.value = {
			type: ValueType.listDeclaration,
			value: {
				values: actualValues,
				type: ValueType.digitalInputPointer
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect digital list format (List<Digital> = [myDigital, 1]) or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}
export function ParseValueListPixel(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
       
	const listMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)List<( *)Pixel( *)>( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|([0-9]+))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|([0-9]+))( *)\]))( *))+(,( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|([0-9]+))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|([0-9]+))( *)\])))*( *)\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listMatch) {
		const value = listMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.substr(1).replace(/\]/g, '').replace(/\s/g, '').split('[').map(s => s.split(',').filter(p => p.length > 0));
		const actualValues: string[] = [];
		values.forEach((v, i) => {

			if(v.length > 1) {
				const subName = name + '-sub' + i;
				let x = v[0];
				let y = v[1];
				const parsedX = Number.parseInt(x);
				if(!Number.isNaN(parsedX)) {
					const subXName = subName + '-x';
					const subXValue: ValueParseResult = {
						value: {
							type: ValueType.number,
							value: parsedX,
							name: subXName
						},
						errors: []
					};
					x = subXName;
					result.push(subXValue);
				}
				const parsedY = Number.parseInt(y);
				if(!Number.isNaN(parsedY)) {
					const subYName = subName + '-y';
					const subYValue: ValueParseResult = {
						value: {
							type: ValueType.number,
							value: parsedY,
							name: subYName
						},
						errors: []
					};
					y = subYName;
					result.push(subYValue);
				}
				const subValue: ValueParseResult = {
					value: {
						type: ValueType.pixelIndex,
						value: {
							x,
							y
						},
						name: subName
					},
					errors: []
				};
				result.push(subValue);
				actualValues.push(subName);
			} else {
				actualValues.push(v[0]);
			}
		});
		main.value = {
			type: ValueType.listDeclaration,
			value: {
				values: actualValues,
				type: ValueType.pixelIndex
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect pixel list format (List<Pixel> = [myPixel, [myNumber, 1]]) or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}
export function ParseValueListConfig(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
       
	const listMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)List<( *)Config( *)>( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*))( *))+(,( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)))*( *)\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listMatch) {
		const value = listMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.replace('[', '').replace(']', '').replace(/\s/g, '').split(',');
		const actualValues: string[] = [];
		values.forEach((v, i) => {
			const configMatch = v.match(/ScreenHeight|ScreenWidth|TargetMillisPerFrame|CurrentMillis|IsZigZag/g);
			if(configMatch) {
				const subName = name + '-sub' + i;
				let configType = getSystemConfigType(v);
				const subValue: ValueParseResult = {
					value: {
						type: ValueType.systemPointer,
						value: configType,
						name: subName
					},
					errors: []
				};
				actualValues.push(subName);
				result.push(subValue);
			} else {
				actualValues.push(v);
			}
		});
		main.value = {
			type: ValueType.listDeclaration,
			value: {
				values: actualValues,
				type: ValueType.systemPointer
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect number list format (List<Number> = [myNumber, anotherNumber]) or incorrect number format or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}
export function ParseValueListString(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
	const listMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)List<( *)String( *)>( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(("([^\"]*)")|('([^\']*)')))( *))+(,( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(("([^\"]*)")|('([^\']*)'))))*( *)\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listMatch) {
		const value = listMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.replace('[', '').replace(']', '').replace(/\s/g, '').split(',');
		const actualValues: string[] = [];
		values.forEach((v, i) => {
			const first = v.charAt(0);
			const last = v.charAt(v.length - 1);
			if((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
				const subName = name + '-sub' + i;
				const value = first === '"' ? v.replace(/"/g, '') : v.replace(/'/g, '');
				const subValue: ValueParseResult = {
					value: {
						type: ValueType.text,
						value,
						name: subName
					},
					errors: []
				};
				actualValues.push(subName);
				result.push(subValue);
			} else {
				actualValues.push(v);
			}
		});
		main.value = {
			type: ValueType.listDeclaration,
			value: {
				values: actualValues,
				type: ValueType.text
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect number list format (List<Number> = [myNumber, anotherNumber]) or incorrect number format or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}
export function ParseValueListEval(section: string, otherMatchWithType: RegExpMatchArray) {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const result: ValueParseResult[] = [];
	const main: ValueParseResult = {
		value: null,
		errors: []
	};
	const listMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)List<( *)Eval( *)>( *)=( *)(\[( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|((static)?( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))))( *))+(,( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|((static)?( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+)))))))*( *)\]END_OF_SECTION$/g) as RegExpMatchArray;
	if (listMatch) {
		const value = listMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split('=')[1];
		const values = value.replace('[', '').replace(']', '').replace(/\s/g, '').split(',');
		const actualValues: string[] = [];
		values.forEach((v, i) => {
			const evaluation = (v.match(/(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)/g) as RegExpMatchArray);
			if(evaluation) {
				const stat = v.startsWith('static');
				if (stat) {
					v = v.replace('static', '');
				}
				const values = v.split(evaluation[0]);
				let evaluationType = getEvaluationOperator(evaluation[0]);
				const subName = name + '-sub' + i;


				let left = values[0];
				let right = values[1];
				const parsedLeft = Number.parseFloat(left);
				if(!Number.isNaN(parsedLeft)) {
					const subLeftName = subName + '-left';
					const subLeftValue: ValueParseResult = {
						value: {
							type: ValueType.number,
							value: parsedLeft,
							name: subLeftName
						},
						errors: []
					};
					left = subLeftName;
					result.push(subLeftValue);
				}
				const parsedRight = Number.parseFloat(right);
				if(!Number.isNaN(parsedRight)) {
					const subRightName = subName + '-right';
					const subRightValue: ValueParseResult = {
						value: {
							type: ValueType.number,
							value: parsedRight,
							name: subRightName
						},
						errors: []
					};
					right = subRightName;
					result.push(subRightValue);
				}

				const subValue: ValueParseResult = {
					value: {
						type: ValueType.evaluation,
						value: {
							evaluation: evaluationType,
							left,
							right,
							static: stat
						},
						name: subName
					},
					errors: []
				};
				actualValues.push(subName);
				result.push(subValue);
			} else {
				actualValues.push(v);
			}
		});

		main.value = {
			type: ValueType.listDeclaration,
			value: {
				values: actualValues,
				type: ValueType.evaluation
			},
			name
		};
	} else {
		main.errors.push({ error: 'Incorrect number list format (List<Number> = [myNumber, anotherNumber]) or incorrect number format or missing ";"', pos: otherMatchWithType[0].length });
	}
	result.push(main);
	return result;
}

export interface FunctionParseResult {
    name: string,
    instructions: {
        line: number,
        pos: number,
        type: InstructionType,
        params: string[]
    }[],
    values: {
        type: ValueType,
        value: any,
        name: string,
        line: number,
        pos: number
    }[],
    errors: {error: string, pos: number, line: number}[]
}

export function ParseFunction(section: string, otherMatchWithType: RegExpMatchArray, lineNumber: number, lines: string[]): {functions: FunctionParseResult[], errors: {error: string, pos: number, line: number}[], parsedCount: number} {
	const values = otherMatchWithType[0].replace(/\s/g, '').split(':');
	const name = values[0];
	const line = lines[lineNumber];
	const codeLine = line.split(/\/\//g)[0];
	const result: {functions: FunctionParseResult[], errors: {error: string, pos: number, line: number}[], parsedCount: number} = {
		functions: [],
		errors: [],
		parsedCount: 0
	};
	const functionStartMatch = section.match(/^([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*:( *)Function( *){( *)END_OF_SECTION$/g) as RegExpMatchArray;
	if (functionStartMatch) {
		let functionLines = [];
		let functionLineNumber = lineNumber;
		let functionCodeLine = codeLine.trim();
		let level = 1;
		let continueSearch = true;
		let parsedLinesCount = 1;

		while (continueSearch) {
			if (functionLineNumber + 1 < lines.length) {
				functionLineNumber++;
				const functionLine = lines[functionLineNumber];
				functionCodeLine = functionLine.split(/\/\//g)[0];
				if (functionCodeLine.includes('{')) {
					level++;
				}
				if (functionCodeLine.includes('}')) {
					level--;
				}
				if (level > 0) {
					functionLines[parsedLinesCount - 1] = functionCodeLine;
				} else {
					continueSearch = false;
				}
				parsedLinesCount++;

			} else {
				continueSearch = false;
			}
		}

		result.functions = parseInstructionSet(lineNumber, functionLines, name);
		result.parsedCount += parsedLinesCount;
	} else {
		result.errors.push({ error: 'Incorrect function format', pos: otherMatchWithType[0].length, line: lineNumber + 1 });
	}
	return result;
}

function parseInstructionSet(instructionSetStartLine: number, lines: string[], name: string): FunctionParseResult[] {
	const resultList: FunctionParseResult[] = [];
	const result: FunctionParseResult = {
		name,
		instructions: [],
		values: [],
		errors: []
	}; 
	for (let lineNumber = 0; lineNumber < lines.length;) {
		const line = lines[lineNumber];
		const sections = line.split(/;/g);
		let totalPosition = 0;
		let parsedLinesCount = 1;
		sections.forEach(section => {

			section += 'END_OF_SECTION';
			let position = 0;
			let char = section.charAt(position);
			while (char.match(/\s/g)) {
				position++;
				char = section.charAt(position);
			}
			const drawMatch = section.substr(position).match(/^draw\./g) as RegExpMatchArray;
			const executeMatch = section.substr(position).match(/^execute/g) as RegExpMatchArray;
			const mutateMatch = section.substr(position).match(/^(([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)( *)=/g) as RegExpMatchArray;
			const conditionMatch = section.substr(position).match(/^if/g) as RegExpMatchArray;
			const debugMatch = section.substr(position).match(/^debug\.log/g) as RegExpMatchArray;

			if (drawMatch) {
				const drawMatchType = section.substr(position).match(/^draw\.(clear|(drawPixel|drawText|drawCircle|fillCircle|drawRect|fillRect|drawTriangle|fillTriangle|drawLine|setRotation))/g) as RegExpMatchArray;
				if (drawMatchType) {
					let drawInstruction: {
                        line: number;
                        pos: number;
                        type: InstructionType;
                        params: string[];
                    } = {
                    	type: -1,
                    	params: [],
                    	line: instructionSetStartLine + lineNumber + 2,
                    	pos: position + totalPosition,
                    };
					switch (drawMatchType[0]) {
						case 'draw.clear': {
							const drawClearMatch = section.substr(position).match(/^draw\.clearEND_OF_SECTION$/g) as RegExpMatchArray;
							if (drawClearMatch) {
								drawInstruction.type = InstructionType.Clear;
							} else {
								result.errors.push({ error: 'Unexpected draw.clear format, or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.drawPixel': {
							const drawPixelMatch = section.substr(position).match(/^draw\.drawPixel\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (drawPixelMatch) {
								const params = drawPixelMatch[0].replace(/\s/g, '').replace('draw.drawPixel(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.DrawPixel;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.drawPixel format ("draw.drawPixel(color, x, y)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.drawText': {
							const drawTextMatch = section.substr(position).match(/^draw\.drawText\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (drawTextMatch) {
								const params = drawTextMatch[0].replace(/\s/g, '').replace('draw.drawText(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.DrawText;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.drawText format ("draw.drawText(color, scale, text, x, y)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.drawCircle': {
							const drawCircleMatch = section.substr(position).match(/^draw\.drawCircle\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (drawCircleMatch) {
								const params = drawCircleMatch[0].replace(/\s/g, '').replace('draw.drawCircle(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.DrawCircle;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.drawCircle format ("draw.drawCircle(color, radius, x, y)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.fillCircle': {
							const fillCircleMatch = section.substr(position).match(/^draw\.fillCircle\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (fillCircleMatch) {
								const params = fillCircleMatch[0].replace(/\s/g, '').replace('draw.fillCircle(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.FillCircle;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.fillCircle format ("draw.fillCircle(color, radius, x, y)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.drawRect': {
							const drawRectMatch = section.substr(position).match(/^draw\.drawRect\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (drawRectMatch) {
								const params = drawRectMatch[0].replace(/\s/g, '').replace('draw.drawRect(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.DrawRect;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.drawRect format ("draw.drawRect(color, tlX, tlY, brX, brY)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.fillRect': {
							const fillRectMatch = section.substr(position).match(/^draw\.fillRect\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (fillRectMatch) {
								const params = fillRectMatch[0].replace(/\s/g, '').replace('draw.fillRect(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.FillRect;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.fillRect format ("draw.fillRect(color, tlX, tlY, brX, brY)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.drawTriangle': {
							const drawTriangleMatch = section.substr(position).match(/^draw\.drawTriangle\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (drawTriangleMatch) {
								const params = drawTriangleMatch[0].replace(/\s/g, '').replace('draw.drawTriangle(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.DrawTriangle;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.drawTriangle format ("draw.drawTriangle(color, x1, y1, x2, y2, x3, y3)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.fillTriangle': {
							const fillTriangleMatch = section.substr(position).match(/^draw\.fillTriangle\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (fillTriangleMatch) {
								const params = fillTriangleMatch[0].replace(/\s/g, '').replace('draw.fillTriangle(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.FillTriangle;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.fillTriangle format ("draw.fillTriangle(color, x1, y1, x2, y2, x3, y3)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.drawLine': {
							const drawLineMatch = section.substr(position).match(/^draw\.drawLine\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *),( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (drawLineMatch) {
								const params = drawLineMatch[0].replace(/\s/g, '').replace('draw.drawLine(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.DrawLine;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.drawLine format ("draw.drawLine(color, x1, y1, x2, y2)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
						case 'draw.setRotation': {
							const setRotationMatch = section.substr(position).match(/^draw\.setRotation\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
							if (setRotationMatch) {
								const params = setRotationMatch[0].replace(/\s/g, '').replace('draw.setRotation(', '').replace(')END_OF_SECTION', '').split(',');
								drawInstruction.type = InstructionType.SetRotation;
								drawInstruction.params = params;
							} else {
								result.errors.push({ error: 'Unexpected draw.setRotation format ("draw.setRotation(rotation)"), or missing ";"', pos: position + totalPosition + drawMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
							}
							break;
						}
					}
					const actualParams: string[] = [];
					drawInstruction.params.forEach((p, i) => {
						const parsedParam = Number.parseFloat(p);
						if(!Number.isNaN(parsedParam)) {
							const subParamName = name + (instructionSetStartLine + lineNumber + 2) + '-param-' + i;
							result.values.push({
								name: subParamName,
								type: ValueType.number,
								value: parsedParam,
								line: instructionSetStartLine + lineNumber + 2,
								pos: position + totalPosition
							});
							actualParams.push(subParamName);
						} else {
							actualParams.push(p);
						}
					});
					drawInstruction.params = actualParams;
					result.instructions.push(drawInstruction);

				} else {
					result.errors.push({ error: 'Unexpected draw type', pos: position + totalPosition, line: instructionSetStartLine + lineNumber + 2 });
				}
			} else if (executeMatch) {
				const executeMatchFormat = section.substr(position).match(/^execute\(( *)(([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
				if (executeMatchFormat) {
					const func = executeMatchFormat[0].replace(/\s/g, '').replace('execute(', '').replace(')END_OF_SECTION', '');
					result.instructions.push({
						type: InstructionType.RunSet,
						params: [func],
						line: instructionSetStartLine + lineNumber + 2,
						pos: position + totalPosition,
					});
				} else {
					result.errors.push({ error: 'Unexpected execute format ("execute(myFunction)"), or missing ";"', pos: position + totalPosition + executeMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
				}
			} else if (debugMatch) {
				const debugMatchFormat = section.substr(position).match(/^debug\.log\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)END_OF_SECTION$/g) as RegExpMatchArray;
				if (debugMatchFormat) {
					const debugName = 'debug -' + name + '-' + (instructionSetStartLine + lineNumber + 2) + '-' + (position + totalPosition + debugMatch[0].length);

					let value = debugMatchFormat[0].replace(/\s/g, '').replace('debug.log(', '').replace(')END_OF_SECTION', '');
					const parsedValue = Number.parseFloat(value);
					if(!Number.isNaN(parsedValue)) {
						const subValueName = debugName + '-value';
						result.values.push({
							name: subValueName,
							type: ValueType.number,
							value: parsedValue,
							line: instructionSetStartLine + lineNumber + 2,
							pos: position + totalPosition
						});
						value = subValueName;
					}

					result.instructions.push({
						type: InstructionType.DebugLog,
						params: [value],
						line: instructionSetStartLine + lineNumber + 2,
						pos: position + totalPosition,
					});
				} else {
					result.errors.push({ error: 'Unexpected debug.log format ("debug.log(myValue)"), or missing ";"', pos: position + totalPosition + debugMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
				}

			} else if (mutateMatch) {
				const evalMatch = section.substr(position).match(/^(([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)( *)=( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))END_OF_SECTION$/g) as RegExpMatchArray;
				const numberMatch = section.substr(position).match(/^(([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)( *)=( *)(([0-9]+(\.([0-9]+))?)|(\.([0-9]+)))END_OF_SECTION$/g) as RegExpMatchArray;

				if (evalMatch) {
					const valueSplit = evalMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split(/=(.+)/g);
					const value = valueSplit[1];
					const valueName = valueSplit[0];
					const evaluation = (value.match(/(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)/g) as RegExpMatchArray)[0];
					const values = value.split(evaluation);
					let evaluationType = getEvaluationOperator(evaluation);
					const evaluationValueName = valueName + '-' + name + '-' + (instructionSetStartLine + lineNumber + 2) + '-' + (position + totalPosition + mutateMatch[0].length);

					let left = values[0];
					let right = values[1];
					const parsedLeft = Number.parseFloat(left);
					if(!Number.isNaN(parsedLeft)) {
						const subLeftName = evaluationValueName + '-left';
						result.values.push({
							name: subLeftName,
							type: ValueType.number,
							value: parsedLeft,
							line: instructionSetStartLine + lineNumber + 2,
							pos: position + totalPosition
						});
						left = subLeftName;
					}
					const parsedRight = Number.parseFloat(right);
					if(!Number.isNaN(parsedRight)) {
						const subRightName = evaluationValueName + '-right';
						result.values.push({
							name: subRightName,
							type: ValueType.number,
							value: parsedRight,
							line: instructionSetStartLine + lineNumber + 2,
							pos: position + totalPosition
						});
						right = subRightName;
					}
    
					result.values.push({
						name: evaluationValueName,
						type: ValueType.evaluation,
						value: {
							evaluation: evaluationType,
							left,
							right,
							static: false
						},
						line: instructionSetStartLine + lineNumber + 2,
						pos: position + totalPosition
					});

					result.instructions.push({
						type: InstructionType.MutateValue,
						params: [valueName, evaluationValueName],
						line: instructionSetStartLine + lineNumber + 2,
						pos: position + totalPosition,
					});
				} else if (numberMatch) {
					const valueSplit = numberMatch[0].replace(/\s/g, '').replace('END_OF_SECTION', '').split(/=(.+)/g);
					const value = valueSplit[1];
					const valueName = valueSplit[0];
					const numberValueName = valueName + '-' + name + '-' + (instructionSetStartLine + lineNumber + 2) + '-' + (position + totalPosition + mutateMatch[0].length);

					result.values.push({
						type: ValueType.number,
						value: value,
						name: numberValueName,
						line: instructionSetStartLine + lineNumber + 2,
						pos: position + totalPosition
					});

					result.instructions.push({
						type: InstructionType.MutateValue,
						params: [valueName, numberValueName],
						line: instructionSetStartLine + lineNumber + 2,
						pos: position + totalPosition,
					});
				} else {
					result.errors.push({ error: 'Incorrect evaluation/number format or missing ";"', pos: position + totalPosition + mutateMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
				}
			} else if (conditionMatch) {
				const conditionValueMatch = section.substr(position).match(/^if( *)\(( *)(([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)( *)\)( *){END_OF_SECTION$/g) as RegExpMatchArray;
				const conditionEvalMatch = section.substr(position).match(/^if( *)\(( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)( *)((([a-z]|[A-Z])+([a-z]|[A-Z]|[0-9])*)|(([0-9]+(\.([0-9]+))?)|(\.([0-9]+))))( *)\)( *){END_OF_SECTION$/g) as RegExpMatchArray;
				let functionLineNumber = lineNumber;
				let conditionInstructionSetSucceedName = 'if-succeed-' + name + '-' + (instructionSetStartLine + lineNumber + 2) + '-' + (position + totalPosition + conditionMatch[0].length);
				let conditionInstructionSetFailedName = '';
				let conditionEvaluationName = '';
				let ifLength = 0;
				if (conditionValueMatch) {
					conditionEvaluationName = conditionValueMatch[0].replace(/\s/g, '').replace('if(', '').replace('){END_OF_SECTION', '');
				} else if (conditionEvalMatch) {
					const value = conditionEvalMatch[0].replace(/\s/g, '').replace('if(', '').replace('){END_OF_SECTION', '');
					const evaluation = (value.match(/(\+|-|\*|\/|%|&|\||\^|<<|>>|pow|==|!=|>|<|>=|<=)/g) as RegExpMatchArray)[0];
					const values = value.split(evaluation);
					let evaluationType = getEvaluationOperator(evaluation);
					conditionEvaluationName = name + '-' + (instructionSetStartLine + lineNumber + 2) + '-' + (position + totalPosition + conditionMatch[0].length);
                    
					let left = values[0];
					let right = values[1];
					const parsedLeft = Number.parseFloat(left);
					if(!Number.isNaN(parsedLeft)) {
						const subLeftName = conditionEvaluationName + '-left';
						result.values.push({
							name: subLeftName,
							type: ValueType.number,
							value: parsedLeft,
							line: instructionSetStartLine + lineNumber + 2,
							pos: position + totalPosition
						});
						left = subLeftName;
					}
					const parsedRight = Number.parseFloat(right);
					if(!Number.isNaN(parsedRight)) {
						const subRightName = conditionEvaluationName + '-right';
						result.values.push({
							name: subRightName,
							type: ValueType.number,
							value: parsedRight,
							line: instructionSetStartLine + lineNumber + 2,
							pos: position + totalPosition
						});
						right = subRightName;
					}
                    
					result.values.push({
						name: conditionEvaluationName,
						type: ValueType.evaluation,
						value: {
							evaluation: evaluationType,
							left,
							right,
							static: false
						},
						line: instructionSetStartLine + lineNumber + 2,
						pos: position + totalPosition,
					});
				} else {
					result.errors.push({ error: 'Incorrect condition format', pos: position + totalPosition + conditionMatch[0].length, line: instructionSetStartLine + lineNumber + 2 });
				}
				let functionLines = [];
				let functionCodeLine = line.trim();
				let level = 1;
				let continueSearch = true;
				while (continueSearch) {
					if (functionLineNumber + 1 < lines.length) {
						functionLineNumber++;
						functionCodeLine = lines[functionLineNumber];
						if (functionCodeLine.includes('{') && !functionCodeLine.includes('else')) {
							level++;
						}
						if (functionCodeLine.includes('}')) {
							level--;
						}
						if (level > 0) {
							functionLines[parsedLinesCount - 1] = functionCodeLine;
						} else {
							continueSearch = false;
						}
						ifLength++;
						parsedLinesCount++;

					} else {
						continueSearch = false;
					}
				}
				const conditionSuccessInstructions = parseInstructionSet(instructionSetStartLine + lineNumber + 1, functionLines, conditionInstructionSetSucceedName);
				resultList.push(...conditionSuccessInstructions);

				if (functionLineNumber + 1 < lines.length) {
					let elseLine = lines[functionLineNumber];
					elseLine += 'END_OF_SECTION';
					let position = 0;
					let char = elseLine.charAt(position);
					while (char.match(/\s/g)) {
						position++;
						char = elseLine.charAt(position);
					}

					const conditionElseMatch = elseLine.substr(position).match(/^}( *)else( *){END_OF_SECTION$/g) as RegExpMatchArray;
					if (conditionElseMatch) {
						conditionInstructionSetFailedName = 'if-failed-' + name + '-' + (instructionSetStartLine + lineNumber + 2) + '-' + (position + totalPosition + conditionMatch[0].length);

						let functionLines = [];
						let functionCodeLine = line.trim();
						let level = 1;
						let continueSearch = true;
						while (continueSearch) {
							if (functionLineNumber + 1 < lines.length) {
								functionLineNumber++;
								functionCodeLine = lines[functionLineNumber];
								if (functionCodeLine.includes('{')) {
									level++;
								}
								if (functionCodeLine.includes('}')) {
									level--;
								}
								if (level > 0) {
									functionLines.push(functionCodeLine);
								} else {
									continueSearch = false;
								}
								parsedLinesCount++;

							} else {
								continueSearch = false;
							}
						}
						const conditionFailedInstructions = parseInstructionSet(instructionSetStartLine + lineNumber + 1 + ifLength, functionLines, conditionInstructionSetFailedName);
						resultList.push(...conditionFailedInstructions);

					}
					parsedLinesCount++;
				}

				result.instructions.push({
					type: InstructionType.RunCondition,
					params: [conditionEvaluationName, conditionInstructionSetSucceedName, conditionInstructionSetFailedName],
					line: instructionSetStartLine + lineNumber + 2,
					pos: position + totalPosition,
				});

			} else {
				let s = section.substr(position).replace('END_OF_SECTION', '');
				if (s.length > 0) {
					if (s.length > 20) {
						s = s.substr(0, 17) + '...';
					}
					result.errors.push({ error: `Unexpected token "${s}"`, pos: position + totalPosition, line: instructionSetStartLine + lineNumber + 2 });
				}
			}
			totalPosition += section.replace('END_OF_SECTION', '').length + 1;
		});

		lineNumber += parsedLinesCount;
	}
	resultList.push(result);
	return resultList;
}

function getEvaluationOperator(type: string): EvaluationOperator {
	switch (type) {
		case '+': return EvaluationOperator.add;
		case '-': return EvaluationOperator.sub;
		case '*': return EvaluationOperator.mul;
		case '/': return EvaluationOperator.subdiv;
		case '%': return EvaluationOperator.mod;
		case '&': return EvaluationOperator.b_and;
		case '|': return EvaluationOperator.b_or;
		case '^': return EvaluationOperator.b_xor;
		case '<<': return EvaluationOperator.lsh;
		case '>>': return EvaluationOperator.rsh;
		case 'pow': return EvaluationOperator.pow;
		case '==': return EvaluationOperator.eq;
		case '!=': return EvaluationOperator.ne;
		case '>': return EvaluationOperator.gt;
		case '<': return EvaluationOperator.lt;
		case '>=': return EvaluationOperator.ge;
		case '<=': return EvaluationOperator.le;
	}
	return -1;
}
function getSystemConfigType(value: string): SystemConfigType {
	switch (value) {
		case 'ScreenHeight': return SystemConfigType.screenHeight;
		case 'ScreenWidth': return SystemConfigType.screenWidth;
		case 'TargetMillisPerFrame': return SystemConfigType.targetMillisPerFrame;
		case 'CurrentMillis': return SystemConfigType.currentMillis;
		case 'IsZigZag': return SystemConfigType.isZigZag;
	}
	return -1;
}