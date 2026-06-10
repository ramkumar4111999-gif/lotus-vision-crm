'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Loader2,
  Phone,
  Mail,
  UserCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Staff {
  id: string
  name: string
  phone: string
  email: string | null
  role: string
  salary: number
  commission: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Sale {
  id: string
  staffId: string | null
  totalAmount: number
  createdAt: string
}

interface StaffFormData {
  name: string
  phone: string
  email: string
  role: string
  salary: string
  commission: string
  isActive: boolean
}

interface StaffPerformance {
  staffId: string
  staffName: string
  staffRole: string
  totalSales: number
  commissionEarned: number
  transactionCount: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM: StaffFormData = {
  name: '',
  phone: '',
  email: '',
  role: 'Staff',
  salary: '',
  commission: '',
  isActive: true,
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  Owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Staff: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [form, setForm] = useState<StaffFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({})

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null)

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff?limit=100')
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json.data ?? []
        setStaffList(data)
      }
    } catch {
      // Silently fail — UI shows empty state
    }
  }, [])

  const fetchSales = useCallback(async () => {
    try {
      const { start, end } = getCurrentMonthRange()
      const from = start.toISOString()
      const to = end.toISOString()
      // Fetch a large page to get all sales for the month
      const res = await fetch(`/api/sales?limit=500&fromDate=${encodeURIComponent(from)}&toDate=${encodeURIComponent(to)}`)
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json.sales ?? []
        setSales(data)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchStaff(), fetchSales()]).finally(() => setLoading(false))
  }, [fetchStaff, fetchSales])

  // ─── Performance Calculation ──────────────────────────────────────────────

  const performanceData: StaffPerformance[] = (() => {
    const { start, end } = getCurrentMonthRange()

    // Filter sales to this month (server already filtered, but double-check)
    const thisMonthSales = sales.filter((s) => {
      const d = new Date(s.createdAt)
      return d >= start && d <= end && s.staffId
    })

    const staffMap = new Map<string, { total: number; count: number }>()
    for (const sale of thisMonthSales) {
      if (!sale.staffId) continue
      const entry = staffMap.get(sale.staffId) ?? { total: 0, count: 0 }
      entry.total += sale.totalAmount
      entry.count += 1
      staffMap.set(sale.staffId, entry)
    }

    return staffList
      .filter((s) => s.isActive)
      .map((s) => {
        const stats = staffMap.get(s.id) ?? { total: 0, count: 0 }
        return {
          staffId: s.id,
          staffName: s.name,
          staffRole: s.role,
          totalSales: stats.total,
          commissionEarned: stats.total * (s.commission / 100),
          transactionCount: stats.count,
        }
      })
  })()

  // ─── Form Handlers ────────────────────────────────────────────────────────

  function openAddDialog() {
    setEditingStaff(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setDialogOpen(true)
  }

  function openEditDialog(staff: Staff) {
    setEditingStaff(staff)
    setForm({
      name: staff.name,
      phone: staff.phone,
      email: staff.email ?? '',
      role: staff.role,
      salary: String(staff.salary),
      commission: String(staff.commission),
      isActive: staff.isActive,
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  function openDeleteDialog(staff: Staff) {
    setDeletingStaff(staff)
    setDeleteDialogOpen(true)
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof StaffFormData, string>> = {}

    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.phone.trim()) errors.phone = 'Phone is required'
    if (form.salary && isNaN(Number(form.salary)))
      errors.salary = 'Must be a valid number'
    if (form.commission && isNaN(Number(form.commission)))
      errors.commission = 'Must be a valid number'
    if (Number(form.commission) < 0 || Number(form.commission) > 100)
      errors.commission = 'Must be 0-100'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit() {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        role: form.role,
        salary: Number(form.salary) || 0,
        commission: Number(form.commission) || 0,
        isActive: form.isActive,
      }

      if (editingStaff) {
        // PUT /api/staff/[id]
        const res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          setDialogOpen(false)
          await fetchStaff()
        }
      } else {
        // POST /api/staff
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          setDialogOpen(false)
          await fetchStaff()
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingStaff) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/staff/${deletingStaff.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDeleteDialogOpen(false)
        setDeletingStaff(null)
        await fetchStaff()
      }
    } finally {
      setSubmitting(false)
    }
  }

  function updateField<K extends keyof StaffFormData>(key: K, value: StaffFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Staff List Card ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="size-5 text-primary" />
              Staff Management
            </CardTitle>
            <CardDescription>
              {staffList.length} staff member{staffList.length !== 1 ? 's' : ''} registered
            </CardDescription>
          </div>
          <Button onClick={openAddDialog} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add Staff
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading staff...</span>
            </div>
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <UserCircle className="size-12" />
              <p className="text-sm">No staff members yet.</p>
              <Button variant="outline" size="sm" onClick={openAddDialog}>
                <Plus className="size-4" />
                Add your first staff member
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Salary</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="pl-4 font-medium">{staff.name}</TableCell>
                        <TableCell className="text-muted-foreground">{staff.phone}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={ROLE_BADGE_STYLES[staff.role] ?? ''}
                          >
                            {staff.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(staff.salary)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {staff.commission}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={staff.isActive ? 'default' : 'secondary'}
                            className={
                              staff.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                            }
                          >
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditDialog(staff)}
                              aria-label={`Edit ${staff.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(staff)}
                              aria-label={`Delete ${staff.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {staffList.map((staff) => (
                  <Card key={staff.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{staff.name}</p>
                          <Badge
                            variant="outline"
                            className={`shrink-0 ${ROLE_BADGE_STYLES[staff.role] ?? ''}`}
                          >
                            {staff.role}
                          </Badge>
                          <Badge
                            variant={staff.isActive ? 'default' : 'secondary'}
                            className={
                              staff.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shrink-0'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700 shrink-0'
                            }
                          >
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="size-3.5" />
                            {staff.phone}
                          </span>
                          {staff.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="size-3.5 shrink-0" />
                              {staff.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEditDialog(staff)}
                          aria-label={`Edit ${staff.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(staff)}
                          aria-label={`Delete ${staff.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Salary</span>
                      <span className="font-mono font-medium">{formatCurrency(staff.salary)}/mo</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Commission</span>
                      <span className="font-mono font-medium">{staff.commission}%</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Staff Performance Section ───────────────────────────────────── */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="size-5 text-primary" />
              Staff Performance
            </CardTitle>
            <CardDescription>
              Monthly sales performance for active staff —{' '}
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Performance Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Staff</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Commission Earned</TableHead>
                    <TableHead className="pr-4 text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((p) => (
                    <TableRow key={p.staffId}>
                      <TableCell className="pl-4 font-medium">{p.staffName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ROLE_BADGE_STYLES[p.staffRole] ?? ''}
                        >
                          {p.staffRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(p.totalSales)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.commissionEarned)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <ShoppingBag className="size-3.5 text-muted-foreground" />
                          {p.transactionCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Performance Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:hidden">
              {performanceData.map((p) => (
                <Card key={p.staffId} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.staffName}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${ROLE_BADGE_STYLES[p.staffRole] ?? ''}`}
                      >
                        {p.staffRole}
                      </Badge>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserCircle className="size-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="size-3.5" />
                        Total Sales
                      </span>
                      <span className="font-mono font-medium">{formatCurrency(p.totalSales)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="size-3.5" />
                        Commission
                      </span>
                      <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.commissionEarned)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <ShoppingBag className="size-3.5" />
                        Transactions
                      </span>
                      <span className="font-mono font-medium">{p.transactionCount}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Add / Edit Staff Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !submitting && setDialogOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff
                ? `Update details for ${editingStaff.name}.`
                : 'Fill in the information below to add a new staff member.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="staff-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-name"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                aria-invalid={!!formErrors.name}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="staff-phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                aria-invalid={!!formErrors.phone}
              />
              {formErrors.phone && (
                <p className="text-xs text-destructive">{formErrors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="staff-role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(val) => updateField('role', val)}
              >
                <SelectTrigger id="staff-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary & Commission Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staff-salary">Salary (monthly)</Label>
                <Input
                  id="staff-salary"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="5000"
                  value={form.salary}
                  onChange={(e) => updateField('salary', e.target.value)}
                  aria-invalid={!!formErrors.salary}
                />
                {formErrors.salary && (
                  <p className="text-xs text-destructive">{formErrors.salary}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-commission">Commission (%)</Label>
                <Input
                  id="staff-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="5"
                  value={form.commission}
                  onChange={(e) => updateField('commission', e.target.value)}
                  aria-invalid={!!formErrors.commission}
                />
                {formErrors.commission && (
                  <p className="text-xs text-destructive">{formErrors.commission}</p>
                )}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="staff-active" className="cursor-pointer">
                  Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive staff won&apos;t appear in performance reports
                </p>
              </div>
              <Switch
                id="staff-active"
                checked={form.isActive}
                onCheckedChange={(checked) => updateField('isActive', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !submitting && setDeleteDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deletingStaff?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}