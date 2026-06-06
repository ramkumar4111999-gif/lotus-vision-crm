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

OUTPUT = '/home/z/my-project/download/Sankarankovil_Spectacle_Lens_Fitters.pdf'
doc = SimpleDocTemplate(OUTPUT, pagesize=A4, rightMargin=22*mm, leftMargin=22*mm, topMargin=22*mm, bottomMargin=18*mm)

styles = getSampleStyleSheet()
title_s = ParagraphStyle('T', parent=styles['Title'], fontName='DejaVuSans-Bold', fontSize=22, textColor=PRIMARY, spaceAfter=4, alignment=TA_CENTER)
subtitle_s = ParagraphStyle('ST', parent=styles['Normal'], fontName='DejaVuSans', fontSize=12, textColor=SECONDARY, spaceAfter=4, alignment=TA_CENTER)
heading_s = ParagraphStyle('H', parent=styles['Heading1'], fontName='DejaVuSans-Bold', fontSize=15, textColor=PRIMARY, spaceBefore=12, spaceAfter=6)
subheading_s = ParagraphStyle('SH', parent=styles['Heading2'], fontName='DejaVuSans-Bold', fontSize=11, textColor=SECONDARY, spaceBefore=8, spaceAfter=5)
body_s = ParagraphStyle('B', parent=styles['Normal'], fontName='DejaVuSerif', fontSize=9.5, textColor=TEXT_COLOR, spaceAfter=5, leading=13, alignment=TA_JUSTIFY)
note_s = ParagraphStyle('N', parent=styles['Normal'], fontName='DejaVuSans', fontSize=8.5, textColor=SUBTEXT, spaceAfter=3, leading=11)
tc_s = ParagraphStyle('TC', parent=styles['Normal'], fontName='DejaVuSans', fontSize=8.5, textColor=TEXT_COLOR, leading=10, spaceAfter=1)
th_s = ParagraphStyle('TH', parent=styles['Normal'], fontName='DejaVuSans-Bold', fontSize=8.5, textColor=white, leading=10, alignment=TA_CENTER)
footer_s = ParagraphStyle('FT', parent=styles['Normal'], fontName='DejaVuSans', fontSize=7.5, textColor=SUBTEXT, alignment=TA_CENTER)

elements = []

# ============ COVER PAGE ============
elements.append(Spacer(1, 50*mm))
elements.append(HRFlowable(width="80%", thickness=3, color=ACCENT, spaceAfter=18))
elements.append(Paragraph("SPECTACLE LENS FITTERS", title_s))
elements.append(Paragraph("DIRECTORY", ParagraphStyle('T2', parent=title_s, fontSize=20, textColor=SECONDARY, spaceAfter=6)))
elements.append(Spacer(1, 6))
elements.append(Paragraph("SANKARANKOVIL, TAMIL NADU 627756", subtitle_s))
elements.append(Spacer(1, 4))
elements.append(Paragraph("Tenkasi District, Tamil Nadu, India", ParagraphStyle('ST2', parent=subtitle_s, fontSize=10, textColor=SUBTEXT)))
elements.append(Spacer(1, 6))
elements.append(HRFlowable(width="80%", thickness=3, color=ACCENT, spaceAfter=25))

cover_data = [
    [Paragraph("<b>Prepared For:</b>", tc_s), Paragraph("Ram Kumar - Sankaran Kovil Opticals", tc_s)],
    [Paragraph("<b>Location:</b>", tc_s), Paragraph("Sankarankovil, Pincode 627756", tc_s)],
    [Paragraph("<b>Research Date:</b>", tc_s), Paragraph("June 6, 2026", tc_s)],
    [Paragraph("<b>Research Method:</b>", tc_s), Paragraph("3 AI Agents, 20+ Web Searches, 8+ Sources", tc_s)],
    [Paragraph("<b>Source Directories:</b>", tc_s), Paragraph("Justdial, BestDial, IndiaMART, a2v.in, TenkasiCityGuide, Instagram, Facebook, Aravind.org, DrAgarwal.com", tc_s)],
]
ct = Table(cover_data, colWidths=[52*mm, 103*mm])
ct.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), LIGHT_BG),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 7), ('RIGHTPADDING', (0,0), (-1,-1), 7),
]))
elements.append(ct)
elements.append(Spacer(1, 28*mm))
elements.append(HRFlowable(width="60%", thickness=1, color=BORDER_COLOR, spaceAfter=8))
elements.append(Paragraph("Contact Numbers, Addresses & Sources", ParagraphStyle('CF', parent=subtitle_s, fontSize=10, textColor=SUBTEXT)))
elements.append(Paragraph("Confidential - For Business Planning Purposes Only", ParagraphStyle('CF2', parent=subtitle_s, fontSize=9, textColor=SUBTEXT)))
elements.append(PageBreak())

