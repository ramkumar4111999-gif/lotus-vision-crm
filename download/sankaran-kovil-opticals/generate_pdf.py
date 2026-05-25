#!/usr/bin/env python3
"""Sankaran Kovil Opticals - Master Business Plan PDF Generator"""
import sys, os, hashlib

sys.path.insert(0, os.path.join(os.environ.get('PDF_SKILL_DIR', '/home/z/my-project/skills/pdf'), 'scripts'))
from pdf import install_font_fallback

install_font_fallback()

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# ━━ Color Palette ━━
ACCENT = colors.HexColor('#3184a0')
TEXT_PRIMARY = colors.HexColor('#232220')
TEXT_MUTED = colors.HexColor('#828078')
BG_PAGE = colors.HexColor('#f3f3f2')
TABLE_HEADER_COLOR = colors.HexColor('#5d5337')
TABLE_ROW_ODD = colors.HexColor('#f3f2f0')
TABLE_ROW_EVEN = colors.white
SUCCESS = colors.HexColor('#487a59')
WARNING = colors.HexColor('#a58441')
ERROR = colors.HexColor('#9e463e')

# ━━ Styles ━━
W = A4[0]
H = A4[1]
LM = 1.0 * inch
RM = 1.0 * inch
AW = W - LM - RM

s_title = ParagraphStyle('Title', fontName='Times New Roman', fontSize=28, leading=34, alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=6)
s_h1 = ParagraphStyle('H1', fontName='Times New Roman', fontSize=20, leading=26, textColor=ACCENT, spaceBefore=18, spaceAfter=10)
s_h2 = ParagraphStyle('H2', fontName='Times New Roman', fontSize=16, leading=22, textColor=colors.HexColor('#5d5337'), spaceBefore=14, spaceAfter=8)
s_h3 = ParagraphStyle('H3', fontName='Times New Roman', fontSize=13, leading=18, textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6)
s_body = ParagraphStyle('Body', fontName='Times New Roman', fontSize=10.5, leading=17, alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=6)
s_body_left = ParagraphStyle('BodyLeft', fontName='Times New Roman', fontSize=10.5, leading=17, alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=6)
s_bullet = ParagraphStyle('Bullet', fontName='Times New Roman', fontSize=10.5, leading=17, alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=4, leftIndent=20, bulletIndent=8)
s_caption = ParagraphStyle('Caption', fontName='Times New Roman', fontSize=9, leading=13, alignment=TA_CENTER, textColor=TEXT_MUTED, spaceBefore=3, spaceAfter=6)
s_callout = ParagraphStyle('Callout', fontName='Times New Roman', fontSize=11, leading=17, alignment=TA_LEFT, textColor=ACCENT, spaceAfter=6, leftIndent=15, borderColor=ACCENT, borderWidth=0, borderPadding=6)
s_toc_h1 = ParagraphStyle('TOCH1', fontName='Times New Roman', fontSize=13, leftIndent=20, leading=22, textColor=TEXT_PRIMARY)
s_toc_h2 = ParagraphStyle('TOCH2', fontName='Times New Roman', fontSize=11, leftIndent=40, leading=18, textColor=TEXT_MUTED)

hdr_s = ParagraphStyle('Hdr', fontName='Times New Roman', fontSize=10, textColor=colors.white, alignment=TA_CENTER)
cel_s = ParagraphStyle('Cel', fontName='Times New Roman', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
cel_l = ParagraphStyle('CelL', fontName='Times New Roman', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT)

MAX_KEEP = A4[1] * 0.4

def skt(els):
    t = 0
    for e in els:
        w2, h2 = e.wrap(AW, A4[1])
        t += h2
    if t <= MAX_KEEP:
        return [KeepTogether(els)]
    elif len(els) >= 2:
        return [KeepTogether(els[:2])] + list(els[2:])
    return list(els)

def make_table(headers, rows, col_widths=None):
    data = [[Paragraph(f'<b>{h}</b>', hdr_s) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), cel_l if i == 0 else cel_s) for i, c in enumerate(row)])
    if not col_widths:
        n = len(headers)
        col_widths = [AW / n] * n
    tbl = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d0caba')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

# ━━ TOC Template ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def heading(text, style, level=0):
    key = 'h_' + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text.replace('<b>', '').replace('</b>', '')
    p.bookmark_key = key
    return p

H1_THRESHOLD = (A4[1] - 2*inch) * 0.15

# ━━ Build Document ━━
output_path = '/home/z/my-project/download/sankaran-kovil-opticals/MASTER-BUSINESS-PLAN.pdf'
doc = TocDocTemplate(output_path, pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=0.9*inch, bottomMargin=0.9*inch)

story = []

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TABLE OF CONTENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph('<b>Table of Contents</b>', ParagraphStyle('TocTitle', fontName='Times New Roman', fontSize=22, leading=28, alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=12)))
story.append(Spacer(1, 6))
toc = TableOfContents()
toc.levelStyles = [s_toc_h1, s_toc_h2]
story.append(toc)
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 1: EXECUTIVE SUMMARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(skt([CondPageBreak(H1_THRESHOLD), heading('<b>1. Executive Summary</b>', s_h1, 0)]))
story.append(Paragraph(
    'This document presents a comprehensive Master Business Plan for <b>Sankaran Kovil Opticals</b>, a full-service optical retail establishment to be located in the temple town of Sankarankovil, Tenkasi District, Tamil Nadu, India. The plan was developed through an extensive multi-agent research process involving 20 specialized analysts working in parallel across four strategic teams: Marketing, Analysis, Sales, and Support. Each team conducted independent market research, competitive intelligence, and strategic planning to produce actionable recommendations tailored to the local market context of Sankarankovil and its surrounding region.', s_body))
