export function TraceQueryPanelWrapper({
  noResults,
  children,
}: TracePanelWrapperProps) {
  const { isFetching, isLoading, queryResults } = useDataQueries("TraceQuery");

  if (isLoading || isFetching) {
    return <LoadingState />;
  }

  const queryError = queryResults.find((d) => d.error);
  if (queryError) {
    return <ErrorAlert error={queryError.error as Error} />;
  }

  const dataFound = queryResults.some(
    (traceData) =>
      (traceData.data?.searchResult ?? []).length > 0 || traceData.data?.trace,
  );
  if (!dataFound && noResults) {
    return <>{noResults}</>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorAlert} resetKeys={[]}>
      {children}
    </ErrorBoundary>
  );
}
