import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))

PRIMARY = HexColor('#1a237e')
SECONDARY = HexColor('#283593')
ACCENT = HexColor('#ffc107')
LIGHT_BG = HexColor('#e8eaf6')
TEXT_COLOR = HexColor('#212121')
SUBTEXT = HexColor('#616161')
TABLE_HEADER = HexColor('#1a237e')
TABLE_ROW_ALT = HexColor('#f5f5f5')
BORDER_COLOR = HexColor('#c5cae9')
GREEN = HexColor('#2e7d32')
AMBER = HexColor('#f57f17')

OUTPUT = '/home/z/my-project/download/Rajapalayam_Wholesale_Spectacle_Lenses.pdf'
doc = SimpleDocTemplate(OUTPUT, pagesize=A4, rightMargin=22*mm, leftMargin=22*mm, topMargin=22*mm, bottomMargin=18*mm)

styles = getSampleStyleSheet()
title_s = ParagraphStyle('T', parent=styles['Title'], fontName='DejaVuSans-Bold', fontSize=20, textColor=PRIMARY, spaceAfter=4, alignment=TA_CENTER)
subtitle_s = ParagraphStyle('ST', parent=styles['Normal'], fontName='DejaVuSans', fontSize=12, textColor=SECONDARY, spaceAfter=4, alignment=TA_CENTER)
heading_s = ParagraphStyle('H', parent=styles['Heading1'], fontName='DejaVuSans-Bold', fontSize=14, textColor=PRIMARY, spaceBefore=12, spaceAfter=6)
subheading_s = ParagraphStyle('SH', parent=styles['Heading2'], fontName='DejaVuSans-Bold', fontSize=11, textColor=SECONDARY, spaceBefore=8, spaceAfter=5)
body_s = ParagraphStyle('B', parent=styles['Normal'], fontName='DejaVuSerif', fontSize=9.5, textColor=TEXT_COLOR, spaceAfter=5, leading=13, alignment=TA_JUSTIFY)
note_s = ParagraphStyle('N', parent=styles['Normal'], fontName='DejaVuSans', fontSize=8.5, textColor=SUBTEXT, spaceAfter=3, leading=11)
tc_s = ParagraphStyle('TC', parent=styles['Normal'], fontName='DejaVuSans', fontSize=8.5, textColor=TEXT_COLOR, leading=10, spaceAfter=1)
th_s = ParagraphStyle('TH', parent=styles['Normal'], fontName='DejaVuSans-Bold', fontSize=8.5, textColor=white, leading=10, alignment=TA_CENTER)
footer_s = ParagraphStyle('FT', parent=styles['Normal'], fontName='DejaVuSans', fontSize=7.5, textColor=SUBTEXT, alignment=TA_CENTER)
green_tc = ParagraphStyle('GTC', parent=tc_s, textColor=GREEN, fontName='DejaVuSans-Bold')
amber_tc = ParagraphStyle('ATC', parent=tc_s, textColor=AMBER, fontName='DejaVuSans-Bold')

def make_table(rows, widths, first_col_center=False):
    header = [Paragraph("<b>"+h+"</b>", th_s) for h in rows[0]]
    data = [header]
    for row in rows[1:]:
        data.append([Paragraph(str(c), tc_s) for c in row])
    t = Table(data, colWidths=widths)
    cmds = [
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4), ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]
    for i in range(1, len(data)):
        bg = white if i % 2 == 1 else TABLE_ROW_ALT
        cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
    t.setStyle(TableStyle(cmds))
    return t

elements = []

# ============ COVER PAGE ============
elements.append(Spacer(1, 48*mm))
elements.append(HRFlowable(width="80%", thickness=3, color=ACCENT, spaceAfter=16))
elements.append(Paragraph("WHOLESALE SPECTACLE LENSES", title_s))
elements.append(Paragraph("SHOP DIRECTORY", ParagraphStyle('T2', parent=title_s, fontSize=18, textColor=SECONDARY, spaceAfter=6)))
elements.append(Spacer(1, 6))
elements.append(Paragraph("RAJAPALAYAM, TAMIL NADU 626117", subtitle_s))
elements.append(Spacer(1, 4))
elements.append(Paragraph("Virudhunagar District, Tamil Nadu, India", ParagraphStyle('ST2', parent=subtitle_s, fontSize=10, textColor=SUBTEXT)))
elements.append(Spacer(1, 6))
elements.append(HRFlowable(width="80%", thickness=3, color=ACCENT, spaceAfter=22))