story.append(Paragraph(
    'The Indian eyewear market is valued at approximately USD 4.1 billion (2024) and is growing at a compound annual growth rate (CAGR) of 11.4 percent, driven by increasing screen time, growing awareness of eye health, fashion trends in eyewear, and rising disposable incomes in Tier 3 and Tier 4 towns. Tamil Nadu represents a significant regional market estimated at USD 250-450 million. Sankarankovil, with a population of approximately 70,000-85,000 people and a catchment area extending to 100,000-150,000 individuals, presents a compelling underserved opportunity for a professionally managed optical retail business.', s_body))
story.append(Paragraph(
    'The plan addresses every aspect of launching and growing the business, from brand identity and digital marketing to competitor strategy, financial projections, and operational management. Total startup investment is estimated at INR 12-13.5 lakh, with break-even projected at month 7-8 of operations. The three-year revenue target under moderate assumptions ranges from INR 16.8 lakh in Year 1 to INR 26.4 lakh by Year 3, delivering a projected 157 percent return on investment.', s_body))

story.append(Spacer(1, 12))
story.extend(skt([heading('<b>Key Numbers at a Glance</b>', s_h2, 1)]))
story.append(Spacer(1, 6))
story.append(make_table(
    ['Metric', 'Value'],
    [
        ['India Eyewear Market', 'USD 4.1B+ (2024), 11.4% CAGR'],
        ['Tamil Nadu Optical Market', '~USD 250-450M'],
        ['Sankarankovil Population', '~70,000-85,000'],
        ['Estimated Local Market', 'INR 1.8-3.2 Crore annually'],
        ['Total Startup Investment', 'INR 12-13.5 Lakh'],
        ['Break-Even Point', 'Month 7-8'],
        ['Year 1 Revenue (Moderate)', 'INR 16.8 Lakh'],
        ['Year 3 Revenue (Moderate)', 'INR 26.4 Lakh'],
        ['3-Year ROI', '157%'],
        ['Direct Competitors in Area', '8-12 local shops'],
        ['Nearest Chain Competitor', 'Titan Eye+ / Lenskart in Tenkasi'],
    ],
    [AW*0.45, AW*0.55]
))
story.append(Paragraph('<b>Table 1:</b> Key Business Metrics Overview', s_caption))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 2: MARKETING TEAM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.extend(skt([CondPageBreak(H1_THRESHOLD), heading('<b>2. Marketing Team (6 Agents)</b>', s_h1, 0)]))
story.append(Paragraph(
    'The Marketing Team conducted deep research across six critical domains: brand strategy, digital marketing, social media, content planning, local SEO, and promotional offers. All strategies are specifically tailored for the Sankarankovil market, incorporating Tamil cultural context, local consumer behavior patterns, and the unique characteristics of a Tier 4 temple town in Tamil Nadu.', s_body))

# 2.1 Brand Strategy
story.extend(skt([heading('<b>2.1 Brand Strategy</b>', s_h2, 1)]))
story.append(Paragraph(
    'The brand strategy establishes Sankaran Kovil Opticals as a trusted, community-rooted optical destination that combines professional competence with deep cultural connection. The brand identity draws from the heritage of the Sankara Narayanar Temple and the Pandya dynasty legacy, creating a unique narrative that differentiates it from national chain competitors like Lenskart and Titan Eye+. The positioning strategy targets the "Affordable Premium" segment, offering family-friendly service with a fashion-forward product selection that appeals to the diverse demographics of the Sankarankovil area.', s_body))
story.append(Paragraph(
    'The brand name rationale leverages the immediate geographic recognition of Sankarankovil, making it the first recalled name when anyone in the area thinks of optical services. The logo concept integrates an eye motif with the temple gopuram silhouette and traditional kolam patterns, creating a visually distinctive identity that resonates with local cultural values. The color palette and brand voice are designed to project trust, clarity, and community warmth across all touchpoints, from the physical store to digital platforms.', s_body))

# 2.2 Digital Marketing
story.extend(skt([heading('<b>2.2 Digital Marketing Plan</b>', s_h2, 1)]))
story.append(Paragraph(
    'The digital marketing strategy covers a comprehensive multi-channel approach optimized for a small-town optical business. Google My Business optimization is the cornerstone, with a target of 200+ photos and 50+ reviews within the first three months. Google Ads campaigns target three search categories: eye tests, spectacles, and specialty eyewear, with an initial budget of INR 8,000-12,000 per month. Facebook and Instagram campaigns use four simultaneous ad sets targeting different demographic segments, with Tamil-language content comprising 80 percent of all posts. YouTube marketing focuses on educational content about eye health and eyewear fashion, with 20+ video ideas developed specifically for the local audience.', s_body))
story.append(Paragraph(
    'WhatsApp Business marketing leverages the dominant messaging platform in India with seven quick reply templates, automated greetings, and four campaign types including welcome sequences, weekly broadcasts, festival promotions, and customer re-engagement. The monthly digital marketing budget is structured in three phases: INR 24,000 in the launch phase, scaling to INR 28,000 in the growth phase, and reaching INR 32,000 in the expansion phase, with total annual investment of approximately INR 3.6 lakh.', s_body))

# 2.3 Social Media
story.extend(skt([heading('<b>2.3 Social Media Strategy</b>', s_h2, 1)]))
story.append(Paragraph(
    'The social media strategy prioritizes Instagram as the primary growth platform, Facebook for community trust building, YouTube for SEO authority, and WhatsApp as the conversion engine. The content strategy is built on four pillars: Education (myth-busting, children eye care tips), Fashion (frame styling, celebrity-inspired looks), Promotions (festival-aligned offers), and Community (temple town pride, local service stories). The hashtag strategy includes 80+ organized hashtags across six categories spanning location-based, eyewear-specific, Tamil-language, fashion, community, and branded tags. A four-tier influencer collaboration plan ranges from Community Voices operating on a barter basis to Regional Tamil Influencers commanding INR 5,000-15,000 per collaboration, with an annual influencer budget of INR 88,000.', s_body))

