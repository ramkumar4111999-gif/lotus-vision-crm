'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Loader2,
  IndianRupee,
  Upload,
  FileBarChart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string
  sku: string
  name: string
  brand: string | null
  model: string | null
  color: string | null
  size: string | null
  category: string
  price: number
  costPrice: number | null
  stock: number
  minStock: number
  type: string | null
  duration: string | null
  expiryDate: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  // NEW fields returned from API:
  supplier: string | null
  supplierPhone: string | null
  lastRestocked: string | null
  frameWidth: number | null
  bridge: number | null
  temple: number | null
}

interface ProductFormData {
  name: string
  brand: string
  model: string
  color: string
  size: string
  category: string
  price: string
  costPrice: string
  stock: string
  minStock: string
  sku: string
  type: string
  duration: string
  expiryDate: string
  description: string
  supplier: string
  supplierPhone: string
  frameWidth: string
  bridge: string
  temple: string
}

interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  lowStockCount: number
  lowStockItems: Product[]
}

interface LowStockReportItem {
  id: string
  name: string
  category: string
  brand: string | null
  stock: number
  minStock: number
  needed: number
  sku: string
  costPrice: number | null
  reorderCost: number
  supplier: string | null
  supplierPhone: string | null
}

interface LowStockReport {
  total: number
  byCategory: Record<string, number>
  totalReorderValue: number
  items: LowStockReportItem[]
}

interface BulkImportResult {
  created: number
  skipped: number
  errors: string[]
}

type SortField = 'name' | 'price' | 'stock' | 'minStock'
type SortDirection = 'asc' | 'desc'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Frames',
  'Lenses',
  'Sunglasses',
  'Contact Lenses',
  'Accessories',
] as const

const CATEGORY_TABS = ['All', ...CATEGORIES] as const

const LENS_TYPES = [
  'Single Vision',
  'Bifocal',
  'Progressive',
  'Blue-cut',
  'Photochromic',
] as const

const DURATIONS = [
  'Daily',
  'Bi-weekly',
  'Monthly',
  'Quarterly',
  'Yearly',
] as const

const ITEMS_PER_PAGE = 10

const CSV_SAMPLE = `name,category,brand,model,price,stock,min_stock,supplier
Aviator Classic,Frames,Ray-Ban,RB3025,4500,10,5,Ray-Ban India`

const emptyForm: ProductFormData = {
  name: '',
  brand: '',
  model: '',
  color: '',
  size: '',
  category: '',
  price: '',
  costPrice: '',
  stock: '',
  minStock: '',
  sku: '',
  type: '',
  duration: '',
  expiryDate: '',
  description: '',
  supplier: '',
  supplierPhone: '',
  frameWidth: '',
  bridge: '',
  temple: '',
}

