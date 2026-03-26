import { useState, useEffect, useMemo } from "react";
import {
  Loader,
  PackageIcon,
  MapPinIcon,
  Phone,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  UserIcon,
  CalendarIcon,
  DownloadIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatPhoneNumber, formatCurrency } from "../../utils/dataHelpers";
import frontdeskService from "../../services/frontdeskService";
import { useToast } from "../../components/ui/toast";
import { useLocation } from "../../contexts/LocationContext";

interface ReconciliationParcel {
  parcelId: string;
  parcelDescription?: string;
  receiverName?: string;
  receiverPhoneNumber?: string;
  receiverAddress?: string;
  parcelAmount: number;
  delivered: boolean;
  cancelled: boolean;
  returned?: boolean;
  deliveryCost?: number;
  inboundCost?: number;
  paymentMethod?: string | null;
}

interface RiderGroup {
  riderId: string;
  riderName: string;
  riderPhoneNumber?: string;
  deliveredParcels: ReconciliationParcel[];
  failedParcels: ReconciliationParcel[];
  totalDeliveredAmount: number;
  totalDeliveredCount: number;
  totalParcelsCount: number;
  failedDeliveryCost: number;
  failedInboundCost: number;
  totalFailedAmount: number;
  assignmentIds: string[];
}

interface ReconciliationHistoryProps {
  embedded?: boolean;
}