# 2.4 Content Calendar
story.extend(skt([heading('<b>2.4 Content Calendar</b>', s_h2, 1)]))
story.append(Paragraph(
    'The 12-month content calendar delivers 20-22 posts per month across all platforms, totaling approximately 260 posts per year. Seven major campaigns are planned: Pongal Pehnna Hai (January), Summer Shades Festival (March-May), Little Eyes Big Futures (May children eye care), 9 Days 9 Frames (Navaratri September-October), Deepavali Deepam (October), World Sight Day Screening (October flagship event targeting 200+ participants), and Christmas Gifting (December). Four free eye screening camps are scheduled throughout the year during Glaucoma Awareness Week (March), Children Myopia Screening (May), World Sight Day (October), and Diabetic Retinopathy Screening (November). The evergreen content library includes 24 always-on pieces, and 23 SEO-optimized blog topics are planned with a publishing cadence of two posts per month.', s_body))

# 2.5 Local SEO
story.extend(skt([heading('<b>2.5 Local SEO Strategy</b>', s_h2, 1)]))
story.append(Paragraph(
    'The local SEO strategy targets 30+ keywords across four tiers including both English and Tamil language searches. Critical research finding: no local competitor currently has an optimized website or Google Business Profile, presenting an immediate first-mover advantage. The strategy covers Google Business Profile optimization with a complete setup guide, on-page SEO for the website, local citations across 50+ India-specific directories (JustDial, Sulekha, TradeIndia, IndiaMART, and more), a systematic review generation strategy targeting 50+ reviews within three months, local link building through sponsorships and media outreach, and voice search optimization for Tamil-language queries. Six competitors were mapped with their SEO profiles, revealing critical gaps in digital presence that Sankaran Kovil Opticals can exploit immediately.', s_body))

# 2.6 Promotions
story.extend(skt([heading('<b>2.6 Promotions and Offers</b>', s_h2, 1)]))
story.append(Paragraph(
    'The promotions plan contains 390+ specific INR price points across all offers, ensuring every promotion has precise, actionable pricing. Festival-specific offers are developed for Diwali, Pongal, Ayudha Pooja, Tamil New Year, Karthigai Deepam, and Christmas, aligned with local purchasing patterns and cultural celebrations. The grand opening plan includes a week-long celebration with tiered discounts. Additional promotional programs include student discount programs for school and college students, senior citizen programs with special benefits, family package deals, buy-one-get-one strategies, a structured referral program, partnership promotions with local hospitals, schools, and temples, a loyalty punch card system, an annual membership program, and flash sale ideas. The total annual promotion budget is INR 5.63 lakh, with a projected return on investment of 12.5x to 17.8x. Temple marketing around the Aadi Thapasu festival, which draws 50,000-100,000 pilgrims, represents the single largest promotional opportunity of the year.', s_body))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 3: ANALYSIS TEAM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.extend(skt([CondPageBreak(H1_THRESHOLD), heading('<b>3. Analysis Team (5 Agents)</b>', s_h1, 0)]))
story.append(Paragraph(
    'The Analysis Team conducted rigorous research across five domains: competitor analysis, market research, SWOT analysis, customer demographics, and pricing benchmarks. This team provided the data-driven foundation upon which all marketing, sales, and operational strategies are built.', s_body))

# 3.1 Competitor Analysis
story.extend(skt([heading('<b>3.1 Competitor Analysis</b>', s_h2, 1)]))
story.append(Paragraph(
    'The competitive landscape analysis identified eight direct local competitors in Sankarankovil, including Aravind Optical, SM Optical, Vision Optical, King Optical, Bright Opticals, Velan Opticals, Grand Gadgets, and Sri Opticals. Beyond the immediate town, 54 optical shops operate in nearby Tenkasi, and major national chains present the most significant competitive threats. Lenskart, with INR 6,653 crore in revenue and 2,723 stores nationwide, represents a growing online and offline threat. Titan Eye+, with INR 796 crore revenue and a confirmed store presence in Tenkasi (15-20 km from Sankarankovil), is rated as the most critical immediate threat. Specsmakers operates 275+ stores with 150+ in Tamil Nadu alone, and is actively expanding into Tier 3 and Tier 4 towns.', s_body))
story.append(Paragraph(
    'An 11-dimension competitive advantage matrix scores Sankaran Kovil Opticals highest on convenience, personalization, after-sales service, and community connection, which are precisely the areas where chain competitors are weakest. The market share analysis estimates the local optical market at approximately INR 1.5-3 crore, with a realistic path for Sankaran Kovil Opticals to capture 8-15 percent in Year 1 and grow to 30-40 percent within three years through execution of the differentiation strategies outlined in this plan.', s_body))

# 3.2 Market Research
story.extend(skt([heading('<b>3.2 Market Research</b>', s_h2, 1)]))
story.append(Paragraph(
    'The Indian eyewear market is valued at USD 4.1 billion for spectacles alone (2024), growing at 11.4 percent CAGR, with prescription glasses accounting for 69 percent of revenue. The overall eyewear market including sunglasses, contact lenses, and accessories is estimated at USD 6.6 billion. Tamil Nadu represents a significant regional market estimated at USD 250-450 million, driven by high literacy rates, growing digital screen usage, and increasing fashion consciousness. Sankarankovil, with a population of approximately 82,000 (2025) and a catchment area of 100,000-150,000 people across surrounding villages, represents an estimated annual optical market of INR 1.8-3.2 crore.', s_body))
