import { InstructionType } from './instructions/instruction';
import { ValueType } from './values/value';

const fp = require('ieee-float');

export function exportArcadable(game: any): Uint8Array {
	let binaryString = '';
	
	let tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.analogInputPointer).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)]).index.toString(2), 8)
		,
		makeLength(ValueType.analogInputPointer.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}
	
	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.digitalInputPointer).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).index.toString(2), 8)
		,
		makeLength(ValueType.digitalInputPointer.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}
	
	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.evaluation).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).evaluationOperator.toString(2), 7) +
		((game.values[Number(curr)] ).isStatic ? '1' : '0') +
		makeLength((game.values[Number(curr)] ).left.ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).right.ID.toString(2), 16)
		,
		makeLength(ValueType.evaluation.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}
	
	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.listDeclaration).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).size.toString(2), 16) +
		(game.values[Number(curr)] ).values.reduce((a, c) => a + makeLength(c.ID.toString(2), 16), '')
		,
		makeLength(ValueType.listDeclaration.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}
	
	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.listValue).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).listValue.ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).listIndex.ID.toString(2), 16)
		,
		makeLength(ValueType.listValue.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}
	
	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.number).reduce((acc, curr) => {
			const output: number[] = [];
			fp.writeFloatBE(output, (game.values[Number(curr)] ).value);
			return acc +
				makeLength(game.values[Number(curr)].ID.toString(2), 16) +
				output.reduce((a, c) => a + makeLength(c.toString(2), 8), '');
		},
		makeLength(ValueType.number.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}
	
	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.pixelIndex).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).XCalc.ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).YCalc.ID.toString(2), 16)
		,
		makeLength(ValueType.pixelIndex.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.image).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).data.ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).width.ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).height.ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).keyColor.ID.toString(2), 16)
		,
		makeLength(ValueType.image.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.data).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).size.toString(2), 16) +
		((game.values[Number(curr)]).data ).reduce((a, c) => a + makeLength(c.toString(2), 8), '')
		,
		makeLength(ValueType.data.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.systemPointer).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).configType.toString(2), 8)
		,
		makeLength(ValueType.systemPointer.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}
	
	tempBinaryString = Object.keys(game.values).filter(k => game.values[Number(k)].type === ValueType.text).reduce((acc, curr) =>
		acc +
		makeLength(game.values[Number(curr)].ID.toString(2), 16) +
		makeLength((game.values[Number(curr)] ).size.toString(2), 8) +
		(game.values[Number(curr)]).values.reduce((a, c) => a + makeLength(c.ID.toString(2), 16), '')
		,
		makeLength(ValueType.text.toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.Clear).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16)
		,
		makeLength((InstructionType.Clear + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DrawCircle).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).radiusValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).xValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).yValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.DrawCircle + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.FillCircle).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).radiusValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).xValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).yValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.FillCircle + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DrawLine).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x2Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y2Value.ID.toString(2), 16)
		,
		makeLength((InstructionType.DrawLine + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DrawPixel).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).xValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).yValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.DrawPixel + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DrawRect).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x2Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y2Value.ID.toString(2), 16)
		,
		makeLength((InstructionType.DrawRect + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.FillRect).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x2Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y2Value.ID.toString(2), 16)
		,
		makeLength((InstructionType.FillRect + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DrawText).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).xValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).yValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).scaleValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).textValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.DrawText + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DrawTriangle).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x2Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y2Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x3Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y3Value.ID.toString(2), 16)
		,
		makeLength((InstructionType.DrawTriangle + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.FillTriangle).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).colorValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y1Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x2Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y2Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).x3Value.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).y3Value.ID.toString(2), 16)
		,
		makeLength((InstructionType.FillTriangle + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DrawImage).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).xValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).yValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).imageValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.DrawImage + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.MutateValue).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).leftValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).rightValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.MutateValue + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.RunCondition && !game.instructions[Number(k)].await).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).evaluationValue.ID.toString(2), 16) +
		((game.instructions[Number(curr)] ).failSet ? makeLength((game.instructions[Number(curr)] ).failSet.ID.toString(2), 16) : '1111111111111111') +
		makeLength((game.instructions[Number(curr)] ).successSet.ID.toString(2), 16)
		,
		makeLength((InstructionType.RunCondition + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.RunCondition && !!game.instructions[Number(k)].await).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).evaluationValue.ID.toString(2), 16) +
		((game.instructions[Number(curr)] ).failSet ? makeLength((game.instructions[Number(curr)] ).failSet.ID.toString(2), 16) : '1111111111111111') +
		makeLength((game.instructions[Number(curr)] ).successSet.ID.toString(2), 16)
		,
		makeLength((InstructionType.AwaitedRunCondition + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.SetRotation).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).rotationValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.SetRotation + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.RunSet && !game.instructions[Number(k)].await).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).set.ID.toString(2), 16)
		,
		makeLength((InstructionType.RunSet + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.RunSet && !!game.instructions[Number(k)].await).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).set.ID.toString(2), 16)
		,
		makeLength((InstructionType.AwaitedRunSet + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.DebugLog).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).logValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.DebugLog + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.Wait).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).amountValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.Wait + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.Tone && !game.instructions[Number(k)].await).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).volumeValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).frequencyValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).durationValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.Tone + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	tempBinaryString = Object.keys(game.instructions).filter(k => game.instructions[Number(k)].instructionType === InstructionType.Tone && !!game.instructions[Number(k)].await).reduce((acc, curr) =>
		acc +
		makeLength(game.instructions[Number(curr)].ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).volumeValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).frequencyValue.ID.toString(2), 16) +
		makeLength((game.instructions[Number(curr)] ).durationValue.ID.toString(2), 16)
		,
		makeLength((InstructionType.AwaitedTone + 128).toString(2), 8)
	);
	if(tempBinaryString.length > 8) {
		binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
		binaryString += tempBinaryString;
	}

	const mainSet = game.instructionSets[game.mainInstructionSet];
	const renderSet = game.instructionSets[game.renderInstructionSet];
	tempBinaryString = makeLength((InstructionType.InstructionSet + 128).toString(2), 8) +
		makeLength(mainSet.ID.toString(2), 16) +
		(mainSet.async ? '1' : '0') +
		makeLength(mainSet.size.toString(2), 15) +
		mainSet.instructions.reduce((a, c) => a + makeLength(c.ID.toString(2), 16), '') +
		makeLength(renderSet.ID.toString(2), 16) +
		(mainSet.async ? '1' : '0') +
		makeLength(mainSet.size.toString(2), 15) +
		renderSet.instructions.reduce((a, c) => a + makeLength(c.ID.toString(2), 16), '') +
		Object.keys(game.instructionSets).filter(k => +k !== game.mainInstructionSet && +k !== game.renderInstructionSet).reduce((acc, curr) =>
			acc +
			makeLength(game.instructionSets[Number(curr)].ID.toString(2), 16) +
			(game.instructionSets[Number(curr)].async ? '1' : '0') +
			makeLength(game.instructionSets[Number(curr)].size.toString(2), 15) +
			game.instructionSets[Number(curr)].instructions.reduce((a, c) => a + makeLength(c.ID.toString(2), 16), '')
			,
			''
		);
	binaryString += makeLength((tempBinaryString.length / 8).toString(2), 16);
	binaryString += tempBinaryString;

	const numbers = [];
	let index = 0;
	while (binaryString.length > 0) {
		numbers[index] = parseInt(binaryString.substring(0, 8), 2);
		binaryString = binaryString.substring(8);
		index++;
	}
	const bytes = Uint8Array.from(numbers);

	return bytes;
}

function makeLength(value, length, signed?) {
	let returnValue = value;
	let negative = false;
	if (signed && returnValue.charAt(0) === '-') {
		negative = true;
		returnValue = returnValue.substr(1);
	}
	if (returnValue.length < length) {
		for (let i = 0; i < length - value.length; i++) {
			returnValue = '0' + returnValue;
		}
	} else if (returnValue.length > length) {
		returnValue = returnValue.substring(returnValue.length - length);
	}
	if (signed) {
		returnValue = negative ? '1' + returnValue : returnValue;
	}
	return returnValue;
}