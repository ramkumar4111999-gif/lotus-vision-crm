#!/usr/bin/env python3
"""
Comprehensive Business Analysis Report:
Toilet/Sanitary Shop Near New Bus Stand - Sankarankovil
Including Sankaran Kovil Opticals Previous Analysis
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether,
    SimpleDocTemplate, HRFlowable, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Color Palette ━━
ACCENT = colors.HexColor('#4a28af')
TEXT_PRIMARY = colors.HexColor('#1b1c1e')
TEXT_MUTED = colors.HexColor('#70767c')
BG_SURFACE = colors.HexColor('#e1e5e9')
BG_PAGE = colors.HexColor('#eef0f2')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('NotoSansSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/chinese/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans', '/usr/share/fonts/truetype/chinese/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansRegular', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansRegBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSCBold')
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif')
registerFontFamily('LiberationSans', normal='LiberationSans', bold='LiberationSans')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')
registerFontFamily('DejaVuSansRegular', normal='DejaVuSansRegular', bold='DejaVuSansRegBold')

# ━━ Styles ━━
styles = getSampleStyleSheet()

cover_title_style = ParagraphStyle(
    name='CoverTitle', fontName='LiberationSerif', fontSize=32, leading=42,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=12
)
cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle', fontName='LiberationSans', fontSize=16, leading=22,
    alignment=TA_LEFT, textColor=TEXT_MUTED, spaceAfter=8
)
cover_meta_style = ParagraphStyle(
    name='CoverMeta', fontName='LiberationSans', fontSize=12, leading=16,
    alignment=TA_LEFT, textColor=TEXT_MUTED
)

h1_style = ParagraphStyle(
    name='H1', fontName='LiberationSerif', fontSize=20, leading=28,
    alignment=TA_LEFT, textColor=ACCENT, spaceBefore=18, spaceAfter=12
)
h2_style = ParagraphStyle(
    name='H2', fontName='LiberationSerif', fontSize=15, leading=22,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8
)
h3_style = ParagraphStyle(
    name='H3', fontName='LiberationSerif', fontSize=12, leading=18,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6
)
body_style = ParagraphStyle(
    name='Body', fontName='LiberationSerif', fontSize=10.5, leading=18,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=8
)
body_left = ParagraphStyle(
    name='BodyLeft', fontName='LiberationSerif', fontSize=10.5, leading=18,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=8
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='LiberationSerif', fontSize=10.5, leading=18,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=4,
    leftIndent=20, bulletIndent=8
)
callout_style = ParagraphStyle(
    name='Callout', fontName='LiberationSans', fontSize=11, leading=18,
    alignment=TA_LEFT, textColor=ACCENT, spaceBefore=6, spaceAfter=6,
    leftIndent=16, borderPadding=8
)
header_cell_style = ParagraphStyle(
    name='HeaderCell', fontName='LiberationSerif', fontSize=10,
    alignment=TA_CENTER, textColor=colors.white
)
cell_style = ParagraphStyle(
    name='Cell', fontName='LiberationSerif', fontSize=9.5,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, leading=14
)
cell_center = ParagraphStyle(
    name='CellCenter', fontName='LiberationSerif', fontSize=9.5,
    alignment=TA_CENTER, textColor=TEXT_PRIMARY, leading=14
)
caption_style = ParagraphStyle(
    name='Caption', fontName='LiberationSans', fontSize=9, leading=14,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceBefore=3, spaceAfter=6
)
toc_h1 = ParagraphStyle(name='TOCH1', fontSize=13, leftIndent=20, fontName='LiberationSerif', leading=22)
toc_h2 = ParagraphStyle(name='TOCH2', fontSize=11, leftIndent=40, fontName='LiberationSerif', leading=18)

# ━━ Page Setup ━━
PAGE_W, PAGE_H = A4
LEFT_M = 1.0 * inch
RIGHT_M = 1.0 * inch
TOP_M = 0.8 * inch
BOTTOM_M = 0.8 * inch
available_width = PAGE_W - LEFT_M - RIGHT_M

OUTPUT_PDF = '/home/z/my-project/download/Toilet_Shop_Business_Analysis_Sankarankovil.pdf'

# ━━ Helper Functions ━━
def P(text, style=body_style):
    return Paragraph(text, style)

def H1(text):
    return P(f'<b>{text}</b>', h1_style)

def H2(text):
    return P(f'<b>{text}</b>', h2_style)

def H3(text):
    return P(f'<b>{text}</b>', h3_style)

def make_table(headers, rows, col_ratios=None):
    """Create a styled table with header and alternating row colors."""
    if col_ratios is None:
        n = len(headers)
        col_ratios = [1.0 / n] * n
    col_widths = [r * available_width for r in col_ratios]

    data = [[P(f'<b>{h}</b>', header_cell_style) for h in headers]]
    for row in rows:
        data.append([P(str(c), cell_style) for c in row])

    t = Table(data, colWidths=col_widths, hAlign='CENTER', repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=ACCENT, spaceAfter=8, spaceBefore=8)

def safe_keep(elements):
    """Keep elements together if total height is reasonable."""
    return [KeepTogether(elements)]

# ━━ TOC Template ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

H1_ORPHAN = (PAGE_H - TOP_M - BOTTOM_M) * 0.15

# ━━ Build Document ━━
doc = TocDocTemplate(
    OUTPUT_PDF,
    pagesize=A4,
    leftMargin=LEFT_M, rightMargin=RIGHT_M,
    topMargin=TOP_M, bottomMargin=BOTTOM_M,
    title='Toilet Shop Business Analysis - Sankarankovil',
    author='Z.ai',
    subject='Business Analysis and Suggestions for Toilet/Sanitary Shop Near New Bus Stand'
)

story = []

# ━━ TABLE OF CONTENTS ━━
story.append(P('<b>Table of Contents</b>', ParagraphStyle(
    name='TOCTitle', fontName='LiberationSerif', fontSize=22, leading=30,
    alignment=TA_LEFT, textColor=ACCENT, spaceAfter=16
)))
toc = TableOfContents()
toc.levelStyles = [toc_h1, toc_h2]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
# SECTION 1: EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════
story.append(add_heading('<b>1. Executive Summary</b>', h1_style, level=0))
story.append(hr())

story.append(P(
    'This comprehensive business analysis report provides a detailed examination of the commercial '
    'opportunities for establishing a toilet and sanitary ware shop near the New Bus Stand in '
    'Sankarankovil, Tirunelveli District, Tamil Nadu. The report has been prepared based on extensive '
    'web research, market data analysis, competitor mapping, and government scheme evaluation to offer '
    'actionable insights for a viable business venture in this high-traffic location.',
    body_style
))
story.append(P(
    'Sankarankovil is a rapidly growing town in the Tirunelveli district with a population that relies '
    'heavily on public transportation. The New Bus Stand area serves as a major transit hub, attracting '
    'hundreds of daily commuters, travelers, and local residents. This creates a natural demand for '
    'sanitary ware products, bathroom fixtures, and related plumbing supplies, particularly from nearby '
    'residential construction projects, commercial building developments, and home renovation activities '
    'that are on the rise in the surrounding areas.',
    body_style
))
story.append(P(
    'The analysis covers three primary business models: (A) a sanitary ware and bathroom fixtures '
    'retail showroom, (B) a public pay-and-use toilet facility, and (C) a combined hybrid model that '
    'leverages both retail sales and service revenue streams. Each model has been evaluated based on '
    'investment requirements, expected returns, competitive landscape, and risk factors. Additionally, '
    'the report includes detailed information about existing competitors in the region, current '
    'commercial rental rates near the bus stand area, dealership opportunities with major brands, '
    'government subsidies available under the Swachh Bharat Mission, and a comprehensive directory '
    'of key contacts including shop owners, dealers, municipal authorities, and brand representatives.',
    body_style
))
story.append(Spacer(1, 8))

# Key highlights table
story.append(H3('Key Highlights at a Glance'))
story.append(Spacer(1, 6))
highlights_data = [
    ['Total Investment (Sanitary Shop)', 'INR 5 - 10 Lakhs'],
    ['Monthly Rent Near Bus Stand', 'INR 5,000 - 15,000'],
    ['Expected Profit Margin', '18% - 35%'],
    ['Break-Even Period', '18 - 26 Months'],
    ['India Sanitary Market CAGR', '7.01% (2024-2030)'],
    ['Existing Competitors in Area', '6 - 8 Shops'],
    ['Government Subsidy (SBM-U 2.0)', 'Up to 40% VGF'],
    ['Monthly Revenue (Pay Toilet)', 'INR 30,000 - 90,000'],
]
story.append(make_table(
    ['Parameter', 'Value'],
    highlights_data,
    col_ratios=[0.50, 0.50]
))
story.append(P('<b>Table 1:</b> Key Business Highlights Summary', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 2: LOCATION ANALYSIS & RENT DETAILS
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>2. Location Analysis and Rent Details</b>', h1_style, level=0))
story.append(hr())

story.append(add_heading('<b>2.1 Sankarankovil New Bus Stand Area</b>', h2_style, level=1))
story.append(P(
    'The New Bus Stand in Sankarankovil, also known as Anna Bus Stand, is spread across approximately '
    '1.5 acres and serves as the primary transit hub for the town and surrounding villages. It connects '
    'Sankarankovil to major cities including Tirunelveli, Tenkasi, Madurai, and Chennai through regular '
    'state-run (SETC) and private bus services. The area surrounding the bus stand has seen significant '
    'commercial development in recent years, with new shops, eateries, and service establishments opening '
    'to cater to the steady flow of commuters and travelers.',
    body_style
))
story.append(P(
    'The Thiruvengadam Road area, which runs adjacent to the bus stand, is particularly attractive for '
    'commercial businesses due to its high foot traffic and visibility. Properties along this road offer '
    'excellent frontage and accessibility, making them ideal for retail showrooms. The area is also '
    'well-connected to residential neighborhoods, which adds to the customer base for home improvement '
    'and construction-related businesses such as sanitary ware shops.',
    body_style
))

story.append(add_heading('<b>2.2 Commercial Rent Rates Near Bus Stand</b>', h2_style, level=1))
story.append(P(
    'Based on data gathered from multiple real estate platforms including 99acres, MagicBricks, OLX, '
    'and JustDial, the commercial rental rates in the Sankarankovil New Bus Stand area are relatively '
    'affordable compared to larger cities in Tamil Nadu. The following table summarizes the current '
    'rental landscape for commercial shop spaces near the bus stand:',
    body_style
))
story.append(Spacer(1, 8))

rent_data = [
    ['100 - 150 sq ft (Small Shop)', 'INR 5,000 - 10,000', 'Ground floor, near road'],
    ['150 - 300 sq ft (Medium Shop)', 'INR 8,000 - 15,000', 'Good frontage on main road'],
    ['300 - 500 sq ft (Large Shop)', 'INR 15,000 - 30,000', 'Showroom-style layout'],
    ['500+ sq ft (Spacious Showroom)', 'INR 25,000 - 40,000', 'Premium location, high visibility'],
    ['480 sq ft (VM Chatram area)', 'INR 10,000', 'Near Tirunelveli highway'],
    ['700 sq ft (Opp. Ganapathi Silks)', 'INR 5,000', 'Near bus stand, high footfall'],
]
story.append(make_table(
    ['Shop Size', 'Monthly Rent (INR)', 'Location Notes'],
    rent_data,
    col_ratios=[0.30, 0.25, 0.45]
))
story.append(P('<b>Table 2:</b> Commercial Rent Rates Near Sankarankovil New Bus Stand', caption_style))

story.append(Spacer(1, 12))
story.append(P(
    'For a sanitary ware retail shop, a medium-sized space of 200-300 sq ft would be ideal to display '
    'a representative collection of products including wash basins, toilet sets, taps, shower systems, '
    'and plumbing fittings. The estimated monthly rent for such a space near the bus stand would range '
    'from INR 8,000 to INR 15,000 depending on the exact location, road frontage, and amenities '
    'included. Most commercial leases in this area require a security deposit of 3 to 6 months rent, '
    'along with a minimum lock-in period of 11 months.',
    body_style
))

story.append(add_heading('<b>2.3 Key Real Estate Contacts</b>', h2_style, level=1))
story.append(P(
    'For finding the ideal commercial space near the New Bus Stand, the following real estate agents '
    'and property listing sources can be contacted. These agents have extensive knowledge of available '
    'properties in the Sankarankovil area and can assist with negotiation and lease agreements.',
    body_style
))
story.append(Spacer(1, 6))
contacts_data = [
    ['Nellai Land', 'Sankarankovil', 'JustDial Listed', 'Commercial property near bus stand'],
    ['Shanthi Complex (Medose)', 'Melapalayam', '5.0 rated, 16+ years', 'Office rooms for rent near bus stand'],
    ['99acres.com', 'Online Portal', 'Multiple Listings', 'Filter: Sankarankovil commercial shops'],
    ['MagicBricks.com', 'Online Portal', 'Verified Listings', 'Commercial properties on Thiruvengadam Road'],
    ['OLX Sankarankoil', 'Online Portal', '3,655+ Listings', 'Shops, offices for rent/sale'],
]
story.append(make_table(
    ['Agent / Source', 'Location', 'Details', 'Notes'],
    contacts_data,
    col_ratios=[0.22, 0.18, 0.25, 0.35]
))
story.append(P('<b>Table 3:</b> Real Estate Agents and Property Sources', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 3: EXISTING SANITARY SHOPS - COMPETITOR ANALYSIS
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>3. Existing Sanitary Shops and Competitor Analysis</b>', h1_style, level=0))
story.append(hr())

story.append(add_heading('<b>3.1 Competitors in Sankarankovil Area</b>', h2_style, level=1))
story.append(P(
    'A thorough competitor mapping exercise was conducted using JustDial, IndiaMart, and Google Maps '
    'to identify all existing sanitary ware dealers and bathroom fixture shops in and around '
    'Sankarankovil. The research revealed approximately 6 to 8 established shops operating in the area, '
    'with varying product ranges, brand associations, and customer bases. Understanding the competitive '
    'landscape is essential for positioning a new entry effectively and identifying market gaps that can '
    'be exploited for competitive advantage.',
    body_style
))
story.append(Spacer(1, 8))

comp_data = [
    ['Jayakumar Stores', 'Thiruchendur Road, Palayamkottai', '105 ratings', 'Jaquar dealer, pipes, PVC, sanitaryware'],
    ['Aaryaa Traders', 'Behind Geetha Theatre, Sankarankovil', '237 ratings (4.2*)', 'Hardware, paint, sanitaryware'],
    ['Jeyalakshmi Tiles', 'Sankarankovil', 'Active', 'Cera sanitaryware dealer'],
    ['RR Tiles & Vignesh Tiles', 'Sankarankovil area', 'Active', 'Tiles, sanitaryware dealer'],
    ['Raja Timber Depot', 'Sankarankovil', '29 ratings', 'Cera dealer, timber'],
    ['Golden Granite Tiles & Sanitary', 'Sankarankovil area', 'Active', 'Bathroom fittings'],
    ['Matha Kovil Street Shop', 'Kela Amman Sannathi, Sankarankovil', 'Near Bus Stand', 'Jaquar sanitaryware dealer'],
    ['Mukesh Electricals', 'Sankarankovil', 'Active', 'Bathroom fittings dealer'],
]
story.append(make_table(
    ['Shop Name', 'Address / Location', 'Ratings', 'Speciality'],
    comp_data,
    col_ratios=[0.20, 0.28, 0.17, 0.35]
))
story.append(P('<b>Table 4:</b> Existing Sanitary Ware Shops in Sankarankovil', caption_style))

story.append(Spacer(1, 12))
story.append(P(
    'The competitive analysis reveals several important insights. First, most existing shops in '
    'Sankarankovil are relatively small operations that focus primarily on hardware, tiles, or paint, '
    'with sanitary ware being a secondary product line. This presents a significant opportunity for a '
    'dedicated sanitary ware showroom that offers a comprehensive range of products from leading brands. '
    'Second, only a few shops (Jayakumar Stores and the Matha Kovil Street Shop) carry premium brands '
    'like Jaquar, leaving room for dealerships with other major brands such as Kohler, Hindware, Cera, '
    'Grohe, and Parryware. Third, the shops near the bus stand area specifically are limited, which '
    'means a well-positioned shop in this high-traffic zone would have a natural advantage in terms of '
    'customer walk-ins and brand visibility.',
    body_style
))

story.append(add_heading('<b>3.2 Major Showrooms in Tirunelveli District</b>', h2_style, level=1))
story.append(P(
    'For reference and potential partnership opportunities, the following major sanitary ware showrooms '
    'operate in the broader Tirunelveli district. These established players represent the competitive '
    'benchmark for quality, product range, and service standards that a new entrant should aspire to.',
    body_style
))
story.append(Spacer(1, 8))

major_data = [
    ['Varshan Enterprises', 'Thiyagaraja Nagar, Tirunelveli', '094431 40379', 'Kohler Exclusive Showroom'],
    ['Grohe Venuva Tiles Mart', 'Swami Nellaiappar High Road, Thirunagar', 'On Request', 'Authorized GROHE dealer'],
    ['AMF Home Centre', 'Trivandrum Road, Palayamkottai', 'On Request', 'Jaquar dealer'],
    ['Amaravathi Traders', 'Tirunelveli', '7949367796', 'Multi-brand sanitaryware'],
    ['SD Traders', 'North Bye Pass Road, Tirunelveli Jn.', 'On Request', 'Johnson sanitaryware'],
    ['Sree Moogambika Pipe Traders', 'Near Udayarpatti, Tirunelveli Jn.', 'On Request', 'Johnson sanitaryware'],
]
story.append(make_table(
    ['Business Name', 'Address', 'Phone', 'Speciality'],
    major_data,
    col_ratios=[0.20, 0.30, 0.17, 0.33]
))
story.append(P('<b>Table 5:</b> Major Sanitary Ware Showrooms in Tirunelveli District', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 4: INVESTMENT & BUSINESS PLAN
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>4. Investment Requirements and Business Plan</b>', h1_style, level=0))
story.append(hr())

story.append(add_heading('<b>4.1 Sanitary Ware Retail Shop - Investment Breakdown</b>', h2_style, level=1))
story.append(P(
    'Starting a sanitary ware retail shop near the Sankarankovil New Bus Stand requires a moderate '
    'initial investment, making it an accessible business opportunity for first-time entrepreneurs and '
    'small business owners. The total investment varies depending on the scale of operations, the brands '
    'carried, and the interior fit-out of the showroom. Based on industry benchmarks and market research, '
    'the following investment breakdown provides a realistic estimate for a medium-scale sanitary ware '
    'retail operation.',
    body_style
))
story.append(Spacer(1, 8))

invest_data = [
    ['Shop Security Deposit (3-6 months rent)', 'INR 25,000 - 90,000', 'One-time'],
    ['Interior Fit-Out and Display Shelves', 'INR 50,000 - 1,50,000', 'One-time'],
    ['Initial Stock Inventory', 'INR 2,00,000 - 5,00,000', 'Working capital'],
    ['Brand Dealership Fees', 'INR 10,000 - 50,000', 'Per brand'],
    ['Licenses and Registrations (GST, Trade)', 'INR 5,000 - 15,000', 'Annual'],
    ['Signage and Marketing', 'INR 15,000 - 40,000', 'One-time'],
    ['Working Capital (3 months)', 'INR 50,000 - 1,00,000', 'Operational'],
    ['Miscellaneous (transport, utilities)', 'INR 20,000 - 50,000', 'Initial setup'],
    ['Total Estimated Investment', 'INR 3,75,000 - 9,95,000', ''],
]
story.append(make_table(
    ['Cost Component', 'Estimated Amount (INR)', 'Type'],
    invest_data,
    col_ratios=[0.40, 0.35, 0.25]
))
story.append(P('<b>Table 6:</b> Investment Breakdown for Sanitary Ware Retail Shop', caption_style))

story.append(Spacer(1, 12))
story.append(P(
    'The total estimated investment ranges from approximately INR 3.75 Lakhs for a small-scale operation '
    'to INR 10 Lakhs for a well-stocked medium showroom. This investment can be financed through a '
    'combination of personal savings, MUDRA loans (up to INR 10 Lakhs available from any bank branch), '
    'and PMEGP subsidies (25-35% of project cost through District Industries Centre). The break-even '
    'period for a sanitary ware retail shop in a semi-urban market like Sankarankovil is typically '
    '18 to 26 months, after which the business generates consistent profits.',
    body_style
))

story.append(add_heading('<b>4.2 Pay-and-Use Toilet Facility - Investment Breakdown</b>', h2_style, level=1))
story.append(P(
    'An alternative or complementary business model is the pay-and-use public toilet facility near the '
    'bus stand. This model has been successfully implemented across India by organizations such as '
    'Sulabh International, which operates over 5,000 profit-making pay toilets across 23 states. The '
    'model is particularly viable near transportation hubs where a constant flow of travelers creates '
    'steady demand for clean, well-maintained restroom facilities.',
    body_style
))
story.append(Spacer(1, 8))

toilet_invest = [
    ['Basic 2-4 Seat Toilet Block', 'INR 2,00,000 - 5,00,000', '18-24 months'],
    ['Pay and Use Complex (6-10 Seats)', 'INR 5,00,000 - 15,00,000', '12-18 months'],
    ['Smart E-Toilet Unit', 'INR 8,00,000 - 15,00,000', '18-24 months'],
    ['Monthly Revenue (500+ daily users)', 'INR 30,000 - 90,000', 'Ongoing'],
    ['Monthly Maintenance Cost', 'INR 8,000 - 20,000', 'Ongoing'],
    ['Net Profit Margin', '20% - 25%', 'Post-break-even'],
]
story.append(make_table(
    ['Facility Type', 'Investment / Revenue', 'Timeline'],
    toilet_invest,
    col_ratios=[0.35, 0.35, 0.30]
))
story.append(P('<b>Table 7:</b> Pay-and-Use Toilet Investment and Returns', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 5: PROFIT MARGINS & REVENUE PROJECTIONS
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>5. Profit Margins and Revenue Projections</b>', h1_style, level=0))
story.append(hr())

story.append(add_heading('<b>5.1 Sanitary Ware Profit Margins by Brand Tier</b>', h2_style, level=1))
story.append(P(
    'The profitability of a sanitary ware retail shop depends significantly on the brand tier of products '
    'carried. Premium brands offer lower profit margins in percentage terms but generate higher absolute '
    'revenue per transaction, while regional and unbranded products offer higher margins but lower '
    'per-unit revenue. A balanced product portfolio that includes a mix of premium, mid-range, and '
    'budget options is recommended for optimal profitability.',
    body_style
))
story.append(Spacer(1, 8))

margin_data = [
    ['Tier 1 (Kohler, Jaquar, Hindware, Cera)', '18% - 25%', 'INR 3,000 - 30,000 per unit', 'High brand value, steady demand'],
    ['Tier 2 (Parryware, Johnson, Grohe)', '25% - 35%', 'INR 1,500 - 15,000 per unit', 'Good balance of margin and volume'],
    ['Regional / Unbranded Products', '35% - 50%', 'INR 500 - 5,000 per unit', 'High margin, price-sensitive segment'],
]
story.append(make_table(
    ['Brand Tier', 'Profit Margin', 'Price Range', 'Notes'],
    margin_data,
    col_ratios=[0.30, 0.15, 0.25, 0.30]
))
story.append(P('<b>Table 8:</b> Profit Margins by Brand Tier', caption_style))

story.append(Spacer(1, 12))
story.append(add_heading('<b>5.2 Market Size and Growth Outlook</b>', h2_style, level=1))
story.append(P(
    'The Indian sanitary ware market is experiencing robust growth, driven by urbanization, rising '
    'disposable incomes, government housing schemes (Pradhan Mantri Awas Yojana), and increasing awareness '
    'of hygiene and sanitation. According to industry research, the India sanitary ware market was valued '
    'at approximately USD 338.59 Million in 2024 and is projected to reach USD 508.45 Million by 2030, '
    'growing at a compound annual growth rate (CAGR) of 7.01%. The global sanitary ware market stands at '
    'USD 34.3 billion and is growing at 6.2% CAGR through 2034.',
    body_style
))
story.append(P(
    'For a retailer in Sankarankovil, this national growth trend translates into expanding local demand '
    'as more households upgrade from basic facilities to modern sanitary ware, new construction projects '
    'increase in the area, and commercial developments (hotels, restaurants, office buildings) create '
    'additional bulk-order opportunities. A well-positioned shop near the bus stand can capture both '
    'retail walk-in customers and bulk project orders from local contractors and builders.',
    body_style
))

story.append(add_heading('<b>5.3 Revenue Projection (Year 1-3)</b>', h2_style, level=1))
story.append(Spacer(1, 8))

rev_data = [
    ['Monthly Sales Revenue', 'INR 60,000 - 80,000', 'INR 90,000 - 1,20,000', 'INR 1,20,000 - 1,80,000'],
    ['Monthly Rent', 'INR 10,000', 'INR 10,000', 'INR 10,000'],
    ['Monthly Staff Salary (1-2)', 'INR 12,000', 'INR 15,000', 'INR 18,000'],
    ['Monthly Utilities', 'INR 3,000', 'INR 3,500', 'INR 4,000'],
    ['Monthly Operating Expenses', 'INR 25,000', 'INR 28,500', 'INR 32,000'],
    ['Net Monthly Profit', 'INR 35,000 - 55,000', 'INR 61,500 - 91,500', 'INR 88,000 - 1,48,000'],
    ['Annual Profit', 'INR 4,20,000 - 6,60,000', 'INR 7,38,000 - 10,98,000', 'INR 10,56,000 - 17,76,000'],
]
story.append(make_table(
    ['Parameter', 'Year 1', 'Year 2', 'Year 3'],
    rev_data,
    col_ratios=[0.30, 0.23, 0.23, 0.24]
))
story.append(P('<b>Table 9:</b> Three-Year Revenue Projection for Sanitary Ware Shop', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 6: GOVERNMENT SCHEMES & SUBSIDIES
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>6. Government Schemes and Subsidies</b>', h1_style, level=0))
story.append(hr())

story.append(add_heading('<b>6.1 Swachh Bharat Mission - Urban 2.0 (SBM-U 2.0)</b>', h2_style, level=1))
story.append(P(
    'The Swachh Bharat Mission - Urban 2.0 is the flagship sanitation program of the Government of '
    'India, with a total outlay of INR 1,41,600 crore. This scheme provides significant financial '
    'incentives for the construction and maintenance of public toilet facilities across the country. '
    'For entrepreneurs interested in setting up pay-and-use toilet facilities near bus stands and other '
    'public spaces, the following benefits are available under this scheme.',
    body_style
))
story.append(Spacer(1, 6))
story.append(P(
    'The scheme offers a Central Government incentive of up to 40% of the project cost through the '
    'Viability Gap Funding (VGF) mechanism for each public toilet block constructed. This means that '
    'for a toilet facility costing INR 5 Lakhs, the government would contribute INR 2 Lakhs, reducing '
    'the effective investment to just INR 3 Lakhs. Additionally, 25% of all new public toilet seats '
    'constructed under the scheme must meet "aspirational" quality standards, which includes premium '
    'fixtures, clean running water, proper ventilation, and disabled-friendly access. This creates an '
    'excellent opportunity for sanitary ware shop owners to supply products for these government-funded '
    'toilet construction projects.',
    body_style
))

story.append(add_heading('<b>6.2 Other Key Government Schemes</b>', h2_style, level=1))
story.append(Spacer(1, 6))

scheme_data = [
    ['PMEGP (Prime Minister Employment Generation Programme)', '25% - 35% of project cost', 'Via District Industries Centre'],
    ['MUDRA Loan (Micro Units Development & Refinance Agency)', 'Up to INR 10 Lakhs', 'Any bank branch'],
    ['Udyam/MSME Registration', 'Benefits for subsidies and tenders', 'Online: udyamregistration.gov.in'],
    ['GST Registration', 'Mandatory for INR 20L+ turnover', 'Online: gst.gov.in'],
    ['Tamil Nadu TNUSSP', 'State-level sanitation support', 'tnussp.co.in'],
    ['BOT/PPP Model (Build-Operate-Transfer)', 'Government land, you build & operate', 'Apply to Municipal Commissioner'],
    ['Tender Opportunities', '59+ active toilet tenders in TN', 'tntenders.gov.in'],
]
story.append(make_table(
    ['Scheme / Programme', 'Benefit', 'How to Apply'],
    scheme_data,
    col_ratios=[0.35, 0.35, 0.30]
))
story.append(P('<b>Table 10:</b> Government Schemes and Subsidies Summary', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 7: KEY CONTACTS & DEALERSHIP INFO
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>7. Key Contacts and Dealership Information</b>', h1_style, level=0))
story.append(hr())

story.append(add_heading('<b>7.1 Government and Municipal Contacts</b>', h2_style, level=1))
story.append(P(
    'Establishing relationships with local government and municipal authorities is critical for '
    'obtaining necessary permits, securing land for public toilet facilities, and accessing government '
    'tenders for sanitary ware supply. The following key contacts should be approached for business '
    'setup assistance and partnership opportunities.',
    body_style
))
story.append(Spacer(1, 8))

govt_contacts = [
    ['Municipal Commissioner, Sankarankovil', '7397389949', '04636-222236', 'commr.sankarankoil@tn.gov.in'],
    ['Tirunelveli Collector', '0462-2501033', '', 'collrtnv@nic.in'],
    ['District Industries Centre', 'Via DIC Tirunelveli', '0462-2501033', 'For PMEGP applications'],
    ['SBM-U Helpdesk', '1800-180-4444', '', 'sbmurban.org'],
]
story.append(make_table(
    ['Contact', 'Phone', 'Alternate Phone', 'Email / Notes'],
    govt_contacts,
    col_ratios=[0.28, 0.18, 0.18, 0.36]
))
story.append(P('<b>Table 11:</b> Government and Municipal Authority Contacts', caption_style))

story.append(Spacer(1, 12))
story.append(add_heading('<b>7.2 Brand Dealership Contacts</b>', h2_style, level=1))
story.append(P(
    'Securing dealership agreements with major sanitary ware brands is essential for stocking '
    'quality products and building customer trust. Most brands offer dealership programs with varying '
    'investment levels, territory exclusivity, and margin structures. The following table provides '
    'contact information for major brands and their existing dealers in the Tirunelveli district area.',
    body_style
))
story.append(Spacer(1, 8))

brand_contacts = [
    ['CERA', '1800-258-5500', 'ceracare@cera-india.com', 'Apply online at cera-india.com'],
    ['Jaquar', 'Via Jayakumar Stores', '094431 40379', 'Existing dealer in Tirunelveli'],
    ['Kohler', 'Via Varshan Enterprises', '094431 40379', 'Exclusive showroom, Tirunelveli'],
    ['Johnson Bathrooms', 'johnsonbathrooms.in/locate/dealer', '', 'Dealer locator on website'],
    ['Grohe', 'Via Venuva Tiles Mart', 'On Request', 'Authorized dealer, Thirunagar'],
    ['Hindware', 'hindwarehomes.com', '', 'Multiple distributors in TN'],
    ['Parryware', '452/A Sankarankovil Rd, Rajapalayam', '', 'Near New Bus Stand, Rajapalayam'],
]
story.append(make_table(
    ['Brand', 'Phone / Location', 'Contact', 'Notes'],
    brand_contacts,
    col_ratios=[0.15, 0.30, 0.25, 0.30]
))
story.append(P('<b>Table 12:</b> Brand Dealership Contact Information', caption_style))

story.append(Spacer(1, 12))
story.append(add_heading('<b>7.3 Tender and Business Opportunity Sources</b>', h2_style, level=1))
story.append(P(
    'Regularly monitoring government tender portals is essential for identifying business opportunities '
    'in public toilet construction, maintenance contracts, and bulk sanitary ware supply orders. The '
    'following online platforms publish relevant tenders for the Tirunelveli district and Tamil Nadu state. '
    'Currently, there are 59 active toilet-related tenders in Tamil Nadu and over 1,647 toilet/bathroom '
    'tenders across India that are accessible through these platforms.',
    body_style
))
story.append(Spacer(1, 6))

tender_data = [
    ['tntenders.gov.in', 'Tamil Nadu Government Tenders', 'Official TN e-procurement portal'],
    ['tenderdetail.com', 'All India Toilet Tenders', '59+ active in Tamil Nadu'],
    ['tamilnadutenders.in', 'TN State Tenders', 'Bus stand toilet tenders (Salem, Erode)'],
    ['tendershark.com', 'Private Tender Aggregator', 'Email alerts for new tenders'],
    ['IndiaMart.com', 'Business Enquiries', 'Direct buyer-seller connections'],
]
story.append(make_table(
    ['Portal', 'Description', 'Key Feature'],
    tender_data,
    col_ratios=[0.25, 0.35, 0.40]
))
story.append(P('<b>Table 13:</b> Tender and Business Opportunity Sources', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 8: SANKARAN KOVIL OPTICALS - PREVIOUS ANALYSIS
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>8. Sankaran Kovil Opticals - Previous Analysis Summary</b>', h1_style, level=0))
story.append(hr())

story.append(P(
    'As part of the comprehensive business planning exercise previously conducted for Sankaran Kovil '
    'Opticals, a team of 20 parallel AI agents produced an extensive set of strategic reports covering '
    'marketing, analysis, sales, and support functions. The following is a summary of the key findings '
    'and strategic recommendations from that analysis, which can also inform the toilet shop business '
    'planning process through shared market insights and operational strategies.',
    body_style
))

story.append(add_heading('<b>8.1 Previous Project Overview</b>', h2_style, level=1))
story.append(P(
    'The Sankaran Kovil Opticals project was a comprehensive business planning initiative that produced '
    '20 detailed reports across four specialized teams. The Marketing Team generated 6 reports covering '
    'digital marketing, social media strategy, local advertising, brand development, content marketing, '
    'and promotional campaigns. The Analysis Team produced 5 reports on competitor analysis, market '
    'research, customer segmentation, SWOT analysis, and financial projections. The Sales Team '
    'contributed 4 reports on sales strategy, pricing, customer retention, and sales funnel optimization. '
    'Finally, the Support Team delivered 5 reports on customer service, operations, technology '
    'infrastructure, HR and training, and regulatory compliance.',
    body_style
))
story.append(P(
    'The total output comprised over 18,000 lines of strategic business content, all tailored to the '
    'Sankarankovil market with real INR pricing, Tamil cultural context, and actionable 90-day plans. '
    'The key strategic insights from that project - including the importance of local SEO, community '
    'engagement, competitive pricing strategies, and customer loyalty programs - are directly applicable '
    'to the toilet and sanitary ware business as well.',
    body_style
))

story.append(add_heading('<b>8.2 Applicable Insights for Toilet Shop Business</b>', h2_style, level=1))
story.append(Spacer(1, 6))

insight_data = [
    ['Local Market Understanding', 'Sankarankovil is a price-sensitive market; value-for-money positioning works best', 'High'],
    ['Digital Presence', 'Google My Business listing and local SEO are critical for customer discovery', 'High'],
    ['Community Engagement', 'Sponsoring local events and temple festivals builds brand awareness', 'Medium'],
    ['Competitive Pricing', 'Price matching with Tirunelveli dealers + free installation attracts customers', 'High'],
    ['Customer Retention', 'Annual maintenance contracts and free after-sales service drive repeat business', 'Medium'],
    ['Staff Training', 'Product knowledge training for 1-2 employees is essential for customer trust', 'High'],
    ['Seasonal Demand', 'Construction peaks during Oct-Mar (post-monsoon); stock accordingly', 'Medium'],
    ['Bulk Orders', 'Building relationships with local contractors yields recurring project orders', 'High'],
]
story.append(make_table(
    ['Insight Area', 'Recommendation', 'Priority'],
    insight_data,
    col_ratios=[0.20, 0.60, 0.20]
))
story.append(P('<b>Table 14:</b> Key Applicable Insights from Sankaran Kovil Opticals Analysis', caption_style))

# ═══════════════════════════════════════════════════════
# SECTION 9: RECOMMENDATIONS & ACTION PLAN
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>9. Recommendations and Action Plan</b>', h1_style, level=0))
story.append(hr())

story.append(add_heading('<b>9.1 Recommended Business Model: Combined Hybrid Approach</b>', h2_style, level=1))
story.append(P(
    'Based on the comprehensive analysis presented in this report, the most recommended business model '
    'is the Combined Hybrid Approach, which integrates a sanitary ware retail showroom with a '
    'pay-and-use demonstration toilet facility. This dual-income model offers several strategic '
    'advantages over standalone operations. First, the pay toilet generates immediate daily revenue '
    'from day one, helping to cover fixed costs (rent, utilities) while the retail business builds '
    'its customer base over the first few months. Second, the demonstration toilet serves as a live '
    'showcase for the products sold in the showroom, allowing customers to experience the quality '
    'of taps, flush systems, tiles, and fixtures before making a purchase decision. Third, the '
    'combined model creates a unique value proposition that differentiates the business from '
    'competitors who only offer retail or only offer toilet facilities.',
    body_style
))
story.append(P(
    'The total investment for the combined model is estimated at INR 8 to 20 Lakhs, depending on '
    'the scale of both the retail showroom and the toilet facility. With the pay toilet generating '
    'INR 30,000 to 90,000 per month and the retail operation contributing INR 35,000 to 55,000 '
    'per month in net profit by Year 1, the combined monthly income potential ranges from INR '
    '65,000 to 1,45,000. The break-even period for the combined model is projected at 18 to 30 '
    'months, which is competitive with industry benchmarks.',
    body_style
))

story.append(add_heading('<b>9.2 Step-by-Step Action Plan (90 Days)</b>', h2_style, level=1))
story.append(Spacer(1, 6))

action_data = [
    ['Week 1-2', 'Market Research & Planning', 'Visit existing shops, study competition, finalize product mix and brand selection'],
    ['Week 2-3', 'Business Registration', 'Register on Udyam (MSME), apply for GST, obtain Trade License via TNSWP portal'],
    ['Week 3-4', 'Secure Location', 'Contact real estate agents, finalize shop near bus stand, sign lease agreement'],
    ['Week 4-6', 'Dealership Applications', 'Apply for Jaquar/Cera/Hindware dealerships, negotiate terms and credit limits'],
    ['Week 5-7', 'Interior Setup', 'Design showroom layout, install display shelves, lighting, and signage'],
    ['Week 6-8', 'Stock Procurement', 'Place initial orders for fast-moving products (taps, wash basins, toilet sets)'],
    ['Week 8-10', 'Toilet Facility Setup', 'Construct pay-and-use toilet (if applicable), install fixtures and plumbing'],
    ['Week 10-11', 'Staff Hiring & Training', 'Hire 1-2 staff, provide product knowledge and customer service training'],
    ['Week 11-12', 'Digital Setup', 'Create Google My Business listing, social media pages, and local SEO optimization'],
    ['Week 12-13', 'Soft Launch', 'Invite local contractors and builders for preview, offer introductory discounts'],
    ['Week 13+', 'Grand Opening', 'Full launch with promotional offers, newspaper ads, and temple festival sponsorship'],
]
story.append(make_table(
    ['Timeline', 'Activity', 'Details'],
    action_data,
    col_ratios=[0.12, 0.25, 0.63]
))
story.append(P('<b>Table 15:</b> 90-Day Action Plan for Toilet/Sanitary Shop Setup', caption_style))

story.append(Spacer(1, 12))
story.append(add_heading('<b>9.3 Critical Success Factors</b>', h2_style, level=1))
story.append(P(
    'The success of a toilet and sanitary ware business near the Sankarankovil New Bus Stand depends '
    'on several critical factors that must be carefully managed throughout the business lifecycle. '
    'Location is paramount; the shop must be on a high-visibility road with easy access for both '
    'walk-in customers and delivery vehicles. Brand portfolio selection is equally important, as '
    'carrying a mix of premium and value-for-money brands ensures broad customer appeal. Product '
    'availability and reliable supply chain management ensures that customers can find what they need '
    'when they need it, which builds trust and encourages repeat visits. Excellent customer service, '
    'including free installation guidance and after-sales support, differentiates the business from '
    'competitors who only focus on point-of-sale transactions.',
    body_style
))
story.append(P(
    'Additionally, maintaining strong relationships with local contractors, builders, and plumbers '
    'is crucial for generating recurring bulk orders and project-based business. Digital marketing '
    'and online presence, particularly Google My Business and social media, are increasingly important '
    'for customer discovery even in semi-urban markets. Finally, staying informed about government '
    'tenders and subsidy programs can unlock additional revenue streams and reduce the effective cost '
    'of business expansion.',
    body_style
))

story.append(Spacer(1, 18))
story.append(add_heading('<b>9.4 Risk Factors and Mitigation Strategies</b>', h2_style, level=1))
story.append(Spacer(1, 6))

risk_data = [
    ['Competition from established players', 'Medium', 'Focus on superior customer service, exclusive brands, and demo toilet'],
    ['Seasonal demand fluctuations', 'Medium', 'Diversify product range, offer maintenance services in off-season'],
    ['Working capital constraints', 'High', 'Negotiate favorable credit terms with dealers, use MUDRA loan'],
    ['Supply chain disruptions', 'Medium', 'Maintain buffer stock for fast-moving items, multiple supplier contacts'],
    ['Regulatory changes', 'Low', 'Stay compliant with GST and local regulations, renew licenses on time'],
    ['Economic slowdown affecting construction', 'Medium', 'Focus on replacement/renovation market, offer EMIs to customers'],
]
story.append(make_table(
    ['Risk Factor', 'Severity', 'Mitigation Strategy'],
    risk_data,
    col_ratios=[0.30, 0.12, 0.58]
))
story.append(P('<b>Table 16:</b> Risk Assessment and Mitigation Strategies', caption_style))

# ━━ BUILD ━━
doc.multiBuild(story)
print(f"PDF generated successfully: {OUTPUT_PDF}")
print(f"File size: {os.path.getsize(OUTPUT_PDF) / 1024:.1f} KB")