story.append(Paragraph(
    'Key market segments include students (23 percent myopia prevalence among schoolchildren in Tamil Nadu), working professionals seeking premium eyewear, senior citizens needing presbyopia correction and cataract referrals, and an underserved agricultural worker segment. The 5-year market forecast projects the local market growing to INR 3.5-5.8 crore by 2030, driven by increasing awareness, aging demographics, and fashion-driven eyewear adoption. The market entry strategy follows a three-phase approach: Foundation (3 months of establishment), Penetration (Year 1 customer acquisition), and Growth (Year 2+ market expansion), with a target revenue of INR 20-45 lakh by Year 3.', s_body))

# 3.3 SWOT Analysis
story.extend(skt([heading('<b>3.3 SWOT Analysis</b>', s_h2, 1)]))
story.append(Paragraph(
    'The comprehensive SWOT analysis identified 10 Strengths, 10 Weaknesses, 10 Opportunities, and 10 Threats, producing 22 cross-functional strategies across SO (Strength-Opportunity), WO (Weakness-Opportunity), ST (Strength-Threat), and WT (Weakness-Threat) categories. The key strengths center on community trust, personalization capabilities, local market knowledge, and operational agility. Weaknesses include limited initial marketing budget, technology gaps, inventory constraints, and single-location dependence. The most significant opportunities lie in the growing Tier 4 market expansion, eye health awareness programs, fashion trends in eyewear, and government healthcare scheme partnerships. Threats are dominated by chain store expansion (particularly Titan Eye+), online retailer disruption from Lenskart and others, and changing consumer expectations driven by urban exposure.', s_body))

story.append(Spacer(1, 10))
story.append(make_table(
    ['SWOT Category', 'Key Points'],
    [
        ['Strengths (10)', 'Community trust, personalization, local knowledge, agility, cost advantage, after-sales service'],
        ['Weaknesses (10)', 'Limited budget, technology gaps, inventory constraints, no SOPs initially, single location'],
        ['Opportunities (10)', 'Market growth, Tier 4 expansion, eye health awareness, fashion trends, aging population'],
        ['Threats (10)', 'Chain stores (Titan Eye+), online retailers, price competition, rising expectations'],
    ],
    [AW*0.25, AW*0.75]
))
story.append(Paragraph('<b>Table 2:</b> SWOT Analysis Summary', s_caption))

# 3.4 Customer Demographics
story.extend(skt([heading('<b>3.4 Customer Demographics</b>', s_h2, 1)]))
story.append(Paragraph(
    'The customer demographics analysis reveals five primary segments for the Sankarankovil market. School and college students represent the highest volume segment at 35-40 percent of transactions, with average spending of INR 700-2,500 per visit. Government employees represent the highest lifetime value segment due to their family networks and referral potential. Senior citizens (55+) are identified as the most underserved segment, presenting a unique opportunity for home visit services and presbyopia-focused products. Agricultural workers (farmers) represent a completely neglected positioning opportunity, as no current optical shop specifically targets this demographic with durable, UV-protective, affordable eyewear.', s_body))
story.append(Paragraph(
    'Four detailed customer personas were developed: Student Priya (20-year-old college student, fashion-conscious, INR 1,200-2,500 spend), Headmaster Govindan (48-year-old school headmaster, high-value referral node, INR 2,000-4,000 spend), Aachi Lakshmi (67-year-old elderly matriarch, multi-generational family connector, INR 800-1,500 spend), and Karthik the Farmer (38-year-old agricultural worker, completely underserved, INR 500-1,200 spend). Seasonal buying patterns show that July (school reopening) and November (Diwali) account for 40-50 percent of annual revenue, with the mid-range price tier of INR 1,200-2,500 representing the optimal sweet spot for both volume and profit margins.', s_body))

# 3.5 Pricing Benchmark
story.extend(skt([heading('<b>3.5 Pricing Benchmark</b>', s_h2, 1)]))
story.append(Paragraph(
    'The pricing benchmark analysis covers frame pricing across four tiers (Budget INR 299-999, Mid-Range INR 1,000-3,999, Premium INR 4,000-15,000+), lens pricing for all major types (Basic Single Vision INR 350-500, Crizal Series INR 1,990-3,500, Progressive INR 4,100-15,000, Photochromic INR 800-6,500), contact lens pricing (Daily disposables INR 750-3,100, Monthly INR 350-2,500), sunglasses, eye exams, and repair services. Competitor price comparison tables cover Lenskart, Titan Eye+, Specsmakers, Lawrence and Mayo, and local shops. The recommended hybrid pricing strategy combines competitive pricing for budget segments, value-based pricing for premium products, and cost-plus pricing for accessories.', s_body))

story.append(Spacer(1, 10))
story.append(make_table(
    ['Product Category', 'Budget Range', 'Mid-Range', 'Premium', 'Margin'],
    [
        ['Frames', 'INR 299-999', 'INR 1,000-3,999', 'INR 4,000-15,000+', '50-75%'],
        ['Lenses (SV)', 'INR 350-500', 'INR 800-1,500', 'INR 1,990-3,500', '40-70%'],
        ['Progressive', '-', 'INR 4,100-8,000', 'INR 8,000-15,000', '40-60%'],
        ['Contact Lenses', '-', 'INR 350-2,500/mo', 'INR 750-3,100/mo', '35-47%'],
        ['Eye Exam', 'Free (with purchase)', 'INR 100', 'INR 300', 'Service'],
        ['Sunglasses', 'INR 199-999', 'INR 999-2,499', 'INR 7,499-15,999', '50-65%'],
    ],
    [AW*0.18, AW*0.22, AW*0.22, AW*0.22, AW*0.16]
))
story.append(Paragraph('<b>Table 3:</b> Pricing Benchmark Summary (INR)', s_caption))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 4: SALES TEAM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.extend(skt([CondPageBreak(H1_THRESHOLD), heading('<b>4. Sales Team (4 Agents)</b>', s_h1, 0)]))
story.append(Paragraph(
    'The Sales Team developed comprehensive strategies across four critical areas: sales process and targets, customer acquisition channels, revenue and financial projections, and customer loyalty programs. All strategies are grounded in the market data and competitive intelligence provided by the Analysis Team.', s_body))

