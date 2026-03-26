import { useState, useEffect, useCallback } from "react";
import {
  Loader, RefreshCwIcon, SearchIcon, ShieldIcon,
  PackageIcon, EyeIcon, UserPlusIcon, EditIcon,
  TrashIcon, LogInIcon, LogOutIcon, ActivityIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import adminService from "../../../services/adminService";
import { useToast } from "../../../components/ui/toast";

interface UserAction {
  id: string;
  userId: string;
  userEmai: string;
  userName: string;
  action: string;
  description: string;
  officeId: string;
  createdAt: number;
}

interface Page {
  content: UserAction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Map action strings to icon + colour
const ACTION_META: Record<string, { icon: React.FC<any>; bg: string; text: string; label: string }> = {
  ADD_PARCEL:        { icon: PackageIcon,  bg: "bg-green-100",  text: "text-green-700",  label: "Add Parcel" },
  UPDATE_PARCEL:     { icon: EditIcon,     bg: "bg-blue-100",   text: "text-blue-700",   label: "Update Parcel" },
  DELETE_PARCEL:     { icon: TrashIcon,    bg: "bg-red-100",    text: "text-red-700",    label: "Delete Parcel" },
  SEARCH_PARCELS:    { icon: SearchIcon,   bg: "bg-purple-100", text: "text-purple-700", label: "Search Parcels" },
  VIEW_LOCATIONS:    { icon: EyeIcon,      bg: "bg-gray-100",   text: "text-gray-600",   label: "View Locations" },
  LOGIN:             { icon: LogInIcon,    bg: "bg-[#ffefe5]",  text: "text-[#ea690c]",  label: "Login" },
  LOGOUT:            { icon: LogOutIcon,   bg: "bg-orange-100", text: "text-orange-600", label: "Logout" },
  CREATE_USER:       { icon: UserPlusIcon, bg: "bg-teal-100",   text: "text-teal-700",   label: "Create User" },
  RECONCILE:         { icon: ShieldIcon,   bg: "bg-yellow-100", text: "text-yellow-700", label: "Reconcile" },
};

const getActionMeta = (action: string) =>
  ACTION_META[action] ?? { icon: ActivityIcon, bg: "bg-gray-100", text: "text-gray-600", label: action };

const formatTs = (ms: number) => {
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const PAGE_SIZE = 20;

export const SystemLogs = (): JSX.Element => {
  const { showToast } = useToast();
  const [page, setPage] = useState<Page | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const fetchLogs = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await adminService.getUserActions(pageNum, PAGE_SIZE);
      if (res.success && res.data) {
        setPage(res.data as Page);
      } else {
        showToast(res.message || "Failed to load logs", "error");
      }
    } catch {
      showToast("Failed to load system logs", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchLogs(currentPage); }, [currentPage, fetchLogs]);

  const allActions = page
    ? Array.from(new Set(page.content.map(a => a.action))).sort()
    : [];

  const filtered = (page?.content ?? []).filter(a => {
    const matchAction = filterAction === "ALL" || a.action === filterAction;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.userName.toLowerCase().includes(q) ||
      a.userEmai.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  const goTo = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-800">System Logs</h1>
            <p className="text-xs text-[#5d5d5d] mt-0.5">
              All user actions across the system — {page?.totalElements?.toLocaleString() ?? "…"} total entries
            </p>
          </div>
          <Button
            onClick={() => fetchLogs(currentPage)}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
          >
            {loading
              ? <Loader className="w-4 h-4 animate-spin" />
              : <><RefreshCwIcon className="w-4 h-4 mr-1" />Refresh</>}
          </Button>
        </div>

        {/* Stats strip */}
        {page && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Entries", value: page.totalElements.toLocaleString(), color: "text-[#ea690c]", bg: "bg-[#ffefe5]" },
              { label: "Pages", value: page.totalPages, color: "text-blue-700", bg: "bg-[#e5f0ff]" },
              { label: "This Page", value: page.content.length, color: "text-green-700", bg: "bg-[#e5f6e9]" },
              { label: "Unique Actions", value: allActions.length, color: "text-purple-700", bg: "bg-purple-50" },
            ].map(s => (
              <Card key={s.label} className={`border-none ${s.bg}`}>
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card className="border border-[#d1d1d1] bg-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by user, action, description..."
                  className="w-full pl-9 pr-4 py-2 border border-[#d1d1d1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
                />
              </div>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="px-3 py-2 border border-[#d1d1d1] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ea690c]"
              >
                <option value="ALL">All Actions</option>
                {allActions.map(a => (
                  <option key={a} value={a}>{getActionMeta(a).label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs table */}
        <Card className="border border-[#d1d1d1] bg-white overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-3 animate-spin" />
              <p className="text-sm text-[#5d5d5d]">Loading logs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <ActivityIcon className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-800">No logs found</p>
              <p className="text-xs text-[#5d5d5d] mt-1">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-[#d1d1d1]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Office ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#d1d1d1]">
                  {filtered.map(log => {
                    const meta = getActionMeta(log.action);
                    const Icon = meta.icon;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">

                        {/* Action badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-neutral-800">{log.userName}</p>
                          <p className="text-xs text-[#5d5d5d] mt-0.5">{log.userEmai}</p>
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3 text-sm text-neutral-700 max-w-[260px]">
                          {log.description}
                        </td>

                        {/* Office ID */}
                        <td className="px-4 py-3">
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] font-mono">
                            {log.officeId ? log.officeId.slice(-8) : "—"}
                          </Badge>
                        </td>

                        {/* Timestamp */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#5d5d5d]">
                          {formatTs(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {page && page.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[#d1d1d1] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#5d5d5d]">
                Page <span className="font-semibold text-neutral-800">{page.number + 1}</span> of{" "}
                <span className="font-semibold text-neutral-800">{page.totalPages}</span>
                {" "}·{" "}
                <span className="font-semibold text-neutral-800">{page.totalElements.toLocaleString()}</span> total entries
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  onClick={() => goTo(0)}
                  disabled={page.first || loading}
                  className="border-[#d1d1d1] text-xs px-2"
                >
                  First
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => goTo(currentPage - 1)}
                  disabled={page.first || loading}
                  className="border-[#d1d1d1]"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>

                {/* Page number pills */}
                {Array.from({ length: Math.min(5, page.totalPages) }, (_, i) => {
                  const start = Math.max(0, Math.min(currentPage - 2, page.totalPages - 5));
                  const p = start + i;
                  return (
                    <button
                      key={p}
                      onClick={() => goTo(p)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        p === currentPage
                          ? "bg-[#ea690c] text-white"
                          : "border border-[#d1d1d1] text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}

                <Button
                  variant="outline" size="sm"
                  onClick={() => goTo(currentPage + 1)}
                  disabled={page.last || loading}
                  className="border-[#d1d1d1]"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => goTo(page.totalPages - 1)}
                  disabled={page.last || loading}
                  className="border-[#d1d1d1] text-xs px-2"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};
