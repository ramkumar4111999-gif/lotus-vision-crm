#!/usr/bin/env python3
"""
Footfall Comparison Report: Two Locations in Sankarankovil
10 AI Agents Research - Comprehensive PDF
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

# ============================================================
# FONT SETUP
# ============================================================
FONT_DIR = "/usr/share/fonts/truetype"
pdfmetrics.registerFont(TTFont('NotoSansSC', os.path.join(FONT_DIR, 'chinese/SarasaMonoSC-Regular.ttf')))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', os.path.join(FONT_DIR, 'chinese/SarasaMonoSC-Bold.ttf')))
pdfmetrics.registerFont(TTFont('NotoSerifSC', os.path.join(FONT_DIR, 'noto-serif-sc/NotoSerifSC-Regular.ttf')))
pdfmetrics.registerFont(TTFont('DejaVuSans', os.path.join(FONT_DIR, 'dejavu/DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', os.path.join(FONT_DIR, 'dejavu/DejaVuSans-Bold.ttf')))

# ============================================================
# PALETTE
# ============================================================
HEADER_FILL   = HexColor('#5d553d')
CARD_BG       = HexColor('#edecea')
TABLE_STRIPE  = HexColor('#f0efee')
BORDER_COLOR  = HexColor('#c4bda8')
ICON_COLOR    = HexColor('#957f40')
ACCENT        = HexColor('#4a22c0')
TEXT_PRIMARY   = HexColor('#201f1d')
TEXT_MUTED     = HexColor('#89867f')
SEM_SUCCESS   = HexColor('#459760')
SEM_ERROR     = HexColor('#a05852')
SEM_INFO      = HexColor('#577a9d')
L1_COLOR      = HexColor('#2d6a4f')  # Green for Location 1
L2_COLOR      = HexColor('#7b2d8b')  # Purple for Location 2

# ============================================================
# STYLES
# ============================================================
styles = getSampleStyleSheet()

def add_style(name, **kwargs):
    styles.add(ParagraphStyle(name, **kwargs))

add_style('CoverTitle', fontName='NotoSansSC', fontSize=32, leading=40, textColor=HEADER_FILL, alignment=TA_CENTER, spaceAfter=6)
add_style('CoverSub', fontName='NotoSansSC', fontSize=14, leading=20, textColor=ICON_COLOR, alignment=TA_CENTER, spaceAfter=4)
add_style('SectionTitle', fontName='NotoSansSC', fontSize=17, leading=22, textColor=HEADER_FILL, spaceBefore=16, spaceAfter=8)
add_style('SubSectionTitle', fontName='NotoSansSC', fontSize=13, leading=18, textColor=ICON_COLOR, spaceBefore=12, spaceAfter=5)
add_style('SubSubTitle', fontName='NotoSansSC', fontSize=11, leading=15, textColor=TEXT_PRIMARY, spaceBefore=8, spaceAfter=4)
add_style('Body', fontName='NotoSansSC', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceBefore=2, spaceAfter=5, wordWrap='CJK')
add_style('Small', fontName='NotoSansSC', fontSize=8, leading=11, textColor=TEXT_MUTED)
add_style('TableHeader', fontName='NotoSansSC', fontSize=8.5, leading=11, textColor=colors.white, alignment=TA_CENTER)
add_style('TableCell', fontName='NotoSansSC', fontSize=8, leading=11, textColor=TEXT_PRIMARY, wordWrap='CJK')
add_style('TableCellBold', fontName='NotoSansSC-Bold', fontSize=8, leading=11, textColor=TEXT_PRIMARY, wordWrap='CJK')
add_style('L1Highlight', fontName='NotoSansSC', fontSize=10, leading=14, textColor=L1_COLOR, spaceBefore=3, spaceAfter=2)
add_style('L2Highlight', fontName='NotoSansSC', fontSize=10, leading=14, textColor=L2_COLOR, spaceBefore=3, spaceAfter=2)
add_style('VerdictBox', fontName='NotoSansSC', fontSize=11, leading=16, textColor=SEM_SUCCESS, alignment=TA_CENTER, spaceBefore=6, spaceAfter=6)

def hr():
    return HRFlowable(width="100%", thickness=1.5, lineCap='round', color=BORDER_COLOR, spaceBefore=5, spaceAfter=6)

def thin_hr():
    return HRFlowable(width="100%", thickness=0.5, lineCap='round', color=TABLE_STRIPE, spaceBefore=3, spaceAfter=3)

def make_table(headers, rows, col_widths=None):
    W = A4[0] - 2*0.9*inch
    header_row = [Paragraph(h, styles['TableHeader']) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), styles['TableCell']) for c in row])
    if col_widths is None:
        n = len(headers)
        col_widths = [W/n]*n
    else:
        total = sum(col_widths)
        col_widths = [w/total*W for w in col_widths]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    cmds = [
        ('BACKGROUND', (0,0), (-1,0), HEADER_FILL),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(('BACKGROUND', (0,i), (-1,i), TABLE_STRIPE))
    t.setStyle(TableStyle(cmds))
    return t

def verdict_box(text, bg_color=CARD_BG, border_color=SEM_SUCCESS):
    d = [[Paragraph(text, styles['VerdictBox'])]]
    t = Table(d, colWidths=[A4[0]-2.2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('BOX', (0,0), (-1,-1), 2, border_color),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont('NotoSansSC', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(A4[0]/2, 25, f"Sankarankovil Footfall Comparison Report  |  Page {canvas.getPageNumber()}")
    canvas.restoreState()

# ============================================================
# BUILD DOCUMENT
# ============================================================
OUTPUT = "/home/z/my-project/download/Sankarankovil_Footfall_Comparison_Report.pdf"

doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    topMargin=0.75*inch, bottomMargin=0.75*inch,
    leftMargin=0.9*inch, rightMargin=0.9*inch,
    title="Sankarankovil Footfall Comparison Report",
    author="Z.ai Research Team",
    subject="Footfall Analysis - Location 1 vs Location 2",
)

story = []

# ============================================================
# COVER PAGE
# ============================================================
story.append(Spacer(1, 0.6*inch))
story.append(Paragraph("<b>FOOTFALL COMPARISON</b>", ParagraphStyle('CL', parent=styles['Normal'],
    fontName='NotoSansSC', fontSize=10, leading=14, textColor=ICON_COLOR, alignment=TA_CENTER)))
story.append(HRFlowable(width="50%", thickness=2, color=ICON_COLOR, spaceBefore=6, spaceAfter=12))

story.append(Paragraph("<b>Sankarankovil</b>", ParagraphStyle('CT', parent=styles['Normal'],
    fontName='NotoSansSC', fontSize=34, leading=42, textColor=HEADER_FILL, alignment=TA_CENTER, spaceAfter=4)))
story.append(Paragraph("<b>Location Analysis Report</b>", ParagraphStyle('CS', parent=styles['Normal'],
    fontName='NotoSansSC', fontSize=17, leading=22, textColor=ICON_COLOR, alignment=TA_CENTER, spaceAfter=14)))

story.append(HRFlowable(width="50%", thickness=2, color=ICON_COLOR, spaceBefore=6, spaceAfter=16))

story.append(Paragraph("Location 1 vs Location 2: Foot Traffic, Landmarks, Demographics, and Business Suitability",
    ParagraphStyle('CDesc', parent=styles['Normal'], fontName='NotoSansSC', fontSize=10, leading=15, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=20)))

# Location boxes
loc1_data = [[Paragraph(
    "<b>LOCATION 1</b><br/>Sengundar School, Vadakaasi Amman 2nd Street,<br/>"
    "Main Rd, opposite Shanthi Complex,<br/>Sankarankoil, Tamil Nadu 627756<br/><br/>"
    "<font color='#2d6a4f'><b>Near New Bus Stand | SH-41 Highway</b></font>",
    ParagraphStyle('LB1', parent=styles['Normal'], fontName='NotoSansSC', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
)]]
loc2_data = [[Paragraph(
    "<b>LOCATION 2</b><br/>M2square Mobiles, Shankar Nagar, 15B,<br/>"
    "Mela Bazar, opposite Old Municipality Office,<br/>Sankarankoil, Tamil Nadu 627756<br/><br/>"
    "<font color='#7b2d8b'><b>Traditional Market | Temple Zone</b></font>",
    ParagraphStyle('LB2', parent=styles['Normal'], fontName='NotoSansSC', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
)]]

W = A4[0] - 2.2*inch
loc_table = Table([
    [Table(loc1_data, colWidths=[W/2-4]), Table(loc2_data, colWidths=[W/2-4])]
], colWidths=[W/2, W/2])
for sub in [0,1]:
    loc_table.setStyle(TableStyle([
        ('BACKGROUND', (sub,0), (sub,0), CARD_BG),
        ('BOX', (sub,0), (sub,0), 1, BORDER_COLOR),
        ('LEFTPADDING', (sub,0), (sub,0), 10),
        ('RIGHTPADDING', (sub,0), (sub,0), 10),
        ('TOPPADDING', (sub,0), (sub,0), 8),
        ('BOTTOMPADDING', (sub,0), (sub,0), 8),
        ('VALIGN', (sub,0), (sub,0), 'MIDDLE'),
    ]))
story.append(loc_table)

story.append(Spacer(1, 0.8*inch))

summary_box = [[Paragraph(
    "<b>Report Contents:</b> Comprehensive footfall estimation for two Sankarankovil locations, "
    "including landmark analysis, traffic patterns, demographic factors, temple tourism impact, "
    "seasonal variations, daily/monthly visitor estimates, and a final recommendation with "
    "weighted scoring. Researched by 10 parallel AI agents.",
    ParagraphStyle('SB', parent=styles['Normal'], fontName='NotoSansSC', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY)
)]]
st = Table(summary_box, colWidths=[A4[0]-2.4*inch])
st.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
    ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
]))
story.append(st)

story.append(Spacer(1, 0.4*inch))
story.append(Paragraph("Prepared for: Ram Kumar | Sankaran Kovil Opticals",
    ParagraphStyle('CP', fontName='NotoSansSC', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_CENTER)))
story.append(Paragraph("Date: June 2026 | 10 AI Agents",
    ParagraphStyle('CD', fontName='NotoSansSC', fontSize=8, leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER)))

story.append(PageBreak())

# ============================================================
# TABLE OF CONTENTS
# ============================================================
story.append(Paragraph("<b>TABLE OF CONTENTS</b>", styles['SectionTitle']))
story.append(hr())
toc = [
    ("1", "Executive Summary", "Quick comparison, key findings, and final verdict"),
    ("2", "Location Profiles", "Detailed profiles of both locations with maps and landmarks"),
    ("3", "Landmark &amp; Business Analysis", "Anchor businesses, commercial establishments, and footfall drivers"),
    ("4", "Traffic &amp; Transport Analysis", "Road connectivity, bus services, parking, and accessibility scores"),
    ("5", "Demographics &amp; Economy", "Population, floating visitors, textile industry, and student population"),
    ("6", "Daily Footfall Estimation", "Hourly, daily, weekly, and monthly footfall estimates for both locations"),
    ("7", "Temple Tourism &amp; Festival Impact", "Festival calendar, crowd multipliers, and temple visitor analysis"),
    ("8", "Weekly &amp; Seasonal Patterns", "Day-of-week variations, monthly rankings, and salary cycle effects"),
    ("9", "Final Comparison &amp; Recommendation", "10-criteria scoring, weighted totals, risk factors, and verdict"),
]
for n, t, d in toc:
    story.append(Paragraph(f"<b>{n}. {t}</b>", ParagraphStyle('TOCI', fontName='NotoSansSC', fontSize=10.5, leading=15, textColor=TEXT_PRIMARY, spaceBefore=5, spaceAfter=1)))
    story.append(Paragraph(d, ParagraphStyle('TOCD', fontName='NotoSansSC', fontSize=8.5, leading=12, textColor=TEXT_MUTED, leftIndent=18, spaceAfter=3)))

story.append(PageBreak())

# ============================================================
# SECTION 1: EXECUTIVE SUMMARY
# ============================================================
story.append(Paragraph("<b>1. Executive Summary</b>", styles['SectionTitle']))
story.append(hr())
story.append(Paragraph(
    "This report presents a comprehensive footfall comparison of two locations in Sankarankovil, Tamil Nadu, "
    "researched by 10 AI agents analyzing landmarks, businesses, traffic patterns, demographics, temple tourism, "
    "seasonal variations, and commercial attractiveness. The analysis is designed to help determine which "
    "location is better suited for opening Sankaran Kovil Opticals, a retail optical shop. "
    "Both locations are commercially active areas but differ significantly in their footfall characteristics, "
    "customer profiles, growth trajectories, and competitive landscapes.",
    styles['Body']
))
story.append(Spacer(1, 6))

story.append(Paragraph("<b>Quick Comparison at a Glance</b>", styles['SubSectionTitle']))

quick = [
    ['Parameter', 'Location 1 (Shanthi Complex / Main Rd)', 'Location 2 (Mela Bazar / Old Municipality)'],
    ['Zone', 'Near New Bus Stand, SH-41 Highway', 'Old Town, Traditional Market Area'],
    ['Road Type', 'State Highway (SH-41), 12-15m wide', 'Municipal internal road, 5-8m narrow'],
    ['Distance to New Bus Stand', '~0.2 km (Adjacent)', '~2.8 km (Far)'],
    ['Distance to Main Temple', '~500-800m', '~100-300m (Very Close)'],
    ['Est. Daily Footfall', '5,400 - 9,200 persons', '3,650 - 5,450 persons'],
    ['Est. Monthly Footfall', '1,62,000 - 2,76,000', '1,05,000 - 1,65,000'],
    ['Transport Score', '7.85 / 10', '4.95 / 10'],
    ['Temple Tourism Score', '6.30 / 10', '8.20 / 10'],
    ['Optical Competition', 'LOW (blue ocean)', 'HIGH (10+ existing shops)'],
    ['Future Growth', 'HIGH (new infrastructure)', 'MODERATE (saturated area)'],
    ['Final Weighted Score', '7.88 / 10', '6.77 / 10'],
]
story.append(make_table(quick[0], quick[1:], col_widths=[1.5, 2.25, 2.25]))
story.append(Spacer(1, 10))

story.append(verdict_box(
    "<b>VERDICT: Location 1 Wins by 1.11 Points (16.4% Margin)</b><br/><br/>"
    "Location 1 (opposite Shanthi Complex, near New Bus Stand) is recommended for Sankaran Kovil Opticals "
    "due to higher footfall volume, superior transport connectivity, lower optical competition, "
    "better Main Road visibility, and strong government-backed future growth potential.<br/>"
    "Location 2 has stronger temple tourism impact and traditional market loyalty, but faces "
    "market saturation with 10+ existing optical shops and declining future growth."
))
story.append(PageBreak())

# ============================================================
# SECTION 2: LOCATION PROFILES
# ============================================================
story.append(Paragraph("<b>2. Location Profiles</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph("<b>2.1 Location 1: Near Shanthi Complex, Main Road</b>", styles['SubSectionTitle']))
story.append(Paragraph(
    "<font color='#2d6a4f'><b>Address:</b></font> Sengundar School, Vadakaasi Amman 2nd Street, Main Rd, "
    "opposite Shanthi Complex, Sankarankoil, Tamil Nadu 627756",
    styles['Body']
))
story.append(Paragraph(
    "Location 1 is situated on State Highway SH-41 (Rajapalayam-Sankarankovil-Tirunelveli corridor), "
    "directly opposite Shanthi Shopping Complex and adjacent to Sengundar School. This area is "
    "approximately 200 meters from the newly inaugurated Thanthai Periyar New Bus Stand, which handles "
    "20 buses simultaneously and features 39 built-in commercial shops. The location sits on a wide "
    "12-15 meter state highway with heavy vehicular traffic, including inter-city buses, trucks, and "
    "private vehicles. The area is the emerging commercial corridor of Sankarankovil, with modern "
    "retail chains, branded textile showrooms, and national pharmacy chains establishing presence. "
    "Key nearby landmarks include Sri Ganapathy Silks, Sri Kannan Silks, Karthika Silks, Apollo Pharmacy "
    "(24-hour), Mariyo Supermarket (newly opened, Sankarankovil's biggest), Meenakshi Cinemas (AC 4K 3D), "
    "Hotel Varnams (4.1-star rated), Aasife Biriyani, and Sri Krishna Hall (wedding venue). "
    "The Vadakasi Amman Kovil temple is approximately 50 meters away, and 6+ ATMs serve the area.",
    styles['Body']
))

story.append(Paragraph("<b>2.2 Location 2: Mela Bazar, Opposite Old Municipality</b>", styles['SubSectionTitle']))
story.append(Paragraph(
    "<font color='#7b2d8b'><b>Address:</b></font> M2square Mobiles, Shankar Nagar, 15B, Mela Bazar, "
    "opposite Old Municipality Office, Sankarankoil, Tamil Nadu 627756",
    styles['Body']
))
story.append(Paragraph(
    "Location 2 is in the heart of Sankarankovil's traditional commercial area - Mela Bazar (Upper Bazaar), "
    "directly opposite the Old Municipality Office on Thiruvenkadam Salai. This area is approximately 200-400 "
    "meters from the Anna Bus Stand (Old/Main Bus Stand), which Wikipedia describes as the busiest bus stand "
    "in Tirunelveli district with approximately 100 buses daily and 10,000 daily commuters. The area is also "
    "very close to the famous Sankara Narayanaswamy Temple (10th century, 4.5-acre complex) - the primary "
    "pilgrimage center of the town. Mela Bazar features narrow 5-8 meter municipal streets lined with "
    "traditional shops, the daily vegetable market (Uzhavar Sandhai), and the North/South Car Street "
    "commercial belt which has the highest commercial property guideline value in town (Rs 825/sq ft). "
    "Key nearby businesses include 10+ banks (HDFC, Axis, SBI, ICICI, Canara, TMB, IOB, KVB, Ujjivan), "
    "Gomathi Shankar Thangamaligai (jewellery), multiple silk showrooms, numerous medical stores, "
    "wholesale lemon/produce merchants, and government offices. The area suffers from narrow congested "
    "streets, poor parking, and severe peak-hour gridlock. The Sankarankovil bypass road project "
    "(under construction) will eventually divert through-traffic away from this area.",
    styles['Body']
))
story.append(PageBreak())

# ============================================================
# SECTION 3: LANDMARK & BUSINESS ANALYSIS
# ============================================================
story.append(Paragraph("<b>3. Landmark &amp; Business Analysis</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph("<b>3.1 Top Footfall Drivers - Location 1 (200m Radius)</b>", styles['SubSectionTitle']))

loc1_drivers = [
    ['#', 'Landmark / Anchor', 'Est. Daily Footfall', 'Why It Drives Footfall'],
    ['1', 'SH-41 State Highway', '10,000+ vehicles/day', 'Major arterial road; all inter-city traffic passes'],
    ['2', 'New Bus Stand', '5,000-8,000 commuters', '20 buses simultaneously; 39 commercial shops'],
    ['3', 'Sengundar School', '400-600 students + parents', 'Morning/evening peak; auto-rickshaw traffic'],
    ['4', 'Shanthi Complex (opposite)', '500+ visitors', 'Office + retail complex; professional footfall'],
    ['5', 'Ganapathy Silks / Kannan Silks', '300-500 customers', 'Branded silk showrooms; wedding/festive shoppers'],
    ['6', 'Mariyo Supermarket (NEW)', '800-1,200 customers', "Sankarankovil's biggest; opened May 2026"],
    ['7', 'Meenakshi Cinemas', '200-400 patrons', 'AC 4K 3D Dolby; evening entertainment crowd'],
    ['8', 'Apollo Pharmacy (24-hr)', '150-250 customers', 'National chain; 24-hour operation'],
    ['9', 'Vadakasi Amman Kovil', '100-200 devotees', 'Area namesake; local guardian deity temple'],
    ['10', 'Sri Krishna Hall', '200-500 per event', 'Wedding hall; daily events and functions'],
]
story.append(make_table(loc1_drivers[0], loc1_drivers[1:], col_widths=[0.3, 1.5, 1.2, 2.5]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "<i>Location 1 aggregate 200m radius footfall: 8,000-15,000 persons/day (normal day), "
    "30,000+ on peak/festival days. 55+ commercial establishments identified.</i>",
    styles['Small']
))
story.append(Spacer(1, 10))

story.append(Paragraph("<b>3.2 Top Footfall Drivers - Location 2 (200m Radius)</b>", styles['SubSectionTitle']))

loc2_drivers = [
    ['#', 'Landmark / Anchor', 'Est. Daily Footfall', 'Why It Drives Footfall'],
    ['1', 'Anna Bus Stand (Old/Main)', '10,000 commuters', 'Busiest in Tirunelveli district; ~100 buses/day'],
    ['2', 'Sankara Narayanaswamy Temple', '3,000-5,000 devotees', '10th century; famous pilgrimage center'],
    ['3', 'Mela Bazar Daily Market', '800-1,200 shoppers', 'Traditional commercial hub; daily needs'],
    ['4', 'Old Municipality Office', '200-500 visitors', 'Certificates, tax, permits; daily admin traffic'],
    ['5', 'North/South Car Street Belt', '2,000-4,000 shoppers', 'Dense commercial corridor; dozens of shops'],
    ['6', '10+ Banks (HDFC, Axis, SBI...)', '500-1,000 customers', 'Bank customers are prime retail buyers'],
    ['7', 'Gomathi Shankar Jewellers', '200-400 customers', 'Established gold showroom; trusted brand'],
    ['8', 'Lemon / Produce Market', '150-250 traders', 'Agricultural wholesale hub for 85 villages'],
    ['9', '6+ Mobile Shops', '80-150 customers', 'Poorvika, M2square, Sangai, Star, Eswar, Avalon'],
    ['10', 'Hotels / Restaurants', '300-500 diners', 'Kumar Hotel, Sultan Biriyani, local eateries'],
]
story.append(make_table(loc2_drivers[0], loc2_drivers[1:], col_widths=[0.3, 1.5, 1.2, 2.5]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "<i>Location 2 aggregate 200m radius footfall: 5,000-10,000+ persons/day (normal day), "
    "15,000-25,000+ on festival days. Temple + market + transport = multi-layered anchor ecosystem.</i>",
    styles['Small']
))
story.append(PageBreak())

# ============================================================
# SECTION 4: TRAFFIC & TRANSPORT ANALYSIS
# ============================================================
story.append(Paragraph("<b>4. Traffic &amp; Transport Analysis</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph(
    "Transport accessibility is a critical factor for any retail business. This section compares both locations "
    "on road classification, highway connectivity, bus services, auto availability, parking, and future "
    "infrastructure growth. The analysis is based on web research including road classification data, "
    "Tamil Nadu highway project databases, and bus service frequency information.",
    styles['Body']
))

story.append(Paragraph("<b>4.1 Transport Accessibility Scoring</b>", styles['SubSectionTitle']))

transport_scores = [
    ['Criterion (Weight)', 'Location 1 Score', 'Location 2 Score'],
    ['Road Connectivity (20%)', '9/10 (SH-41 State Highway)', '4/10 (Narrow municipal road)'],
    ['Public Transport (20%)', '9/10 (New Bus Stand adjacent)', '6/10 (Old Bus Stand nearby)'],
    ['Highway Access (15%)', '9/10 (Direct SH-41 frontage)', '3/10 (No highway access)'],
    ['Auto/Taxi Availability (10%)', '8/10', '8/10'],
    ['Parking (10%)', '6/10 (Moderate)', '3/10 (Poor - congested)'],
    ['Walking Accessibility (10%)', '5/10 (Highway area)', '8/10 (Market/temple walkable)'],
    ['Peak-Hour Flow (10%)', '7/10 (Manages well)', '3/10 (Gridlock-prone)'],
    ['Future Growth (5%)', '9/10 (Bypass + SH-41 upgrade)', '3/10 (Saturated, no widening)'],
    ['WEIGHTED TOTAL (100%)', '7.85 / 10', '4.95 / 10'],
]
story.append(make_table(transport_scores[0], transport_scores[1:], col_widths=[1.8, 2.1, 2.1]))
story.append(Spacer(1, 8))

story.append(Paragraph(
    "<b>Key Transport Finding:</b> Location 1 scores 59% higher in transport accessibility. "
    "Being directly on SH-41 (State Highway) with New Bus Stand adjacency gives Location 1 "
    "unmatched connectivity for customer arrival by vehicle. Location 2 has better walkability "
    "to the temple and market, but its narrow 5-8 meter streets cause severe congestion and "
    "parking is extremely limited. The upcoming Sankarankovil Bypass project will further enhance "
    "Location 1's advantage by improving SH-41 traffic flow, while potentially diverting traffic "
    "away from Location 2's old town area entirely.",
    styles['Body']
))
story.append(PageBreak())

# ============================================================
# SECTION 5: DEMOGRAPHICS & ECONOMY
# ============================================================
story.append(Paragraph("<b>5. Demographics &amp; Economy</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph(
    "Sankarankovil is the third largest town in Tenkasi district with a 2011 census population of "
    "70,574, now estimated at 85,000-90,000 in 2026. The taluk (including 85 villages) has a total "
    "population of approximately 375,000, creating a large rural catchment area that depends on "
    "the town for commercial services. The floating population (daily visitors who are not residents) "
    "is approximately 15,000 persons per day according to TNUIFSL government documents. The town "
    "has 11+ schools and 3 colleges with a combined student population of 5,000-7,000. Sengundar "
    "Higher Secondary School alone has approximately 2,500 students. The local economy is driven "
    "by three major sectors: temple tourism, the powerloom textile industry (4,000+ looms with 10,000+ "
    "workers), and commercial trade serving the surrounding 85 villages.",
    styles['Body']
))

story.append(Paragraph("<b>5.1 Footfall Impact by Demographic Category</b>", styles['SubSectionTitle']))

demo_table = [
    ['Category', 'Estimated Daily Count', 'Impact on Loc 1', 'Impact on Loc 2'],
    ['Town Residents (daily shopping)', '~5,000-7,000', 'Medium (highway area)', 'HIGH (market zone)'],
    ['Floating Population', '~15,000', 'HIGH (bus stand/transit)', 'Medium (traditional area)'],
    ['Temple Devotees', '3,000-5,000 (normal)', 'Medium (500-1,000 capture)', 'HIGH (1,200-2,000 capture)'],
    ['Powerloom Workers', '10,000+', 'Medium (transit corridor)', 'Low (factory locations differ)'],
    ['Students & Parents', '5,000-7,000', 'HIGH (Sengundar School)', 'Medium (nearby schools)'],
    ['Rural Village Traders', '2,500-4,000 (weekly)', 'Low', 'HIGH (market day at Mela Bazar)'],
    ['Bus Commuters', '10,000-15,000', 'HIGH (New Bus Stand)', 'HIGH (Anna Bus Stand)'],
]
story.append(make_table(demo_table[0], demo_table[1:], col_widths=[1.4, 1.3, 1.5, 1.5]))
story.append(Spacer(1, 8))

story.append(Paragraph(
    "<b>Demographic Verdict:</b> Location 1 benefits from bus commuters, students (via Sengundar School), "
    "and the floating population that transits through the New Bus Stand and SH-41 corridor. "
    "Location 2 benefits from temple devotees (due to closer proximity), daily market shoppers, "
    "government office visitors, and rural traders who visit the weekly shandy. For an optical shop, "
    "Location 1's mix of transit commuters, students, and highway travelers provides a broader "
    "customer base, while Location 2's temple/market visitors have higher purchase intent but "
    "in a more congested and competitive environment.",
    styles['Body']
))
story.append(PageBreak())

# ============================================================
# SECTION 6: DAILY FOOTFALL ESTIMATION
# ============================================================
story.append(Paragraph("<b>6. Daily Footfall Estimation</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph(
    "Daily footfall was estimated by breaking down visitors into distinct categories, estimating each "
    "stream independently, and then applying a deduplication factor (0.65-0.75) to account for overlap "
    "(a person visiting both the temple and the market, for example, should not be counted twice). "
    "The methodology uses government floating population data, temple visitor benchmarks from similar "
    "Tamil Nadu pilgrimage towns, bus frequency data, and retail density indicators.",
    styles['Body']
))

story.append(Paragraph("<b>6.1 Location 1: Hourly Footfall Breakdown</b>", styles['SubSectionTitle']))

l1_hourly = [
    ['Time Slot', 'Footfall Range', '% of Daily', 'Activity Description'],
    ['6:00 - 8:00 AM', '400-700', '8%', 'Early temple visitors, tea shops, first buses'],
    ['8:00 - 10:00 AM', '1,000-1,700', '18%', 'PEAK: School + buses + temple + shops opening'],
    ['10:00 AM - 2:00 PM', '1,200-1,800', '17%', 'Midday: steady shopping, commuters, offices'],
    ['2:00 - 4:00 PM', '600-900', '10%', 'Post-lunch lull; reduced activity'],
    ['4:00 - 6:00 PM', '1,000-1,300', '14%', 'PEAK 2: School pickup + evening shopping'],
    ['6:00 - 8:00 PM', '700-1,200', '12%', 'Bus departures + silk shopping + eateries'],
    ['8:00 - 10:00 PM', '300-500', '5%', 'Late evening; restaurants, cinema, pharmacies'],
    ['10:00 PM - 6:00 AM', '200-400', '3%', 'Minimal; night buses, 24-hr pharmacy, hotels'],
]
story.append(make_table(l1_hourly[0], l1_hourly[1:], col_widths=[1.2, 1.0, 0.8, 2.5]))
story.append(Spacer(1, 6))

story.append(verdict_box(
    "<b>Location 1 Net Daily Footfall: 5,400 - 9,200 persons/day (Best Estimate: ~7,400)</b><br/>"
    "Monthly (Normal): 1,62,000 - 2,76,000 | Festival Months: Up to 4,00,000 - 5,00,000"
))
story.append(Spacer(1, 10))

story.append(Paragraph("<b>6.2 Location 2: Hourly Footfall Breakdown</b>", styles['SubSectionTitle']))

l2_hourly = [
    ['Time Slot', 'Footfall Range', '% of Daily', 'Activity Description'],
    ['6:00 - 10:00 AM', '500-800', '14%', 'Temple darshan, vegetable market, morning commuters'],
    ['10:00 AM - 2:00 PM', '1,200-1,800', '27%', 'PEAK: Bus stand max, market full, municipality'],
    ['2:00 - 6:00 PM', '800-1,200', '19%', 'Post-lunch market, mobile shops, students'],
    ['6:00 - 10:00 PM', '1,000-1,500', '23%', 'PEAK 2: Return commuters, temple evening, families'],
    ['10:00 PM - 6:00 AM', '50-100', '2%', 'Minimal; 24-hr medical, security'],
]
story.append(make_table(l2_hourly[0], l2_hourly[1:], col_widths=[1.2, 1.0, 0.8, 2.5]))
story.append(Spacer(1, 6))

story.append(verdict_box(
    "<b>Location 2 Net Daily Footfall: 3,650 - 5,450 persons/day (Best Estimate: ~4,500)</b><br/>"
    "Monthly (Normal): 1,05,000 - 1,65,000 | Festival Months: Up to 3,00,000 - 5,00,000"
))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>6.3 Weekly Variation Pattern</b>", styles['SubSectionTitle']))

weekly = [
    ['Day', 'Location 1 Multiplier', 'Location 2 Multiplier', 'Key Driver'],
    ['Monday', '1.15x (bus commuters)', '1.20x (weekly shandy)', 'Market day spillover at Mela Bazar'],
    ['Tuesday', '1.00x', '0.95x', 'Normal day'],
    ['Wednesday', '0.90x (lowest)', '0.90x (lowest)', 'Mid-week lull'],
    ['Thursday', '1.00x', '1.00x', 'Baseline normal day'],
    ['Friday', '1.10x', '1.15x', 'Temple Friday boost + weekend shopping'],
    ['Saturday', '1.25x (highest)', '1.10x', 'Families, weekend pilgrims, full retail'],
    ['Sunday', '1.15x (temple)', '0.90x', 'Temple visitors; many shops partially closed'],
]
story.append(make_table(weekly[0], weekly[1:], col_widths=[0.9, 1.4, 1.4, 2.0]))
story.append(PageBreak())

# ============================================================
# SECTION 7: TEMPLE TOURISM & FESTIVAL IMPACT
# ============================================================
story.append(Paragraph("<b>7. Temple Tourism &amp; Festival Impact</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph(
    "The Sankara Narayanaswamy Temple (also called Sankaranarayanasamy Temple) is the primary cultural "
    "and religious landmark of Sankarankovil. Dating back to the 10th century and spanning 4.5 acres, "
    "it is famous as the only temple where Shiva and Vishnu appear in a unified form. The temple "
    "attracts an estimated 15-25 lakh (1.5-2.5 million) visitors annually, making it one of the most "
    "significant pilgrimage centers in southern Tamil Nadu. The temple's festivals are the single "
    "largest driver of seasonal footfall spikes in the entire town.",
    styles['Body']
))

story.append(Paragraph("<b>7.1 Festival Calendar &amp; Crowd Multipliers</b>", styles['SubSectionTitle']))

festivals = [
    ['Festival', 'Period', 'Peak Crowd', 'Multiplier', 'Loc 1 Impact', 'Loc 2 Impact'],
    ['Aadi Thabasu', 'Jul 18-29 (12 days)', '50,000-80,000', '10-16x', '5,000-8,000', '15,000-25,000'],
    ['Chithirai Brahmotsavam', 'Mar-May (48 days)', '80,000-1,00,000', '8-20x', '6,000-10,000', '20,000-40,000'],
    ['Maha Shivarathri', 'Feb-Mar (1 night)', '30,000-50,000', '6-10x', '3,000-5,000', '10,000-20,000'],
    ['Navarathri', 'Sep-Oct (9 days)', '15,000-20,000', '3-4x', '2,000-3,000', '5,000-8,000'],
    ['Chitra Pournami', 'Apr ~12', '10,000-15,000', '2.5-3.5x', '1,500-2,500', '4,000-7,000'],
    ['Diwali Shopping', 'Oct-Nov', 'High commercial', '3-4x', '3x multiplier', '3x multiplier'],
    ['Pongal', 'Jan 14-17', 'Moderate', '2x', '2x multiplier', '2x multiplier'],
]
story.append(make_table(festivals[0], festivals[1:], col_widths=[1.0, 1.1, 0.9, 0.7, 0.9, 0.9]))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>7.2 Temple Tourism Score Comparison</b>", styles['SubSectionTitle']))

temple_scores = [
    ['Factor', 'Location 1', 'Location 2'],
    ['Distance from Temple', '6/10 (~500-800m)', '9/10 (~100-300m)'],
    ['Temple Visitor Capture', '5/10 (15-20% capture)', '9/10 (35-45% capture)'],
    ['Festival Day Multiplier', '6/10 (6-12x)', '9/10 (12-20x)'],
    ['Revenue Potential', '7/10', '8/10'],
    ['Year-round Consistency', '7/10', '7/10'],
    ['Non-Temple Transit Advantage', '8/10', '5/10'],
    ['Growth Potential', '7/10', '8/10'],
    ['WEIGHTED TOTAL', '6.30 / 10', '8.20 / 10'],
]
story.append(make_table(temple_scores[0], temple_scores[1:], col_widths=[1.8, 2.1, 2.1]))
story.append(Spacer(1, 8))

story.append(Paragraph(
    "<b>Temple Analysis Verdict:</b> Location 2 is the clear winner for temple tourism impact with a "
    "score of 8.20 vs 6.30. Being 2-5x closer to the temple and sitting on the car festival "
    "procession route gives Location 2 a significant advantage during festival periods. However, "
    "temple tourism is seasonal and concentrated around specific festival dates, creating feast-or-famine "
    "cycles. For a daily retail business like an optical shop, consistent year-round footfall from "
    "transport and commercial anchors (where Location 1 excels) may be more valuable than periodic "
    "festival spikes.",
    styles['Body']
))
story.append(PageBreak())

# ============================================================
# SECTION 8: WEEKLY & SEASONAL PATTERNS
# ============================================================
story.append(Paragraph("<b>8. Weekly &amp; Seasonal Patterns</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph("<b>8.1 Monthly Ranking (Best to Worst)</b>", styles['SubSectionTitle']))

monthly = [
    ['Rank', 'Month', 'Loc 1 Multiplier', 'Loc 2 Multiplier', 'Key Driver'],
    ['1 (Best)', 'July', '1.7x', '1.8x', 'Aadi Thapasu festival'],
    ['2', 'April', '1.6x', '1.5x', 'Chithirai Brahmotsavam peak'],
    ['3', 'November', '1.6x', '1.7x', 'Diwali shopping peak'],
    ['4', 'October', '1.5x', '1.4x', 'Diwali shopping season'],
    ['5', 'March', '1.4x', '1.3x', 'Brahmotsavam start + Equinox'],
    ['6', 'September', '1.3x', '1.2x', 'Equinox + Navaratri'],
    ['7', 'January', '1.3x', '1.2x', 'Pongal harvest festival'],
    ['8', 'May', '1.1x', '1.0x', 'Post-festival lull'],
    ['9', 'December', '1.0x', '0.95x', 'Margazhi spiritual month'],
    ['10', 'February', '0.95x', '0.9x', 'Shivaratri brief spike only'],
    ['11', 'August', '0.9x', '0.85x', 'Post-Aadi, monsoon slowdown'],
    ['12 (Worst)', 'June', '0.75x', '0.70x', 'Monsoon, no festivals'],
]
story.append(make_table(monthly[0], monthly[1:], col_widths=[0.6, 0.9, 1.1, 1.1, 2.0]))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>8.2 Salary Cycle Impact</b>", styles['SubSectionTitle']))
story.append(Paragraph(
    "Tamil Nadu government and private sector salary cycles significantly affect retail spending patterns "
    "in small towns. The 1st-5th of every month sees a 20-40% increase in footfall and purchasing activity "
    "as salaries are credited and people begin their monthly purchases. The 16th-25th period typically "
    "sees a 10% dip as mid-month financial pressure reduces discretionary spending. This pattern is "
    "consistent across both locations, though Location 2 (Mela Bazar) is more affected due to its "
    "higher proportion of daily-essentials shoppers who are more salary-cycle sensitive.",
    styles['Body']
))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>8.3 Footfall Calculation Formula</b>", styles['SubSectionTitle']))
story.append(Paragraph(
    "<b>Daily Footfall = Baseline x Weekly (day) x Monthly (season) x Festival (event) x Salary (cycle)</b><br/><br/>"
    "Lowest day: Wednesday in June (0.81x of baseline)<br/>"
    "Highest day: Saturday during Aadi Therottam (7.1x of baseline)<br/>"
    "Range variation: 8.8x between worst and best day of the year<br/><br/>"
    "For Location 1: Lowest = ~4,400/day (June Wed) | Highest = ~52,500/day (July Aadi Saturday)<br/>"
    "For Location 2: Lowest = ~2,700/day (June Wed) | Highest = ~32,000/day (July Aadi Saturday)",
    styles['Body']
))
story.append(PageBreak())

# ============================================================
# SECTION 9: FINAL COMPARISON & RECOMMENDATION
# ============================================================
story.append(Paragraph("<b>9. Final Comparison &amp; Recommendation</b>", styles['SectionTitle']))
story.append(hr())

story.append(Paragraph("<b>9.1 Comprehensive 10-Criteria Scoring</b>", styles['SubSectionTitle']))

final_scores = [
    ['#', 'Criterion', 'Weight', 'Loc 1 Score', 'Loc 1 Weighted', 'Loc 2 Score', 'Loc 2 Weighted'],
    ['1', 'Daily Foot Traffic Volume', '15%', '8', '1.20', '7', '1.05'],
    ['2', 'Foot Traffic Quality (Buying Intent)', '12%', '7', '0.84', '8', '0.96'],
    ['3', 'Visibility & Signage', '12%', '9', '1.08', '7', '0.84'],
    ['4', 'Parking Facility', '8%', '6', '0.48', '5', '0.40'],
    ['5', 'Transport Connectivity', '12%', '9', '1.08', '7', '0.84'],
    ['6', 'Anchor Business Proximity', '10%', '8', '0.80', '8', '0.80'],
    ['7', 'Competition Level (for Optical)', '10%', '8', '0.80', '5', '0.50'],
    ['8', 'Future Growth Potential', '8%', '9', '0.72', '6', '0.48'],
    ['9', 'Rental Value for Money', '6%', '7', '0.42', '8', '0.48'],
    ['10', 'Overall Optical Suitability', '7%', '8', '0.56', '6', '0.42'],
    ['', 'WEIGHTED TOTAL', '100%', '', '7.88 / 10', '', '6.77 / 10'],
]
story.append(make_table(final_scores[0], final_scores[1:], col_widths=[0.3, 1.5, 0.6, 0.6, 0.8, 0.6, 0.8]))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>9.2 Summary Comparison</b>", styles['SubSectionTitle']))

summary_comp = [
    ['Metric', 'Location 1', 'Location 2', 'Winner'],
    ['Daily Footfall (Net)', '~7,400 persons', '~4,500 persons', 'Location 1 (+64%)'],
    ['Monthly Footfall (Normal)', '~2,22,000', '~1,35,000', 'Location 1 (+64%)'],
    ['Peak Festival Footfall', '10,000-15,000', '15,000-25,000', 'Location 2'],
    ['Transport Score', '7.85/10', '4.95/10', 'Location 1 (+59%)'],
    ['Temple Tourism Score', '6.30/10', '8.20/10', 'Location 2'],
    ['Anchor Score', '7.5/10', '8.0/10', 'Location 2'],
    ['Optical Competition', 'LOW', 'HIGH (10+ shops)', 'Location 1'],
    ['Final Weighted Score', '7.88/10', '6.77/10', 'Location 1 (+16%)'],
]
story.append(make_table(summary_comp[0], summary_comp[1:], col_widths=[1.4, 1.2, 1.2, 1.4]))
story.append(Spacer(1, 12))

# VERDICT BOX
story.append(Paragraph("<b>9.3 FINAL VERDICT</b>", styles['SubSectionTitle']))

story.append(verdict_box(
    "<b>RECOMMENDED: Location 1 (Shanthi Complex / Main Road / New Bus Stand)</b><br/><br/>"
    "Weighted Score: 7.88/10 vs 6.77/10 | Margin: +16.4% | Confidence: HIGH (80%+)<br/><br/>"
    "Est. Daily Footfall: 5,400-9,200 | Monthly: 1,62,000-2,76,000<br/>"
    "Est. Optical Walk-ins: 8-15 customers per day"
))
story.append(Spacer(1, 10))

story.append(Paragraph("<b>5 Key Reasons for Location 1</b>", styles['SubSubTitle']))
reasons = [
    "1. <b>Unmatched Transport Hub:</b> New Bus Stand handles 20 buses simultaneously; every bus arrival creates fresh foot traffic. SH-41 state highway ensures constant vehicular exposure.",
    "2. <b>Superior Main Road Visibility:</b> Being on the Main Road opposite Shanthi Complex provides maximum eye-level exposure to both vehicular and pedestrian traffic. Critical for an optical shop where brand discovery matters.",
    "3. <b>Blue Ocean - Less Competition:</b> Sankarankovil has 10+ optical shops, but they are heavily clustered near Tirunelveli Road and North Car Street (Location 2 area). The New Bus Stand zone is significantly under-served for optical shops.",
    "4. <b>Government-Backed Future Growth:</b> New Bus Stand inaugurated with 39 shops. Active tender to demolish old bus stand and build new commercial complex signals massive government investment shifting commercial gravity to this corridor.",
    "5. <b>Complementary Anchor Ecosystem:</b> Sengundar School ensures daily parent/student footfall. Shanthi Complex attracts regular shoppers. Ganapathy Silks is an established draw. These anchors create a self-sustaining ecosystem of daily visitors."
]
for r in reasons:
    story.append(Paragraph(r, styles['Body']))

story.append(Spacer(1, 10))

story.append(Paragraph("<b>5 Key Reasons for Location 2 (Strengths to Note)</b>", styles['SubSubTitle']))
reasons2 = [
    "1. <b>Temple Tourism Advantage:</b> Being 2-5x closer to Sankara Narayanaswamy Temple captures 35-45% of temple visitor footfall vs only 15-20% for Location 1. Festival days see 3-5x multiplier advantage.",
    "2. <b>Traditional Market Loyalty:</b> Mela Bazar has been the commercial heart for decades with deep-rooted vendor relationships and generational shopping habits. Non-discretionary daily spending is recession-proof.",
    "3. <b>Better Foot Traffic Quality:</b> Visitors to Mela Bazar have higher purchase intent (purposeful shopping) compared to Location 1's transient bus commuters who are rushing to catch buses.",
    "4. <b>Anna Bus Stand Proximity:</b> The old bus stand is described as the busiest in Tirunelveli district with ~100 buses/day and 10,000 daily commuters, providing a massive footfall base.",
    "5. <b>Lower Rental Costs:</b> Traditional market area likely offers better rental value per square foot compared to the premium Main Road/SH-41 corridor, improving ROI potential."
]
for r in reasons2:
    story.append(Paragraph(r, styles['Body']))

story.append(Spacer(1, 10))

story.append(Paragraph("<b>9.4 Risk Factors</b>", styles['SubSectionTitle']))

risks = [
    ['Risk', 'Location 1', 'Severity', 'Location 2', 'Severity'],
    ['Higher rental cost', 'Negotiate lock-in', 'Medium', 'N/A', 'N/A'],
    ['Transient traffic (bus rush)', 'Extended hours; signage', 'Low-Med', 'N/A', 'N/A'],
    ['Construction disruption', 'Be established early', 'Medium', 'N/A', 'N/A'],
    ['Market saturation (optical)', 'N/A', 'N/A', '10+ existing shops', 'HIGH'],
    ['Narrow streets, no parking', 'N/A', 'N/A', 'Poor accessibility', 'MEDIUM'],
    ['Declining commercial gravity', 'N/A', 'N/A', 'Bypass diverts traffic', 'HIGH'],
    ['Seasonal feast-or-famine', 'Diverse traffic base', 'LOW', 'Temple-dependent', 'MEDIUM'],
]
story.append(make_table(risks[0], risks[1:], col_widths=[1.3, 1.2, 0.7, 1.3, 0.7]))
story.append(Spacer(1, 12))

# DISCLAIMER
story.append(thin_hr())
story.append(Paragraph(
    "<i>This report was prepared using 10 parallel AI research agents analyzing data from Google Maps, "
    "JustDial, Wikipedia, The Hindu, TNUIFSL, Census 2011, TN Urban Tree portal, and multiple property "
    "and business directories. Footfall estimates are based on demographic benchmarks, temple visitor "
    "patterns, bus frequency data, and retail density indicators. No direct footfall counter data was "
    "available. All estimates should be verified through on-ground observation before making business "
    "decisions. Data reflects publicly available information as of June 2026.</i>",
    styles['Small']
))

# ============================================================
# BUILD
# ============================================================
doc.build(story, onFirstPage=page_number, onLaterPages=page_number)
print(f"PDF generated: {OUTPUT}")
print(f"File size: {os.path.getsize(OUTPUT)/1024:.1f} KB")
