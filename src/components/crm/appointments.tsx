'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  format,
  parseISO,
  isToday,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns'
import { DayPicker } from 'react-day-picker'
import {
  CalendarDays,
  List,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  Clock,
  Eye,
  MoreHorizontal,
  Loader2,
  CalendarIcon,
  User,
  FileText,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ───────────────────────────────────────────────────────────────────

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

type AppointmentPurpose =
  | 'eye_checkup'
  | 'lens_fitting'
  | 'collection'
  | 'follow_up'
  | 'other'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  date: string
  time: string
  purpose: AppointmentPurpose
  status: AppointmentStatus
  notes: string
  createdAt: string
  updatedAt: string
}

interface AppointmentsResponse {
  appointments: Appointment[]
  total: number
  page: number
  pageSize: number
}

interface CustomersResponse {
  customers: Customer[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PURPOSE_LABELS: Record<AppointmentPurpose, string> = {
  eye_checkup: 'Eye Checkup',
  lens_fitting: 'Lens Fitting',
  collection: 'Collection',
  follow_up: 'Follow-up',
  other: 'Other',
}

const PURPOSE_OPTIONS: { value: AppointmentPurpose; label: string }[] = [
  { value: 'eye_checkup', label: 'Eye Checkup' },
  { value: 'lens_fitting', label: 'Lens Fitting' },
  { value: 'collection', label: 'Collection' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
]

const STATUS_VARIANTS: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: 'Scheduled',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  completed: {
    label: 'Completed',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    return format(date, 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return timeStr
  }
}

function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// ─── Mock Data (used when API is unavailable) ────────────────────────────────

function getMockAppointments(): Appointment[] {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  const dayOffset = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    return fmt(d)
  }

  return [
    {
      id: '1',
      customerId: 'c1',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@example.com',
      customerPhone: '555-0101',
      date: fmt(today),
      time: '09:00',
      purpose: 'eye_checkup',
      status: 'scheduled',
      notes: 'Annual eye examination. Patient reports mild headaches.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      customerId: 'c2',
      customerName: 'Michael Chen',
      customerEmail: 'mchen@example.com',
      customerPhone: '555-0102',
      date: fmt(today),
      time: '10:30',
      purpose: 'lens_fitting',
      status: 'scheduled',
      notes: 'Contact lens fitting for astigmatism.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      customerId: 'c3',
      customerName: 'Emily Rodriguez',
      customerEmail: 'emily.r@example.com',
      customerPhone: '555-0103',
      date: fmt(today),
      time: '14:00',
      purpose: 'collection',
      status: 'completed',
      notes: 'Picking up progressive glasses ordered last week.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      customerId: 'c4',
      customerName: 'David Kim',
      customerEmail: 'dkim@example.com',
      customerPhone: '555-0104',
      date: dayOffset(-1),
      time: '11:00',
      purpose: 'follow_up',
      status: 'completed',
      notes: 'Post-surgery follow-up. Healing well.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
      customerId: 'c5',
      customerName: 'Lisa Thompson',
      customerEmail: 'lthompson@example.com',
      customerPhone: '555-0105',
      date: dayOffset(-1),
      time: '15:30',
      purpose: 'eye_checkup',
      status: 'cancelled',
      notes: 'Patient called to reschedule due to illness.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '6',
      customerId: 'c6',
      customerName: 'James Wilson',
      customerEmail: 'jwilson@example.com',
      customerPhone: '555-0106',
      date: dayOffset(1),
      time: '09:30',
      purpose: 'eye_checkup',
      status: 'scheduled',
      notes: 'New patient. Referred by Dr. Smith.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '7',
      customerId: 'c7',
      customerName: 'Anna Park',
      customerEmail: 'apark@example.com',
      customerPhone: '555-0107',
      date: dayOffset(2),
      time: '13:00',
      purpose: 'lens_fitting',
      status: 'scheduled',
      notes: 'First-time contact lens wearer. Needs training.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '8',
      customerId: 'c8',
      customerName: 'Robert Garcia',
      customerEmail: 'rgarcia@example.com',
      customerPhone: '555-0108',
      date: dayOffset(3),
      time: '16:00',
      purpose: 'collection',
      status: 'scheduled',
      notes: 'Prescription sunglasses ready for pickup.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

function getMockCustomers(): Customer[] {
  return [
    { id: 'c1', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-0101' },
    { id: 'c2', name: 'Michael Chen', email: 'mchen@example.com', phone: '555-0102' },
    { id: 'c3', name: 'Emily Rodriguez', email: 'emily.r@example.com', phone: '555-0103' },
    { id: 'c4', name: 'David Kim', email: 'dkim@example.com', phone: '555-0104' },
    { id: 'c5', name: 'Lisa Thompson', email: 'lthompson@example.com', phone: '555-0105' },
    { id: 'c6', name: 'James Wilson', email: 'jwilson@example.com', phone: '555-0106' },
    { id: 'c7', name: 'Anna Park', email: 'apark@example.com', phone: '555-0107' },
    { id: 'c8', name: 'Robert Garcia', email: 'rgarcia@example.com', phone: '555-0108' },
    { id: 'c9', name: 'Maria Santos', email: 'msantos@example.com', phone: '555-0109' },
    { id: 'c10', name: 'Thomas Lee', email: 'tlee@example.com', phone: '555-0110' },
  ]
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_VARIANTS[status]
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}

function AppointmentFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

// ─── Appointment Form Dialog ─────────────────────────────────────────────────

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  customers: Customer[]
  onSubmit: (data: {
    customerId: string
    date: string
    time: string
    purpose: AppointmentPurpose
    notes: string
  }) => Promise<void>
}

function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  customers,
  onSubmit,
}: AppointmentFormDialogProps) {
  const isEditing = !!appointment
  const [submitting, setSubmitting] = useState(false)
  const [customerId, setCustomerId] = useState(appointment?.customerId ?? '')
  const [date, setDate] = useState(appointment?.date ?? toDateString(new Date()))
  const [time, setTime] = useState(appointment?.time ?? '09:00')
  const [purpose, setPurpose] = useState<AppointmentPurpose>(
    appointment?.purpose ?? 'eye_checkup'
  )
  const [notes, setNotes] = useState(appointment?.notes ?? '')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)

  // Reset form when dialog opens/closes or appointment changes
  useEffect(() => {
    if (open) {
      setCustomerId(appointment?.customerId ?? '')
      setDate(appointment?.date ?? toDateString(new Date()))
      setTime(appointment?.time ?? '09:00')
      setPurpose(appointment?.purpose ?? 'eye_checkup')
      setNotes(appointment?.notes ?? '')
      setCustomerSearch('')
      setShowCustomerPicker(false)
    }
  }, [open, appointment])

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  )

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8)
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    )
  }, [customers, customerSearch])

  const canSubmit = customerId && date && time && purpose

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({ customerId, date, time, purpose, notes })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the appointment details below.'
              : 'Schedule a new appointment by filling in the details below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer" className="flex items-center gap-1.5">
              <User className="size-3.5" />
              Customer
            </Label>
            <Popover open={showCustomerPicker} onOpenChange={setShowCustomerPicker}>
              <PopoverTrigger asChild>
                <Button
                  id="customer"
                  variant="outline"
                  role="combobox"
                  aria-expanded={showCustomerPicker}
                  className="w-full justify-between font-normal"
                >
                  {selectedCustomer ? (
                    <span className="flex items-center gap-2">
                      <span>{selectedCustomer.name}</span>
                      {selectedCustomer.phone && (
                        <span className="text-muted-foreground text-xs">
                          {selectedCustomer.phone}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Search & select customer...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                <ScrollArea className="max-h-48">
                  <div className="p-1">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        No customers found.
                      </p>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left',
                            customerId === customer.id && 'bg-accent'
                          )}
                          onClick={() => {
                            setCustomerId(customer.id)
                            setShowCustomerPicker(false)
                            setCustomerSearch('')
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {customer.email || customer.phone || 'No contact info'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={toDateString(new Date())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose" className="flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Purpose
            </Label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as AppointmentPurpose)}>
              <SelectTrigger id="purpose" className="w-full">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes for this appointment..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
            {isEditing ? 'Save Changes' : 'Create Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Calendar View ───────────────────────────────────────────────────────────

interface CalendarViewProps {
  appointments: Appointment[]
  selectedDate: Date | undefined
  onDateSelect: (date: Date) => void
}

function CalendarView({ appointments, selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Build a map of dates that have appointments
  const appointmentDateMap = useMemo(() => {
    const map: Record<string, { total: number; scheduled: number; completed: number; cancelled: number }> = {}
    appointments.forEach((apt) => {
      if (!map[apt.date]) {
        map[apt.date] = { total: 0, scheduled: 0, completed: 0, cancelled: 0 }
      }
      map[apt.date].total++
      map[apt.date][apt.status]++
    })
    return map
  }, [appointments])

  // Dates with appointments for the current month
  const appointmentDates = useMemo(() => {
    const dates: Set<string> = new Set()
    appointments.forEach((apt) => {
      if (isSameMonth(parseISO(apt.date), currentMonth)) {
        dates.add(apt.date)
      }
    })
    return dates
  }, [appointments, currentMonth])

  // Selected date appointments
  const selectedDateApts = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = toDateString(selectedDate)
    return appointments
      .filter((apt) => apt.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [appointments, selectedDate])

  // Custom day render
  const dayRender = (day: Date) => {
    const dateStr = toDateString(day)
    const info = appointmentDateMap[dateStr]
    if (!info) return null
    return (
      <div className="flex gap-0.5 justify-center mt-0.5">
        {info.scheduled > 0 && (
          <span className="size-1 rounded-full bg-blue-500" title={`${info.scheduled} scheduled`} />
        )}
        {info.completed > 0 && (
          <span className="size-1 rounded-full bg-green-500" title={`${info.completed} completed`} />
        )}
        {info.cancelled > 0 && (
          <span className="size-1 rounded-full bg-red-500" title={`${info.cancelled} cancelled`} />
        )}
      </div>
    )
  }

  const totalMonthAppointments = useMemo(() => {
    return appointments.filter((apt) => isSameMonth(parseISO(apt.date), currentMonth)).length
  }, [appointments, currentMonth])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="size-5" />
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {totalMonthAppointments} appointment{totalMonthAppointments !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            showOutsideDays
            modifiers={{
              hasAppointments: (day) => appointmentDates.has(toDateString(day)),
            }}
            modifiersStyles={{
              hasAppointments: { fontWeight: '600' },
            }}
            className="mx-auto"
            classNames={{
              day: 'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
            }}
            components={{
              DayContent: ({ date }) => (
                <div className="flex flex-col items-center justify-center w-full h-full py-1">
                  <span>{format(date, 'd')}</span>
                  {dayRender(date)}
                </div>
              ),
            }}
          />
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />
              Scheduled
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500" />
              Completed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" />
              Cancelled
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {selectedDate
              ? isToday(selectedDate)
                ? "Today's Appointments"
                : format(selectedDate, 'EEEE, MMM d')
              : 'Select a Date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Click on a date in the calendar to view its appointments.
              </p>
            </div>
          ) : selectedDateApts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3 pr-3">
                {selectedDateApts.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{formatTime(apt.time)}</span>
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="text-sm font-medium">{apt.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {PURPOSE_LABELS[apt.purpose]}
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{apt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

type ViewMode = 'list' | 'calendar'
type StatusFilter = 'all' | AppointmentStatus

export default function Appointments() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('date', toDateString(selectedDate))
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', page.toString())

      const res = await fetch(`/api/appointments?${params.toString()}`)
      if (res.ok) {
        const data: AppointmentsResponse = await res.json()
        setAppointments(data.appointments)
        setTotal(data.total)
      } else {
        // Fallback to mock data
        const mock = getMockAppointments()
        const filtered = mock.filter((apt) => {
          if (statusFilter !== 'all' && apt.status !== statusFilter) return false
          return apt.date === toDateString(selectedDate)
        })
        setAppointments(filtered.sort((a, b) => a.time.localeCompare(b.time)))
        setTotal(filtered.length)
      }
    } catch {
      // Fallback to mock data
      const mock = getMockAppointments()
      const filtered = mock.filter((apt) => {
        if (statusFilter !== 'all' && apt.status !== statusFilter) return false
        return apt.date === toDateString(selectedDate)
      })
      setAppointments(filtered.sort((a, b) => a.time.localeCompare(b.time)))
      setTotal(filtered.length)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, statusFilter, page])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?limit=100')
      if (res.ok) {
        const data: CustomersResponse = await res.json()
        setCustomers(data.customers)
      } else {
        setCustomers(getMockCustomers())
      }
    } catch {
      setCustomers(getMockCustomers())
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleCreateAppointment = async (data: {
    customerId: string
    date: string
    time: string
    purpose: AppointmentPurpose
    notes: string
  }) => {
    const customer = customers.find((c) => c.id === data.customerId)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await fetchAppointments()
        return
      }
    } catch {
      // fallback
    }
    // Mock fallback: add locally
    const newApt: Appointment = {
      id: `mock-${Date.now()}`,
      customerId: data.customerId,
      customerName: customer?.name ?? 'Unknown',
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      date: data.date,
      time: data.time,
      purpose: data.purpose,
      status: 'scheduled',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setAppointments((prev) => [...prev, newApt].sort((a, b) => a.time.localeCompare(b.time)))
    setTotal((prev) => prev + 1)
  }

  const handleEditAppointment = async (data: {
    customerId: string
    date: string
    time: string
    purpose: AppointmentPurpose
    notes: string
  }) => {
    if (!editAppointment) return
    const customer = customers.find((c) => c.id === data.customerId)
    try {
      const res = await fetch(`/api/appointments/${editAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setEditAppointment(null)
        await fetchAppointments()
        return
      }
    } catch {
      // fallback
    }
    // Mock fallback: update locally
    setAppointments((prev) =>
      prev
        .map((apt) =>
          apt.id === editAppointment.id
            ? {
                ...apt,
                ...data,
                customerName: customer?.name ?? apt.customerName,
                customerEmail: customer?.email ?? apt.customerEmail,
                customerPhone: customer?.phone ?? apt.customerPhone,
                updatedAt: new Date().toISOString(),
              }
            : apt
        )
        .sort((a, b) => a.time.localeCompare(b.time))
    )
    setEditAppointment(null)
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        await fetchAppointments()
        return
      }
    } catch {
      // fallback
    }
    // Mock fallback: update locally
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() }
          : apt
      )
    )
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchAppointments()
        return
      }
    } catch {
      // fallback
    }
    // Mock fallback
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId))
    setTotal((prev) => prev - 1)
  }

  // ─── All appointments for calendar (need all statuses for dots) ──────────

  const allAppointments = useMemo(() => {
    // For calendar view, we need all appointments regardless of filter
    // In a real app this would be a separate fetch; here we use mock fallback
    return getMockAppointments()
  }, [])

  // ─── Stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const todayStr = toDateString(new Date())
    const todayApts = allAppointments.filter((a) => a.date === todayStr)
    return {
      today: todayApts.length,
      scheduled: todayApts.filter((a) => a.status === 'scheduled').length,
      completed: todayApts.filter((a) => a.status === 'completed').length,
    }
  }, [allAppointments])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and schedule customer appointments.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="size-4" />
          New Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <CalendarDays className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today&apos;s Total</p>
              <p className="text-2xl font-bold">{stats.today}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5">
              <Clock className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2.5">
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal gap-2 w-full sm:w-auto',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="size-4" />
                  {selectedDate
                    ? isToday(selectedDate)
                      ? 'Today'
                      : format(selectedDate, 'MMM d, yyyy')
                    : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      setPage(1)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter Tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StatusFilter)
                setPage(1)
              }}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none gap-1.5"
                onClick={() => setViewMode('list')}
              >
                <List className="size-4" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none gap-1.5"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="size-4" />
                <span className="hidden sm:inline">Calendar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {viewMode === 'list' ? (
        /* ─── List View ────────────────────────────────────────────────────── */
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton />
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <CalendarDays className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No appointments found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {statusFilter !== 'all'
                    ? `No ${statusFilter} appointments for ${isToday(selectedDate) ? 'today' : format(selectedDate, 'MMM d, yyyy')}. Try a different filter or date.`
                    : `No appointments scheduled for ${isToday(selectedDate) ? 'today' : format(selectedDate, 'MMM d, yyyy')}. Create a new appointment to get started.`}
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  Schedule Appointment
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">Date &amp; Time</TableHead>
                        <TableHead className="min-w-[140px]">Customer</TableHead>
                        <TableHead className="min-w-[120px]">Purpose</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[180px] hidden md:table-cell">Notes</TableHead>
                        <TableHead className="w-[60px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((apt) => (
                        <TableRow key={apt.id}>
                          {/* Date & Time */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="rounded-md bg-muted p-1.5">
                                <Clock className="size-3.5 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {formatDate(apt.date)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(apt.time)}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{apt.customerName}</span>
                              {apt.customerPhone && (
                                <span className="text-xs text-muted-foreground">
                                  {apt.customerPhone}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Purpose */}
                          <TableCell>
                            <span className="text-sm">{PURPOSE_LABELS[apt.purpose]}</span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <StatusBadge status={apt.status} />
                          </TableCell>

                          {/* Notes */}
                          <TableCell className="hidden md:table-cell">
                            {apt.notes ? (
                              <p className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
                                {apt.notes}
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {apt.status === 'scheduled' && (
                                  <>
                                    <DropdownMenuItem
                                      className="gap-2 text-green-600 dark:text-green-400 focus:text-green-600 dark:focus:text-green-400"
                                      onClick={() => handleUpdateStatus(apt.id, 'completed')}
                                    >
                                      <CheckCircle2 className="size-4" />
                                      Mark Complete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                      onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                    >
                                      <XCircle className="size-4" />
                                      Cancel
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {apt.status === 'cancelled' && (
                                  <>
                                    <DropdownMenuItem
                                      className="gap-2"
                                      onClick={() => handleUpdateStatus(apt.id, 'scheduled')}
                                    >
                                      <Clock className="size-4" />
                                      Reschedule
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => setEditAppointment(apt)}
                                >
                                  <Pencil className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteAppointment(apt.id)}
                                >
                                  <XCircle className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
                  <span>
                    Showing {appointments.length} of {total} appointment{total !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="px-2">
                      Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * pageSize >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ─── Calendar View ────────────────────────────────────────────────── */
        <CalendarView
          appointments={allAppointments}
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date)
            setPage(1)
          }}
        />
      )}

      {/* Create Appointment Dialog */}
      <AppointmentFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        customers={customers}
        onSubmit={handleCreateAppointment}
      />

      {/* Edit Appointment Dialog */}
      <AppointmentFormDialog
        open={!!editAppointment}
        onOpenChange={(open) => {
          if (!open) setEditAppointment(null)
        }}
        appointment={editAppointment}
        customers={customers}
        onSubmit={handleEditAppointment}
      />
    </div>
  )
}