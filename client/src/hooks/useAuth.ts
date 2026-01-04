import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error);
      // Forza il logout anche se c'è un errore
      queryClient.setQueryData(["/api/user"], null);
      window.location.href = "/auth";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logoutMutation,
  };
}
