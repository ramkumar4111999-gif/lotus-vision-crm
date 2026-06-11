'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Megaphone,
  Plus,
  Send,
  Clock,
  Trash2,
  AlertTriangle,
  PackageCheck,
  Cake,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Eye,
  Gift,
  IndianRupee,
  Pencil,
  Users,
  BarChart3,
  Printer,
  Globe,
  TrendingUp,
  Sparkles,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Campaign {
  id: string
  name: string
  type: string
  message: string
  status: string
  budget: number
  reach: number
  targetGroup: string | null
  scheduledAt: string | null
  sentCount: number
  createdAt: string
  updatedAt: string
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

interface HighValueCustomer {
  id: string
  name: string
  phone: string
  totalSpent: number
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const AVERAGE_ORDER_VALUE = 2500

const whatsAppTemplates = [
  {
    label: 'Promotional Offer',
    emoji: '🎯',
    message: '🎯 {customer_name}! Get {offer}% off on {product_category} at Lotus Vision Opticals! Limited time offer!',
  },
  {
    label: 'Collection Ready',
    emoji: '✅',
    message: '✅ Dear {customer_name}, your eyewear from Lotus Vision Opticals is READY! Visit us to collect.',
  },
  {
    label: 'Payment Reminder',
    emoji: '💰',
    message: '💰 Dear {customer_name}, your payment of ₹{amount} is due at Lotus Vision Opticals. Please clear it at the earliest.',
  },
  {
    label: 'New Arrival',
    emoji: '👋',
    message: '👋 Welcome to Lotus Vision Opticals, {customer_name}! We\'re glad you visited us.',
  },
]

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  Planned: { label: 'Planned', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' },
  Active: { label: 'Active', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' },
  Completed: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' },
  Cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800' },
  Sent: { label: 'Sent', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' },
  Scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' },
  Failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800' },
  Draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700' },
}

const typeConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  SMS: { label: 'SMS', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: MessageSquare },
  WhatsApp: { label: 'WhatsApp', className: 'bg-green-100 text-green-700 border-green-200', icon: Phone },
  Print: { label: 'Print', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: Printer },
  Online: { label: 'Online', className: 'bg-purple-100 text-purple-700 border-purple-200', icon: Globe },
}

const typePlaceholders: Record<string, string> = {
  SMS: 'Enter your SMS message here. Keep it under 160 characters for a single SMS.',
  WhatsApp: 'Enter your WhatsApp message here. You can use emojis and longer text for WhatsApp messages.',
  Print: 'Enter content for your print campaign (flyers, posters, banners, newspaper ads).',
  Online: 'Enter content for your online campaign (social media, email, Google Ads).',
}

const targetGroups = [
  { value: 'All', label: 'All Customers' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Wholesale', label: 'Wholesale' },
  { value: 'New', label: 'New' },
  { value: 'High Value', label: 'High Value' },
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
  const [highValueCustomers, setHighValueCustomers] = useState<HighValueCustomer[]>([])

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<Campaign[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')

  // Form state - Create
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('SMS')
  const [formTargetGroup, setFormTargetGroup] = useState('All')
  const [formMessage, setFormMessage] = useState('')
  const [formScheduleOption, setFormScheduleOption] = useState('now')
  const [formScheduleDate, setFormScheduleDate] = useState('')
  const [formBudget, setFormBudget] = useState('')
  const [formReach, setFormReach] = useState('')
  const [formStatus, setFormStatus] = useState('Planned')

  // Form state - Edit
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('SMS')
  const [editTargetGroup, setEditTargetGroup] = useState('All')
  const [editMessage, setEditMessage] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editReach, setEditReach] = useState('')
  const [editStatus, setEditStatus] = useState('Planned')

  // ─────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const json = await res.json()
        const data = json.data ?? json.campaigns ?? []
        setCampaigns(data)
        setAnalyticsData(data)
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
        setBirthdays(Array.isArray(data) ? data : [])
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
        setDues(Array.isArray(data) ? data : data.dues ?? [])
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
        const orders = data.labOrders || data.data || data || []
        setLabReady(
          (Array.isArray(orders) ? orders : []).map((o: Record<string, unknown>) => ({
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

  const fetchHighValueCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?segment=high_value')
      if (res.ok) {
        const data = await res.json()
        const customers = Array.isArray(data) ? data : data.data ?? data.customers ?? []
        setHighValueCustomers(customers)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchCampaigns(), fetchBirthdays(), fetchDues(), fetchLabReady(), fetchHighValueCustomers()])
      setLoading(false)
    }
    load()
  }, [fetchCampaigns, fetchBirthdays, fetchDues, fetchLabReady, fetchHighValueCustomers])

  // ─────────────────────────────────────────────────────────
  // Summary stats (with ROI tracking)
  // ─────────────────────────────────────────────────────────
  const totalSentCount = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0)
  const totalRevenue = totalSentCount * AVERAGE_ORDER_VALUE
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const roi = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0

  const summaryStats = {
    total: campaigns.length,
    planned: campaigns.filter((c) => c.status === 'Planned' || c.status === 'Draft' || c.status === 'Scheduled').length,
    active: campaigns.filter((c) => c.status === 'Active' || c.status === 'Sent').length,
    completed: campaigns.filter((c) => c.status === 'Completed').length,
    totalBudget,
    totalReach: campaigns.reduce((s, c) => s + (c.reach || 0), 0),
  }

  // ─────────────────────────────────────────────────────────
  // Form handlers - Create
  // ─────────────────────────────────────────────────────────
  const resetCreateForm = () => {
    setFormName('')
    setFormType('SMS')
    setFormTargetGroup('All')
    setFormMessage('')
    setFormScheduleOption('now')
    setFormScheduleDate('')
    setFormBudget('')
    setFormReach('')
    setFormStatus('Planned')
  }

  const handleTypeChange = (newType: string) => {
    setFormType(newType)
    setFormMessage(typePlaceholders[newType] || '')
  }

  const handleCreateSubmit = async () => {
    if (!formName.trim() || !formMessage.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name: formName.trim(),
        type: formType,
        message: formMessage.trim(),
        targetGroup: formTargetGroup,
        status: formStatus,
        budget: formBudget ? Number(formBudget) : 0,
        reach: formReach ? Number(formReach) : 0,
        scheduledAt: formScheduleOption === 'later' && formScheduleDate ? formScheduleDate : null,
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchCampaigns()
        setCreateDialogOpen(false)
        resetCreateForm()
        toast.success('Campaign created successfully')
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }))
        toast.error(err.error || 'Failed to create campaign')
      }
    } catch {
      toast.error('Network error while creating campaign')
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  // Form handlers - Edit
  // ─────────────────────────────────────────────────────────
  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setEditName(campaign.name)
    setEditType(campaign.type)
    setEditTargetGroup(campaign.targetGroup || 'All')
    setEditMessage(campaign.message)
    setEditBudget(String(campaign.budget || ''))
    setEditReach(String(campaign.reach || ''))
    setEditStatus(campaign.status)
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingCampaign || !editName.trim() || !editMessage.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name: editName.trim(),
        type: editType,
        message: editMessage.trim(),
        targetGroup: editTargetGroup,
        status: editStatus,
        budget: editBudget ? Number(editBudget) : 0,
        reach: editReach ? Number(editReach) : 0,
      }

      const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchCampaigns()
        setEditDialogOpen(false)
        setEditingCampaign(null)
        toast.success('Campaign updated')
      } else {
        toast.error('Failed to update campaign')
      }
    } catch {
      toast.error('Network error while updating campaign')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchCampaigns()
        toast.success('Campaign deleted')
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch {
      toast.error('Network error while deleting campaign')
    }
  }

  // ─────────────────────────────────────────────────────────
  // Preview renderer
  // ─────────────────────────────────────────────────────────
  const renderPreview = (msg: string, type: string) => {
    if (!msg.trim()) {
      return (
        <p className="text-muted-foreground text-sm italic">Your message preview will appear here…</p>
      )
    }
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          {typeConfig[type]?.icon && (() => {
            const Icon = typeConfig[type]!.icon
            return <Icon className="size-4" />
          })()}
          <span className="text-xs font-medium text-muted-foreground">
            {typeConfig[type]?.label || type} Preview
          </span>
          <Badge variant="outline" className={typeConfig[type]?.className}>{typeConfig[type]?.label}</Badge>
        </div>
        <div className="bg-muted/50 rounded-md p-3 whitespace-pre-wrap text-sm leading-relaxed">
          {msg}
        </div>
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>{msg.length} chars</span>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // SMS character counter (160 limit)
  // ─────────────────────────────────────────────────────────
  const smsCharCount = formMessage.length
  const smsExceedsLimit = smsCharCount > 160

  // ── Derived analytics ──────────────────────────────────────
  const totalCampaigns = analyticsData.length
  const totalSent = analyticsData.reduce((sum, c) => sum + c.sentCount, 0)
  const totalReach = analyticsData.reduce((sum, c) => sum + c.reach, 0)
  const avgROI = totalCampaigns > 0
    ? analyticsData.reduce((sum, c) => {
        const revenue = c.sentCount * AVERAGE_ORDER_VALUE * 0.05
        const roi = c.budget > 0 ? ((revenue - c.budget) / c.budget) * 100 : 0
        return sum + roi
      }, 0) / totalCampaigns
    : 0
  const maxSent = Math.max(...analyticsData.map((c) => c.sentCount), 1)

  // ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="size-8 animate-spin inline-block border-2 border-current border-t-transparent rounded-full text-muted-foreground" />
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
        <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetCreateForm() }}>
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
                Compose a new campaign to reach your customers.
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
                  {Object.entries(typeConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant={formType === key ? 'default' : 'outline'}
                        className="justify-start gap-2"
                        onClick={() => handleTypeChange(key)}
                      >
                        <Icon className="size-4" />
                        {config.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* WhatsApp Template Section */}
              {formType === 'WhatsApp' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="size-4 text-green-600" />
                    WhatsApp Template
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose a pre-built template to quickly get started. Click to pre-fill the message.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {whatsAppTemplates.map((tmpl) => (
                      <Button
                        key={tmpl.label}
                        type="button"
                        variant="outline"
                        className="justify-start gap-2 h-auto py-2.5 px-3 text-left"
                        onClick={() => setFormMessage(tmpl.message)}
                      >
                        <span className="text-base">{tmpl.emoji}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium">{tmpl.label}</span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {tmpl.message.slice(0, 45)}…
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Group</Label>
                  <Select value={formTargetGroup} onValueChange={setFormTargetGroup}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetGroups.map((group) => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                          {group.value === 'High Value' && (
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              ({highValueCustomers.length} customers)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget & Reach */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-budget">Budget (₹)</Label>
                  <Input
                    id="campaign-budget"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="5000"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-reach">Expected Reach</Label>
                  <Input
                    id="campaign-reach"
                    type="number"
                    min="0"
                    placeholder="500"
                    value={formReach}
                    onChange={(e) => setFormReach(e.target.value)}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="campaign-message">Message / Content</Label>
                <Textarea
                  id="campaign-message"
                  placeholder={typePlaceholders[formType]}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={5}
                  className={`resize-none ${formType === 'SMS' && smsExceedsLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {/* SMS character counter with 160 limit */}
                {formType === 'SMS' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${smsExceedsLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
                        SMS Tracker
                      </span>
                      <span className={`text-xs font-mono font-medium ${smsExceedsLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {smsCharCount}/160 chars
                      </span>
                    </div>
                    {/* Visual progress bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          smsExceedsLimit ? 'bg-red-500' : smsCharCount > 130 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((smsCharCount / 160) * 100, 100)}%` }}
                      />
                    </div>
                    {smsExceedsLimit && (
                      <p className="text-xs text-red-600 font-medium">
                        SMS has {smsCharCount}/160 characters — exceeds limit!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {formMessage.length}/500 characters
                  </p>
                )}
              </div>

              {/* Schedule (for digital campaigns) */}
              {(formType === 'SMS' || formType === 'WhatsApp' || formType === 'Online') && (
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
              )}

              {/* Preview */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="size-4" />
                  Preview
                </Label>
                {renderPreview(formMessage, formType)}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetCreateForm() }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={!formName.trim() || !formMessage.trim() || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <span className="size-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Send className="size-4" />
                )}
                {submitting ? 'Creating…' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5">
              <Megaphone className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{summaryStats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2.5">
              <Clock className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Planned</p>
              <p className="text-2xl font-bold">{summaryStats.planned}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5">
              <IndianRupee className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalBudget)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5">
              <Users className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-bold">{summaryStats.totalReach.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        {/* Active/Sent Card — Blue background */}
        <Card className="p-4 bg-blue-600 text-white dark:bg-blue-700">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/50 dark:bg-blue-600/50 p-2.5">
              <Send className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-100">Active / Sent</p>
              <p className="text-2xl font-bold">{summaryStats.active}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ROI & Revenue Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2.5">
              <TrendingUp className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Campaign ROI</p>
              <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(totalRevenue)} − {formatCurrency(totalBudget)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5">
              <IndianRupee className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue from Campaigns</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalSentCount.toLocaleString()} sent × ₹{AVERAGE_ORDER_VALUE.toLocaleString()} avg order value
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2.5">
              <BarChart3 className="size-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Value Segment</p>
              <p className="text-2xl font-bold">{highValueCustomers.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customers available for targeted campaigns
              </p>
            </div>
          </div>
        </Card>
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
              <p className="text-sm text-muted-foreground text-center py-4">No birthdays this week</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {birthdays.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-full bg-amber-100 shrink-0">
                        <Cake className="size-3.5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.phone}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDate(b.dob)}</span>
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
                  resetCreateForm()
                  setFormType('WhatsApp')
                  setFormTargetGroup('All')
                  setFormMessage('🎉 Happy Birthday, {customer_name}! 🎂\n\nWishing you a wonderful day filled with joy! Visit us at Lotus Vision Opticals for special birthday discounts on eyewear.\n\n- Lotus Vision Opticals')
                  setCreateDialogOpen(true)
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
              <p className="text-sm text-muted-foreground text-center py-4">No pending dues</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dues.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
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
                  resetCreateForm()
                  setFormType('SMS')
                  setFormTargetGroup('All')
                  setFormName('Due Payment Reminder')
                  setFormMessage('Dear {customer_name},\n\nThis is a reminder that you have a pending dues at Lotus Vision Opticals.\n\nKindly clear the dues at your earliest convenience.\n\nThank you!\n- Lotus Vision Opticals')
                  setCreateDialogOpen(true)
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
              <p className="text-sm text-muted-foreground text-center py-4">No orders ready for collection</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {labReady.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-full bg-emerald-100 shrink-0">
                        <PackageCheck className="size-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{order.customerName || 'Walk-in Customer'}</p>
                        <p className="text-xs text-muted-foreground">{order.lensType}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDate(order.createdAt)}</span>
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
                  resetCreateForm()
                  setFormType('WhatsApp')
                  setFormTargetGroup('All')
                  setFormName('Collection Ready Notification')
                  setFormMessage('Dear {customer_name},\n\n✅ Your eyewear order is READY for collection!\n\nPlease visit us at Lotus Vision Opticals at your earliest convenience.\n\nThank you for choosing us!\n- Lotus Vision Opticals')
                  setCreateDialogOpen(true)
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
            All
          </TabsTrigger>
          <TabsTrigger value="planned" className="gap-2">
            <Clock className="size-4" />
            Planned
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle2 className="size-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <BarChart3 className="size-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <XCircle className="size-4" />
            Cancelled
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="size-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignTable
            campaigns={campaigns}
            onEdit={openEditDialog}
            onDelete={handleDeleteCampaign}
            emptyMessage="No campaigns yet. Create your first campaign!"
          />
        </TabsContent>
        <TabsContent value="planned">
          <CampaignTable
            campaigns={campaigns.filter((c) => c.status === 'Planned' || c.status === 'Draft' || c.status === 'Scheduled')}
            onEdit={openEditDialog}
            onDelete={handleDeleteCampaign}
            emptyMessage="No planned campaigns."
          />
        </TabsContent>
        <TabsContent value="active">
          <CampaignTable
            campaigns={campaigns.filter((c) => c.status === 'Active' || c.status === 'Sent')}
            onEdit={openEditDialog}
            onDelete={handleDeleteCampaign}
            emptyMessage="No active campaigns."
          />
        </TabsContent>
        <TabsContent value="completed">
          <CampaignTable
            campaigns={campaigns.filter((c) => c.status === 'Completed')}
            onEdit={openEditDialog}
            onDelete={handleDeleteCampaign}
            emptyMessage="No completed campaigns."
          />
        </TabsContent>
        <TabsContent value="cancelled">
          <CampaignTable
            campaigns={campaigns.filter((c) => c.status === 'Cancelled' || c.status === 'Failed')}
            onEdit={openEditDialog}
            onDelete={handleDeleteCampaign}
            emptyMessage="No cancelled campaigns."
          />
        </TabsContent>
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* ── Summary Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalCampaigns}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Sent</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Reach</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalReach.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg ROI</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{avgROI.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Performance Table ──────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sent Count</TableHead>
                      <TableHead>Reach</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No campaign data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      analyticsData.map((campaign) => {
                        const status = statusConfig[campaign.status]
                        return (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.type}</TableCell>
                            <TableCell>{campaign.sentCount.toLocaleString()}</TableCell>
                            <TableCell>{campaign.reach.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={status?.className ?? ''}>
                                {status?.label ?? campaign.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ── Bar Visualization ──────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sent Count per Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data to visualize.</p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData.map((campaign) => (
                      <div key={campaign.id} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-36 truncate shrink-0" title={campaign.name}>
                          {campaign.name}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full flex items-center justify-end px-2 transition-all"
                            style={{ width: `${Math.max((campaign.sentCount / maxSent) * 100, 4)}%` }}
                          >
                            <span className="text-xs font-medium text-primary-foreground">
                              {campaign.sentCount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Edit Campaign Dialog ──────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingCampaign(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update campaign details below.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Campaign Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budget">Budget (₹)</Label>
                <Input id="edit-budget" type="number" min="0" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reach">Expected Reach</Label>
                <Input id="edit-reach" type="number" min="0" value={editReach} onChange={(e) => setEditReach(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">Message / Content</Label>
              <Textarea id="edit-message" value={editMessage} onChange={(e) => setEditMessage(e.target.value)} rows={5} className="resize-none" />
              <p className="text-xs text-muted-foreground">{editMessage.length}/500 characters</p>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              {renderPreview(editMessage, editType)}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingCampaign(null) }}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={!editName.trim() || !editMessage.trim() || submitting}>
              {submitting && <span className="size-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full mr-2" />}
              <Pencil className="size-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Campaign Table Sub-component
// ─────────────────────────────────────────────────────────
interface CampaignTableProps {
  campaigns: Campaign[]
  onEdit: (campaign: Campaign) => void
  onDelete: (id: string) => void
  emptyMessage: string
}

function CampaignTable({ campaigns, onEdit, onDelete, emptyMessage }: CampaignTableProps) {
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
        <div className="overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Name</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="min-w-[160px]">Message</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Budget</TableHead>
                <TableHead className="w-[80px] text-right">Reach</TableHead>
                <TableHead className="w-[100px]">Target</TableHead>
                <TableHead className="w-[100px]">Scheduled</TableHead>
                <TableHead className="w-[80px] text-center">Sent</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{campaign.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeConfig[campaign.type]?.className}>
                      {typeConfig[campaign.type]?.label || campaign.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {truncate(campaign.message, 50)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig[campaign.status]?.className}>
                      {statusConfig[campaign.status]?.label || campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {campaign.budget ? formatCurrency(campaign.budget) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {campaign.reach ? campaign.reach.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {campaign.targetGroup || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatDate(campaign.scheduledAt)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{campaign.sentCount}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-w-[44px] min-h-[44px] touch-manipulation"
                        title="Edit"
                        onClick={() => onEdit(campaign)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-w-[44px] min-h-[44px] touch-manipulation text-destructive hover:text-destructive"
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
        </div>

        {/* Mobile Campaign Cards */}
        <div className="space-y-3 md:hidden pt-4 px-1">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{campaign.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={typeConfig[campaign.type]?.className}>
                      {typeConfig[campaign.type]?.label || campaign.type}
                    </Badge>
                    <Badge variant="outline" className={statusConfig[campaign.status]?.className}>
                      {statusConfig[campaign.status]?.label || campaign.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-w-[44px] min-h-[44px] touch-manipulation"
                    onClick={() => onEdit(campaign)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-w-[44px] min-h-[44px] touch-manipulation text-destructive hover:text-destructive"
                    onClick={() => onDelete(campaign.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{truncate(campaign.message, 80)}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {campaign.budget > 0 && <span>Budget: {formatCurrency(campaign.budget)}</span>}
                {campaign.reach > 0 && <span>Reach: {campaign.reach.toLocaleString()}</span>}
                {campaign.sentCount > 0 && <span>Sent: {campaign.sentCount}</span>}
              </div>
              {campaign.targetGroup && campaign.targetGroup !== 'All' && (
                <Badge variant="secondary" className="text-[10px]">Target: {campaign.targetGroup}</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}