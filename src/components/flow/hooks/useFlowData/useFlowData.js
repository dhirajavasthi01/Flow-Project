import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFlowDiagram, updateFlowDiagram, deleteFlowDiagram, addFlowDiagram } from "../../../../services/FlowServices";
import { svgMap } from "../../svgMap";

const FLOW_DIAGRAM_QUERY_KEY = ['flow-diagram'];

export function useFlowData(caseId = 1) {
  const queryClient = useQueryClient();

  // Transform API data to usable format
  const transformData = (data) => {
    if (!data) return null;
    try {
      return {
        ...data,
        nodes: JSON.parse(data.nodeJson || '[]').map(node => ({
          ...node,
          data: { ...node.data, svgPath: svgMap[node.nodeType] || null }
        })),
        edges: JSON.parse(data.edgeJson || '[]')
      };
    } catch (error) {
      console.error('Error parsing flow data:', error);
      return null;
    }
  };

  // Optimized query with smart caching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...FLOW_DIAGRAM_QUERY_KEY, caseId],
    queryFn: async () => {
      try {
        return await getFlowDiagram(caseId);
      } catch (err) {
        // If 404, return null (no diagram exists yet) instead of throwing
        if (err?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000, // 10 min garbage collection
    retry: (count, error) => {
      // Don't retry on 404 (diagram doesn't exist yet)
      if (error?.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 2 times
      return count < 2;
    },
    select: transformData
  });

  // Simple mutations
  const addFlow = useMutation({
    mutationFn: (payload) => addFlowDiagram(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...FLOW_DIAGRAM_QUERY_KEY, caseId] })
  });

  const updateFlow = useMutation({
    mutationFn: (payload) => updateFlowDiagram(caseId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...FLOW_DIAGRAM_QUERY_KEY, caseId] })
  });

  const deleteFlow = useMutation({
    mutationFn: (diagramId) => deleteFlowDiagram(diagramId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FLOW_DIAGRAM_QUERY_KEY, caseId] });
      queryClient.removeQueries({ queryKey: [...FLOW_DIAGRAM_QUERY_KEY, caseId] });
    }
  });

  return {
    // Data
    nodes: data?.nodes || [],
    edges: data?.edges || [],
    diagramId: data?.diagramId,
    saved: data?.saved,

    // States
    isLoading,
    error,

    // Actions
    refetch,
    addFlow: (payload, options) => addFlow.mutate(payload, options),
    updateFlow: updateFlow.mutate,
    deleteFlow: deleteFlow.mutate,
    isUpdating: updateFlow.isPending,
    isDeleting: deleteFlow.isPending
  };
}