export const ReconciliationHistory = ({ embedded = false }: ReconciliationHistoryProps): JSX.Element => {
  const { showToast } = useToast();
  const { locations } = useLocation();
  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [expandedRiders, setExpandedRiders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string>("ALL");
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("ALL");
  const [monthlySummaries, setMonthlySummaries] = useState<
    Record<
      string,
      {
        totalAmount: number;
        totalParcels: number;
        hasReconciliations: boolean;
        hasAssignments: boolean;
      }
    >
  >({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  const getDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get filtered offices based on selected location
  const filteredOffices = useMemo(() => {
    if (selectedLocationId === "ALL") {
      return locations.flatMap(loc => (loc.offices || []).map(office => ({ ...office, locationId: loc.id, locationName: loc.name })));
    }
    const location = locations.find(loc => loc.id === selectedLocationId);
    return (location?.offices || []).map(office => ({ ...office, locationId: location!.locationId, locationName: location!.locationName }));
  }, [locations, selectedLocationId]);

  // Fetch reconciliations by date and office filter
  const fetchAssignments = async (date: Date) => {
    setLoading(true);
    try {
      // Convert date to start of day in milliseconds
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const dateInMillis = startOfDay.getTime();

      console.log('Fetching reconciliation history for date:', startOfDay.toDateString(), 'Millis:', dateInMillis, 'Office:', selectedOfficeId);

      const response = await frontdeskService.getReconciliationsByDate(dateInMillis);

      if (response.success && response.data) {
        const data = response.data as any;
        let allAssignments = Array.isArray(data) ? data : (data.content || []);
        
        // Filter by office if selectedOfficeId is not "ALL"
        if (selectedOfficeId !== "ALL") {
          allAssignments = allAssignments.filter((assignment: any) => {
            const officeId = assignment.officeInfo?.officeId || assignment.officeId;
            return officeId === selectedOfficeId;
          });
        }
        
        console.log('Fetched reconciliation history:', allAssignments.length);
        setRawAssignments(allAssignments);
      } else {
        showToast(response.message || "Failed to load reconciliation history", "error");
        setRawAssignments([]);
      }
    } catch (error) {
      console.error("Failed to fetch reconciliation history:", error);
      showToast("Failed to load reconciliation history. Please try again.", "error");
      setRawAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedOfficeId]);

  // Load monthly overview (based on selectedMonth)
  useEffect(() => {
    const loadMonthlySummaries = async () => {
      try {
        setLoadingMonth(true);

        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth(); // 0-based
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const summaries: Record<
          string,
          {
            totalAmount: number;
            totalParcels: number;
            hasReconciliations: boolean;
            hasAssignments: boolean;
          }
        > = {};

        // Initialize all days in the month
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);
          const key = getDateKey(date);
          summaries[key] = {
            totalAmount: 0,
            totalParcels: 0,
            hasReconciliations: false,
            hasAssignments: false,
          };
        }

        // Build list of days we actually need to fetch (avoid future days for current month)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isCurrentMonth =
          year === today.getFullYear() && month === today.getMonth();

        const datesToFetch: Date[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);
          if (isCurrentMonth && date > today) {
            continue; // skip future days in current month
          }
          datesToFetch.push(date);
        }

        // Load reconciled history per day in parallel
        const fetchPromises = datesToFetch.map(async (date) => {
          const startOfDayMillis = date.getTime();
          const response = await frontdeskService.getReconciliationsByDate(
            startOfDayMillis
          );
          if (!response.success || !response.data) {
            return;
          }

          const data = response.data as any;
          const allAssignments = Array.isArray(data) ? data : data.content || [];

          let dayTotalAmount = 0;
          let dayTotalParcels = 0;

          allAssignments.forEach((assignment: any) => {
            if (assignment.parcels && Array.isArray(assignment.parcels)) {
              assignment.parcels.forEach((parcel: any) => {
                if (parcel.delivered && !parcel.cancelled) {
                  const parcelAmount = parcel.parcelAmount || 0;
                  dayTotalAmount += parcelAmount;
                  dayTotalParcels += 1;
                }
              });
            }
          });

          const key = getDateKey(date);
          if (summaries[key]) {
            summaries[key].totalAmount = dayTotalAmount;
            summaries[key].totalParcels = dayTotalParcels;
            summaries[key].hasReconciliations = dayTotalParcels > 0;
          }
        });

        await Promise.all(fetchPromises);

        // Load outstanding assignments once, then bucket by day
        const assignmentsResponse = await frontdeskService.getParcelAssignments(0, 500);
        if (assignmentsResponse.success && assignmentsResponse.data) {
          const data = assignmentsResponse.data as any;
          const allAssignments = data.content || [];

          allAssignments.forEach((assignment: any) => {
            const assignedAt = assignment.assignedAt;
            if (!assignedAt) return;
            const date = new Date(assignedAt);
            if (date.getFullYear() !== year || date.getMonth() !== month) return;

            date.setHours(0, 0, 0, 0);
            const key = getDateKey(date);
            if (!summaries[key]) {
              summaries[key] = {
                totalAmount: 0,
                totalParcels: 0,
                hasReconciliations: false,
                hasAssignments: true,
              };
            } else {
              summaries[key].hasAssignments = true;
            }
          });
        }

        setMonthlySummaries(summaries);
      } catch (error) {
        console.error("Failed to load monthly reconciliation summaries:", error);
        showToast("Failed to load monthly overview. Calendar totals may be incomplete.", "error");
      } finally {
        setLoadingMonth(false);
      }
    };

    loadMonthlySummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth.getFullYear(), selectedMonth.getMonth()]);

  // Group assignments by rider and filter only delivered parcels
  const riderGroups = useMemo(() => {
    const groupsMap = new Map<string, RiderGroup>();

    rawAssignments.forEach((assignment: any) => {
      const riderId = assignment.riderInfo?.riderId || assignment.riderId || 'unknown';
      const riderName = assignment.riderInfo?.riderName || assignment.riderName || 'Unknown Rider';
      const riderPhoneNumber = assignment.riderInfo?.riderPhoneNumber || assignment.riderPhoneNumber;

      if (!groupsMap.has(riderId)) {
        groupsMap.set(riderId, {
          riderId,
          riderName,
          riderPhoneNumber,
          deliveredParcels: [],
          failedParcels: [],
          totalDeliveredAmount: 0,
          totalDeliveredCount: 0,
          totalParcelsCount: 0,
          failedDeliveryCost: 0,
          failedInboundCost: 0,
          totalFailedAmount: 0,
          assignmentIds: [],
        });
      }

      const group = groupsMap.get(riderId)!;
      
      // Add assignment ID
      if (!group.assignmentIds.includes(assignment.assignmentId)) {
        group.assignmentIds.push(assignment.assignmentId);
      }

      // Process parcels array
      if (assignment.parcels && Array.isArray(assignment.parcels)) {
        assignment.parcels.forEach((parcel: any) => {
          group.totalParcelsCount++;
          
          const parcelAmount = parcel.parcelAmount || 0;

          // Delivered parcels (not cancelled)
          if (parcel.delivered && !parcel.cancelled) {
            group.deliveredParcels.push({
              parcelId: parcel.parcelId,
              parcelDescription: parcel.parcelDescription,
              receiverName: parcel.receiverName,
              receiverPhoneNumber: parcel.receiverPhoneNumber,
              receiverAddress: parcel.receiverAddress,
              parcelAmount,
              delivered: true,
              cancelled: false,
              returned: parcel.returned || false,
              deliveryCost: parcel.deliveryCost,
              inboundCost: parcel.inboundCost,
              paymentMethod: parcel.paymentMethod,
            });
            group.totalDeliveredAmount += parcelAmount;
            group.totalDeliveredCount++;
          } else if (parcel.returned) {
            // Failed (returned) parcels
            group.failedParcels.push({
              parcelId: parcel.parcelId,
              parcelDescription: parcel.parcelDescription,
              receiverName: parcel.receiverName,
              receiverPhoneNumber: parcel.receiverPhoneNumber,
              receiverAddress: parcel.receiverAddress,
              parcelAmount,
              delivered: false,
              cancelled: !!parcel.cancelled,
              returned: true,
              deliveryCost: parcel.deliveryCost,
              inboundCost: parcel.inboundCost,
              paymentMethod: parcel.paymentMethod,
            });
            group.failedDeliveryCost += parcel.deliveryCost || 0;
            group.failedInboundCost += parcel.inboundCost || 0;
            group.totalFailedAmount += parcelAmount;
          }
        });
      }
    });

    // Filter out riders with no delivered parcels and sort by rider name
    return Array.from(groupsMap.values())
      .filter(group => group.deliveredParcels.length > 0)
      .sort((a, b) => a.riderName.localeCompare(b.riderName));
  }, [rawAssignments]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return riderGroups.reduce((sum, group) => sum + group.totalDeliveredAmount, 0);
  }, [riderGroups]);

  const totalParcels = useMemo(() => {
    return riderGroups.reduce((sum, group) => sum + group.totalDeliveredCount, 0);
  }, [riderGroups]);

  const handleDownloadMonthlyPDF = () => {
    const monthLabel = selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build calendar rows HTML
    let cells = Array(firstDayOfWeek).fill('<td></td>').join('');
    let rows = '';
    let cellCount = firstDayOfWeek;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const summary = monthlySummaries[key];
      const isFuture = date > today;

      let bg = '#f9fafb'; let border = '#e5e7eb'; let amountColor = '#16a34a';
      if (isFuture) { bg = '#fff'; border = '#e5e7eb'; }
      else if (summary?.hasReconciliations) { bg = '#f0fdf4'; border = '#86efac'; }
      else if (summary?.hasAssignments) { bg = '#fefce8'; border = '#fde047'; }
      else if (summary) { bg = '#fef2f2'; border = '#fca5a5'; }

      cells += `<td style="padding:4px">
        <div style="background:${bg};border:1px solid ${border};border-radius:6px;padding:6px 4px;min-height:52px;text-align:center">
          <div style="font-weight:600;font-size:12px">${day}</div>
          ${summary && summary.totalParcels > 0
            ? `<div style="font-size:10px;color:#4b5563;margin-top:2px">${summary.totalParcels} parcels</div>
               <div style="font-size:10px;font-weight:700;color:${amountColor}">${formatCurrency(summary.totalAmount)}</div>`
            : '<div style="font-size:10px;color:#d1d5db;margin-top:2px">&nbsp;</div>'}
        </div>
      </td>`;
      cellCount++;

      if (cellCount % 7 === 0 || day === daysInMonth) {
        // Pad last row
        const remaining = 7 - (cellCount % 7 === 0 ? 7 : cellCount % 7);
        if (day === daysInMonth && remaining < 7) cells += '<td></td>'.repeat(remaining);
        rows += `<tr>${cells}</tr>`;
        cells = '';
      }
    }

    // Monthly totals
    const monthTotal = Object.values(monthlySummaries).reduce((s, d) => s + d.totalAmount, 0);
    const monthParcels = Object.values(monthlySummaries).reduce((s, d) => s + d.totalParcels, 0);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Monthly Overview – ${monthLabel}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:24px;color:#111}
        h1{font-size:18px;margin-bottom:4px}p{font-size:12px;color:#555;margin:0 0 12px}
        table{width:100%;border-collapse:collapse}th{font-size:11px;font-weight:600;color:#6b7280;text-align:center;padding:4px 0;}
        .legend{display:flex;gap:16px;margin-top:12px;font-size:11px;color:#555}
        .legend span{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:middle}
        .totals{margin-top:14px;padding:10px 14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;display:flex;gap:32px}
        .totals div{font-size:12px;color:#7c2d12} .totals strong{font-size:16px;color:#ea690c;display:block}
        @media print{body{margin:12px}}
      </style></head><body>
      <h1>Monthly Overview – ${monthLabel}</h1>
      <p>Mealex &amp; Mailex (M&amp;M) Parcel Delivery System &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr>
          <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div><span>Total Parcels</span><strong>${monthParcels}</strong></div>
        <div><span>Total Amount</span><strong>${formatCurrency(monthTotal)}</strong></div>
      </div>
      <div class="legend">
        <div><span style="background:#f0fdf4;border:1px solid #86efac"></span>Reconciliation approved</div>
        <div><span style="background:#fefce8;border:1px solid #fde047"></span>Work done, pending approval</div>
        <div><span style="background:#fef2f2;border:1px solid #fca5a5"></span>No parcels / no work</div>
      </div>
      <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleToggleRiderExpansion = (riderId: string) => {
    setExpandedRiders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riderId)) {
        newSet.delete(riderId);
      } else {
        newSet.add(riderId);
      }
      return newSet;
    });
  };

  const content = (
    <main className="flex-1 space-y-4 sm:space-y-6">
      {!embedded && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-1">Reconciliation History</h1>
            <p className="text-sm text-gray-600">View historical reconciliation data by month and day</p>
          </div>
        </div>
      )}

      {/* Location and Office Filters */}
      <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location Filter */}
            <div>
              <label htmlFor="location-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                <MapPinIcon className="w-4 h-4 inline mr-2" />
                Location
              </label>
              <select
                id="location-filter"
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setSelectedOfficeId("ALL");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#ea690c]"
              >
                <option value="ALL">All Locations</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Office/Station Filter */}
            <div>
              <label htmlFor="office-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                <MapPinIcon className="w-4 h-4 inline mr-2" />
                Station/Office
              </label>
              <select
                id="office-filter"
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#ea690c]"
              >
                <option value="ALL">All Stations</option>
                {filteredOffices.map(office => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Monthly Calendar Overview (current month) */}
          <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#ea690c]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Monthly Overview</p>
                      <button
                        type="button"
                        onClick={handleDownloadMonthlyPDF}
                        disabled={loadingMonth}
                        title="Download as PDF"
                        className="inline-flex items-center gap-1 rounded-md border border-[#ea690c] px-2 py-0.5 text-[11px] font-medium text-[#ea690c] hover:bg-orange-50 disabled:opacity-40"
                      >
                        <DownloadIcon className="w-3 h-3" />
                        PDF
                      </button>
                    </div>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 leading-tight">
                      {selectedMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Click a day to view full reconciliation details.
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
                  <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 border-gray-300 text-xs"
                    title="Previous year"
                    onClick={() => {
                      setSelectedMonth(prev => {
                        const candidate = new Date(prev.getFullYear() - 1, prev.getMonth(), 1);
                        const today = new Date();
                        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        const next = candidate > currentMonthStart ? currentMonthStart : candidate;
                        setSelectedDate(next);
                        return next;
                      });
                    }}
                  >
                    Prev Year
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 border-gray-300 text-xs"
                    title="Previous month"
                    onClick={() => {
                      setSelectedMonth(prev => {
                        const candidate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                        const today = new Date();
                        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        const next = candidate > currentMonthStart ? currentMonthStart : candidate;
                        setSelectedDate(next);
                        return next;
                      });
                    }}
                  >
                    Prev Month
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 border-gray-300 text-xs"
                    title="Next month"
                    onClick={() => {
                      setSelectedMonth(prev => {
                        const candidate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
                        const today = new Date();
                        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        const next =
                          candidate > currentMonthStart ? currentMonthStart : candidate;
                        setSelectedDate(next);
                        return next;
                      });
                    }}
                  >
                    Next Month
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 border-gray-300 text-xs"
                    title="Next year"
                    onClick={() => {
                      setSelectedMonth(prev => {
                        const candidate = new Date(prev.getFullYear() + 1, prev.getMonth(), 1);
                        const today = new Date();
                        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        const next =
                          candidate > currentMonthStart ? currentMonthStart : candidate;
                        setSelectedDate(next);
                        return next;
                      });
                    }}
                  >
                    Next Year
                  </Button>
                  </div>
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <label
                      htmlFor="reconciliation-history-date-picker"
                      className="text-[11px] text-gray-500"
                    >
                      Jump to date
                    </label>
                    <div className="relative">
                      <input
                        id="reconciliation-history-date-picker"
                        type="date"
                        value={selectedDate.toISOString().split("T")[0]}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const picked = new Date(e.target.value);
                          picked.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const safePicked = picked > today ? today : picked;
                          setSelectedDate(safePicked);
                          setSelectedMonth(
                            new Date(
                              safePicked.getFullYear(),
                              safePicked.getMonth(),
                              1
                            )
                          );
                        }}
                        className="w-[130px] sm:w-[140px] border border-gray-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#ea690c] bg-white"
                      />
                    </div>
                  </div>
                </div>
                {loadingMonth && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading monthly totals...
                  </div>
                )}
              </div>

              {/* Calendar grid */}
              <div className="space-y-2 overflow-x-auto">
                <div className="min-w-[360px] grid grid-cols-7 text-[11px] font-semibold text-gray-500">
                  <div className="text-center">Sun</div>
                  <div className="text-center">Mon</div>
                  <div className="text-center">Tue</div>
                  <div className="text-center">Wed</div>
                  <div className="text-center">Thu</div>
                  <div className="text-center">Fri</div>
                  <div className="text-center">Sat</div>
                </div>

                {(() => {
                  const year = selectedMonth.getFullYear();
                  const month = selectedMonth.getMonth();
                  const firstOfMonth = new Date(year, month, 1);
                  const firstDayOfWeek = firstOfMonth.getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();

                  const weeks: JSX.Element[][] = [];
                  let currentWeek: JSX.Element[] = [];

                  // Leading empty cells
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    currentWeek.push(<div key={`empty-${i}`} />);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    date.setHours(0, 0, 0, 0);
                    const key = getDateKey(date);
                    const summary = monthlySummaries[key];
                    const isSelected =
                      selectedDate.getFullYear() === year &&
                      selectedDate.getMonth() === month &&
                      selectedDate.getDate() === day;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isFuture = date > today;

                    type DayVariant = "neutral" | "future" | "green" | "yellow" | "red";
                    let variant: DayVariant = "neutral";
                    if (isFuture) {
                      variant = "future";
                    } else if (summary) {
                      if (summary.hasReconciliations) {
                        variant = "green";
                      } else if (summary.hasAssignments) {
                        variant = "yellow";
                      } else {
                        variant = "red";
                      }
                    }

                    const variantClassMap: Record<DayVariant, { base: string; selected: string }> =
                      {
                        neutral: {
                          base: "border-transparent bg-gray-50 text-neutral-600 hover:bg-gray-100",
                          selected:
                            "border-gray-400 bg-gray-100 text-neutral-900",
                        },
                        future: {
                          base: "border-dashed border-gray-200 bg-white text-gray-300",
                          selected:
                            "border-gray-400 bg-gray-50 text-gray-400",
                        },
                        green: {
                          base: "border-green-300 bg-green-50 text-neutral-800 hover:bg-green-100",
                          selected:
                            "border-green-500 bg-green-100 text-green-900",
                        },
                        yellow: {
                          base: "border-yellow-300 bg-yellow-50 text-neutral-800 hover:bg-yellow-100",
                          selected:
                            "border-yellow-500 bg-yellow-100 text-yellow-900",
                        },
                        red: {
                          base: "border-red-300 bg-red-50 text-neutral-700 hover:bg-red-100",
                          selected:
                            "border-red-500 bg-red-100 text-red-900",
                        },
                      };

                    const { base: stateBaseClass, selected: stateSelectedClass } =
                      variantClassMap[variant];

                    currentWeek.push(
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center justify-between rounded-lg border px-1.5 py-1.5 text-xs transition-colors ${
                          isSelected
                            ? stateSelectedClass
                            : stateBaseClass
                        }`}
                      >
                        <span className="font-semibold">{day}</span>
                        {summary && summary.totalParcels > 0 ? (
                          <div className="flex flex-col items-center leading-tight mt-0.5">
                            <span className="text-[10px] text-gray-600">
                              {summary.totalParcels} parcels
                            </span>
                            <span className="text-[10px] font-semibold text-green-700">
                              {formatCurrency(summary.totalAmount)}
                            </span>
                          </div>
                        ) : (
                          <span className="mt-0.5 text-[10px] text-gray-400">
                            &nbsp;
                          </span>
                        )}
                      </button>
                    );

                    if (currentWeek.length === 7 || day === daysInMonth) {
                      weeks.push(currentWeek);
                      currentWeek = [];
                    }
                  }

                  return (
                    <div className="min-w-[360px] grid grid-rows-6 gap-1">
                      {weeks.map((week, index) => (
                        <div key={index} className="grid grid-cols-7 gap-1">
                          {week}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded border border-green-400 bg-green-100 inline-block" />
                  <span>Reconciliation approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded border border-yellow-400 bg-yellow-100 inline-block" />
                  <span>Work done, pending approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded border border-red-400 bg-red-100 inline-block" />
                  <span>No parcels / no work</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded border border-dashed border-gray-300 bg-white inline-block" />
                  <span>Future date (no data yet)</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Showing reconciliation history for:{" "}
                <span className="font-semibold text-neutral-800">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          {riderGroups.length > 0 && (
            <Card className="rounded-lg border border-[#d1d1d1] bg-white shadow-sm">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Riders</p>
                    <p className="text-2xl font-bold text-[#ea690c]">{riderGroups.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Delivered Parcels</p>
                    <p className="text-2xl font-bold text-blue-600">{totalParcels}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignments Table */}
          <Card className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader className="w-10 h-10 text-[#ea690c] mx-auto mb-4 animate-spin" />
                  <p className="text-neutral-700 font-semibold text-lg">Loading reconciliation history...</p>
                </div>
              ) : riderGroups.length === 0 ? (
                <div className="text-center py-12">
                  <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-neutral-800 font-semibold text-lg mb-2">No reconciliation data found</p>
                  <p className="text-sm text-gray-500">
                    No delivered assignments found for the selected date
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Rider</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Delivered Parcels</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Total Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Stats</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {riderGroups.map((group, groupIndex) => {
                        const isExpanded = expandedRiders.has(group.riderId);

                        return (
                          <>
                            {/* Rider Group Header Row */}
                            <tr
                              key={group.riderId}
                              className={`hover:bg-gray-50 transition-colors ${groupIndex !== riderGroups.length - 1 ? 'border-b border-gray-200' : ''}`}
                            >
                              <td className="px-4 py-4 border-r border-gray-100">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleRiderExpansion(group.riderId)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    {isExpanded ? (
                                      <ChevronDownIcon className="w-4 h-4" />
                                    ) : (
                                      <ChevronRightIcon className="w-4 h-4" />
                                    )}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-blue-500" />
                                    <div>
                                      <div className="text-sm font-semibold text-neutral-800">
                                        {group.riderName}
                                      </div>
                                      {group.riderPhoneNumber && (
                                        <div className="text-xs text-gray-500">
                                          {formatPhoneNumber(group.riderPhoneNumber)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <div className="text-sm font-semibold text-blue-600">
                                  {group.totalDeliveredCount} / {group.totalParcelsCount}
                                </div>
                                <div className="text-xs text-gray-500">Delivered / Total</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                <div className="text-sm font-bold text-[#ea690c]">
                                  {formatCurrency(group.totalDeliveredAmount)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  {group.totalDeliveredCount} Delivered
                                </Badge>
                              </td>
                            </tr>
                            {/* Expanded Parcels Rows */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={4} className="px-0 py-0">
                                  <div className="bg-gray-50 border-top border-gray-200">
                                    <table className="w-full">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Recipient</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Location</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Amount</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Payment</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.deliveredParcels.map((parcel, parcelIndex) => (
                                          <tr
                                            key={parcel.parcelId}
                                            className={`${parcelIndex !== group.deliveredParcels.length - 1 ? 'border-b border-gray-200' : ''}`}
                                          >
                                            <td className="px-4 py-3">
                                              <div className="text-sm font-semibold text-neutral-800">
                                                {parcel.receiverName || "N/A"}
                                              </div>
                                              {parcel.parcelDescription && (
                                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                                  {parcel.parcelDescription}
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              {parcel.receiverPhoneNumber ? (
                                                <a
                                                  href={`tel:${parcel.receiverPhoneNumber}`}
                                                  className="text-sm text-[#ea690c] hover:underline font-medium"
                                                >
                                                  {formatPhoneNumber(parcel.receiverPhoneNumber)}
                                                </a>
                                              ) : (
                                                <span className="text-sm text-gray-400">N/A</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="text-sm text-neutral-700">
                                                {parcel.receiverAddress ? (
                                                  <div className="flex items-start gap-1">
                                                    <MapPinIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]" title={parcel.receiverAddress}>
                                                      {parcel.receiverAddress}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="text-gray-400">N/A</span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="text-sm font-bold text-[#ea690c]">
                                                {formatCurrency(parcel.parcelAmount)}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <Badge className={`${parcel.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : parcel.paymentMethod === 'momo' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'} border text-xs`}>
                                                {parcel.paymentMethod || 'N/A'}
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              {parcel.receiverPhoneNumber && (
                                                <Button
                                                  onClick={() => window.location.href = `tel:${parcel.receiverPhoneNumber}`}
                                                  variant="outline"
                                                  className="border-green-300 text-green-600 hover:bg-green-50 text-xs px-2.5 py-1.5"
                                                  title={`Call ${parcel.receiverName || 'recipient'}`}
                                                >
                                                  <Phone className="w-3.5 h-3.5" />
                                                </Button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>

                                    {/* Failed (returned) parcels and driver's money (failed fees) */}
                                    {group.failedParcels.length > 0 && (
                                      <div className="border-t-2 border-red-300 bg-red-50 px-4 py-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                          <span className="text-sm font-semibold text-red-800">
                                            Failed (returned) parcels: {group.failedParcels.length}
                                          </span>
                                          <span className="text-sm font-semibold text-red-800">
                                            Driver&apos;s money (failed):{" "}
                                            {formatCurrency(group.failedDeliveryCost + group.failedInboundCost)}
                                          </span>
                                        </div>
                                        <table className="w-full text-xs">
                                          <thead className="bg-red-200 border-b-2 border-red-400">
                                            <tr>
                                              <th className="px-2 py-1.5 text-left font-semibold text-red-900">Recipient</th>
                                              <th className="px-2 py-1.5 text-left font-semibold text-red-900">Phone</th>
                                              <th className="px-2 py-1.5 text-left font-semibold text-red-900">Location</th>
                                              <th className="px-2 py-1.5 text-right font-semibold text-red-900">Amount</th>
                                              <th className="px-2 py-1.5 text-center font-semibold text-red-900">Status</th>
                                              <th className="px-2 py-1.5 text-right font-semibold text-red-900">Delivery Fee</th>
                                              <th className="px-2 py-1.5 text-right font-semibold text-red-900">Inbound Fee</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {group.failedParcels.map((parcel) => (
                                              <tr
                                                key={parcel.parcelId}
                                                className="border-b border-red-200 bg-red-50/80 hover:bg-red-100/80"
                                              >
                                                <td className="px-2 py-1.5 text-[11px] text-red-900">
                                                  {parcel.receiverName || "N/A"}
                                                  {parcel.parcelDescription && (
                                                    <div className="text-[10px] text-red-700 truncate max-w-[120px]">
                                                      {parcel.parcelDescription}
                                                    </div>
                                                  )}
                                                </td>
                                                <td className="px-2 py-1.5 text-[11px] text-red-900">
                                                  {parcel.receiverPhoneNumber
                                                    ? formatPhoneNumber(parcel.receiverPhoneNumber)
                                                    : "N/A"}
                                                </td>
                                                <td
                                                  className="px-2 py-1.5 text-[11px] text-red-900 truncate max-w-[140px]"
                                                  title={parcel.receiverAddress}
                                                >
                                                  {parcel.receiverAddress || "N/A"}
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-[11px] text-red-900 font-medium">
                                                  {formatCurrency(parcel.parcelAmount)}
                                                </td>
                                                <td className="px-2 py-1.5 text-center">
                                                  <Badge className="bg-red-600 text-white border-0 text-[10px] font-semibold">
                                                    Failed
                                                  </Badge>
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-[11px] text-red-900">
                                                  {formatCurrency(parcel.deliveryCost || 0)}
                                                </td>
                                                <td className="px-2 py-1.5 text-right text-[11px] text-red-900">
                                                  {formatCurrency(parcel.inboundCost || 0)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {content}
      </div>
    </div>
  );
};

