import { ErrorBoundary } from './ErrorBoundary';

export function SafeCard({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Card failed to load.
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
}