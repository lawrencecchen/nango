export default function useSet<T>(initialValue?: T[], limit?: number): readonly [T[], (item: T) => void, (item: T) => void];
