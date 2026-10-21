/** Ordered playback queue; packets from invalidated (barged-in) turns are dropped. */
export class AudioTurnQueue {
  constructor() {
    this.items = [];
    this.floor = -1;
  }

  enqueue(item) {
    if (this.isStale(item.turnId)) return false;
    this.items.push(item);
    return true;
  }

  shift() {
    return this.items.shift();
  }

  invalidate(turnId) {
    this.floor = Math.max(this.floor, turnId);
    this.items = this.items.filter((i) => !this.isStale(i.turnId));
  }

  isStale(turnId) {
    return typeof turnId === "number" && turnId <= this.floor;
  }

  clear() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  get isEmpty() {
    return this.items.length === 0;
  }
}