# 4.1 Sales Strategy
story.extend(skt([heading('<b>4.1 Sales Strategy</b>', s_h2, 1)]))
story.append(Paragraph(
    'The sales strategy establishes a three-year revenue roadmap progressing from INR 55 lakh in Year 1 to INR 1.3 crore in Year 2 and INR 2.4 crore in Year 3. The core sales methodology follows a proprietary seven-step "SANKARAN" framework covering every stage from customer greeting through post-sale nurturing, with all scripts developed in both Tamil and English. Ten upselling and cross-selling techniques are detailed, including the "Layered Recommendation" approach where staff suggest progressively premium options, coating bundles that increase average lens value, and a second-pair strategy targeting different use cases (reading, computer, sunglasses). Five tailored product bundles serve key segments: Student (INR 1,499), Office Professional (INR 2,499), Family (INR 4,999), Senior Citizen (INR 1,999), and Festival Gift (INR 3,499).', s_body))
story.append(Paragraph(
    'Walk-in conversion targets are set at 65 percent through an "Engagement Funnel" methodology. B2B sales programs include corporate tie-up playbooks for local banks, government offices, and textile businesses, school vision screening program models with per-school revenue estimates of INR 48,000-56,000, and community eye camp formats. Daily, weekly, and monthly sales targets are broken down to hourly targets to help staff maintain consistent performance. Slow-day sales boosters include outreach campaigns, flash sales, community engagement activities, and staff productivity improvement exercises. Seasonal tactics are aligned with the Tamil Nadu festival calendar, with specific campaigns for Pongal, Thai Poosam, Ayudha Puja, Diwali, and other regional celebrations.', s_body))

# 4.2 Customer Acquisition
story.extend(skt([heading('<b>4.2 Customer Acquisition</b>', s_h2, 1)]))
story.append(Paragraph(
    'The customer acquisition plan targets 1,200 new customers per year with a blended customer acquisition cost (CAC) of INR 163-314, producing a lifetime value to CAC ratio of 75:1. Offline channels include pamphlets, banners, wall paintings, auto-rickshaw advertising, cable TV, and temple event marketing. Online channels encompass Google Business Profile, Facebook and Instagram, WhatsApp marketing, YouTube content, and Google Ads. The referral program, named "Kannukkul Kirukku" (Joy in the Eyes), offers INR 200 rewards with digital sharing capabilities.', s_body))
story.append(Paragraph(
    'Temple marketing around the Aadi Thapasu festival at the Sankara Narayanar Temple, which draws 50,000-100,000 pilgrims annually, represents the single largest customer acquisition opportunity. The plan includes booth setup during the festival, route advertising for pilgrim foot traffic, prasad packet inserts, and branded eye care awareness materials. School vision screening programs target 10-15 schools in the area, with each school generating an estimated 48-56 eyewear purchases. Corporate eye checkup camps are designed as turnkey half-day events generating INR 20,000-70,000 in revenue per camp through partnerships with local businesses and institutions.', s_body))

# 4.3 Revenue Projection
story.extend(skt([heading('<b>4.3 Revenue Projection</b>', s_h2, 1)]))
story.append(Paragraph(
    'The financial model projects startup costs of INR 12-13.5 lakh, broken down as: shop interiors and furniture INR 2,30,000, optical equipment INR 2,75,000-4,50,000, initial inventory INR 2,50,000, licenses and registrations INR 25,000, technology systems INR 4,50,000-9,64,000, and working capital INR 2,35,000. Monthly fixed operating costs are estimated at INR 87,000 covering rent (INR 12,000), salaries (INR 45,000), equipment EMI (INR 8,100), and marketing (INR 6,000).', s_body))

story.append(Spacer(1, 10))
story.append(make_table(
    ['Scenario', 'Year 1', 'Year 2', 'Year 3'],
    [
        ['Conservative', 'INR 12.0 Lakh', 'INR 14.0 Lakh', 'INR 16.56 Lakh'],
        ['Moderate', 'INR 16.8 Lakh', 'INR 21.0 Lakh', 'INR 26.4 Lakh'],
        ['Optimistic', 'INR 20.4 Lakh', 'INR 28.0 Lakh', 'INR 36.0 Lakh'],
        ['Net Margin', '-7.1%', '6.7%', '15.5%'],
    ],
    [AW*0.25, AW*0.25, AW*0.25, AW*0.25]
))
story.append(Paragraph('<b>Table 4:</b> Revenue Projections by Scenario (Moderate Path)', s_caption))
story.append(Paragraph(
    'Break-even is projected at month 7-8, requiring approximately 70 eyeglass pairs sold per month at the moderate scenario. The blended gross margin across all product categories is estimated at 56.5 percent. The financial model identifies a potential cash deficit in February of Year 1 under the moderate scenario with INR 12 lakh capital, recommending an increase to INR 13.5 lakh with an additional INR 1.5 lakh working capital buffer. The investment recovery plan follows a four-phase approach: Survival (months 1-6), Stabilization (months 7-12), Growth (Year 2), and Expansion (Year 3), with full investment recovery projected at 24 months and a three-year ROI of 157 percent.', s_body))