# ============ MAIN DIRECTORY ============
elements.append(Paragraph("1. SANKARANKOVIL SPECTACLE LENS FITTERS - COMPLETE DIRECTORY", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

elements.append(Paragraph(
    "This directory lists all spectacle lens fitters, opticians, and optical shops in Sankarankovil, Tamil Nadu (Pincode 627756). "
    "Each entry includes the shop name, full address, phone number(s), and the online source where the information was found. "
    "The research was conducted using 3 AI agents performing 20+ web searches across 8+ online directories and platforms.",
    body_s
))

# --- Table 1: Shops with Confirmed Phone Numbers ---
elements.append(Paragraph("1.1 Shops with Confirmed Phone Numbers", subheading_s))

confirmed = [
    ["#", "Shop Name", "Full Address", "Phone Number(s)", "Source"],
    ["1", "Shifa Opticals & Eyecare Centre", "36, North Car Street, Sankarankovil-627756", "98432 22989\n63812 45846\n70461 90482", "TenkasiCityGuide\nInstagram"],
    ["2", "Meera Opticals (Est. 1988)", "52, Tiruvengadam Road, Sankarankovil-627756", "81220 96895", "Facebook\nInstagram"],
    ["3", "Sakthi Opticals", "North Car Street East Corner, Sankarankovil-627756", "96887 15417", "a2v.in Directory"],
    ["4", "Vision Care Optics & Clinic", "249, Rajapalayam Road, Opp. IOB Bank, Sankarankovil-627756", "94436 71365\n04636-226434", "BestDial.in"],
    ["5", "Dr. Agarwal's Eye Hospital", "No.69, South Car Street, Near Sankara Narayanan Temple, Sankarankovil-627750", "95949 24456\n73959 02020", "dragarwal.com"],
    ["6", "Aravind Eye Hospital", "No.214, South Chariot Street, Near Sankara Narayana Temple, Sankarankovil-627756", "04636-222055", "aravind.org"],
    ["7", "Velan Eye Care & Opticals", "Sankarankovil-627756", "84288 27767", "a2v.in Directory"],
    ["8", "GV Hospital (Bones & Eyes)", "80/6, NGO Colony, Sankarankovil", "99955 58216", "Instagram"],
    ["9", "Revi Eye Care", "Sankarankovil-627756", "91599 98390", "Instagram"],
    ["10", "Smart Opticals", "Perunkottur, Sankarankovil", "89401 12255\n97867 63344", "Justdial"],
]

header_row = [Paragraph("<b>"+h+"</b>", th_s) for h in confirmed[0]]
data = [header_row]
for row in confirmed[1:]:
    data.append([Paragraph(str(c), tc_s) for c in row])

t = Table(data, colWidths=[8*mm, 32*mm, 38*mm, 28*mm, 24*mm])
style_cmds = [
    ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4), ('RIGHTPADDING', (0,0), (-1,-1), 4),
]
for i in range(1, len(data)):
    bg = white if i % 2 == 1 else TABLE_ROW_ALT
    style_cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
t.setStyle(TableStyle(style_cmds))
elements.append(t)
elements.append(Spacer(1, 10))

# --- Table 2: Shops on Justdial (phone via Justdial) ---
elements.append(Paragraph("1.2 Shops Listed on Justdial (Phone Available on Justdial Page)", subheading_style := subheading_s))
elements.append(Paragraph(
    "The following shops are listed on Justdial but their phone numbers are gated behind the 'Call Now' feature. "
    "Visit justdial.com and search 'Opticians in Sankarankovil' to obtain their direct phone numbers.",
    body_s
))

justdial = [
    ["#", "Shop Name", "Address", "Rating", "Source URL"],
    ["1", "Sheeba Opticals", "No.302, North Car Street, Sankarankovil", "4.9 (330+ reviews)", ParagraphStyle('link', parent=tc_s, textColor=HexColor('#1565c0'), fontSize=7.5)],
    ["2", "Chennai Opticals", "TDTA Complex, Near Anand Pharma, Railway Feeder Road", "5.0 (1 review)", "justdial.com"],
    ["3", "Arasan Glasses", "Near Bus Stand, Sankarankovil", "Listed", "justdial.com"],
    ["4", "Eye Care Optical & Clinic", "New Bus Stand, Inside, Ayyapuram", "Listed", "justdial.com"],
]

header_row2 = [Paragraph("<b>"+h+"</b>", th_s) for h in justdial[0]]
data2 = [header_row2]
for row in justdial[1:]:
    data2.append([Paragraph(str(c), tc_s) for c in row])

t2 = Table(data2, colWidths=[8*mm, 32*mm, 45*mm, 28*mm, 30*mm])
style_cmds2 = [
    ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4), ('RIGHTPADDING', (0,0), (-1,-1), 4),
]
for i in range(1, len(data2)):
    bg = white if i % 2 == 1 else TABLE_ROW_ALT
    style_cmds2.append(('BACKGROUND', (0,i), (-1,i), bg))
