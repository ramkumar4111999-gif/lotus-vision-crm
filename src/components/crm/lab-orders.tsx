'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  ChevronRight,
  Loader2,
  Eye,
  FlaskConical,
  CalendarDays,
  IndianRupee,
  User,
  Package,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ───────────────────────────────────────────────────────────────────

type LabOrderStatus = 'Sent' | 'In Progress' | 'Ready' | 'Delivered'

interface LensPower {
  sph: string
  cyl: string
  axis: string
}

interface CustomerOption {
  id: string
  name: string
  phone: string
}

interface FrameOption {
  id: string
  name: string
  brand: string | null
  price: number
}

interface LabOrder {
  id: string
  customerId: string | null
  customerName: string | null
  customerPhone: string | null
  lensType: string
  leftSPH: number | null
  leftCYL: number | null
  leftAXIS: number | null
  rightSPH: number | null
  rightCYL: number | null
  rightAXIS: number | null
  frameId: string | null
  frameName: string | null
  status: LabOrderStatus
  costPrice: number
  sellingPrice: number
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FLOW: LabOrderStatus[] = ['Sent', 'In Progress', 'Ready', 'Delivered']

const STATUS_BADGE_CLASS: Record<LabOrderStatus, string> = {
  Sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'In Progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Ready: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
  Delivered: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-gray-200 dark:border-gray-800',
}

const LENS_TYPES = [
  'Single Vision',
  'Bifocal',
  'Progressive',
  'Blue-cut',
  'Photochromic',
] as const

function formatPower(sph: number | null, cyl: number | null, axis: number | null): string {
  const parts: string[] = []
  if (sph !== null && sph !== undefined) parts.push(`${sph > 0 ? '+' : ''}${sph}`)
  else parts.push('—')
  if (cyl !== null && cyl !== undefined && cyl !== 0) parts.push(`${cyl > 0 ? '+' : ''}${cyl}`)
  else parts.push('—')
  if (axis !== null && axis !== undefined) parts.push(`×${axis}°`)
  return parts.join(' / ')
}

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function getNextStatus(current: LabOrderStatus): LabOrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current)
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LabOrders() {
  // ── State ──
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form
  const [formLensType, setFormLensType] = useState<string>('Single Vision')
  const [formLeft, setFormLeft] = useState<LensPower>({ sph: '', cyl: '', axis: '' })
  const [formRight, setFormRight] = useState<LensPower>({ sph: '', cyl: '', axis: '' })
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formSellingPrice, setFormSellingPrice] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formFrameId, setFormFrameId] = useState('')

  // Search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([])
  const [customerSearching, setCustomerSearching] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null)

  const [frameSearch, setFrameSearch] = useState('')
  const [frameResults, setFrameResults] = useState<FrameOption[]>([])
  const [frameSearching, setFrameSearching] = useState(false)
  const [selectedFrame, setSelectedFrame] = useState<FrameOption | null>(null)

  const customerSearchRef = useRef<HTMLDivElement>(null)
  const frameSearchRef = useRef<HTMLDivElement>(null)

  // ── Fetch orders ──
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeStatus !== 'all') params.set('status', activeStatus)
      params.set('page', String(page))
      const res = await fetch(`/api/lab-orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch lab orders')
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch (err) {
      toast.error('Failed to load lab orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeStatus, page])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Reset page when tab changes
  useEffect(() => {
    setPage(1)
  }, [activeStatus])

  // ── Customer search ──
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setCustomerResults([])
      return
    }
    setCustomerSearching(true)
    try {
      const res = await fetch(`/api/lab-orders?searchType=customers&q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Failed to search customers')
      const data = await res.json()
      setCustomerResults(data.results ?? [])
    } catch {
      setCustomerResults([])
    } finally {
      setCustomerSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchCustomers(customerSearch), 300)
    return () => clearTimeout(timer)
  }, [customerSearch, searchCustomers])

  // ── Frame search ──
  const searchFrames = useCallback(async (query: string) => {
    if (query.length < 1) {
      setFrameResults([])
      return
    }
    setFrameSearching(true)
    try {
      const res = await fetch(`/api/lab-orders?searchType=frames&q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Failed to search frames')
      const data = await res.json()
      setFrameResults(data.results ?? [])
    } catch {
      setFrameResults([])
    } finally {
      setFrameSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchFrames(frameSearch), 300)
    return () => clearTimeout(timer)
  }, [frameSearch, searchFrames])

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setCustomerResults([])
      }
      if (frameSearchRef.current && !frameSearchRef.current.contains(e.target as Node)) {
        setFrameResults([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Sorted orders (by due date, soonest first, nulls last) ──
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [orders])

  // ── Reset form ──
  const resetForm = useCallback(() => {
    setFormLensType('Single Vision')
    setFormLeft({ sph: '', cyl: '', axis: '' })
    setFormRight({ sph: '', cyl: '', axis: '' })
    setFormCostPrice('')
    setFormSellingPrice('')
    setFormDueDate('')
    setFormNotes('')
    setFormCustomerId('')
    setFormFrameId('')
    setCustomerSearch('')
    setFrameSearch('')
    setSelectedCustomer(null)
    setSelectedFrame(null)
    setCustomerResults([])
    setFrameResults([])
  }, [])

  // ── Submit ──
  const handleSubmit = async () => {
    if (!formCustomerId) {
      toast.error('Please select a customer')
      return
    }
    if (!formCostPrice || Number(formCostPrice) < 0) {
      toast.error('Please enter a valid cost price')
      return
    }
    if (!formSellingPrice || Number(formSellingPrice) < 0) {
      toast.error('Please enter a valid selling price')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customerId: formCustomerId,
        lensType: formLensType,
        leftSPH: formLeft.sph ? parseFloat(formLeft.sph) : null,
        leftCYL: formLeft.cyl ? parseFloat(formLeft.cyl) : null,
        leftAXIS: formLeft.axis ? parseFloat(formLeft.axis) : null,
        rightSPH: formRight.sph ? parseFloat(formRight.sph) : null,
        rightCYL: formRight.cyl ? parseFloat(formRight.cyl) : null,
        rightAXIS: formRight.axis ? parseFloat(formRight.axis) : null,
        frameId: formFrameId || null,
        costPrice: parseFloat(formCostPrice),
        sellingPrice: parseFloat(formSellingPrice),
        dueDate: formDueDate || null,
        notes: formNotes || null,
      }

      const res = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create lab order')
      }

      toast.success('Lab order created successfully')
      setDialogOpen(false)
      resetForm()
      fetchOrders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lab order')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Update status ──
  const handleUpdateStatus = async (order: LabOrder) => {
    const next = getNextStatus(order.status)
    if (!next) return

    setUpdatingId(order.id)
    try {
      const res = await fetch(`/api/lab-orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error('Failed to update status')

      if (next === 'Delivered') {
        toast.success(`Order ${order.id.slice(-6).toUpperCase()} has been delivered!`)
      } else {
        toast.success(`Status updated to "${next}"`)
      }
      fetchOrders()
    } catch {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Tab counts ──
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1
    }
    return counts
  }, [orders])

  // ── Render power input group ──
  const renderPowerInputs = (
    label: string,
    power: LensPower,
    onChange: (p: LensPower) => void
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">SPH</Label>
          <Input
            type="number"
            step="0.25"
            placeholder="0.00"
            value={power.sph}
            onChange={(e) => onChange({ ...power, sph: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">CYL</Label>
          <Input
            type="number"
            step="0.25"
            placeholder="0.00"
            value={power.cyl}
            onChange={(e) => onChange({ ...power, cyl: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">AXIS</Label>
          <Input
            type="number"
            step="1"
            min="0"
            max="180"
            placeholder="0"
            value={power.axis}
            onChange={(e) => onChange({ ...power, axis: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  )

  // ── Tab config ──
  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'Sent', label: 'Sent' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Ready', label: 'Ready' },
    { value: 'Delivered', label: 'Delivered' },
  ] as const

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lab Orders</h1>
            <p className="text-sm text-muted-foreground">
              Manage lens orders and track delivery status
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (open) resetForm()
          setDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Lab Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Lab Order</DialogTitle>
              <DialogDescription>
                Enter the lens prescription details and submit to the lab.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-2">
              {/* Customer Selection */}
              <div className="space-y-2" ref={customerSearchRef}>
                <Label className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  Customer <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : customerSearch}
                    onChange={(e) => {
                      if (selectedCustomer) {
                        setSelectedCustomer(null)
                        setFormCustomerId('')
                      }
                      setCustomerSearch(e.target.value)
                    }}
                    className="pl-9"
                  />
                  {customerSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                  {customerResults.length > 0 && !selectedCustomer && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          onClick={() => {
                            setSelectedCustomer(c)
                            setFormCustomerId(c.id)
                            setCustomerSearch('')
                            setCustomerResults([])
                          }}
                        >
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lens Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Lens Type <span className="text-destructive">*</span>
                </Label>
                <Select value={formLensType} onValueChange={setFormLensType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select lens type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LENS_TYPES.map((lt) => (
                      <SelectItem key={lt} value={lt}>
                        {lt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Eye Power */}
              <div className="grid gap-4 sm:grid-cols-2">
                {renderPowerInputs('Left Eye (OD)', formLeft, setFormLeft)}
                {renderPowerInputs('Right Eye (OS)', formRight, setFormRight)}
              </div>

              {/* Frame Selection (optional) */}
              <div className="space-y-2" ref={frameSearchRef}>
                <Label className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" />
                  Frame <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search frames by name or brand..."
                    value={selectedFrame ? `${selectedFrame.name}${selectedFrame.brand ? ` (${selectedFrame.brand})` : ''}` : frameSearch}
                    onChange={(e) => {
                      if (selectedFrame) {
                        setSelectedFrame(null)
                        setFormFrameId('')
                      }
                      setFrameSearch(e.target.value)
                    }}
                    className="pl-9"
                  />
                  {frameSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                  {frameResults.length > 0 && !selectedFrame && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                      {frameResults.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          onClick={() => {
                            setSelectedFrame(f)
                            setFormFrameId(f.id)
                            setFrameSearch('')
                            setFrameResults([])
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate font-medium">{f.name}</span>
                            {f.brand && (
                              <span className="text-muted-foreground shrink-0">{f.brand}</span>
                            )}
                          </div>
                          <span className="text-muted-foreground shrink-0">{formatCurrency(f.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Cost Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Selling Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes or special instructions..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Status Tabs ── */}
      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList className="flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {statusCounts[tab.value] ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="mt-4 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Lens Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Left Power</TableHead>
                    <TableHead className="hidden lg:table-cell">Right Power</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Cost</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Selling</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Margin</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Loading lab orders...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sortedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FlaskConical className="h-10 w-10 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No lab orders found</p>
                          <p className="text-xs text-muted-foreground/70">
                            Create a new lab order to get started
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedOrders.map((order) => {
                      const margin = order.sellingPrice - order.costPrice
                      const next = getNextStatus(order.status)
                      const isOverdue =
                        order.dueDate &&
                        new Date(order.dueDate) < new Date() &&
                        order.status !== 'Delivered'

                      return (
                        <TableRow key={order.id} className="group">
                          {/* Order ID */}
                          <TableCell className="font-mono text-xs font-medium">
                            #{order.id.slice(-6).toUpperCase()}
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {order.customerName || '—'}
                              </div>
                              {order.customerPhone && (
                                <div className="text-xs text-muted-foreground">
                                  {order.customerPhone}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Lens Type */}
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="font-normal text-xs">
                              {order.lensType}
                            </Badge>
                          </TableCell>

                          {/* Left Power */}
                          <TableCell className="hidden lg:table-cell font-mono text-xs">
                            {formatPower(order.leftSPH, order.leftCYL, order.leftAXIS)}
                          </TableCell>

                          {/* Right Power */}
                          <TableCell className="hidden lg:table-cell font-mono text-xs">
                            {formatPower(order.rightSPH, order.rightCYL, order.rightAXIS)}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs font-medium',
                                STATUS_BADGE_CLASS[order.status]
                              )}
                            >
                              {order.status}
                            </Badge>
                          </TableCell>

                          {/* Cost Price */}
                          <TableCell className="hidden sm:table-cell text-right text-sm">
                            {formatCurrency(order.costPrice)}
                          </TableCell>

                          {/* Selling Price */}
                          <TableCell className="hidden sm:table-cell text-right text-sm font-medium">
                            {formatCurrency(order.sellingPrice)}
                          </TableCell>

                          {/* Margin */}
                          <TableCell
                            className={cn(
                              'hidden md:table-cell text-right text-sm font-medium',
                              margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {margin >= 0 ? '+' : ''}{formatCurrency(margin)}
                          </TableCell>

                          {/* Due Date */}
                          <TableCell className="hidden md:table-cell">
                            {order.dueDate ? (
                              <span
                                className={cn(
                                  'text-sm',
                                  isOverdue && 'text-red-600 dark:text-red-400 font-medium'
                                )}
                              >
                                {format(new Date(order.dueDate), 'dd MMM yyyy')}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setDetailOpen(true)
                                }}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {next && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 text-xs"
                                  disabled={updatingId === order.id}
                                  onClick={() => handleUpdateStatus(order)}
                                >
                                  {updatingId === order.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      {next}
                                      <ChevronRight className="h-3 w-3" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Order #{selectedOrder?.id.slice(-6).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Lab order details and prescription information
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Status & Dates */}
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant="outline"
                  className={cn('text-sm font-medium', STATUS_BADGE_CLASS[selectedOrder.status])}
                >
                  {selectedOrder.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>

              {/* Customer */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Customer</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{selectedOrder.customerName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">{selectedOrder.customerPhone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Prescription */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Prescription</h4>
                  <Badge variant="outline">{selectedOrder.lensType}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Left Eye (OD)
                    </p>
                    <p className="font-mono text-sm">
                      {formatPower(selectedOrder.leftSPH, selectedOrder.leftCYL, selectedOrder.leftAXIS)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Right Eye (OS)
                    </p>
                    <p className="font-mono text-sm">
                      {formatPower(selectedOrder.rightSPH, selectedOrder.rightCYL, selectedOrder.rightAXIS)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Pricing</h4>
                <div className="grid grid-cols-3 gap-2 text-sm text-center">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Cost Price</p>
                    <p className="font-semibold">{formatCurrency(selectedOrder.costPrice)}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Selling Price</p>
                    <p className="font-semibold">{formatCurrency(selectedOrder.sellingPrice)}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Margin</p>
                    <p
                      className={cn(
                        'font-semibold',
                        selectedOrder.sellingPrice - selectedOrder.costPrice >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {selectedOrder.sellingPrice - selectedOrder.costPrice >= 0 ? '+' : ''}
                      {formatCurrency(selectedOrder.sellingPrice - selectedOrder.costPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedOrder.frameName && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Frame</p>
                    <p className="font-medium">{selectedOrder.frameName}</p>
                  </div>
                )}
                {selectedOrder.dueDate && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p
                      className={cn(
                        'font-medium',
                        new Date(selectedOrder.dueDate) < new Date() &&
                          selectedOrder.status !== 'Delivered' &&
                          'text-red-600 dark:text-red-400'
                      )}
                    >
                      {format(new Date(selectedOrder.dueDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Actions */}
              {getNextStatus(selectedOrder.status) && (
                <Button
                  className="w-full gap-2"
                  disabled={updatingId === selectedOrder.id}
                  onClick={() => {
                    handleUpdateStatus(selectedOrder)
                  }}
                >
                  {updatingId === selectedOrder.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      Mark as {getNextStatus(selectedOrder.status)}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}