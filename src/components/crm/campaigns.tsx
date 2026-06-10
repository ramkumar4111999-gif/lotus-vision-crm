'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Megaphone,
  Plus,
  Send,
  Clock,
  FileEdit,
  Trash2,
  AlertTriangle,
  PackageCheck,
  Cake,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Gift,
  IndianRupee,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Campaign {
  id: string
  name: string
  type: string
  message: string
  status: string
  scheduledAt: string | null
  sentCount: number
  createdAt: string
}

interface BirthdayCustomer {
  id: string
  name: string
  phone: string
  dob: string
}

interface DueRecord {
  id: string
  customerId: string
  customerName: string
  amount: number
  paid: number
  status: string
  dueDate: string | null
}

interface LabOrderReady {
  id: string
  customerId: string | null
  customerName: string | null
  lensType: string
  dueDate: string | null
  createdAt: string
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  Draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  Scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  Sent: { label: 'Sent', className: 'bg-green-100 text-green-700 border-green-200' },
  Failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
}

const typeConfig: Record<string, { label: string; className: string }> = {
  SMS: { label: 'SMS', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  WhatsApp: { label: 'WhatsApp', className: 'bg-green-100 text-green-700 border-green-200' },
  'Birthday Greeting': { label: 'Birthday', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Promotional Offer': { label: 'Offer', className: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const typePlaceholders: Record<string, string> = {
  SMS: 'Enter your SMS message here. Keep it under 160 characters for a single SMS.',
  WhatsApp: 'Enter your WhatsApp message here. You can use emojis and longer text for WhatsApp messages.',
  'Birthday Greeting':
    '🎉 Happy Birthday, {customer_name}! 🎂\n\nWishing you a wonderful day filled with joy! Visit us for special birthday discounts on eyewear.\n\n- Vision Opticals',
  'Promotional Offer':
    '✨ SPECIAL OFFER! ✨\n\nGet {offer_details} at Vision Opticals!\n\nHurry, offer valid until {end_date}.\n\nVisit us today!\n- Vision Opticals',
}

const targetGroups = [
  { value: 'All', label: 'All Customers' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Wholesale', label: 'Wholesale' },
  { value: 'New', label: 'New' },
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function Campaigns() {
  // Data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [birthdays, setBirthdays] = useState<BirthdayCustomer[]>([])
  const [dues, setDues] = useState<DueRecord[]>([])
  const [labReady, setLabReady] = useState<LabOrderReady[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')

  // Form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('SMS')
  const [formTargetGroup, setFormTargetGroup] = useState('All')
  const [formMessage, setFormMessage] = useState('')
  const [formScheduleOption, setFormScheduleOption] = useState('now')
  const [formScheduleDate, setFormScheduleDate] = useState('')

  // ─────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  const fetchBirthdays = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?filter=birthday_this_week')
      if (res.ok) {
        const data = await res.json()
        setBirthdays(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  const fetchDues = useCallback(async () => {
    try {
      const res = await fetch('/api/dues')
      if (res.ok) {
        const data = await res.json()
        setDues(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  const fetchLabReady = useCallback(async () => {
    try {
      const res = await fetch('/api/lab-orders?status=Ready')
      if (res.ok) {
        const data = await res.json()
        const orders = data.labOrders || data || []
        setLabReady(
          orders.map((o: Record<string, unknown>) => ({
            id: o.id as string,
            customerId: (o.customerId as string) ?? null,
            customerName: (o.customer as Record<string, string> | null)?.name ?? null,
            lensType: o.lensType as string,
            dueDate: (o.dueDate as string | null) ?? null,
            createdAt: o.createdAt as string,
          }))
        )
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchCampaigns(), fetchBirthdays(), fetchDues(), fetchLabReady()])
      setLoading(false)
    }
    load()
  }, [fetchCampaigns, fetchBirthdays, fetchDues, fetchLabReady])

  // ─────────────────────────────────────────────────────────
  // Form handlers
  // ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormName('')
    setFormType('SMS')
    setFormTargetGroup('All')
    setFormMessage('')
    setFormScheduleOption('now')
    setFormScheduleDate('')
  }

  const handleTypeChange = (newType: string) => {
    setFormType(newType)
    setFormMessage(typePlaceholders[newType] || '')
  }

  const handleSubmit = async () => {
    if (!formName.trim() || !formMessage.trim()) return

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim(),
        type: formType,
        message: formMessage.trim(),
        targetGroup: formTargetGroup,
        status: formScheduleOption === 'now' ? 'Sent' : 'Scheduled',
        scheduledAt: formScheduleOption === 'later' && formScheduleDate ? formScheduleDate : null,
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchCampaigns()
        setDialogOpen(false)
        resetForm()
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchCampaigns()
      }
    } catch {
      // silently fail
    }
  }

  // ─────────────────────────────────────────────────────────
  // Preview renderer
  // ─────────────────────────────────────────────────────────
  const renderPreview = () => {
    if (!formMessage.trim()) {
      return (
        <p className="text-muted-foreground text-sm italic">
          Your message preview will appear here…
        </p>
      )
    }
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          {formType === 'SMS' && <MessageSquare className="size-4 text-blue-500" />}
          {formType === 'WhatsApp' && <Phone className="size-4 text-green-500" />}
          {(formType === 'Birthday Greeting' || formType === 'Promotional Offer') && (
            <Gift className="size-4 text-purple-500" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {typeConfig[formType]?.label || formType} Preview
          </span>
          <Badge className={typeConfig[formType]?.className}>{typeConfig[formType]?.label}</Badge>
        </div>
        <div className="bg-muted/50 rounded-md p-3 whitespace-pre-wrap text-sm leading-relaxed">
          {formMessage}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t mt-2">
          <span>Target: {targetGroups.find((g) => g.value === formTargetGroup)?.label}</span>
          <span>{formMessage.length} chars</span>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="size-6 text-primary" />
            Communication & Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage campaigns, greetings, and customer communications
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>
                Compose a new campaign to reach your customers via SMS, WhatsApp, or birthday greetings.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-2">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Summer Sale 2026"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* Campaign Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={formType === key ? 'default' : 'outline'}
                      className="justify-start gap-2"
                      onClick={() => handleTypeChange(key)}
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Target Group */}
              <div className="space-y-2">
                <Label>Target Group</Label>
                <RadioGroup
                  value={formTargetGroup}
                  onValueChange={setFormTargetGroup}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {targetGroups.map((group) => (
                    <div key={group.value} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors">
                      <RadioGroupItem value={group.value} id={`group-${group.value}`} />
                      <Label htmlFor={`group-${group.value}`} className="cursor-pointer font-normal text-sm">
                        {group.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="campaign-message">Message</Label>
                <Textarea
                  id="campaign-message"
                  placeholder={typePlaceholders[formType]}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formMessage.length}/500 characters
                </p>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label>Schedule</Label>
                <RadioGroup
                  value={formScheduleOption}
                  onValueChange={setFormScheduleOption}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="now" id="schedule-now" />
                    <Label htmlFor="schedule-now" className="cursor-pointer font-normal">
                      Send Now
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="later" id="schedule-later" />
                    <Label htmlFor="schedule-later" className="cursor-pointer font-normal">
                      Schedule for Later
                    </Label>
                  </div>
                </RadioGroup>
                {formScheduleOption === 'later' && (
                  <Input
                    type="datetime-local"
                    value={formScheduleDate}
                    onChange={(e) => setFormScheduleDate(e.target.value)}
                    className="max-w-xs"
                  />
                )}
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="size-4" />
                  Preview
                </Label>
                {renderPreview()}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || !formMessage.trim() || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {submitting ? 'Sending…' : formScheduleOption === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Birthday Greetings Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-amber-100">
                  <Cake className="size-4 text-amber-600" />
                </div>
                Birthday Greetings
              </CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                {birthdays.length} this week
              </Badge>
            </div>
            <CardDescription>Upcoming birthdays this week</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {birthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No birthdays this week
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {birthdays.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-full bg-amber-100 shrink-0">
                        <Cake className="size-3.5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.phone}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatDate(b.dob)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {birthdays.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={() => {
                  setFormType('Birthday Greeting')
                  setFormTargetGroup('All')
                  setFormMessage(typePlaceholders['Birthday Greeting'])
                  setDialogOpen(true)
                }}
              >
                <Gift className="size-3.5" />
                Send Birthday Wishes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Due Reminders Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-orange-100">
                  <AlertTriangle className="size-4 text-orange-600" />
                </div>
                Due Reminders
              </CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                {dues.length} pending
              </Badge>
            </div>
            <CardDescription>Customers with pending dues</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {dues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending dues
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dues.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-full bg-orange-100 shrink-0">
                        <IndianRupee className="size-3.5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {formatCurrency(d.amount - d.paid)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {d.dueDate ? formatDate(d.dueDate) : 'No date'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {dues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={() => {
                  setFormType('SMS')
                  setFormTargetGroup('All')
                  setFormName('Due Payment Reminder')
                  setFormMessage(
                    'Dear {customer_name},\n\nThis is a reminder that you have a pending dues of {amount} at Vision Opticals.\n\nKindly clear the dues at your earliest convenience.\n\nThank you!\n- Vision Opticals'
                  )
                  setDialogOpen(true)
                }}
              >
                <Send className="size-3.5" />
                Send Due Reminders
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Collection Ready Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-100">
                  <PackageCheck className="size-4 text-emerald-600" />
                </div>
                Collection Ready
              </CardTitle>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                {labReady.length} orders
              </Badge>
            </div>
            <CardDescription>Lab orders ready for delivery</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {labReady.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No orders ready for collection
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {labReady.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-full bg-emerald-100 shrink-0">
                        <PackageCheck className="size-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.customerName || 'Walk-in Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.lensType}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {labReady.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={() => {
                  setFormType('WhatsApp')
                  setFormTargetGroup('All')
                  setFormName('Collection Ready Notification')
                  setFormMessage(
                    'Dear {customer_name},\n\n✅ Your eyewear order is READY for collection!\n\nPlease visit us at your earliest convenience to pick up your order.\n\nThank you for choosing Vision Opticals!\n- Vision Opticals'
                  )
                  setDialogOpen(true)
                }}
              >
                <CheckCircle2 className="size-3.5" />
                Notify Customers
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Campaign List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="size-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <CheckCircle2 className="size-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Clock className="size-4" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            <XCircle className="size-4" />
            Failed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignTable
            campaigns={campaigns}
            onDelete={handleDeleteCampaign}
            emptyMessage="No campaigns yet. Create your first campaign!"
          />
        </TabsContent>
        <TabsContent value="sent">
          <CampaignTable
            campaigns={campaigns.filter((c) => c.status === 'Sent')}
            onDelete={handleDeleteCampaign}
            emptyMessage="No sent campaigns yet."
          />
        </TabsContent>
        <TabsContent value="scheduled">
          <CampaignTable
            campaigns={campaigns.filter((c) => c.status === 'Scheduled')}
            onDelete={handleDeleteCampaign}
            emptyMessage="No scheduled campaigns."
          />
        </TabsContent>
        <TabsContent value="failed">
          <CampaignTable
            campaigns={campaigns.filter((c) => c.status === 'Failed')}
            onDelete={handleDeleteCampaign}
            emptyMessage="No failed campaigns."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Campaign Table Sub-component
// ─────────────────────────────────────────────────────────
interface CampaignTableProps {
  campaigns: Campaign[]
  onDelete: (id: string) => void
  emptyMessage: string
}

function CampaignTable({ campaigns, onDelete, emptyMessage }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="flex items-center justify-center size-12 rounded-full bg-muted">
            <Megaphone className="size-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="min-w-[200px]">Message</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px]">Scheduled At</TableHead>
              <TableHead className="w-[80px] text-center">Sent</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="font-medium">{campaign.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={typeConfig[campaign.type]?.className}>
                    {typeConfig[campaign.type]?.label || campaign.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground max-w-[300px] truncate">
                    {truncate(campaign.message, 60)}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig[campaign.status]?.className}>
                    {statusConfig[campaign.status]?.label || campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(campaign.scheduledAt)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">{campaign.sentCount}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {campaign.status === 'Draft' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Edit"
                      >
                        <FileEdit className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {campaign.status === 'Draft' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Send"
                      >
                        <Send className="size-3.5" />
                        <span className="sr-only">Send</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      title="Delete"
                      onClick={() => onDelete(campaign.id)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