cover = [
    [Paragraph("<b>Prepared For:</b>", tc_s), Paragraph("Ram Kumar - Sankaran Kovil Opticals", tc_s)],
    [Paragraph("<b>Location:</b>", tc_s), Paragraph("Rajapalayam, Pincode 626117, Virudhunagar District", tc_s)],
    [Paragraph("<b>Research Date:</b>", tc_s), Paragraph("June 6, 2026", tc_s)],
    [Paragraph("<b>Research Method:</b>", tc_s), Paragraph("3 AI Agents, 20+ Web Searches, 8+ Sources", tc_s)],
    [Paragraph("<b>Source Directories:</b>", tc_s), Paragraph("Justdial, IndiaMART, a2v.in, IDBF.in, Instagram, Facebook, Titan Eye+, AdityaOpticals.com", tc_s)],
]
ct = Table(cover, colWidths=[52*mm, 103*mm])
ct.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), LIGHT_BG),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 7), ('RIGHTPADDING', (0,0), (-1,-1), 7),
]))
elements.append(ct)
elements.append(Spacer(1, 25*mm))
elements.append(HRFlowable(width="60%", thickness=1, color=BORDER_COLOR, spaceAfter=8))
elements.append(Paragraph("Wholesale Spectacle Lens Dealers & Suppliers", ParagraphStyle('CF', parent=subtitle_s, fontSize=10, textColor=SUBTEXT)))
elements.append(Paragraph("Confidential - For Business Planning Purposes Only", ParagraphStyle('CF2', parent=subtitle_s, fontSize=9, textColor=SUBTEXT)))
elements.append(PageBreak())

