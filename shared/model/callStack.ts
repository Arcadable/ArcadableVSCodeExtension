export class Executable {
	static asdf = 0;
	public id;
	constructor(
		public action: () => Promise<Executable[]>,
		public async: boolean,
		public await: boolean,
		public awaiting: Executable[],
		public parentAwait: Executable | null,
		public executeOnMillis: number | null,
		public test?: boolean
	) {
		this.id = Executable.asdf;
		Executable.asdf++;
	}
	withParentAwait(p: Executable): Executable {
		this.parentAwait = p;
		return this;
	}
}
export class CallStack {
	private storage: Executable[] = [];
	private delayed: number = 0;
	constructor(private capacity: number = Infinity) { }

	pushback(...items: Executable[]): void {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		this.storage.push(...items);
	}
	pushinfrontof(infrontof: Executable, ...items: Executable[]) {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		const index = this.storage.findIndex(e => e === infrontof);
		if(index !== -1) {
			this.storage.splice(index, 0, ...items);
		}
	}
	pushbehind(behind: Executable, ...items: Executable[]) {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		const index = this.storage.findIndex(e => e === behind);
		if(index !== -1) {
			this.storage.splice(index+1, 0, ...items);
		}
	}
	pushfront(...items: Executable[]): void {
		if (this.size() === this.capacity) {
			throw Error("Stack has reached max capacity.");
		}
		this.storage.splice(0, 0, ...items);
	}

	
	delayScheduledSection(parent: Executable) {

		this.storage = this.storage.filter(i => i !== parent);
		this.pushback(parent);

		this.delayed++;

		if(parent.parentAwait) {
			this.delayScheduledSection(parent.parentAwait);
		}
	}

	doProcessMore(): boolean {
		return this.delayed < this.size();
	}

	prepareStep() {
		this.delayed = 0;
	}

	pop(): Executable | undefined {
		return this.storage.shift();
	}

	size(): number {
		return this.storage.length;
	}
}