# 4.4 Loyalty Programs
story.extend(skt([heading('<b>4.4 Loyalty Programs</b>', s_h2, 1)]))
story.append(Paragraph(
    'The customer loyalty program, branded "Kannoli Kaadhal" (Love for Eyes), uses a hybrid model combining points-based rewards with tiered membership and an optional paid VIP upgrade. Three membership tiers provide escalating benefits: Silver (free enrollment, 1x points earning, birthday greeting), Gold (INR 500 annual fee, 1.5x points, free annual eye exam, INR 200 birthday gift), and Platinum (INR 1,500 annual fee, 2x points, free comprehensive exam, priority service, INR 500 birthday gift). Points are earned at 1-2x rates based on tier and redeemed at INR 0.50 per point across a catalogue ranging from INR 50 vouchers to free frames.', s_body))
story.append(Paragraph(
    'The referral rewards program, named "Kannoli Kooduvom" (Let Us See Together), offers 100-300 points per successful referral depending on membership tier, with milestone bonuses at 5, 10, and 20 referrals. A comprehensive WhatsApp-first communication strategy handles all customer interactions, from birthday and anniversary greetings with tiered gifts to seven-step annual eye checkup reminders and four-phase post-purchase follow-ups extending to Day 270. Lost customer win-back strategies include personal owner outreach, exclusive INR 500 offers, and churn analysis to identify at-risk customers before they lapse. The program costs INR 1.94 lakh in Year 1 with projected incremental revenue of INR 5 lakh, delivering a Year 1 ROI of 16 percent that scales to 90-120 percent by Year 3.', s_body))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 5: SUPPORT TEAM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.extend(skt([CondPageBreak(H1_THRESHOLD), heading('<b>5. Support Team (5 Agents)</b>', s_h1, 0)]))
story.append(Paragraph(
    'The Support Team covered the operational backbone of the business across five domains: website and digital presence, customer service excellence, supply chain and inventory management, technology and POS systems, and human resources with daily operations management.', s_body))

# 5.1 Website
story.extend(skt([heading('<b>5.1 Website and Digital Presence</b>', s_h2, 1)]))
story.append(Paragraph(
    'The website plan recommends WordPress as the primary platform, with Wix as an easier alternative for non-technical operators. The sitemap includes eight main sections with 20+ sub-pages: Home, Products/Collections, Eye Exam Booking, About Us, Contact/Location, Blog, Services, and Testimonials. The design follows a mobile-first approach with a 1.5MB performance budget and 3-second First Contentful Paint target. Key features include an online appointment booking system with three implementation options (SaaS, WhatsApp-based, or custom), WhatsApp integration with a floating button and Business API for marketing broadcasts, and hosting on Hostinger India at INR 1,800 per year. A six-week phased launch plan covers preparation, development, testing, launch, and post-launch optimization phases.', s_body))

# 5.2 Customer Service
story.extend(skt([heading('<b>5.2 Customer Service Excellence</b>', s_h2, 1)]))
story.append(Paragraph(
    'The customer service plan establishes comprehensive service standards covering in-store experience design, staff behavior guidelines, greeting protocols, and after-sales policies. The in-store experience includes a family-friendly waiting area, six-category frame display organization, trial room setup with recommended lighting specifications, and layered store lighting design. A 30-second greeting rule requires staff to acknowledge every customer within 30 seconds of entry, followed by a five-point needs assessment. After-sales service includes free lifetime frame adjustments, a four-stage follow-up cadence, and clear warranty terms. The return policy allows seven-day frame exchanges and 14-day lens returns, compliant with the Consumer Protection Act 2019. A 100-point mystery shopper evaluation system covers six sections with quarterly reporting cadence and ten key performance indicators with specific targets for customer satisfaction measurement.', s_body))

# 5.3 Supply Chain
story.extend(skt([heading('<b>5.3 Supply Chain and Inventory</b>', s_h2, 1)]))
story.append(Paragraph(
    'The supply chain plan covers 400-600 frame SKUs across five price tiers, with primary sourcing from three major wholesale markets: Chennai Parry Corner and Broadway (550 km, primary hub), Mumbai Kalbadevi (premium brands), and Delhi Ballimaran (economy frames). Nine specific suppliers are identified with contact details. The frame brand hierarchy spans four tiers: Luxury (Ray-Ban, Oakley, Tommy Hilfiger), Premium Indian (Titan Eye Plus, IDEE, John Jacobs), Mid-Range (Stylrite, Himalaya, Delite), and Economy (Chinese and Korean imports). Lens sourcing centers on Essilor with 60 percent market share (Crizal series), Zeiss at 20 percent premium, and Hoya, with local surfacing labs in Chennai and Madurai for stock lens inventory of 50-100 single vision pairs.', s_body))
story.append(Paragraph(
    'The initial inventory investment is INR 8-12 lakh following a 70/20/10 buying rule (70 percent proven sellers, 20 percent new trends, 10 percent experimental). Stock level management uses ABC analysis with minimum and maximum stock levels for every product type. Seasonal planning follows the full Tamil Nadu calendar cycle including summer peak, monsoon, wedding, festival, and Pongal seasons. Dead stock management uses eight clearance methods with a progressive markdown schedule from 20 percent to 40 percent to 60 percent, with a reserve of INR 15,000-30,000 for write-offs. Product display investment ranges from INR 73,000 to INR 2,10,000 depending on the level of sophistication chosen.', s_body))

