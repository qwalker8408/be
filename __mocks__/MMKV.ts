export default class MMKV {
  store: { [key: string]: string } = {};

  getAllKeys(): string[] {
    return Object.keys(this.store);
  }

  getString(key: string): string | null {
    return this.store[key] || null;
  }

  set(key: string, value: string): void {
    this.store[key] = value;
  }

  clearAll(): void {
    this.store = {};
  }
}