t2.setStyle(TableStyle(style_cmds2))
elements.append(t2)
elements.append(Spacer(1, 10))

# --- Source URLs Reference ---
elements.append(Paragraph("2. SOURCE URLS REFERENCE", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

elements.append(Paragraph(
    "Below are the exact source URLs where the shop information was found. These sources can be visited directly "
    "to verify the details or obtain additional information such as working hours, services offered, and customer reviews.",
    body_s
))

sources = [
    ["#", "Source", "URL / Reference"],
    ["1", "Justdial - Sheeba Opticals", "justdial.com/Sankarankovil/Sheeba-Opticals"],
    ["2", "Justdial - Chennai Opticals", "justdial.com/Sankarankovil/Chennai-Opticals-Near-Anand-Pharma"],
    ["3", "Justdial - Opticians List", "justdial.com/Sankarankovil/Opticians/nct-10344205"],
    ["4", "BestDial - Vision Care Optics", "bestdial.in/places/vision-care-optics-a-c-vision-care-clinic"],
    ["5", "TenkasiCityGuide - Shifa Opticals", "tenkasicityguide.com/listing/shifa-opticals"],
    ["6", "a2v.in - Sakthi Opticals", "a2v.in/000/Optical-Showrooms/List-in-Tamilnadu.html"],
    ["7", "a2v.in - Velan Eye Care", "a2v.in/000/Optical-Showrooms/List-in-Tamilnadu.html"],
    ["8", "Dr. Agarwal's Official Website", "dragarwal.com/eye-clinic/tirunelveli/sankarankoil"],
    ["9", "Aravind Eye Hospital Website", "aravind.org/hospitals/tirunelveli"],
    ["10", "Instagram - Shifa Opticals", "instagram.com/p/Cgi4AXvp_OK"],
    ["11", "Instagram - GV Hospital", "instagram.com/gvhospitalsnkl"],
    ["12", "Instagram - Revi Eye Care", "instagram.com/p/DScjxSRk_xN"],
    ["13", "Facebook - Meera Opticals", "facebook.com/meeraopticals"],
]

header_row3 = [Paragraph("<b>"+h+"</b>", th_s) for h in sources[0]]
data3 = [header_row3]
for row in sources[1:]:
    data3.append([Paragraph(str(c), tc_s) for c in row])

t3 = Table(data3, colWidths=[8*mm, 42*mm, 105*mm])
style_cmds3 = [
    ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4), ('RIGHTPADDING', (0,0), (-1,-1), 4),
]
for i in range(1, len(data3)):
    bg = white if i % 2 == 1 else TABLE_ROW_ALT
    style_cmds3.append(('BACKGROUND', (0,i), (-1,i), bg))
t3.setStyle(TableStyle(style_cmds3))
elements.append(t3)

elements.append(Spacer(1, 10))

# --- Quick Reference Card ---
elements.append(Paragraph("3. QUICK REFERENCE - ALL PHONE NUMBERS AT A GLANCE", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))

quick_ref = [
    ["#", "Shop Name", "Primary Phone", "Alternate Phone"],
    ["1", "Shifa Opticals", "98432 22989", "63812 45846 / 70461 90482"],
    ["2", "Meera Opticals", "81220 96895", "-"],
    ["3", "Sakthi Opticals", "96887 15417", "-"],
    ["4", "Vision Care Optics", "94436 71365", "04636-226434"],
    ["5", "Dr. Agarwal's Eye Hospital", "95949 24456", "73959 02020"],
    ["6", "Aravind Eye Hospital", "04636-222055", "-"],
    ["7", "Velan Eye Care", "84288 27767", "-"],
    ["8", "GV Hospital", "99955 58216", "-"],
    ["9", "Revi Eye Care", "91599 98390", "-"],
    ["10", "Smart Opticals", "89401 12255", "97867 63344"],
    ["11", "Sheeba Opticals", "Via Justdial", "-"],
    ["12", "Chennai Opticals", "Via Justdial", "-"],
    ["13", "Arasan Glasses", "Via Justdial", "-"],
    ["14", "Eye Care Optical", "Via Justdial", "-"],
]

header_row4 = [Paragraph("<b>"+h+"</b>", th_s) for h in quick_ref[0]]
data4 = [header_row4]
for row in quick_ref[1:]:
    phone_style = ParagraphStyle('ph', parent=tc_s, textColor=GREEN, fontName='DejaVuSans-Bold')
    jd_style = ParagraphStyle('jd', parent=tc_s, textColor=HexColor('#e65100'), fontName='DejaVuSans')
    if "Justdial" in str(row[2]):
        data4.append([Paragraph(str(row[0]), tc_s), Paragraph(str(row[1]), tc_s), Paragraph(row[2], jd_style), Paragraph(str(row[3]), jd_style)])
    else:
        data4.append([Paragraph(str(row[0]), tc_s), Paragraph(str(row[1]), tc_s), Paragraph(row[2], phone_style), Paragraph(str(row[3]), tc_s)])

t4 = Table(data4, colWidths=[8*mm, 40*mm, 35*mm, 40*mm])
style_cmds4 = [
    ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4), ('RIGHTPADDING', (0,0), (-1,-1), 4),
]
for i in range(1, len(data4)):
    bg = white if i % 2 == 1 else TABLE_ROW_ALT
    style_cmds4.append(('BACKGROUND', (0,i), (-1,i), bg))
