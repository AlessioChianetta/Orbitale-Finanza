import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Gestione automatica degli errori di autenticazione
    if (res.status === 401 || res.status === 403) {
      console.warn("Sessione scaduta o non valida, reindirizzamento al login...");
      // Clear all query cache
      queryClient.clear();
      // Programmare il reindirizzamento (non bloccante)
      setTimeout(() => {
        window.location.href = "/auth";
      }, 100);
      // Fare sempre throw per assicurarsi che le mutazioni entrino nel percorso onError
      throw new Error(`${res.status}: Sessione scaduta, reindirizzamento in corso...`);
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    // Gestione specifica per errori di autenticazione
    if (res.status === 401 || res.status === 403) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect") {
        console.warn("Sessione scaduta durante query, reindirizzamento al login...");
        // Clear all cache before redirect
        queryClient.clear();
        // Small delay to ensure cache is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = "/auth";
        return null;
      }
      // Per "throw" comportamento, continua con throwIfResNotOk
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "redirect" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes (default)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper function to get cache options for critical account data
export const getCriticalAccountQueryOptions = () => ({
  staleTime: 30 * 1000, // 30 seconds for critical data
  refetchOnWindowFocus: true, // Refetch when user switches back to app
  refetchInterval: 2 * 60 * 1000 // Auto-refetch every 2 minutes
});

// Helper function to invalidate all account-related cache
export const invalidateAccountCache = () => {
  queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
  queryClient.invalidateQueries({ queryKey: ['/api/custom-accounts'] });
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard-unified'] });
  queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
};