function generateSKU(category: string): string {
  const catPrefix = category.substring(0, 3).toUpperCase()
  const suffix = Date.now().toString(36).toUpperCase()
  return `SKO-${catPrefix}-${suffix}`
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return 'Never'
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Inventory() {
  // List state
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('All')
  const [categorySelect, setCategorySelect] = useState('All')
  const [search, setSearch] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [loading, setLoading] = useState(true)

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Alert state
  const [lowStockCount, setLowStockCount] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<Product[]>([])
  const [showAlert, setShowAlert] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // CSV Import dialog state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null)

  // Low-Stock Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportData, setReportData] = useState<LowStockReport | null>(null)

  // ─── Sorted products ─────────────────────────────────────────────────────

  const sortedProducts = useMemo(() => {
    if (!sortField) return products
    const sorted = [...products].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number
      if (sortField === 'name') {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else {
        aVal = a[sortField]
        bVal = b[sortField]
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [products, sortField, sortDirection])

  // ─── Fetch products ──────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      // Use categorySelect if it's not 'All', otherwise fall back to activeTab
      const effectiveCategory = categorySelect !== 'All' ? categorySelect : activeTab
      if (effectiveCategory !== 'All') params.set('category', effectiveCategory)
      if (search.trim()) params.set('search', search.trim())
      params.set('page', String(currentPage))
      params.set('pageSize', String(ITEMS_PER_PAGE))
      if (lowStockFilter) params.set('lowStock', 'true')

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data: ProductsResponse = await res.json()

      setProducts(data.products)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setLowStockCount(data.lowStockCount)
      setLowStockItems(data.lowStockItems)
    } catch {
      setProducts([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [activeTab, categorySelect, search, currentPage, lowStockFilter])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const openCreateDialog = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      brand: product.brand ?? '',
      model: product.model ?? '',
      color: product.color ?? '',
      size: product.size ?? '',
      category: product.category,
      price: String(product.price),
      costPrice: product.costPrice != null ? String(product.costPrice) : '',
      stock: String(product.stock),
      minStock: String(product.minStock),
      sku: product.sku,
      type: product.type ?? '',
      duration: product.duration ?? '',
      expiryDate: product.expiryDate
        ? new Date(product.expiryDate).toISOString().split('T')[0]
        : '',
      description: product.description ?? '',
      supplier: product.supplier ?? '',
      supplierPhone: product.supplierPhone ?? '',
      frameWidth: product.frameWidth != null ? String(product.frameWidth) : '',
      bridge: product.bridge != null ? String(product.bridge) : '',
      temple: product.temple != null ? String(product.temple) : '',
    })
    setDialogOpen(true)
  }

  const updateField = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }
      // Auto-generate SKU when category changes and SKU is empty
      if (field === 'category' && !prev.sku.trim() && value) {
        updated.sku = generateSKU(value)
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!form.name.trim()) return
    if (!form.category) return
    if (!form.price.trim() || isNaN(Number(form.price))) return
    if (!form.stock.trim() || isNaN(Number(form.stock))) return

    const finalSKU = form.sku.trim() || generateSKU(form.category)

    const body = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      color: form.color.trim() || null,
      size: form.size.trim() || null,
      category: form.category,
      price: Number(form.price),
      costPrice: form.costPrice.trim() ? Number(form.costPrice) : null,
      stock: Number(form.stock),
      minStock: form.minStock.trim() ? Number(form.minStock) : 0,
      sku: finalSKU,
      type: ['Lenses'].includes(form.category) && form.type
        ? form.type
        : null,
      duration: ['Contact Lenses'].includes(form.category) && form.duration
        ? form.duration
        : null,
      expiryDate:
        ['Lenses', 'Contact Lenses'].includes(form.category) &&
        form.expiryDate
          ? new Date(form.expiryDate).toISOString()
          : null,
      description: form.description.trim() || null,
      supplier: form.supplier.trim() || null,
      supplierPhone: form.supplierPhone.trim() || null,
      frameWidth: form.category === 'Frames' && form.frameWidth.trim()
        ? Number(form.frameWidth)
        : null,
      bridge: form.category === 'Frames' && form.bridge.trim()
        ? Number(form.bridge)
        : null,
      temple: form.category === 'Frames' && form.temple.trim()
        ? Number(form.temple)
        : null,
    }

    setSubmitting(true)
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to save product')

      setDialogOpen(false)
      setForm(emptyForm)
      setEditingProduct(null)
      fetchProducts()
    } catch {
      // Error handled silently for now
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (product: Product) => {
    setDeletingProduct(product)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete product')
      setDeleteDialogOpen(false)
      setDeletingProduct(null)
      fetchProducts()
    } catch {
      // Error handled silently
    } finally {
      setDeleting(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCategorySelect('All')
    setCurrentPage(1)
  }

  const handleCategorySelectChange = (value: string) => {
    setCategorySelect(value)
    // Sync tab to All when using the dropdown
    if (value !== 'All') {
      setActiveTab('All')
    } else {
      // If selecting All in dropdown, keep current tab behavior
    }
    setCurrentPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleLowStockToggle = () => {
    setLowStockFilter((prev) => !prev)
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // ─── Sort handler ───────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline opacity-40" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 inline" />
    )
  }

  // ─── CSV Import handler ─────────────────────────────────────────────────

  const openCsvDialog = () => {
    setCsvData('')
    setImportResult(null)
    setCsvDialogOpen(true)
  }

  const handleCsvImport = async () => {
    if (!csvData.trim()) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvData.trim() }),
      })
      if (!res.ok) throw new Error('Import failed')
      const data: BulkImportResult = await res.json()
      setImportResult(data)
      if (data.created > 0) {
        fetchProducts()
      }
    } catch {
      setImportResult({ created: 0, skipped: 0, errors: ['Import request failed'] })
    } finally {
      setImporting(false)
    }
  }

  // ─── Low-Stock Report handler ───────────────────────────────────────────

  const openReportDialog = async () => {
    setReportDialogOpen(true)
    setReportLoading(true)
    setReportData(null)
    try {
      const res = await fetch('/api/products/low-stock')
      if (!res.ok) throw new Error('Failed to fetch report')
      const data: LowStockReport = await res.json()
      setReportData(data)
    } catch {
      // handled silently
    } finally {
      setReportLoading(false)
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  const isLowStock = (product: Product) => product.stock < product.minStock

  const getStatusBadge = (product: Product) => {
    if (isLowStock(product)) {
      return (
        <Badge variant="destructive" className="text-xs">
          Low Stock
        </Badge>
      )
    }
    if (product.stock === 0) {
      return (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Out of Stock
        </Badge>
      )
    }
    return (
      <Badge className="bg-emerald-600 text-white border-transparent text-xs">
        In Stock
      </Badge>
    )
  }

  const showTypeField = form.category === 'Lenses'
  const showDurationField = form.category === 'Contact Lenses'
  const showExpiryField = ['Lenses', 'Contact Lenses'].includes(form.category)
  const showFrameSizeFields = form.category === 'Frames'

  // ─── Render: Pagination ─────────────────────────────────────────────────

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }

    return (
      <div className="flex items-center justify-between px-2 py-3">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} products
        </p>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={currentPage === p ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(p)}
                aria-label={`Page ${p}`}
                aria-current={currentPage === p ? 'page' : undefined}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    )
  }

  // ─── Render: Skeleton Loading ───────────────────────────────────────────

  const renderSkeleton = () => (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 animate-pulse"
        >
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="ml-auto h-8 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  )

  // ─── Total visible columns count ────────────────────────────────────────

  const TABLE_COLSPAN = 12

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your products, track stock levels, and monitor inventory alerts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={openReportDialog} className="w-full sm:w-auto">
            <FileBarChart className="mr-2 h-4 w-4" />
            Low Stock Report
          </Button>
          <Button variant="outline" onClick={openCsvDialog} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stock Alert Section */}
      {lowStockCount > 0 && showAlert && (
        <Alert variant="destructive" className="relative border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} below minimum stock level
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <div className="mt-2">
              <p className="text-xs font-medium mb-1.5 uppercase tracking-wider">
                Items needing reorder:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lowStockItems.slice(0, 8).map((item) => (
                  <Badge
                    key={item.id}
                    variant="outline"
                    className="border-amber-400/50 text-amber-800 dark:text-amber-200 text-xs bg-amber-100/50 dark:bg-amber-900/30"
                  >
                    {item.name} ({item.stock}/{item.minStock})
                  </Badge>
                ))}
                {lowStockItems.length > 8 && (
                  <Badge
                    variant="outline"
                    className="border-amber-400/50 text-amber-800 dark:text-amber-200 text-xs bg-amber-100/50 dark:bg-amber-900/30 cursor-pointer"
                    onClick={() => {
                      setLowStockFilter(true)
                      setActiveTab('All')
                      setCategorySelect('All')
                      setCurrentPage(1)
                    }}
                  >
                    +{lowStockItems.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-3 right-3 rounded-sm p-0.5 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Alert>
      )}

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full overflow-x-auto flex-wrap">
                {CATEGORY_TABS.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search & Filters Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or brand..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category filter dropdown */}
                <Select value={categorySelect} onValueChange={handleCategorySelectChange}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={lowStockFilter ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleLowStockToggle}
                  className="gap-1.5"
                >
                  {lowStockFilter ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  Low Stock
                  {lowStockCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-0.5 h-5 min-w-5 flex items-center justify-center px-1.5 text-[10px]"
                    >
                      {lowStockCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">SKU</TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center hover:text-foreground transition-colors font-semibold text-muted-foreground"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Brand</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center hover:text-foreground transition-colors font-semibold text-muted-foreground"
                      onClick={() => handleSort('price')}
                    >
                      Price
                      <SortIcon field="price" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center hover:text-foreground transition-colors font-semibold text-muted-foreground"
                      onClick={() => handleSort('stock')}
                    >
                      Stock
                      <SortIcon field="stock" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-right">
                    <button
                      className="inline-flex items-center hover:text-foreground transition-colors font-semibold text-muted-foreground"
                      onClick={() => handleSort('minStock')}
                    >
                      Min Stock
                      <SortIcon field="minStock" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Supplier</TableHead>
                  <TableHead className="hidden xl:table-cell">Last Restocked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_COLSPAN}>{renderSkeleton()}</TableCell>
                  </TableRow>
                ) : sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_COLSPAN} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-8 w-8 opacity-40" />
                        <p>No products found.</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={openCreateDialog}
                        >
                          Add your first product
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {product.brand || '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1.5">
                          {isLowStock(product) && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                            </span>
                          )}
                          <span
                            className={
                              isLowStock(product)
                                ? 'text-red-600 dark:text-red-400 font-semibold'
                                : 'text-emerald-600 dark:text-emerald-400 font-medium'
                            }
                          >
                            {product.stock}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                        {product.minStock}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {product.supplier || '—'}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground text-xs">
                        {formatDate(product.lastRestocked)}
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(product)}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => confirmDelete(product)}
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {renderPagination()}
        </CardContent>
      </Card>

      {/* ─── Add/Edit Product Dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false)
          setEditingProduct(null)
          setForm(emptyForm)
        } else {
          setDialogOpen(true)
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product details below.'
                : 'Fill in the details to add a new product to inventory.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Row 1: Name, Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder="e.g. Aviator Classic"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-brand">Brand</Label>
                <Input
                  id="product-brand"
                  placeholder="e.g. Ray-Ban"
                  value={form.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Model, Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-model">Model</Label>
                <Input
                  id="product-model"
                  placeholder="e.g. RB3025"
                  value={form.model}
                  onChange={(e) => updateField('model', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-color">Color</Label>
                <Input
                  id="product-color"
                  placeholder="e.g. Gold/Green"
                  value={form.color}
                  onChange={(e) => updateField('color', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Size, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-size">Size</Label>
                <Input
                  id="product-size"
                  placeholder="e.g. 58-14-135"
                  value={form.size}
                  onChange={(e) => updateField('size', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => updateField('category', val)}
                >
                  <SelectTrigger id="product-category" className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Price, Cost Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">
                  <IndianRupee className="h-3.5 w-3.5" />
                  Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-cost-price"><IndianRupee className="h-3.5 w-3.5 mr-1 inline" />Cost Price</Label>
                <Input
                  id="product-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.costPrice}
                  onChange={(e) => updateField('costPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Row 5: Stock, Min Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-stock">
                  Stock <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => updateField('stock', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-min-stock">Min Stock Level</Label>
                <Input
                  id="product-min-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minStock}
                  onChange={(e) => updateField('minStock', e.target.value)}
                />
              </div>
            </div>

            {/* Row: SKU */}
            <div className="space-y-2">
              <Label htmlFor="product-sku">
                SKU <span className="text-destructive">*</span>
                <span className="text-muted-foreground text-xs font-normal ml-2">
                  Auto-generated if left empty
                </span>
              </Label>
              <Input
                id="product-sku"
                placeholder="e.g. SKO-FRA-XXXXX"
                value={form.sku}
                onChange={(e) => updateField('sku', e.target.value)}
              />
            </div>

            {/* Row: Supplier & Supplier Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-supplier">Supplier</Label>
                <Input
                  id="product-supplier"
                  placeholder="e.g. Ray-Ban India"
                  value={form.supplier}
                  onChange={(e) => updateField('supplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-supplier-phone">Supplier Phone</Label>
                <Input
                  id="product-supplier-phone"
                  placeholder="e.g. +91 98765 43210"
                  value={form.supplierPhone}
                  onChange={(e) => updateField('supplierPhone', e.target.value)}
                />
              </div>
            </div>

            {/* Conditional: Frame Size Fields (for Frames) */}
            {showFrameSizeFields && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-lg border bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="product-frame-width">Frame Width (mm)</Label>
                  <Input
                    id="product-frame-width"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 140"
                    value={form.frameWidth}
                    onChange={(e) => updateField('frameWidth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-bridge">Bridge (mm)</Label>
                  <Input
                    id="product-bridge"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 18"
                    value={form.bridge}
                    onChange={(e) => updateField('bridge', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-temple">Temple Length (mm)</Label>
                  <Input
                    id="product-temple"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 145"
                    value={form.temple}
                    onChange={(e) => updateField('temple', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Conditional: Lens Type (for Lenses) */}
            {showTypeField && (
              <div className="space-y-2">
                <Label htmlFor="product-type">Lens Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => updateField('type', val)}
                >
                  <SelectTrigger id="product-type" className="w-full">
                    <SelectValue placeholder="Select lens type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LENS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conditional: Duration (for Contact Lenses) */}
            {showDurationField && (
              <div className="space-y-2">
                <Label htmlFor="product-duration">Duration</Label>
                <Select
                  value={form.duration}
                  onValueChange={(val) => updateField('duration', val)}
                >
                  <SelectTrigger id="product-duration" className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conditional: Expiry Date (for Solutions, Lenses, Contact Lenses) */}
            {showExpiryField && (
              <div className="space-y-2">
                <Label htmlFor="product-expiry">Expiry Date</Label>
                <Input
                  id="product-expiry"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => updateField('expiryDate', e.target.value)}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Optional product description..."
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setEditingProduct(null)
                setForm(emptyForm)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !form.name.trim() ||
                !form.category ||
                !form.price.trim() ||
                !form.stock.trim()
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {deletingProduct?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeletingProduct(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk CSV Import Dialog ───────────────────────────────────────── */}
      <Dialog open={csvDialogOpen} onOpenChange={(open) => {
        setCsvDialogOpen(open)
        if (!open) {
          setCsvData('')
          setImportResult(null)
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <span className="inline-flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Import CSV
              </span>
            </DialogTitle>
            <DialogDescription>
              Paste your CSV data below to import products in bulk. The first row must be the header.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Sample format hint */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Sample CSV Format
              </p>
              <pre className="text-xs text-foreground/80 overflow-x-auto whitespace-pre">
                {CSV_SAMPLE}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Required columns: name, category, price. Optional: brand, model, stock, min_stock, supplier, supplier_phone, cost_price, sku, color, size, type, duration.
              </p>
            </div>

            {/* CSV textarea */}
            <div className="space-y-2">
              <Label htmlFor="csv-data">
                CSV Data <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="csv-data"
                placeholder="Paste your CSV data here, including the header row..."
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            {/* Import results */}
            {importResult && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Import Results</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span><strong>{importResult.created}</strong> created</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span><strong>{importResult.skipped}</strong> skipped</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span><strong>{importResult.errors.length}</strong> errors</span>
                    </div>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                      {importResult.errors.map((err, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCsvDialogOpen(false)
                setCsvData('')
                setImportResult(null)
              }}
              disabled={importing}
            >
              Close
            </Button>
            <Button
              onClick={handleCsvImport}
              disabled={importing || !csvData.trim()}
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Low-Stock Report Dialog ──────────────────────────────────────── */}
      <Dialog open={reportDialogOpen} onOpenChange={(open) => {
        setReportDialogOpen(open)
        if (!open) {
          setReportData(null)
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <span className="inline-flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                Low Stock Report
              </span>
            </DialogTitle>
            <DialogDescription>
              Overview of all products that need reordering.
            </DialogDescription>
          </DialogHeader>

          {reportLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportData ? (
            <div className="space-y-6 py-2">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Low-Stock Items</p>
                    <p className="text-3xl font-bold mt-1">{reportData.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Categories Affected</p>
                    <p className="text-3xl font-bold mt-1">{Object.keys(reportData.byCategory).length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Reorder Value</p>
                    <p className="text-3xl font-bold mt-1 flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      {reportData.totalReorderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* By-category breakdown */}
              <div>
                <h3 className="text-sm font-semibold mb-2">By Category</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reportData.byCategory).map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="text-sm px-3 py-1">
                      {category}: <strong className="ml-1">{count}</strong>
                    </Badge>
                  ))}
                  {Object.keys(reportData.byCategory).length === 0 && (
                    <p className="text-sm text-muted-foreground">No categories affected.</p>
                  )}
                </div>
              </div>

              {/* Items table */}
              {reportData.items.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Items Needing Reorder</h3>
                  <div className="max-h-[400px] overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Category</TableHead>
                          <TableHead className="hidden md:table-cell">Brand</TableHead>
                          <TableHead className="text-right">Stock / Min</TableHead>
                          <TableHead className="text-right">Needed</TableHead>
                          <TableHead className="hidden sm:table-cell text-right">Reorder Cost</TableHead>
                          <TableHead className="hidden lg:table-cell">Supplier</TableHead>
                          <TableHead className="hidden lg:table-cell">Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {item.brand || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                {item.stock}
                              </span>
                              <span className="text-muted-foreground"> / {item.minStock}</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.needed}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-right font-medium">
                              {formatINR(item.reorderCost)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                              {item.supplier || '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                              {item.supplierPhone || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No items are currently below minimum stock levels.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load report.</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReportDialogOpen(false)
                setReportData(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}