export type VertexId = string;

export interface Edge {
    target: VertexId;
    baseWeight: number;
}

export type DensityMap = Record<VertexId, number>; // Density as a percentage (0.0 to 1.0)

class MinPriorityQueue<T> {
    private heap: { element: T; priority: number }[] = [];

    enqueue(element: T, priority: number): void {
        this.heap.push({ element, priority });
        this.bubbleUp(this.heap.length - 1);
    }

    dequeue(): T | undefined {
        if (this.heap.length === 0) return undefined;
        if (this.heap.length === 1) return this.heap.pop()!.element;

        const min = this.heap[0].element;
        this.heap[0] = this.heap.pop()!;
        this.sinkDown(0);
        return min;
    }
    
    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    private bubbleUp(index: number): void {
        let current = index;
        while (current > 0) {
            const parent = Math.floor((current - 1) / 2);
            if (this.heap[parent].priority <= this.heap[current].priority) break;
            
            this.swap(current, parent);
            current = parent;
        }
    }

    private sinkDown(index: number): void {
        let current = index;
        const length = this.heap.length;

        while (true) {
            const leftChild = 2 * current + 1;
            const rightChild = 2 * current + 2;
            let smallest = current;

            if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
                smallest = leftChild;
            }
            if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
                smallest = rightChild;
            }

            if (smallest === current) break;
            
            this.swap(current, smallest);
            current = smallest;
        }
    }

    private swap(i: number, j: number): void {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }
}

export class StadiumGraph {
    private adjacencyList: Map<VertexId, Edge[]> = new Map();

    addVertex(vertex: VertexId): void {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, []);
        }
    }

    addEdge(source: VertexId, target: VertexId, baseWeight: number): void {
        this.addVertex(source);
        this.addVertex(target);
        this.adjacencyList.get(source)!.push({ target, baseWeight });
    }

    private calculateDynamicWeight(baseWeight: number, targetDensity: number): number {
        // Density is assumed to be 0 to 100 here in the implementation (from our DB)
        // Convert to 0.0 - 1.0
        const densityFactor = Math.max(0, Math.min(1, targetDensity / 100));
        
        // If it's infinity (like a closed gate or incident block), preserve it
        if (baseWeight === Infinity) return Infinity;

        const penaltyMultiplier = 1 + (2 * Math.pow(densityFactor, 2));
        return baseWeight * penaltyMultiplier;
    }

    findShortestPath(
        source: VertexId, 
        target: VertexId, 
        currentZoneDensities: DensityMap
    ): { path: VertexId[], cost: number } {
        
        const distances = new Map<VertexId, number>();
        const previous = new Map<VertexId, VertexId | null>();
        const pq = new MinPriorityQueue<VertexId>();
        const visited = new Set<VertexId>();

        for (const vertex of this.adjacencyList.keys()) {
            distances.set(vertex, Infinity);
            previous.set(vertex, null);
        }

        distances.set(source, 0);
        pq.enqueue(source, 0);

        while (!pq.isEmpty()) {
            const currentVertex = pq.dequeue()!;

            if (currentVertex === target) {
                break;
            }

            if (visited.has(currentVertex)) continue;
            visited.add(currentVertex);

            const neighbors = this.adjacencyList.get(currentVertex) || [];
            
            for (const edge of neighbors) {
                const neighborDensity = currentZoneDensities[edge.target] || 0;
                const dynamicWeight = this.calculateDynamicWeight(edge.baseWeight, neighborDensity);
                
                const currentDistance = distances.get(currentVertex)!;
                const altDistance = currentDistance + dynamicWeight;

                if (altDistance < distances.get(edge.target)!) {
                    distances.set(edge.target, altDistance);
                    previous.set(edge.target, currentVertex);
                    pq.enqueue(edge.target, altDistance);
                }
            }
        }

        const path: VertexId[] = [];
        let curr: VertexId | null = target;
        
        if (previous.get(target) === null && source !== target) {
            return { path: [], cost: Infinity };
        }

        while (curr !== null) {
            path.unshift(curr);
            curr = previous.get(curr)!;
        }

        return { path, cost: distances.get(target)! };
    }
}
