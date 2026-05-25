#!/usr/bin/env python3
"""Merge cover PDF with body PDF."""
from pypdf import PdfReader, PdfWriter, Transformation

A4_W, A4_H = 595.28, 841.89

def normalize_page(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 2 or abs(h - A4_H) > 2:
        sx, sy = A4_W / w, A4_H / h
        page.add_transformation(Transformation().scale(sx=sx, sy=sy))
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

cover_pdf = '/home/z/my-project/download/cover.pdf'
body_pdf = '/home/z/my-project/download/Toilet_Shop_Business_Analysis_Sankarankovil.pdf'
output_pdf = '/home/z/my-project/download/Toilet_Shop_Business_Analysis_Sankarankovil.pdf'

# Read body into memory first since we're writing to same file
import io
with open(body_pdf, 'rb') as f:
    body_data = f.read()

writer = PdfWriter()
# Cover as page 1
cover_page = PdfReader(cover_pdf).pages[0]
writer.add_page(normalize_page(cover_page))
# Body pages
body_reader = PdfReader(io.BytesIO(body_data))
for page in body_reader.pages:
    writer.add_page(normalize_page(page))

writer.add_metadata({
    '/Title': 'Toilet & Sanitary Ware Shop Business Analysis - Sankarankovil',
    '/Author': 'Z.ai',
    '/Creator': 'Z.ai',
    '/Subject': 'Comprehensive business analysis for toilet/sanitary shop near new bus stand'
})

with open(output_pdf, 'wb') as f:
    writer.write(f)

print(f"Merged PDF: {output_pdf}")

import os
print(f"File size: {os.path.getsize(output_pdf) / 1024:.1f} KB")
print(f"Total pages: {len(writer.pages)}")