# ============ SECTION 1: COMPLETE DIRECTORY ============
elements.append(Paragraph("1. RAJAPALAYAM WHOLESALE SPECTACLE LENSES - COMPLETE DIRECTORY", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

elements.append(Paragraph(
    "This directory lists all wholesale spectacle lens dealers, optical wholesalers, and spectacle frame suppliers "
    "in Rajapalayam, Tamil Nadu (Pincode 626117). Rajapalayam is a tier-3 town in Virudhunagar district where "
    "most optical businesses operate as retail-cum-wholesale dealers. While no dedicated wholesale-only spectacle "
    "lens manufacturer operates within the city, several shops serve as wholesale distributors and B2B suppliers "
    "to smaller optical shops in the region. Each entry includes the shop name, full address, phone number(s), "
    "wholesale status, and the online source where the information was found.",
    body_s
))

# --- 1.1 Confirmed Wholesale Dealers ---
elements.append(Paragraph("1.1 Confirmed Wholesale / B2B Dealers", subheading_s))

ws_confirmed = [
    ["#", "Shop Name", "Full Address", "Phone Number(s)", "Wholesale Type"],
    ["1", "Sha Opticals", "No.80, AKDR Market, AKDR Statue Right Side, Rajapalayam-626117", "90870 71990", "Spectacle Frame Wholesaler (Justdial confirmed)"],
    ["2", "Star Opticals", "Tenkasi Road, Opp. Chitra Hospital, Rajapalayam-626117", "98848 84332\n93423 52477\n80478 19729\n70102 04644\n96005 59786", "IndiaMART B2B Supplier - Frames, Sunglasses, Lenses, Goggles"],
    ["3", "Aditya Opticals", "Rajapalayam, Tamil Nadu (visit adityaopticals.com)", "Visit Website", "Wholesale Distributor - Cases, Frames, Lenses, Goggles"],
]
elements.append(make_table(ws_confirmed, [8*mm, 28*mm, 40*mm, 30*mm, 49*mm]))
elements.append(Spacer(1, 10))

# --- 1.2 Probable Wholesale / Dealers ---
elements.append(Paragraph("1.2 Probable Wholesale / Retail-Cum-Wholesale Dealers", subheading_s))
elements.append(Paragraph(
    "The following shops are optical retailers that likely also serve as wholesale/B2B suppliers based on their "
    "brand portfolio (Essilor, Zeiss, Hoya), business size, or IndiaMART/Justdial listing categories. Contact "
    "them directly to confirm wholesale pricing and minimum order quantities.",
    body_s
))

ws_probable = [
    ["#", "Shop Name", "Full Address", "Phone Number(s)", "Notes"],
    ["4", "Rajapalayam Opticals", "905, Tenkasi Road / NH744, Avarampatti, Near Old Bus Stand, Rajapalayam-626117", "89258 99048\n73737 30474", "Stocks Essilor, Zeiss, Ray Ban, Marc Jacobs. You&Eye Awards Boutique Store"],
    ["5", "JVJ Opticals", "Madurai Road, Sevalpatti Street, Near Thraupathi Amman Kovil, Rajapalayam-626117", "99440 50540", "Certified Bausch+Lomb Contact Lens Dealer. 5.0 rating, 79 reviews"],
    ["6", "JK Eye Care & Opticals", "Rajapalayam-626117", "94862 38407\n79428 72569", "IndiaMART B2B listed - Optical Frames & Glasses Dealer"],
    ["7", "P.S.K. Lakshmanan & Sons", "Rajapalayam-626117", "Via IndiaMART", "Long-standing dealer. Up to 10 employees. GST registered since 2017"],
    ["8", "Sri Sai Opticals", "Rajapalayam-626117", "76675 58811", "Optical retailer/dealer"],
    ["9", "Sri Chennai Opticals", "206D, PACR Road, Opp. Sri Krishna Hospital, Rajapalayam-626117", "Via Justdial", "Spectacle Glass Dealer"],
    ["10", "Sri Murugan Opticals", "2/3A, Bypass Road, Opp. Srivilliputhur, Rajapalayam-626117", "Via Website", "Custom Lenses & Frames"],
]
elements.append(make_table(ws_probable, [8*mm, 28*mm, 38*mm, 26*mm, 55*mm]))
elements.append(Spacer(1, 10))

# --- 1.3 Retail Only (For Reference) ---
elements.append(Paragraph("1.3 Retail Only (For Reference)", subheading_s))

retail = [
    ["#", "Shop Name", "Full Address", "Phone Number", "Type"],
    ["11", "Titan Eye+ Rajapalayam", "No.431, Tenkasi Road, Near DBS Bank, Rajapalayam-626117", "78459 48668", "Corporate Chain (Retail Only)"],
]
elements.append(make_table(retail, [8*mm, 30*mm, 50*mm, 30*mm, 47*mm]))

elements.append(PageBreak())

# ============ SECTION 2: SOURCE URLS ============
elements.append(Paragraph("2. COMPLETE SOURCE URLS REFERENCE", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

elements.append(Paragraph(
    "Below are the exact source URLs where each shop's information was found. These sources can be visited "
    "directly to verify details, obtain additional information, or view customer reviews and product catalogs.",
    body_s
))

sources = [
    ["#", "Shop Name", "Source Platform", "Source URL / Reference"],
    ["1", "Sha Opticals", "Justdial", "justdial.com/Virudhunagar/Sha-Opticals-Near-Akdr-Status"],
    ["2", "Sha Opticals", "Instagram", "instagram.com/sha_optical_rjpm"],
    ["3", "Star Opticals", "IndiaMART", "indiamart.com/company/131336115/"],
    ["4", "Star Opticals", "Facebook", "facebook.com/p/STAR-Optical-Rajapalayam"],
    ["5", "Star Opticals", "a2v.in Directory", "a2v.in/000/Optical-Showrooms/List-in-Tamilnadu.html"],
    ["6", "Aditya Opticals", "Official Website", "adityaopticals.com"],
    ["7", "Rajapalayam Opticals", "Justdial", "justdial.com/Virudhunagar/Rajapalayam-Opticals"],
    ["8", "Rajapalayam Opticals", "You&Eye Awards", "awards.youandeyemag.com/rajapalayam-opticals"],
    ["9", "Rajapalayam Opticals", "CallVirudhunagar", "callvirudhunagar.com/rajapalayam-opticals"],
    ["10", "JVJ Opticals", "Justdial", "justdial.com/Virudhunagar/Jvj-Opticals"],
    ["11", "JVJ Opticals", "a2v.in Directory", "a2v.in/000/Optical-Showrooms/List-in-Tamilnadu.html"],
    ["12", "JK Eye Care", "IndiaMART", "indiamart.com/company/7822747/"],
    ["13", "JK Eye Care", "a2v.in Directory", "a2v.in/000/Optical-Showrooms/List-in-Tamilnadu.html"],
    ["14", "P.S.K. Lakshmanan", "IndiaMART", "indiamart.com/psk-lakshmanan-sons/profile.html"],
    ["15", "Sri Sai Opticals", "a2v.in Directory", "a2v.in/000/Optical-Showrooms/List-in-Tamilnadu.html"],
    ["16", "Sri Chennai Opticals", "Justdial", "justdial.com/Virudhunagar/Opticians-in-Rajapalayam"],
    ["17", "Titan Eye+", "Official Website", "titaneyeplus.com/stores/india/tamil-nadu/rajapalayam"],
]
elements.append(make_table(sources, [8*mm, 28*mm, 25*mm, 94*mm]))

elements.append(Spacer(1, 10))

# ============ SECTION 3: JUSTDIAL DIRECTORY PAGES ============
elements.append(Paragraph("3. JUSTDIAL DIRECTORY PAGES FOR RAJAPALAYAM", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

elements.append(Paragraph(
    "Justdial lists multiple optical categories for Rajapalayam. Visit these directory pages directly to find "
    "additional shops and their phone numbers (Justdial requires page visit to reveal phone numbers):",
    body_s
))

jd_pages = [
    ["#", "Category", "Justdial URL", "Count"],
    ["1", "Opticians in Rajapalayam", "justdial.com/Virudhunagar/Opticians-in-Rajapalayam/nct-10344205", "21 listings"],
    ["2", "Spectacle Dealers in Rajapalayam", "justdial.com/Virudhunagar/Spectacle-Dealers-in-Rajapalayam/nct-10446742", "12 listings"],
    ["3", "Optical Frame Dealers", "justdial.com/Virudhunagar/Optical-Frame-Dealers-in-Rajapalayam/nct-10343990", "Multiple listings"],
    ["4", "Optical Lens Dealers", "justdial.com/Virudhunagar/Optical-Lens-Dealers-in-Rajapalayam/nct-10344088", "Multiple listings"],
    ["5", "Contact Lens Dealers", "justdial.com/Virudhunagar/Contact-Lens-Dealers-in-Rajapalayam/nct-10132192", "Multiple listings"],
    ["6", "IDBF.in Directory", "rajapalayam.idbf.in/optical", "24 listings"],
]
elements.append(make_table(jd_pages, [8*mm, 35*mm, 85*mm, 25*mm]))

elements.append(Spacer(1, 10))

# ============ SECTION 4: QUICK REFERENCE ============
elements.append(Paragraph("4. QUICK REFERENCE - ALL PHONE NUMBERS AT A GLANCE", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

quick = [
    ["#", "Shop Name", "Primary Phone", "Alternate Phone(s)"],
    ["1", "Sha Opticals (Wholesale)", "90870 71990", "-"],
    ["2", "Star Opticals (B2B)", "98848 84332", "93423 52477 / 80478 19729 / 70102 04644"],
    ["3", "Rajapalayam Opticals", "89258 99048", "73737 30474"],
    ["4", "JVJ Opticals", "99440 50540", "-"],
    ["5", "JK Eye Care", "94862 38407", "79428 72569"],
    ["6", "Sri Sai Opticals", "76675 58811", "-"],
    ["7", "Titan Eye+ Rajapalayam", "78459 48668", "-"],
    ["8", "Aditya Opticals", "Visit adityaopticals.com", "-"],
    ["9", "P.S.K. Lakshmanan & Sons", "Via IndiaMART", "-"],
    ["10", "Sri Chennai Opticals", "Via Justdial", "-"],
    ["11", "Sri Murugan Opticals", "Via Website", "-"],
]
elements.append(make_table(quick, [8*mm, 38*mm, 35*mm, 74*mm]))

elements.append(Spacer(1, 10))

# ============ SECTION 5: WHOLESALE SOURCING TIPS ============
elements.append(Paragraph("5. WHOLESALE SOURCING NOTES", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

elements.append(Paragraph(
    "Rajapalayam is a tier-3 town where dedicated wholesale-only spectacle lens distributors are limited. Most "
    "businesses operate as retail-cum-wholesale dealers. For your Sankaran Kovil Opticals business, here are "
    "key recommendations for sourcing wholesale spectacle lenses:",
    body_s
))

tips = [
    "<b>Star Opticals</b> (IndiaMART B2B Verified) - Best wholesale contact in Rajapalayam with 5 phone numbers, "
    "GST registration, and IndiaMART B2B presence. Supplies spectacle frames, sunglasses, reading glasses, and goggles. "
    "Also deals in Essilor and Zeiss lenses. Recommended as primary wholesale contact.",
    "<b>Sha Opticals</b> (Justdial Confirmed Wholesaler) - Explicitly listed as 'Spectacle Frame Wholesalers' on Justdial. "
    "Stocks premium brands including ZEISS, Essilor, Hoya, and GKB lenses. Good option for both frames and lenses.",
    "<b>Rajapalayam Opticals</b> - The most established optical showroom in Rajapalayam with premium brand portfolio "
    "(Essilor, Zeiss, Ray Ban, Marc Jacobs, Lacoste). Listed as a 'Boutique Store' on You&Eye Awards. May offer "
    "competitive B2B pricing on branded lenses due to volume.",
    "<b>Nearby Wholesale Hubs</b> - For larger wholesale orders, consider contacting distributors in Madurai (~65 km from "
    "Sankarankovil) and Chennai (~500 km) where major wholesale optical distributors operate with wider inventories.",
    "<b>Direct from Manufacturers</b> - Essilor, ZEISS, and Hoya have regional offices in Tamil Nadu. Contacting them "
    "directly for dealer/distributor registration may yield better pricing than going through local dealers.",
]
for tip in tips:
    elements.append(Paragraph(tip, note_s))
    elements.append(Spacer(1, 3))

elements.append(Spacer(1, 10))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=6))
elements.append(Paragraph(
    "Report compiled on June 6, 2026 | Prepared for Ram Kumar - Sankaran Kovil Opticals | "
    "Rajapalayam Wholesale Spectacle Lenses Directory | Confidential",
    footer_s
))

doc.build(elements)
print(f"PDF generated: {OUTPUT}")
print(f"Size: {os.path.getsize(OUTPUT)/1024:.1f} KB")