# 5.4 Technology
story.extend(skt([heading('<b>5.4 Technology and POS Systems</b>', s_h2, 1)]))
story.append(Paragraph(
    'The technology plan compares three Indian POS systems for optical shops: OptoSoft (recommended, full-featured at INR 6,000-36,000/year), Gofrugal (second choice, strong analytics), and MargBooks (budget option). Eye testing equipment covers six categories including auto refractometer (Nidek, Topcon, Unikross brands), trial lens set, retinoscope, ophthalmoscope, and visual acuity chart. A computerized eye testing setup costs INR 4,35,000-7,54,000 complete. The customer database management system handles segmentation, loyalty program tracking, and retention strategies. WhatsApp Business API integration follows a three-phase implementation strategy from free tier to INR 4,999/month using providers like WATI or Anantya.ai. Payment systems include Paytm Soundbox, Pine Labs mPOS, and Google Pay for UPI transactions. CCTV security using CP Plus or Hikvision systems costs INR 25,000-50,000. Total technology investment ranges from INR 4,50,000 to INR 9,64,000 depending on the tier selected, with a 12-18 month payback period.', s_body))

# 5.5 HR
story.extend(skt([heading('<b>5.5 HR, Staffing and Operations</b>', s_h2, 1)]))
story.append(Paragraph(
    'The staffing structure comprises five full-time positions plus one seasonal hire: Optometrist (INR 24,000-29,000/month), Store Manager (INR 20,000-25,000), two Sales Associates (INR 10,600-16,500 each), and one Helper (INR 8,500). Total monthly payroll including statutory contributions is INR 87,438-1,01,438. The two-shift operation runs from 9:00 AM to 8:30 PM, closed on Tuesdays. A comprehensive four-week onboarding program covers 80 hours of structured training across 20 sessions covering product knowledge, sales skills, clinical procedures, and compliance requirements. Daily operations follow a 21-item pre-opening checklist, 15 during-operations tasks, and 17 end-of-day procedures. Performance management uses a 100-point monthly scorecard per role with performance improvement plans for underperformers and six reward and recognition award categories.', s_body))
story.append(Paragraph(
    'Legal and compliance requirements include eight licenses and registrations: Shop and Establishment License, GST Registration, MD-42 License for contact lens retail (mandatory since April 2020), ESI and EPF registration for employees, and local body trade license. A full monthly compliance calendar and 12 record-keeping registers are maintained. Insurance coverage includes a shop package at INR 15,500-24,500/year, group health insurance at INR 25,000-40,000/year, and professional indemnity at INR 8,000-15,000/year. The recruitment process follows a 30-day timeline with verification checklist and a 90-day probation period with clear confirmation criteria for all positions.', s_body))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 6: FINANCIAL SUMMARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.extend(skt([CondPageBreak(H1_THRESHOLD), heading('<b>6. Financial Summary</b>', s_h1, 0)]))
story.append(Paragraph(
    'This section consolidates the key financial projections from across all team reports into a unified financial picture for the Sankaran Kovil Opticals business. All figures are in Indian Rupees (INR) and represent the moderate-growth scenario unless otherwise noted.', s_body))

story.append(Spacer(1, 10))
story.append(make_table(
    ['Item', 'Amount (INR)'],
    [
        ['Total Startup Investment', '12,00,000 - 13,50,000'],
        ['  Shop Interiors and Furniture', '2,30,000'],
        ['  Optical Equipment', '2,75,000 - 4,50,000'],
        ['  Initial Inventory', '2,50,000'],
        ['  Technology (POS, CCTV, etc.)', '4,50,000 - 9,64,000'],
        ['  Licenses and Registrations', '25,000'],
        ['  Working Capital (3 months)', '2,35,000'],
        ['Monthly Fixed Costs', '87,000'],
        ['  Rent', '12,000'],
        ['  Salaries (5 staff)', '45,000'],
        ['  Equipment EMI', '8,100'],
        ['  Marketing', '6,000'],
        ['  Miscellaneous', '15,900'],
        ['Monthly Marketing Budget', '24,000 - 32,000'],
        ['Break-Even Point', 'Month 7-8'],
        ['Year 1 Revenue (Moderate)', '16,80,000'],
        ['Year 3 Revenue (Moderate)', '26,40,000'],
        ['3-Year ROI', '157%'],
    ],
    [AW*0.45, AW*0.55]
))
story.append(Paragraph('<b>Table 5:</b> Consolidated Financial Summary', s_caption))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 7: PRIORITY ACTION ITEMS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(skt([heading('<b>7. Priority Action Items - First 90 Days</b>', s_h1, 0)]))
story.append(Paragraph(
    'The following timeline outlines the critical actions required during the first 90 days to successfully launch Sankaran Kovil Opticals. Each milestone is designed to build upon the previous phase, creating a systematic progression from initial setup through full operational launch.', s_body))

story.append(Spacer(1, 8))
story.extend(skt([heading('<b>Week 1-2: Foundation</b>', s_h2, 1)]))
items = [
    'Finalize shop location and sign lease agreement',
    'Register business (GST, Shops and Establishment License)',
    'Hire optometrist and store manager',
    'Order eye testing equipment (2-3 week delivery time)',
    'Open supplier accounts (Chennai wholesale market)',
]
for item in items:
    story.append(Paragraph(f'<bullet>&bull;</bullet> {item}', s_bullet))

story.extend(skt([heading('<b>Week 3-4: Setup</b>', s_h2, 1)]))
items = [
    'Complete shop interiors and branding installation',
    'Install POS system and test all operations',
    'Set up Google Business Profile with photos and details',
    'Create social media accounts (Instagram, Facebook, WhatsApp Business)',
    'Order initial inventory (frames, lenses, accessories)',
]
for item in items:
    story.append(Paragraph(f'<bullet>&bull;</bullet> {item}', s_bullet))

