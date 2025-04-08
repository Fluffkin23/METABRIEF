import { useQueryClient } from "@tanstack/react-query";

// Custom hook to handle refetching of active queries
const useRefetch = () => {
    // Get the query client instance from React Query
    const queryClient = useQueryClient();
    
    // Return an asynchronous function that refetches all active queries
    return async () => {
        await queryClient.refetchQueries({
            type: "active", // Specify that only active queries should be refetched
        });
    }
}
export default useRefetch;