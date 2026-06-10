'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Eye,
  ShoppingCart,
  FileText,
  Clock,
  IndianRupee,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  X,
  Stethoscope,
  History,
  Receipt,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  dob?: string | null;
  address?: string | null;
  aadhar?: string | null;
  group: 'New' | 'Regular' | 'Wholesale' | 'Premium';
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
}

interface Prescription {
  id: string;
  customerId: string;
  date: string;
  leftSph?: number | null;
  leftCyl?: number | null;
  leftAxis?: number | null;
  leftPd?: number | null;
  rightSph?: number | null;
  rightCyl?: number | null;
  rightAxis?: number | null;
  rightPd?: number | null;
  notes?: string | null;
}

interface Visit {
  id: string;
  customerId: string;
  date: string;
  purpose: string;
  notes?: string | null;
}

interface Due {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  description?: string | null;
  status: 'pending' | 'paid' | 'overdue';
}

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
  aadhar: string;
  group: Customer['group'];
}

interface PrescriptionFormData {
  date: string;
  leftSph: string;
  leftCyl: string;
  leftAxis: string;
  leftPd: string;
  rightSph: string;
  rightCyl: string;
  rightAxis: string;
  rightPd: string;
  notes: string;
}

interface VisitFormData {
  date: string;
  purpose: string;
  notes: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GROUP_BADGE_VARIANT: Record<Customer['group'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  New: 'secondary',
  Regular: 'default',
  Wholesale: 'outline',
  Premium: 'destructive',
};

const GROUP_COLORS: Record<Customer['group'], string> = {
  New: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Regular: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  Wholesale: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  Premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

const GROUP_LIST: Customer['group'][] = ['New', 'Regular', 'Wholesale', 'Premium'];

const EMPTY_CUSTOMER_FORM: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  dob: '',
  address: '',
  aadhar: '',
  group: 'New',
};

const EMPTY_PRESCRIPTION_FORM: PrescriptionFormData = {
  date: new Date().toISOString().split('T')[0],
  leftSph: '',
  leftCyl: '',
  leftAxis: '',
  leftPd: '',
  rightSph: '',
  rightCyl: '',
  rightAxis: '',
  rightPd: '',
  notes: '',
};

const EMPTY_VISIT_FORM: VisitFormData = {
  date: new Date().toISOString().split('T')[0],
  purpose: '',
  notes: '',
};

const PAGE_LIMIT = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatEyePower(
  sph?: number | null,
  cyl?: number | null,
  axis?: number | null,
  pd?: number | null
): string {
  const parts: string[] = [];
  if (sph !== null && sph !== undefined) parts.push(`SPH ${sph > 0 ? '+' : ''}${sph}`);
  if (cyl !== null && cyl !== undefined && cyl !== 0) parts.push(`CYL ${cyl > 0 ? '+' : ''}${cyl}`);
  if (axis !== null && axis !== undefined && axis !== 0) parts.push(`AX ${axis}°`);
  if (pd !== null && pd !== undefined) parts.push(`PD ${pd}`);
  return parts.length > 0 ? parts.join(' / ') : '—';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Customers() {
  // List state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail panel state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Customer dialog state
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerFormData>(EMPTY_CUSTOMER_FORM);
  const [customerFormErrors, setCustomerFormErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const [customerSubmitting, setCustomerSubmitting] = useState(false);

  // Prescription dialog state
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionFormData>(EMPTY_PRESCRIPTION_FORM);
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);

  // Visit dialog state
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [visitForm, setVisitForm] = useState<VisitFormData>(EMPTY_VISIT_FORM);
  const [visitSubmitting, setVisitSubmitting] = useState(false);

  // ─── Fetch customers ───────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch customers (HTTP ${res.status})`);
      const json: PaginatedResponse<Customer> = await res.json();
      setCustomers(json.data);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ─── Fetch customer details ────────────────────────────────────────────

  const fetchCustomerDetails = useCallback(async (customerId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [prescRes, visitRes, dueRes] = await Promise.all([
        fetch(`/api/prescriptions?customerId=${customerId}`),
        fetch(`/api/visits?customerId=${customerId}`),
        fetch(`/api/dues?customerId=${customerId}`),
      ]);

      if (!prescRes.ok) throw new Error('Failed to fetch prescriptions');
      if (!visitRes.ok) throw new Error('Failed to fetch visit history');
      if (!dueRes.ok) throw new Error('Failed to fetch dues');

      const prescJson = await prescRes.json();
      const visitJson = await visitRes.json();
      const dueJson = await dueRes.json();

      setPrescriptions(Array.isArray(prescJson.data) ? prescJson.data : prescJson || []);
      setVisits(Array.isArray(visitJson.data) ? visitJson.data : visitJson || []);
      setDues(Array.isArray(dueJson.data) ? dueJson.data : dueJson || []);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ─── Search handler ────────────────────────────────────────────────────

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // ─── Customer form handlers ────────────────────────────────────────────

  const openAddCustomerDialog = () => {
    setEditingCustomer(null);
    setCustomerForm(EMPTY_CUSTOMER_FORM);
    setCustomerFormErrors({});
    setCustomerDialogOpen(true);
  };

  const openEditCustomerDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      dob: customer.dob || '',
      address: customer.address || '',
      aadhar: customer.aadhar || '',
      group: customer.group,
    });
    setCustomerFormErrors({});
    setCustomerDialogOpen(true);
  };

  const validateCustomerForm = (): boolean => {
    const errors: Partial<Record<keyof CustomerFormData, string>> = {};
    if (!customerForm.name.trim()) errors.name = 'Name is required';
    if (!customerForm.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\+?[\d\s-]{7,15}$/.test(customerForm.phone.trim()))
      errors.phone = 'Enter a valid phone number';
    if (customerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email))
      errors.email = 'Enter a valid email';
    setCustomerFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCustomerSubmit = async () => {
    if (!validateCustomerForm()) return;
    setCustomerSubmitting(true);
    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Failed to ${editingCustomer ? 'update' : 'create'} customer`);
      }
      setCustomerDialogOpen(false);
      fetchCustomers();
      // If we're editing the currently viewed customer, refresh details
      if (editingCustomer && selectedCustomer?.id === editingCustomer.id) {
        const updated: Customer = { ...editingCustomer, ...customerForm };
        setSelectedCustomer(updated);
      }
    } catch (err) {
      setCustomerFormErrors({
        _form: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setCustomerSubmitting(false);
    }
  };

  // ─── Customer selection (detail panel) ─────────────────────────────────

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDetails(customer.id);
  };

  const handleCloseDetail = () => {
    setSelectedCustomer(null);
    setPrescriptions([]);
    setVisits([]);
    setDues([]);
    setDetailError(null);
  };

  // ─── Prescription handlers ─────────────────────────────────────────────

  const openPrescriptionDialog = () => {
    setPrescriptionForm(EMPTY_PRESCRIPTION_FORM);
    setPrescriptionDialogOpen(true);
  };

  const handlePrescriptionSubmit = async () => {
    if (!selectedCustomer || !prescriptionForm.date) return;
    setPrescriptionSubmitting(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          ...prescriptionForm,
          leftSph: prescriptionForm.leftSph ? parseFloat(prescriptionForm.leftSph) : null,
          leftCyl: prescriptionForm.leftCyl ? parseFloat(prescriptionForm.leftCyl) : null,
          leftAxis: prescriptionForm.leftAxis ? parseFloat(prescriptionForm.leftAxis) : null,
          leftPd: prescriptionForm.leftPd ? parseFloat(prescriptionForm.leftPd) : null,
          rightSph: prescriptionForm.rightSph ? parseFloat(prescriptionForm.rightSph) : null,
          rightCyl: prescriptionForm.rightCyl ? parseFloat(prescriptionForm.rightCyl) : null,
          rightAxis: prescriptionForm.rightAxis ? parseFloat(prescriptionForm.rightAxis) : null,
          rightPd: prescriptionForm.rightPd ? parseFloat(prescriptionForm.rightPd) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to add prescription');
      }
      setPrescriptionDialogOpen(false);
      fetchCustomerDetails(selectedCustomer.id);
    } catch (err) {
      // Could show toast here; for now just log
      console.error(err);
    } finally {
      setPrescriptionSubmitting(false);
    }
  };

  // ─── Visit handlers ────────────────────────────────────────────────────

  const openVisitDialog = () => {
    setVisitForm(EMPTY_VISIT_FORM);
    setVisitDialogOpen(true);
  };

  const handleVisitSubmit = async () => {
    if (!selectedCustomer || !visitForm.date || !visitForm.purpose.trim()) return;
    setVisitSubmitting(true);
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          ...visitForm,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to add visit');
      }
      setVisitDialogOpen(false);
      fetchCustomerDetails(selectedCustomer.id);
    } catch (err) {
      console.error(err);
    } finally {
      setVisitSubmitting(false);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────

  const renderGroupBadge = (group: Customer['group']) => (
    <Badge variant={GROUP_BADGE_VARIANT[group]} className={GROUP_COLORS[group]}>
      {group}
    </Badge>
  );

  // ─── Loading skeleton for table ────────────────────────────────────────

  const renderTableSkeleton = () => (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  // ─── Main render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">
            {total} customer{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={openAddCustomerDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 size-4" />
          Add Customer
        </Button>
      </div>

      {/* ─── Search Bar ─────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* ─── Customer Table ────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Name</TableHead>
                <TableHead className="min-w-[130px]">Phone</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="size-8 text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchCustomers}>
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : loading ? (
                renderTableSkeleton()
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <User className="size-8" />
                      <p className="text-sm">
                        {search ? 'No customers found for your search.' : 'No customers yet.'}
                      </p>
                      {!search && (
                        <Button variant="outline" size="sm" onClick={openAddCustomerDialog}>
                          <Plus className="mr-1 size-3" />
                          Add your first customer
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{renderGroupBadge(customer.group)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {customer.loyaltyPoints.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(customer);
                          }}
                          aria-label="View details"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCustomerDialog(customer);
                          }}
                          aria-label="Edit customer"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* ─── Pagination ──────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── Customer Detail Panel (Drawer/Sheet-like) ────────────────── */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={(open) => {
          if (!open) handleCloseDetail();
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-2xl">
          {selectedCustomer ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  {selectedCustomer.name}
                  {renderGroupBadge(selectedCustomer.group)}
                </DialogTitle>
                <DialogDescription>Customer details and history</DialogDescription>
              </DialogHeader>

              {/* Customer Info Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="text-muted-foreground size-4 shrink-0" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="text-muted-foreground size-4 shrink-0" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.dob && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground size-4 shrink-0" />
                    <span>DOB: {formatDate(selectedCustomer.dob)}</span>
                  </div>
                )}
                {selectedCustomer.aadhar && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="text-muted-foreground size-4 shrink-0" />
                    <span>Aadhar: {selectedCustomer.aadhar}</span>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-start gap-2 text-sm sm:col-span-2">
                    <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-muted-foreground text-xs">Points</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {selectedCustomer.loyaltyPoints.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-muted-foreground text-xs">Total Spent</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-muted-foreground text-xs">Outstanding</p>
                  <p className="text-lg font-semibold tabular-nums text-destructive">
                    {formatCurrency(
                      dues
                        .filter((d) => d.status === 'pending' || d.status === 'overdue')
                        .reduce((sum, d) => sum + d.amount, 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPrescriptionDialog()}
                >
                  <Stethoscope className="mr-1.5 size-3.5" />
                  Add Prescription
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openVisitDialog()}
                >
                  <History className="mr-1.5 size-3.5" />
                  Add Visit
                </Button>
                <Button size="sm">
                  <ShoppingCart className="mr-1.5 size-3.5" />
                  New Sale
                </Button>
              </div>

              <Separator />

              {/* Tabs: Prescriptions, Visit History, Dues */}
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading details...</span>
                </div>
              ) : detailError ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <AlertCircle className="size-6 text-destructive" />
                  <p className="text-sm text-destructive">{detailError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCustomerDetails(selectedCustomer.id)}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="prescriptions" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="prescriptions" className="flex-1">
                      <FileText className="mr-1.5 size-3.5" />
                      Prescriptions
                      {prescriptions.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                          {prescriptions.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="visits" className="flex-1">
                      <Clock className="mr-1.5 size-3.5" />
                      Visits
                      {visits.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                          {visits.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="dues" className="flex-1">
                      <IndianRupee className="mr-1.5 size-3.5" />
                      Dues
                      {dues.filter((d) => d.status !== 'paid').length > 0 && (
                        <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-xs">
                          {dues.filter((d) => d.status !== 'paid').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Prescriptions Tab */}
                  <TabsContent value="prescriptions">
                    <ScrollArea className="max-h-72">
                      {prescriptions.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                          <FileText className="size-8" />
                          <p className="text-sm">No prescriptions recorded yet.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openPrescriptionDialog}
                          >
                            <Plus className="mr-1 size-3" />
                            Add First Prescription
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {prescriptions.map((rx) => (
                            <Card key={rx.id}>
                              <CardHeader className="p-3 pb-0">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-medium">
                                    {formatDate(rx.date)}
                                  </CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent className="p-3 pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
                                      Left Eye
                                    </p>
                                    <p className="text-sm">
                                      {formatEyePower(
                                        rx.leftSph,
                                        rx.leftCyl,
                                        rx.leftAxis,
                                        rx.leftPd
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
                                      Right Eye
                                    </p>
                                    <p className="text-sm">
                                      {formatEyePower(
                                        rx.rightSph,
                                        rx.rightCyl,
                                        rx.rightAxis,
                                        rx.rightPd
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {rx.notes && (
                                  <p className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                                    {rx.notes}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Visits Tab */}
                  <TabsContent value="visits">
                    <ScrollArea className="max-h-72">
                      {visits.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                          <Clock className="size-8" />
                          <p className="text-sm">No visit history yet.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openVisitDialog}
                          >
                            <Plus className="mr-1 size-3" />
                            Add First Visit
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {visits.map((visit) => (
                            <div
                              key={visit.id}
                              className="flex items-start gap-3 rounded-lg border p-3"
                            >
                              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                                <Clock className="text-muted-foreground size-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium truncate">
                                    {visit.purpose}
                                  </p>
                                  <p className="text-muted-foreground shrink-0 text-xs">
                                    {formatDate(visit.date)}
                                  </p>
                                </div>
                                {visit.notes && (
                                  <p className="text-muted-foreground mt-0.5 text-xs line-clamp-2">
                                    {visit.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Dues Tab */}
                  <TabsContent value="dues">
                    <ScrollArea className="max-h-72">
                      {dues.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                          <Receipt className="size-8" />
                          <p className="text-sm">No dues recorded.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {dues.map((due) => (
                            <div
                              key={due.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                                    due.status === 'paid'
                                      ? 'bg-emerald-100 dark:bg-emerald-900'
                                      : due.status === 'overdue'
                                      ? 'bg-red-100 dark:bg-red-900'
                                      : 'bg-amber-100 dark:bg-amber-900'
                                  }`}
                                >
                                  <IndianRupee
                                    className={`size-4 ${
                                      due.status === 'paid'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : due.status === 'overdue'
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {due.description || 'Due payment'}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {formatDate(due.date)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums">
                                  {formatCurrency(due.amount)}
                                </p>
                                <Badge
                                  variant={
                                    due.status === 'paid'
                                      ? 'default'
                                      : due.status === 'overdue'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {due.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Customer Dialog ────────────────────────────────── */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update customer information below.'
                : 'Fill in the details to add a new customer.'}
            </DialogDescription>
          </DialogHeader>

          {customerFormErrors._form && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {customerFormErrors._form}
            </div>
          )}

          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-4 p-1">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="cust-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cust-name"
                  placeholder="Customer name"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm((f) => ({ ...f, name: e.target.value }))
                  }
                  aria-invalid={!!customerFormErrors.name}
                />
                {customerFormErrors.name && (
                  <p className="text-xs text-destructive">{customerFormErrors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="grid gap-2">
                <Label htmlFor="cust-phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cust-phone"
                  placeholder="Phone number"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  aria-invalid={!!customerFormErrors.phone}
                />
                {customerFormErrors.phone && (
                  <p className="text-xs text-destructive">{customerFormErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="Email address"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm((f) => ({ ...f, email: e.target.value }))
                  }
                  aria-invalid={!!customerFormErrors.email}
                />
                {customerFormErrors.email && (
                  <p className="text-xs text-destructive">{customerFormErrors.email}</p>
                )}
              </div>

              {/* DOB */}
              <div className="grid gap-2">
                <Label htmlFor="cust-dob">Date of Birth</Label>
                <Input
                  id="cust-dob"
                  type="date"
                  value={customerForm.dob}
                  onChange={(e) =>
                    setCustomerForm((f) => ({ ...f, dob: e.target.value }))
                  }
                />
              </div>

              {/* Address */}
              <div className="grid gap-2">
                <Label htmlFor="cust-address">Address</Label>
                <Textarea
                  id="cust-address"
                  placeholder="Full address"
                  rows={2}
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>

              {/* Aadhar */}
              <div className="grid gap-2">
                <Label htmlFor="cust-aadhar">Aadhar Number</Label>
                <Input
                  id="cust-aadhar"
                  placeholder="Aadhar number"
                  value={customerForm.aadhar}
                  onChange={(e) =>
                    setCustomerForm((f) => ({ ...f, aadhar: e.target.value }))
                  }
                />
              </div>

              {/* Group */}
              <div className="grid gap-2">
                <Label htmlFor="cust-group">Group</Label>
                <Select
                  value={customerForm.group}
                  onValueChange={(val) =>
                    setCustomerForm((f) => ({
                      ...f,
                      group: val as Customer['group'],
                    }))
                  }
                >
                  <SelectTrigger id="cust-group" className="w-full">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_LIST.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCustomerDialogOpen(false)}
              disabled={customerSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCustomerSubmit} disabled={customerSubmitting}>
              {customerSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Prescription Dialog ────────────────────────────────────── */}
      <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Prescription</DialogTitle>
            <DialogDescription>
              Enter the eye power details for the prescription.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-4 p-1">
              {/* Date */}
              <div className="grid gap-2">
                <Label htmlFor="rx-date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rx-date"
                  type="date"
                  value={prescriptionForm.date}
                  onChange={(e) =>
                    setPrescriptionForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>

              <Separator />

              {/* Left Eye */}
              <div>
                <p className="mb-3 text-sm font-medium">Left Eye (OS)</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-l-sph" className="text-xs text-muted-foreground">
                      SPH
                    </Label>
                    <Input
                      id="rx-l-sph"
                      placeholder="0.00"
                      value={prescriptionForm.leftSph}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, leftSph: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-l-cyl" className="text-xs text-muted-foreground">
                      CYL
                    </Label>
                    <Input
                      id="rx-l-cyl"
                      placeholder="0.00"
                      value={prescriptionForm.leftCyl}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, leftCyl: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-l-axis" className="text-xs text-muted-foreground">
                      AXIS
                    </Label>
                    <Input
                      id="rx-l-axis"
                      placeholder="0"
                      value={prescriptionForm.leftAxis}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, leftAxis: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-l-pd" className="text-xs text-muted-foreground">
                      PD
                    </Label>
                    <Input
                      id="rx-l-pd"
                      placeholder="0"
                      value={prescriptionForm.leftPd}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, leftPd: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Right Eye */}
              <div>
                <p className="mb-3 text-sm font-medium">Right Eye (OD)</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-r-sph" className="text-xs text-muted-foreground">
                      SPH
                    </Label>
                    <Input
                      id="rx-r-sph"
                      placeholder="0.00"
                      value={prescriptionForm.rightSph}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, rightSph: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-r-cyl" className="text-xs text-muted-foreground">
                      CYL
                    </Label>
                    <Input
                      id="rx-r-cyl"
                      placeholder="0.00"
                      value={prescriptionForm.rightCyl}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, rightCyl: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-r-axis" className="text-xs text-muted-foreground">
                      AXIS
                    </Label>
                    <Input
                      id="rx-r-axis"
                      placeholder="0"
                      value={prescriptionForm.rightAxis}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, rightAxis: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="rx-r-pd" className="text-xs text-muted-foreground">
                      PD
                    </Label>
                    <Input
                      id="rx-r-pd"
                      placeholder="0"
                      value={prescriptionForm.rightPd}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, rightPd: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="rx-notes">Notes</Label>
                <Textarea
                  id="rx-notes"
                  placeholder="Additional notes (optional)"
                  rows={2}
                  value={prescriptionForm.notes}
                  onChange={(e) =>
                    setPrescriptionForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPrescriptionDialogOpen(false)}
              disabled={prescriptionSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrescriptionSubmit}
              disabled={prescriptionSubmitting || !prescriptionForm.date}
            >
              {prescriptionSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Visit Dialog ───────────────────────────────────────────── */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Visit</DialogTitle>
            <DialogDescription>
              Record a customer visit entry.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="visit-date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="visit-date"
                type="date"
                value={visitForm.date}
                onChange={(e) =>
                  setVisitForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>

            {/* Purpose */}
            <div className="grid gap-2">
              <Label htmlFor="visit-purpose">
                Purpose <span className="text-destructive">*</span>
              </Label>
              <Input
                id="visit-purpose"
                placeholder="e.g., Eye checkup, Frame fitting, Follow-up"
                value={visitForm.purpose}
                onChange={(e) =>
                  setVisitForm((f) => ({ ...f, purpose: e.target.value }))
                }
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="visit-notes">Notes</Label>
              <Textarea
                id="visit-notes"
                placeholder="Additional notes (optional)"
                rows={3}
                value={visitForm.notes}
                onChange={(e) =>
                  setVisitForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setVisitDialogOpen(false)}
              disabled={visitSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVisitSubmit}
              disabled={visitSubmitting || !visitForm.date || !visitForm.purpose.trim()}
            >
              {visitSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}