story.extend(skt([heading('<b>Week 5-6: Pre-Launch</b>', s_h2, 1)]))
items = [
    'Staff training (product knowledge, sales process, customer service)',
    'Grand opening promotion planning and material production',
    'Distribute pamphlets and banners in Sankarankovil area',
    'Launch website (basic version with contact and location pages)',
    'Start social media posting (2-3 posts per week)',
]
for item in items:
    story.append(Paragraph(f'<bullet>&bull;</bullet> {item}', s_bullet))

story.extend(skt([heading('<b>Week 7-8: Launch</b>', s_h2, 1)]))
items = [
    'Grand opening with special promotional offers',
    'First free eye health screening camp',
    'Begin school vision screening program outreach',
    'Start collecting customer reviews on Google',
    'Implement loyalty program enrollment for first customers',
]
for item in items:
    story.append(Paragraph(f'<bullet>&bull;</bullet> {item}', s_bullet))

story.extend(skt([heading('<b>Month 3: Growth</b>', s_h2, 1)]))
items = [
    'Launch Google Ads campaigns for local search visibility',
    'Start WhatsApp marketing broadcasts to customer database',
    'First corporate eye camp partnership agreement',
    'Monthly performance review and strategy adjustment',
    'Adjust strategy based on first 60 days of operational data',
]
for item in items:
    story.append(Paragraph(f'<bullet>&bull;</bullet> {item}', s_bullet))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 8: KEY RISKS & MITIGATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(skt([heading('<b>8. Key Risks and Mitigations</b>', s_h1, 0)]))
story.append(Paragraph(
    'Every business venture carries inherent risks. The following table identifies the most significant risks facing Sankaran Kovil Opticals, rates their potential impact, and outlines specific mitigation strategies designed to minimize each risk.', s_body))

story.append(Spacer(1, 10))
story.append(make_table(
    ['Risk', 'Impact', 'Mitigation Strategy'],
    [
        ['Titan Eye+ opens in Sankarankovil', 'CRITICAL', 'Build strong local relationships, compete on personalized service and community trust, not price'],
        ['Online retailers (Lenskart) expansion', 'HIGH', 'Offer try-before-buy experience, free adjustments, and community-based service that online cannot match'],
        ['Slow initial customer acquisition', 'HIGH', 'Aggressive opening promotions, temple festival marketing (Aadi Thapasu), school screening programs'],
        ['Cash flow crunch in early months', 'HIGH', 'Maintain INR 1.5 lakh extra working capital buffer, control fixed costs, focus on revenue-generating activities'],
        ['Unable to hire qualified optometrist', 'MEDIUM', 'Offer competitive salary for the area, consider visiting optometrist initially, partner with eye hospitals'],
        ['Poor monsoon affecting local economy', 'MEDIUM', 'Diversify with eye health camps, corporate programs, and essential prescription eyewear that is recession-resistant'],
    ],
    [AW*0.22, AW*0.12, AW*0.66]
))
story.append(Paragraph('<b>Table 6:</b> Risk Assessment Matrix', s_caption))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 9: TEAM STRUCTURE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(skt([heading('<b>9. Research Team Structure</b>', s_h1, 0)]))
story.append(Paragraph(
    'This Master Business Plan was created by deploying 20 specialized AI research agents operating in parallel across four strategic teams. Each agent conducted independent web research and produced a comprehensive domain-specific report. The following table summarizes the complete team structure and their contributions.', s_body))

story.append(Spacer(1, 10))
story.append(make_table(
    ['Team', 'Agent', 'Specialization', 'Report Lines'],
    [
        ['Marketing', '#1', 'Brand Strategy', '622'],
        ['Marketing', '#2', 'Digital Marketing', '1,294'],
        ['Marketing', '#3', 'Social Media', '1,171'],
        ['Marketing', '#4', 'Content Calendar', '1,096'],
        ['Marketing', '#5', 'Local SEO', '1,116'],
        ['Marketing', '#6', 'Promotions and Offers', '1,182'],
        ['Analysis', '#7', 'Competitor Analysis', '909'],
        ['Analysis', '#8', 'Market Research', '520'],
        ['Analysis', '#9', 'SWOT Analysis', '411'],
        ['Analysis', '#10', 'Customer Demographics', '714'],
        ['Analysis', '#11', 'Pricing Benchmark', '835'],
        ['Sales', '#12', 'Sales Strategy', '1,366'],
        ['Sales', '#13', 'Customer Acquisition', '740'],
        ['Sales', '#14', 'Revenue Projection', '714'],
        ['Sales', '#15', 'Loyalty Programs', '886'],
        ['Support', '#16', 'Website and UX', '846'],
        ['Support', '#17', 'Customer Service', '859'],
        ['Support', '#18', 'Supply Chain', '1,051'],
        ['Support', '#19', 'Technology and POS', '848'],
        ['Support', '#20', 'HR and Operations', '1,112'],
    ],
    [AW*0.14, AW*0.08, AW*0.45, AW*0.15]  # wider for specialization
))
story.append(Paragraph('<b>Table 7:</b> Research Team Agent Assignments and Report Sizes', s_caption))
story.append(Paragraph(
    'Total research output: 20 comprehensive reports comprising 18,292 lines of strategic business content. Each report includes real market data sourced from web research, specific INR pricing and financial projections, Tamil cultural context and localization, and actionable implementation timelines. All reports are available in their original markdown format in the project folder for detailed reference and ongoing operational guidance.', s_body))

# ━━ BUILD ━━
doc.multiBuild(story)
print(f'PDF generated: {output_path}')
