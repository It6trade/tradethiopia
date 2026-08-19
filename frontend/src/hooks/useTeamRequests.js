import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@chakra-ui/react";
import apiClient from "../utils/apiClient";

export const REQUEST_DEPARTMENTS = [
  "Social Media",
  "TradexTV",
  "IT",
  "HR",
  "Sales",
  "Customer Success",
  "Finance",
  "Tessbin",
];
export const REQUEST_STATUSES = ["Pending", "Approved", "Completed"];
export const REQUEST_PRIORITIES = ["High", "Medium", "Low"];

const INITIAL_FILTERS = {
  department: "",
  priority: "",
  status: "",
  fromDate: "",
  toDate: "",
};

const sanitizeFilters = (filters) => {
  const params = {};
  if (filters.department) params.department = filters.department;
  if (filters.priority) params.priority = filters.priority;
  if (filters.status) params.status = filters.status;
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  return params;
};

const formatPayload = (response) => {
  if (!response) return [];
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

export const useTeamRequests = () => {
  const toast = useToast();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = sanitizeFilters(filters);
      const response = await apiClient.get("/requests", { params });
      setRequests(formatPayload(response));
    } catch (error) {
      console.error("Failed to load requests", error);
      toast({
        title: "Unable to load requests",
        description: error.message || "Please try again later",
        status: "error",
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
  }, []);

  const requestSummary = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((req) => (req.status || "Pending") !== "Completed").length;
    const highPriority = requests.filter((req) => req.priority === "High").length;
    return { total, open, highPriority };
  }, [requests]);

  const handleStatusChange = useCallback(
    async (requestId, newStatus) => {
      if (!requestId || !newStatus) return;
      setStatusUpdatingId(requestId);
      try {
        await apiClient.patch(`/requests/${requestId}/status`, { status: newStatus });
        toast({ title: "Status updated", status: "success" });
        fetchRequests();
      } catch (error) {
        console.error("Failed to update request status", error);
        toast({
          title: "Unable to update status",
          description: error.message || "Please try again later",
          status: "error",
        });
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [fetchRequests, toast]
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    filters,
    handleFilterChange,
    resetFilters,
    requests,
    loading,
    requestSummary,
    statusUpdatingId,
    handleStatusChange,
    fetchRequests,
  };
};