t4.setStyle(TableStyle(style_cmds4))
elements.append(t4)

elements.append(Spacer(1, 10))
elements.append(Paragraph("4. HOW TO GET JUSTDIAL PHONE NUMBERS", heading_s))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))
elements.append(Paragraph(
    "For the 4 shops listed on Justdial (Sheeba Opticals, Chennai Opticals, Arasan Glasses, Eye Care Optical), "
    "their phone numbers are available through Justdial's 'Call Now' feature. Here are the steps to obtain them:",
    body_s
))
steps = [
    "1. Visit <b>justdial.com</b> on your browser or mobile app",
    "2. Search for <b>'Opticians in Sankarankovil'</b>",
    "3. Click on the shop name to open its listing page",
    "4. The phone number will be displayed with a 'Call Now' button",
    "5. Alternatively, call Justdial at <b>08888888888</b> and ask for the shop's contact number",
    "6. You can also visit the direct Justdial URLs listed in the Source Reference section above",
]
for step in steps:
    elements.append(Paragraph(step, note_s))

elements.append(Spacer(1, 10))
elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=6))
elements.append(Paragraph(
    "Report compiled on June 6, 2026 | Prepared for Ram Kumar - Sankaran Kovil Opticals | "
    "Sankarankovil Spectacle Lens Fitters Directory | Confidential",
    footer_s
))

doc.build(elements)
print(f"PDF generated: {OUTPUT}")
print(f"Size: {os.path.getsize(OUTPUT)/1024:.1f} KB")
