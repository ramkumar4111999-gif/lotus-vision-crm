#!/usr/bin/env python3
"""Generate Lotus Vision Opticals CRM - Complete Features Documentation PDF."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

# ── Color Palette (MANDATORY) ──────────────────────────────────────────────
ACCENT = colors.HexColor('#4820bf')
TEXT_PRIMARY = colors.HexColor('#272523')
TEXT_MUTED = colors.HexColor('#918c85')
BG_SURFACE = colors.HexColor('#e0dcd5')
BG_PAGE = colors.HexColor('#eceae8')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ── Font Registration ──────────────────────────────────────────────────────
pdfmetrics.registerFont(
    TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf')
)
pdfmetrics.registerFont(
    TTFont('NotoSerifSC-Bold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf')
)
pdfmetrics.registerFont(
    TTFont('LiberationSans', '/usr/share/fonts/truetype/chinese/LiberationSans-Regular.ttf')
)
pdfmetrics.registerFont(
    TTFont('LiberationSans-Bold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf')
)

HEADING_FONT = 'LiberationSans-Bold'
BODY_FONT = 'NotoSerifSC'
BODY_FONT_BOLD = 'NotoSerifSC-Bold'

# ── Page Setup ─────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN = 50
CONTENT_W = PAGE_W - 2 * MARGIN  # available width

OUTPUT_PATH = '/home/z/my-project/download/Lotus_Vision_CRM_Features.pdf'

# ── Styles ─────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

style_h1 = ParagraphStyle(
    'CustomH1', fontName=HEADING_FONT, fontSize=28, leading=34,
    textColor=TEXT_PRIMARY, spaceAfter=12, spaceBefore=6, keepWithNext=True,
)
style_h2 = ParagraphStyle(
    'CustomH2', fontName=HEADING_FONT, fontSize=20, leading=26,
    textColor=ACCENT, spaceAfter=10, spaceBefore=18, keepWithNext=True,
)
style_h3 = ParagraphStyle(
    'CustomH3', fontName=HEADING_FONT, fontSize=14, leading=18,
    textColor=TEXT_PRIMARY, spaceAfter=6, spaceBefore=12, keepWithNext=True,
)
style_body = ParagraphStyle(
    'CustomBody', fontName=BODY_FONT, fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_JUSTIFY,
)
style_body_bold = ParagraphStyle(
    'CustomBodyBold', fontName=BODY_FONT_BOLD, fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, spaceAfter=4,
)
style_table = ParagraphStyle(
    'TableText', fontName=BODY_FONT, fontSize=9, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
style_table_header = ParagraphStyle(
    'TableHeader', fontName=HEADING_FONT, fontSize=9, leading=12,
    textColor=TABLE_HEADER_TEXT, alignment=TA_LEFT,
)
style_footer = ParagraphStyle(
    'Footer', fontName=BODY_FONT, fontSize=8, leading=10,
    textColor=TEXT_MUTED, alignment=TA_CENTER,
)
style_bullet = ParagraphStyle(
    'BulletBody', fontName=BODY_FONT, fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, spaceAfter=3, leftIndent=18, bulletIndent=6,
    alignment=TA_JUSTIFY,
)

# ── Helper Functions ───────────────────────────────────────────────────────

def p(text, style=style_body):
    """Shorthand for Paragraph."""
    return Paragraph(text, style)


def ph(text):
    """Paragraph for table header."""
    return Paragraph(f'<b>{text}</b>', style_table_header)


def pt_cell(text):
    """Paragraph for table cell."""
    return Paragraph(text, style_table)


def make_feature_table(features, col_widths=None):
    """
    Create a 3-column feature table: Feature | Description | Status.
    features: list of (feature_name, description) tuples.
    """
    if col_widths is None:
        w_feature = CONTENT_W * 0.30
        w_desc = CONTENT_W * 0.55
        w_status = CONTENT_W * 0.15
        col_widths = [w_feature, w_desc, w_status]

    header = [ph('Feature'), ph('Description'), ph('Status')]
    data = [header]
    for fname, fdesc in features:
        data.append([
            pt_cell(f'<b>{fname}</b>'),
            pt_cell(fdesc),
            pt_cell('Implemented'),
        ])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('FONTNAME', (0, 0), (-1, 0), HEADING_FONT),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
    ]
    # Alternating row colors
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    t.hAlign = 'CENTER'
    return t


def make_generic_table(headers, rows, col_widths):
    """Create a generic table with given headers and rows."""
    header_row = [ph(h) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([pt_cell(str(cell)) for cell in row])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    t.hAlign = 'CENTER'
    return t


# ── Page Number Footer ────────────────────────────────────────────────────

class NumberedCanvas:
    """Wrapper to add page numbers via onFirstPage / onLaterPages."""
    pass


def footer_handler(canvas, doc):
    """Draw page number at the bottom center."""
    canvas.saveState()
    canvas.setFont(BODY_FONT, 8)
    canvas.setFillColor(TEXT_MUTED)
    page_num = canvas.getPageNumber()
    text = f"Page {page_num}"
    canvas.drawCentredString(PAGE_W / 2, 25, text)
    # subtle top line
    canvas.setStrokeColor(BG_SURFACE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, PAGE_H - MARGIN + 10, PAGE_W - MARGIN, PAGE_H - MARGIN + 10)
    canvas.restoreState()


# ── Build Document ─────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=MARGIN,
    rightMargin=MARGIN,
    topMargin=MARGIN,
    bottomMargin=MARGIN,
    title='Lotus Vision Opticals CRM - Complete Features Documentation',
    author='Lotus Vision Opticals',
)

story = []

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1: EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════════════════════
story.append(p('Lotus Vision Opticals CRM', style_h1))
story.append(p('Complete Features Documentation', style_h2))
story.append(Spacer(1, 12))

story.append(p('Executive Summary', style_h2))

summary_items = [
    ('CRM Name', 'Lotus Vision Opticals'),
    ('Tech Stack', 'Next.js 16, Turbopack, shadcn/ui, SQLite/Prisma ORM, Tailwind CSS'),
    ('Total Codebase', '~20,855 lines across 16 files'),
    ('Components', '14 CRM Components'),
    ('API Routes', '21 API Routes'),
    ('Database Models', '16 Prisma Models'),
    ('Design Philosophy', 'Mobile-first responsive design with 44px touch targets'),
]
for label, value in summary_items:
    story.append(p(f'<b>{label}:</b> {value}', style_bullet))

story.append(Spacer(1, 8))
story.append(p(
    'This document provides a comprehensive feature-level breakdown of every module '
    'in the Lotus Vision Opticals CRM system. The application is designed as a single-page '
    'application built on Next.js 16 with Turbopack for optimized development and build performance. '
    'It leverages shadcn/ui component library for consistent, accessible UI components styled '
    'with Tailwind CSS. Data persistence is handled through SQLite via Prisma ORM, providing a '
    'lightweight yet robust database solution suitable for optical retail operations.',
    style_body
))

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2: MODULE-BY-MODULE FEATURES
# ═══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(p('Module-by-Module Features', style_h2))

# ─── Module 1: Dashboard ───────────────────────────────────────────────────
story.append(p('1. Dashboard (1,235 lines)', style_h3))

dashboard_features = [
    ('KPI Summary Cards', 'Real-time display of total revenue, total sales, total customers, and active inventory count with period-over-period comparison indicators.'),
    ('Sales Trend Chart', 'Interactive line/area chart showing daily, weekly, and monthly sales trends with configurable date ranges.'),
    ('Top Products Widget', 'Ranked list of best-selling products by quantity and revenue within a selected time period.'),
    ('Low Stock Alerts', 'Visual warning indicators for products that have fallen below their configured minimum stock threshold.'),
    ('Recent Activity Feed', 'Chronological feed of the latest transactions, customer additions, and inventory changes with timestamps.'),
    ('Quick Action Shortcuts', 'One-click navigation buttons to create a new sale, add a customer, or manage inventory directly from the dashboard.'),
    ('Revenue Breakdown', 'Visual breakdown of revenue by payment mode (Cash, UPI, Card) and by product category.'),
]
story.append(make_feature_table(dashboard_features))
story.append(Spacer(1, 10))

# ─── Module 2: Customers ──────────────────────────────────────────────────
story.append(p('2. Customers (1,961 lines)', style_h3))

customers_features = [
    ('Full CRUD Operations', 'Create, read, update, and delete customer records with validation on all required fields including name, phone, and email.'),
    ('WhatsApp Integration', 'Direct WhatsApp message button on each customer card for instant communication using the customer\'s registered phone number.'),
    ('CSV Export with Date Filters', 'Export the full customer list to CSV format with optional date range filtering for targeted data extraction.'),
    ('Duplicate Phone Detection', 'Automatic detection and warning when a new or edited customer record contains a phone number that already exists in the database.'),
    ('Group Filter', 'Filter customers by group classification: Regular, Wholesale, New, enabling segment-specific views and management.'),
    ('Sortable Columns', 'All table columns (name, phone, group, date added) are sortable in ascending or descending order.'),
    ('Prescription Management', 'View and manage customer prescriptions directly from the customer detail view with spherical, cylindrical, and axis values.'),
    ('Visit History', 'Complete chronological log of all customer visits including purchase history, prescriptions issued, and appointments attended.'),
    ('Birthday Tracking', 'Record and track customer birthdays with upcoming birthday reminders for personalized outreach and campaign targeting.'),
    ('Search and Pagination', 'Full-text search across customer name and phone fields with configurable page size and navigation controls.'),
    ('Customer Detail View', 'Comprehensive single-customer view consolidating contact info, purchase history, prescriptions, and appointment records.'),
]
story.append(make_feature_table(customers_features))
story.append(Spacer(1, 10))

# ─── Module 3: Sales / POS ────────────────────────────────────────────────
story.append(p('3. Sales / POS (2,255 lines)', style_h3))

sales_features = [
    ('Invoice Creation', 'Full invoice creation workflow with product selection, quantity entry, price override, and automatic subtotal/tax/total calculation.'),
    ('Split Payment', 'Support for splitting a single invoice payment across multiple modes (e.g., part cash, part UPI) with individual amount tracking.'),
    ('Return Processing', 'Process sales returns with full or partial item returns, automatic refund calculation, and restocking of returned inventory.'),
    ('Invoice Print View', 'Dedicated print-optimized invoice layout suitable for A4 thermal or inkjet printing with shop header and GST details.'),
    ('Payment Mode Filter', 'Filter sales records by payment method: Cash, UPI, Card, enabling quick reconciliation per payment channel.'),
    ('Status Filter', 'Filter invoices by status: Completed, Pending, Partially Paid, Returned for focused view of transaction states.'),
    ('Daily Summary Card', 'Aggregated daily sales metrics including total invoices, total revenue, and average order value displayed prominently.'),
    ('Weekly Summary Card', 'Weekly aggregated sales data with comparison to the previous week to identify trends and anomalies.'),
    ('Monthly Summary Card', 'Monthly performance overview with revenue, transaction count, and growth percentage against the prior month.'),
    ('WhatsApp Invoice Sharing', 'One-click sharing of invoice details to customer via WhatsApp using pre-formatted message templates.'),
    ('GST Calculation', 'Automatic CGST and SGST computation at configurable rates (default 9% each) applied to line items and invoice totals.'),
    ('Product Search in POS', 'Real-time product search by name, SKU, or barcode during invoice creation for rapid item lookup.'),
]
story.append(make_feature_table(sales_features))
story.append(Spacer(1, 10))

# ─── Module 4: Inventory ──────────────────────────────────────────────────
story.append(p('4. Inventory (1,745 lines)', style_h3))

inventory_features = [
    ('Product CRUD', 'Complete create, read, update, and delete operations for inventory products with fields for name, SKU, category, price, and stock quantity.'),
    ('Quick Stock Adjust Dialog', 'Rapid stock quantity adjustment via a lightweight dialog without needing to open the full product edit form.'),
    ('CSV Import', 'Bulk import products from a CSV file with field mapping, validation, and error reporting for failed rows.'),
    ('Bulk Import', 'Dedicated bulk import interface for adding multiple products at once with batch processing and progress indication.'),
    ('Low Stock Alerts', 'Configurable low-stock threshold per product with visual alert badges and a dedicated low-stock filter view.'),
    ('Frame Size Display', 'Display and manage frame size attributes (width, bridge, temple length) for optical frame products.'),
    ('Search and Filter', 'Multi-field search across product name, SKU, and category with combined filter support for refined results.'),
    ('Pagination', 'Configurable pagination for the product list with options for 10, 25, 50, or 100 items per page.'),
    ('Category Management', 'Organize products into categories (Frames, Lenses, Sunglasses, Accessories, Contact Lenses) for structured browsing.'),
    ('Price and Cost Tracking', 'Track both selling price and cost price per product for margin and profitability analysis.'),
]
story.append(make_feature_table(inventory_features))
story.append(Spacer(1, 10))

# ─── Module 5: Prescriptions ──────────────────────────────────────────────
story.append(p('5. Prescriptions', style_h3))

prescriptions_features = [
    ('Customer Prescription Management', 'Create, view, edit, and delete prescriptions linked to specific customer records for complete eyecare documentation.'),
    ('Spherical/Cylindrical Values', 'Record SPH and CYL values for both left (OS) and right (OD) eyes with decimal precision and positive/negative indicators.'),
    ('Axis Recording', 'Capture the axis degree value (0-180) for cylindrical correction in each eye as part of the full prescription data.'),
    ('PD Measurement', 'Record Pupillary Distance measurements for accurate lens fitting, with support for separate near and distance PD values.'),
    ('Lens Type Tracking', 'Track the prescribed lens type including Single Vision, Bifocal, Progressive, and Reading lenses for each prescription.'),
    ('Prescription Date and Doctor', 'Record the date of examination and the prescribing optometrist/doctor name for reference and follow-up.'),
    ('Add Power for Bifocal/Progressive', 'Additional near vision add power field for bifocal and progressive lens prescriptions.'),
    ('Prescription History', 'View complete historical list of all prescriptions for a customer with date-based sorting and comparison capability.'),
]
story.append(make_feature_table(prescriptions_features))
story.append(Spacer(1, 10))

# ─── Module 6: Lab Orders ─────────────────────────────────────────────────
story.append(p('6. Lab Orders (1,102 lines)', style_h3))

lab_features = [
    ('Lab Order Creation', 'Create new lab orders linked to a customer and prescription with lens specifications and frame selection.'),
    ('Status Tracking', 'Track each lab order through its lifecycle: Pending, In Progress, Ready, and Delivered with timestamp recording.'),
    ('Order Search', 'Search lab orders by customer name, order ID, or prescription reference for quick retrieval.'),
    ('Due Date Tracking', 'Set and monitor expected completion dates for each lab order with overdue alerts for delayed orders.'),
    ('Lab Order Detail View', 'Comprehensive detail view showing prescription details, lens specs, frame info, and status history.'),
    ('Status Update Workflow', 'Simple status transition interface to move orders through the pipeline with automatic timestamp logging.'),
    ('Customer Notification', 'Notify customers via WhatsApp or SMS when their lab order status changes to Ready or Delivered.'),
]
story.append(make_feature_table(lab_features))
story.append(Spacer(1, 10))

# ─── Module 7: Appointments ───────────────────────────────────────────────
story.append(p('7. Appointments (1,593 lines)', style_h3))

appointments_features = [
    ('Calendar Month View', 'Full month calendar grid showing all scheduled appointments with color-coded indicators for different appointment types.'),
    ('Calendar Week View', 'Detailed week view with hourly time slots for precise scheduling and conflict detection.'),
    ('Walk-in vs Scheduled Toggle', 'Distinguish between walk-in and pre-scheduled appointments with a clear toggle during creation.'),
    ('Purpose Type Selection', 'Select from predefined appointment purposes: Eye Exam, Frame Selection, Lens Fitting, Delivery, Follow-up, Walk-in.'),
    ('SMS Reminders', 'Automated SMS reminder sent to customers before their scheduled appointment time.'),
    ('WhatsApp Reminders', 'Automated WhatsApp reminder message sent to customers prior to their appointment.'),
    ('Recurrence Support', 'Create recurring appointments with daily, weekly, or monthly frequency patterns for regular follow-up visits.'),
    ('Status Management', 'Manage appointment lifecycle: Scheduled, Confirmed, Completed, Cancelled, No-Show with visual status badges.'),
    ('Date Picker Navigation', 'Quick navigation to any date via an integrated date picker component for fast appointment lookup.'),
    ('Appointment Search', 'Search appointments by customer name, phone, or purpose to locate specific bookings quickly.'),
    ('Time Slot Selection', 'Select specific time slots when creating appointments with visual availability indicators.'),
    ('Customer Linking', 'Associate each appointment with an existing customer record or create a new customer inline during booking.'),
]
story.append(make_feature_table(appointments_features))
story.append(Spacer(1, 10))

# ─── Module 8: Staff ──────────────────────────────────────────────────────
story.append(p('8. Staff (1,594 lines)', style_h3))

staff_features = [
    ('Full CRUD Operations', 'Create, read, update, and delete staff member records with personal details, role assignment, and contact information.'),
    ('Clock In/Out Attendance', 'Digital clock-in and clock-out functionality with live timer showing current shift duration.'),
    ('Live Timer Display', 'Real-time running timer on the staff dashboard showing elapsed time since clock-in for currently active staff.'),
    ('Commission Tracking', 'Automatic commission calculation per sale for commission-eligible staff roles with cumulative period totals.'),
    ('Salary Management', 'Generate salary records for any period with automatic calculation of base pay, commission, and deductions.'),
    ('Mark Salary as Paid', 'One-click action to mark generated salary records as paid with date stamping for payroll records.'),
    ('Role-Based Access Matrix', 'Five predefined roles: Owner, Admin, Optometrist, Sales Staff, and Assistant with granular permission controls per module.'),
    ('Performance Reports', 'Individual and team performance dashboards showing sales attributed, appointments handled, and revenue generated.'),
    ('Bank Details', 'Secure storage of staff bank account information for salary disbursement and record-keeping.'),
    ('Staff Attendance History', 'Complete attendance log with clock-in/out times, total hours, and date-range filtering for each staff member.'),
    ('Staff Directory', 'Searchable staff directory with role-based filtering and quick access to individual staff profiles.'),
]
story.append(make_feature_table(staff_features))
story.append(Spacer(1, 10))

# ─── Module 9: Campaigns ──────────────────────────────────────────────────
story.append(p('9. Campaigns (1,518 lines)', style_h3))

campaigns_features = [
    ('SMS Campaigns', 'Create and send bulk SMS campaigns to targeted customer segments with delivery tracking.'),
    ('WhatsApp Campaigns', 'Launch WhatsApp marketing campaigns using pre-approved message templates for compliance.'),
    ('Print Campaigns', 'Plan and track print media campaigns including flyers, banners, and newspaper advertisements.'),
    ('Online Campaigns', 'Manage digital marketing campaigns across online channels with cost and reach tracking.'),
    ('WhatsApp Templates (4 Pre-built)', 'Four pre-configured WhatsApp message templates: Promotional Offer, Birthday Greeting, Due Reminder, Collection Ready Notification.'),
    ('SMS Character Tracker', 'Real-time character count with 160-character per SMS segment limit indication and segment count display.'),
    ('ROI Tracking', 'Track return on investment per campaign with cost input, revenue attribution, and profit/loss calculation.'),
    ('Customer Segment Targeting', 'Target campaigns to specific segments: All Customers, Regular, Wholesale, New, or High Value customers.'),
    ('Analytics Tab', 'Dedicated analytics view with performance bar charts showing delivery rates, open rates, and conversion metrics.'),
    ('Birthday Greetings', 'Automated birthday greeting campaigns that trigger based on customer birthday data.'),
    ('Due Reminders', 'Automated payment due reminder campaigns targeting customers with outstanding balances.'),
    ('Collection Ready Notifications', 'Automated notifications sent to customers when their lab orders or prescriptions are ready for collection.'),
    ('Mobile-Responsive Card View', 'Campaign cards displayed in a responsive grid layout optimized for both mobile and desktop viewing.'),
    ('Campaign Status Management', 'Track campaigns through Draft, Scheduled, Active, Completed, and Cancelled states.'),
]
story.append(make_feature_table(campaigns_features))
story.append(Spacer(1, 10))

# ─── Module 10: Accounting ────────────────────────────────────────────────
story.append(p('10. Accounting (2,594 lines)', style_h3))

accounting_features = [
    ('GST Summary (CGST/SGST/IGST)', 'Comprehensive GST breakdown showing collected CGST, SGST, and IGST totals with period filtering and export capability.'),
    ('Expense Tracking', 'Record and categorize business expenses with date, amount, category, and description fields for complete financial tracking.'),
    ('Dues Management', 'Track customer outstanding balances with aging analysis showing current, 30-day, 60-day, and 90+ day overdue amounts.'),
    ('Profit/Loss Calculation', 'Automatic profit and loss computation from revenue and expense data with configurable reporting periods.'),
    ('Payment Tracking', 'Record and track incoming and outgoing payments with reference to sales invoices, purchase orders, and expense entries.'),
    ('Daily Cash Summary', 'End-of-day cash position summary showing opening balance, cash inflows, cash outflows, and closing balance.'),
    ('Expense Categories', 'Predefined expense categories (Rent, Utilities, Salaries, Supplies, Marketing, Maintenance, Other) with custom category support.'),
    ('Financial Date Filters', 'Filter all accounting data by custom date ranges, or use preset periods: Today, This Week, This Month, This Quarter, This Year.'),
    ('Accounting Dashboard', 'Central financial overview with key metrics: total revenue, total expenses, net profit, pending dues, and GST liability.'),
    ('Payment Method Breakdown', 'Revenue breakdown by payment method (Cash, UPI, Card) for bank reconciliation and cash flow management.'),
]
story.append(make_feature_table(accounting_features))
story.append(Spacer(1, 10))

# ─── Module 11: Reports ───────────────────────────────────────────────────
story.append(p('11. Reports (2,359 lines)', style_h3))

reports_features = [
    ('Sales Trend Report', 'Visual and tabular representation of sales trends over customizable time periods with daily, weekly, and monthly aggregation options.'),
    ('Top Products Report', 'Ranked listing of products by sales quantity and revenue with period filtering and comparison capabilities.'),
    ('Top Customers Report', 'Customer ranking by total purchase value, purchase frequency, and average order value for loyalty program insights.'),
    ('Inventory Turnover Report', 'Analysis of how quickly inventory items are sold and replaced with turnover ratio calculations per product.'),
    ('Revenue Comparison', 'Side-by-side revenue comparison between two periods (e.g., this month vs. last month) with variance percentages.'),
    ('Product Performance Report', 'Individual product performance metrics including units sold, revenue generated, profit margin, and stock status.'),
    ('Customer Acquisition Report', 'Track new customer additions over time with source attribution and segment distribution analysis.'),
    ('Date Range Selection', 'Flexible date range picker for all reports with preset options for quick access to common time periods.'),
    ('Report Export', 'Export any generated report to CSV format for further analysis in external spreadsheet applications.'),
    ('Summary Statistics', 'Aggregate statistics (totals, averages, min, max) displayed prominently at the top of each report for quick insights.'),
]
story.append(make_feature_table(reports_features))
story.append(Spacer(1, 10))

# ─── Module 12: Purchase Orders ───────────────────────────────────────────
story.append(p('12. Purchase Orders (763 lines)', style_h3))

po_features = [
    ('PO Creation', 'Create purchase orders with supplier selection, product line items, quantities, unit prices, and expected delivery dates.'),
    ('Supplier Linking', 'Associate each purchase order with a supplier from the supplier directory for organized procurement tracking.'),
    ('Status Tracking', 'Track purchase order status through its lifecycle: Draft, Sent, Confirmed, Partially Received, Received, Cancelled.'),
    ('PO Search and Filter', 'Search purchase orders by supplier name, PO number, or product name with status-based filtering.'),
    ('Order Detail View', 'Comprehensive detail view showing all line items, supplier information, status history, and received quantities.'),
    ('Inventory Update on Receipt', 'Automatic inventory stock increment when a purchase order is marked as received.'),
    ('PO Print View', 'Print-optimized purchase order layout suitable for sending to suppliers or maintaining physical records.'),
]
story.append(make_feature_table(po_features))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3: TECHNICAL ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(p('Technical Architecture', style_h2))

# ── API Routes Table ───────────────────────────────────────────────────────
story.append(p('API Routes (21 Endpoints)', style_h3))

api_routes = [
    ['GET', '/api/customers', 'List all customers with pagination and filters'],
    ['POST', '/api/customers', 'Create a new customer record'],
    ['GET', '/api/customers/[id]', 'Get customer by ID with related data'],
    ['PUT', '/api/customers/[id]', 'Update customer record'],
    ['DELETE', '/api/customers/[id]', 'Delete customer record'],
    ['GET', '/api/sales', 'List all sales/invoices with filters'],
    ['POST', '/api/sales', 'Create a new sale/invoice'],
    ['GET', '/api/sales/[id]', 'Get sale details by ID'],
    ['PUT', '/api/sales/[id]', 'Update sale record (status, return)'],
    ['GET', '/api/inventory', 'List all inventory products'],
    ['POST', '/api/inventory', 'Add a new product to inventory'],
    ['PUT', '/api/inventory/[id]', 'Update product details and stock'],
    ['DELETE', '/api/inventory/[id]', 'Remove product from inventory'],
    ['GET', '/api/appointments', 'List appointments with date filters'],
    ['POST', '/api/appointments', 'Create a new appointment'],
    ['PUT', '/api/appointments/[id]', 'Update appointment details/status'],
    ['GET', '/api/staff', 'List all staff members'],
    ['POST', '/api/staff', 'Add a new staff member'],
    ['PUT', '/api/staff/[id]', 'Update staff record'],
    ['GET', '/api/campaigns', 'List campaigns with status filter'],
    ['POST', '/api/campaigns', 'Create and launch a new campaign'],
]

api_col_widths = [CONTENT_W * 0.10, CONTENT_W * 0.30, CONTENT_W * 0.60]
story.append(make_generic_table(['Method', 'Route', 'Description'], api_routes, api_col_widths))
story.append(Spacer(1, 14))

# ── Prisma Models Table ───────────────────────────────────────────────────
story.append(p('Prisma Models (16 Models)', style_h3))

prisma_models = [
    ['Customer', 'name, phone, email, address, group, birthday, notes'],
    ['Sale', 'invoiceNumber, customerId, subtotal, tax, total, status, paymentMode'],
    ['SaleItem', 'saleId, productId, quantity, price, discount'],
    ['Product', 'name, sku, category, price, costPrice, stock, minStock'],
    ['Prescription', 'customerId, sphR, cylR, axisR, sphL, cylL, axisL, pd, addPower, lensType'],
    ['LabOrder', 'customerId, prescriptionId, status, dueDate, notes'],
    ['Appointment', 'customerId, date, time, purpose, type, status, recurrence'],
    ['Staff', 'name, phone, email, role, salary, bankDetails, status'],
    ['Attendance', 'staffId, clockIn, clockOut, totalHours, date'],
    ['Commission', 'staffId, saleId, amount, date'],
    ['Salary', 'staffId, basePay, commission, deductions, total, status, period'],
    ['Campaign', 'name, type, status, segment, message, scheduledAt, sentAt'],
    ['Expense', 'category, amount, description, date, reference'],
    ['PurchaseOrder', 'supplierId, status, total, expectedDate, notes'],
    ['PurchaseOrderItem', 'purchaseOrderId, productId, quantity, unitPrice'],
    ['Supplier', 'name, phone, email, address, notes'],
]

model_col_widths = [CONTENT_W * 0.22, CONTENT_W * 0.78]
story.append(make_generic_table(['Model', 'Key Fields'], prisma_models, model_col_widths))
story.append(Spacer(1, 14))

# ── Keyboard Shortcuts & Extras ───────────────────────────────────────────
story.append(p('Keyboard Shortcuts and UX Features', style_h3))

shortcuts = [
    ('Ctrl+K', 'Global search - opens the command palette for quick navigation and search across all modules.'),
    ('1 through 0', 'Section switching - number keys 1 through 0 switch between the ten primary CRM sections instantly.'),
]
for key, desc in shortcuts:
    story.append(p(f'<b>{key}:</b> {desc}', style_bullet))

story.append(Spacer(1, 8))
story.append(p(
    'The application supports dark mode with a system-preference-aware toggle that persists '
    'the user\'s choice. Page transitions are handled with smooth CSS animations to provide '
    'a polished, native-app-like feel during navigation between sections.',
    style_body
))

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 4: MOBILE & UX FEATURES
# ═══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(p('Mobile and UX Features', style_h2))

story.append(p(
    'The Lotus Vision Opticals CRM is built with a mobile-first approach, ensuring that every '
    'feature is fully functional and comfortably usable on smartphones, tablets, and desktop browsers. '
    'Below are the key mobile and user experience design decisions implemented across the application.',
    style_body
))
story.append(Spacer(1, 8))

ux_features = [
    ('44px Touch Targets', 'All interactive elements including buttons, links, form inputs, and tab controls maintain a minimum touch target size of 44x44 pixels, meeting WCAG accessibility guidelines and ensuring comfortable use on touch devices.'),
    ('Mobile-Responsive Card Layouts', 'Staff directory, campaign list, and sales summary screens use responsive card-based layouts that adapt from a single-column view on mobile to multi-column grids on larger screens.'),
    ('Horizontal Scroll Tables', 'All wide data tables (customers, sales, inventory, reports) feature horizontal scroll containers on narrow viewports, ensuring no data columns are hidden or truncated.'),
    ('Collapsible Sidebar with Mobile Drawer', 'The main navigation sidebar collapses to a hamburger-triggered drawer on mobile devices, providing full access to all sections without consuming screen real estate.'),
    ('Dark Mode Support', 'A system-aware dark mode toggle allows users to switch between light and dark themes. The preference is persisted in local storage and applied consistently across all views.'),
    ('Page Transitions', 'Smooth CSS-based page transition animations provide visual continuity during navigation, creating a polished single-page application experience.'),
]
story.append(make_feature_table(ux_features))

# ═══════════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════════
doc.build(story, onFirstPage=footer_handler, onLaterPages=footer_handler)

print(f"PDF generated successfully: {OUTPUT_PATH}")

# Count pages
from reportlab.lib.pagesizes import A4
import subprocess
result = subprocess.run(
    ['python3', '-c', f'''
import fitz
doc = fitz.open("{OUTPUT_PATH}")
print(doc.page_count)
doc.close()
'''],
    capture_output=True, text=True
)
if result.returncode == 0:
    print(f"Total pages: {result.stdout.strip()}")
else:
    print("Could not count pages (PyMuPDF may not be installed), but PDF was generated.")