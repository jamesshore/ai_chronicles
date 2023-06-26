export class OutputTracker<T> {
  private _data: T[] = [];

  get data(): T[] {
    return this._data;
  }

  clear(): T[] {
    const dataCopy = [ ...this._data ];
    this._data = [];
    return dataCopy;
  }
}

export class OutputListener<T> {

  private _trackers: OutputTracker<T>[] = [];

  static create<T>(): OutputListener<T> {
    return new OutputListener<T>();
  }

  trackOutput(): OutputTracker<T> {
    const outputTracker = new OutputTracker<T>();
    this._trackers.push(outputTracker);
    return outputTracker;
  }

  emit(data: T) {
    this._trackers.forEach((tracker) => {
      tracker.data.push(data);
    });
  }
}
