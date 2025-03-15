export class Random {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    // Simple seeded random number generator
    private next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    // Generate a random number within a range
    range(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
} 