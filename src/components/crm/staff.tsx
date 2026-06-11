'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  CalendarCheck,
  CircleDot,
  Clock,
  Lock,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
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
  joinDate: string | null
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
  joinDate: string
}

interface StaffPerformance {
  staffId: string
  staffName: string
  staffRole: string
  totalSales: number
  commissionEarned: number
  transactionCount: number
}

interface AttendanceEntry {
  staffId: string
  staffName: string
  clockIn: string
  clockOut: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM: StaffFormData = {
  name: '',
  phone: '',
  email: '',
  role: 'Sales Staff',
  salary: '',
  commission: '',
  isActive: true,
  joinDate: new Date().toISOString().split('T')[0],
}

const ROLES = ['Owner', 'Admin', 'Optometrist', 'Sales Staff', 'Assistant'] as const

const ROLE_BADGE_STYLES: Record<string, string> = {
  Owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Admin: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
  Optometrist: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'Sales Staff': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Assistant: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function getAttendanceStatus(joinDate: string | null, isActive: boolean): { label: string; color: string } {
  if (!isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700' }
  return { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800' }
}

function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function getElapsedSeconds(isoStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000))
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
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

  // Attendance state
  const [attendanceLog, setAttendanceLog] = useState<AttendanceEntry[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [clockSubmitting, setClockSubmitting] = useState<string | null>(null) // staffId
  const [timerTick, setTimerTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      // Silently fail
    }
  }, [])

  const fetchSales = useCallback(async () => {
    try {
      const { start, end } = getCurrentMonthRange()
      const from = start.toISOString()
      const to = end.toISOString()
      const res = await fetch(`/api/sales?limit=500&fromDate=${encodeURIComponent(from)}&toDate=${encodeURIComponent(to)}`)
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json.sales ?? json.data ?? []
        setSales(data)
      }
    } catch {
      // Silently fail
    }
  }, [])

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/attendance')
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json) ? json : json.data ?? []
        setAttendanceLog(data)
      }
    } catch {
      // Silently fail
    } finally {
      setAttendanceLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchStaff(), fetchSales(), fetchAttendance()]).finally(() => setLoading(false))
  }, [fetchStaff, fetchSales, fetchAttendance])

  // ─── Live Timer ──────────────────────────────────────────────────────────

  useEffect(() => {
    const hasActive = attendanceLog.some((e) => e.clockOut === null)
    if (hasActive) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimerTick((t) => t + 1)
        }, 1000)
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [attendanceLog])

  // ─── Attendance Helpers ──────────────────────────────────────────────────

  function getActiveAttendance(staffId: string): AttendanceEntry | undefined {
    return attendanceLog.find((e) => e.staffId === staffId && e.clockOut === null)
  }

  function isClockedIn(staffId: string): boolean {
    return !!getActiveAttendance(staffId)
  }

  function getTodayTotalHours(): number {
    let totalMs = 0
    for (const entry of attendanceLog) {
      const start = new Date(entry.clockIn).getTime()
      const end = entry.clockOut ? new Date(entry.clockOut).getTime() : Date.now()
      totalMs += Math.max(0, end - start)
    }
    return totalMs / (1000 * 60 * 60)
  }

  function getPresentStaffIds(): Set<string> {
    const ids = new Set<string>()
    for (const entry of attendanceLog) {
      ids.add(entry.staffId)
    }
    return ids
  }

  async function handleClockIn(staff: Staff) {
    setClockSubmitting(staff.id)
    try {
      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staff.id, staffName: staff.name, action: 'clockIn' }),
      })
      if (res.ok) {
        await fetchAttendance()
      }
    } finally {
      setClockSubmitting(null)
    }
  }

  async function handleClockOut(staff: Staff) {
    setClockSubmitting(staff.id)
    try {
      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staff.id, staffName: staff.name, action: 'clockOut' }),
      })
      if (res.ok) {
        await fetchAttendance()
      }
    } finally {
      setClockSubmitting(null)
    }
  }

  // ─── Performance Calculation ──────────────────────────────────────────────

  const performanceData: StaffPerformance[] = (() => {
    const { start, end } = getCurrentMonthRange()
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

  // ─── Summary Stats ──────────────────────────────────────────────────────

  const summaryStats = {
    totalStaff: staffList.length,
    activeStaff: staffList.filter((s) => s.isActive).length,
    totalMonthlyPayroll: staffList.filter((s) => s.isActive).reduce((sum, s) => sum + s.salary, 0),
    totalMonthlySales: performanceData.reduce((sum, p) => sum + p.totalSales, 0),
  }

  // Attendance derived data
  const presentStaffIds = getPresentStaffIds()
  const absentStaff = staffList.filter((s) => s.isActive && !presentStaffIds.has(s.id))
  const presentCount = presentStaffIds.size
  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

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
      joinDate: staff.joinDate ? new Date(staff.joinDate).toISOString().split('T')[0] : '',
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
        joinDate: form.joinDate || null,
      }

      if (editingStaff) {
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

  // ─── Role Badge Renderer ─────────────────────────────────────────────────

  function renderRoleBadge(role: string) {
    return (
      <Badge
        variant="outline"
        className={ROLE_BADGE_STYLES[role] ?? ''}
      >
        {role === 'Admin' && <Lock className="mr-1 size-3" />}
        {role}
      </Badge>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <Users className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{summaryStats.totalStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2.5">
              <CircleDot className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{summaryStats.activeStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2.5">
              <DollarSign className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Payroll</p>
              <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalMonthlyPayroll)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5">
              <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Sales</p>
              <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalMonthlySales)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Today's Attendance Card ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="size-5 text-primary" />
            Today&apos;s Attendance
          </CardTitle>
          <CardDescription className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="size-3.5" />
              {todayDate}
            </span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="size-3.5 text-green-600" />
              {presentCount} Present
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              Total: {getTodayTotalHours().toFixed(1)}h worked
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading attendance...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Present Staff */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <UserCheck className="size-4 text-green-600" />
                  Present ({presentCount})
                </h4>
                {attendanceLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No one has clocked in yet today.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {attendanceLog.map((entry, idx) => {
                      const active = entry.clockOut === null
                      return (
                        <div
                          key={`${entry.staffId}-${idx}`}
                          className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="font-medium truncate">{entry.staffName}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <LogIn className="size-3 text-green-500" />
                                In: {formatTime(entry.clockIn)}
                              </span>
                              {entry.clockOut && (
                                <span className="flex items-center gap-1">
                                  <LogOut className="size-3 text-orange-500" />
                                  Out: {formatTime(entry.clockOut)}
                                </span>
                              )}
                              {!active && entry.clockOut && (
                                <span className="text-muted-foreground">
                                  ({formatElapsed(getElapsedSeconds(entry.clockIn) - getElapsedSeconds(entry.clockOut))} worked)
                                </span>
                              )}
                            </div>
                          </div>
                          {active && (
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 text-[10px] px-1.5 py-0">
                                Working
                              </Badge>
                              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                                {formatElapsed(getElapsedSeconds(entry.clockIn))}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Absent Staff */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <UserX className="size-4 text-red-500" />
                  Absent ({absentStaff.length})
                </h4>
                {absentStaff.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {staffList.length === 0 ? 'No staff registered.' : 'All active staff are present!'}
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {absentStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-dashed p-3 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={clockSubmitting === staff.id}
                          onClick={() => handleClockIn(staff)}
                        >
                          {clockSubmitting === staff.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <LogIn className="size-3.5" />
                          )}
                          Clock In
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Salary</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-center">Attendance</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((staff) => {
                      const attStatus = getAttendanceStatus(staff.joinDate, staff.isActive)
                      const clocked = isClockedIn(staff.id)
                      const activeEntry = getActiveAttendance(staff.id)
                      return (
                        <TableRow key={staff.id}>
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{staff.name}</span>
                              {renderRoleBadge(staff.role)}
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${attStatus.color}`}
                              >
                                {attStatus.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{staff.phone}</TableCell>
                          <TableCell>
                            {renderRoleBadge(staff.role)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            <div className="flex items-center gap-1.5">
                              <CalendarCheck className="size-3.5" />
                              {formatDate(staff.joinDate)}
                            </div>
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
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(staff.salary)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {staff.commission}%
                          </TableCell>
                          <TableCell className="text-center">
                            {staff.isActive && (
                              clocked ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                    disabled={clockSubmitting === staff.id}
                                    onClick={() => handleClockOut(staff)}
                                  >
                                    {clockSubmitting === staff.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <LogOut className="size-3" />
                                    )}
                                    Clock Out
                                  </Button>
                                  {activeEntry && (
                                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                                      {formatElapsed(getElapsedSeconds(activeEntry.clockIn))}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                  disabled={clockSubmitting === staff.id}
                                  onClick={() => handleClockIn(staff)}
                                >
                                  {clockSubmitting === staff.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <LogIn className="size-3" />
                                  )}
                                  Clock In
                                </Button>
                              )
                            )}
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
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {staffList.map((staff) => {
                  const attStatus = getAttendanceStatus(staff.joinDate, staff.isActive)
                  const clocked = isClockedIn(staff.id)
                  const activeEntry = getActiveAttendance(staff.id)
                  return (
                    <Card key={staff.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="truncate font-medium">{staff.name}</p>
                            {renderRoleBadge(staff.role)}
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] px-1.5 py-0 ${attStatus.color}`}
                            >
                              {attStatus.label}
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
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Join Date</span>
                          <span className="font-medium">{formatDate(staff.joinDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
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
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Salary</span>
                          <span className="font-mono font-medium">{formatCurrency(staff.salary)}/mo</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Commission</span>
                          <span className="font-mono font-medium">{staff.commission}%</span>
                        </div>
                      </div>
                      {staff.isActive && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Attendance</span>
                            {clocked ? (
                              <div className="flex items-center gap-2">
                                {activeEntry && (
                                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                                    {formatElapsed(getElapsedSeconds(activeEntry.clockIn))}
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                  disabled={clockSubmitting === staff.id}
                                  onClick={() => handleClockOut(staff)}
                                >
                                  {clockSubmitting === staff.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <LogOut className="size-3" />
                                  )}
                                  Clock Out
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                disabled={clockSubmitting === staff.id}
                                onClick={() => handleClockIn(staff)}
                              >
                                {clockSubmitting === staff.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <LogIn className="size-3" />
                                )}
                                Clock In
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </Card>
                  )
                })}
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
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
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
                    <TableHead className="text-right">This Month&apos;s Commission</TableHead>
                    <TableHead className="pr-4 text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((p) => (
                    <TableRow key={p.staffId}>
                      <TableCell className="pl-4 font-medium">{p.staffName}</TableCell>
                      <TableCell>
                        {renderRoleBadge(p.staffRole)}
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
                      {renderRoleBadge(p.staffRole)}
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
                        This Month&apos;s Commission
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
                placeholder="e.g., Kumar"
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
                placeholder="+91 98765 43210"
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
                placeholder="staff@example.com"
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
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Join Date */}
            <div className="grid gap-2">
              <Label htmlFor="staff-join-date">Join Date</Label>
              <Input
                id="staff-join-date"
                type="date"
                value={form.joinDate}
                onChange={(e) => updateField('joinDate', e.target.value)}
              />
            </div>

            {/* Salary & Commission Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staff-salary">Salary (₹/month)</Label>
                <Input
                  id="staff-salary"
                  type="number"
                  min="0"
                  step="500"
                  placeholder="15000"
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