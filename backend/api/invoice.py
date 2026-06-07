"""Build a simple invoice-basis ('fakturaunderlag') PDF for a project.

This is a billing *basis*, not a legal invoice: it sums the contract value plus
customer-approved ÄTA, adds Swedish VAT (moms), and lists the lines so the
manager can hand it to whoever produces the real invoice.
"""
from datetime import date
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors as pdf_colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

VAT_RATE = Decimal("0.25")
BRAND = pdf_colors.HexColor("#5b3fd3")
INK = pdf_colors.HexColor("#1b1b25")
MUTED = pdf_colors.HexColor("#6b6b7b")
LINE = pdf_colors.HexColor("#d9d9e3")


def _kr(value):
    """Format a Decimal as Swedish currency, e.g. 12 500,00 kr."""
    q = Decimal(value or 0).quantize(Decimal("0.01"))
    whole, frac = f"{q:.2f}".split(".")
    neg = whole.startswith("-")
    whole = whole.lstrip("-")
    groups = []
    while len(whole) > 3:
        groups.insert(0, whole[-3:])
        whole = whole[:-3]
    groups.insert(0, whole)
    spaced = "\u00a0".join(groups)
    return f"{'-' if neg else ''}{spaced},{frac}\u00a0kr"


def build_invoice_pdf(project):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    left = 20 * mm
    right = width - 20 * mm
    y = height - 24 * mm

    company_name = getattr(project.company, "name", "") or "Marginal"

    # Header band
    c.setFillColor(BRAND)
    c.rect(0, height - 16 * mm, width, 16 * mm, fill=1, stroke=0)
    c.setFillColor(pdf_colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(left, height - 11 * mm, company_name)
    c.setFont("Helvetica", 9)
    c.drawRightString(right, height - 11 * mm, "FAKTURAUNDERLAG")

    # Title + meta
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(left, y, "Fakturaunderlag")
    y -= 9 * mm

    c.setFont("Helvetica", 10)
    c.setFillColor(MUTED)
    customer_name = getattr(project.customer, "name", "") or "—"
    meta = [
        ("Projekt", project.name),
        ("Kund", customer_name),
        ("Datum", date.today().strftime("%Y-%m-%d")),
        ("Projekt-ID", f"#{project.id}"),
    ]
    for label, val in meta:
        c.setFillColor(MUTED)
        c.drawString(left, y, label)
        c.setFillColor(INK)
        c.drawString(left + 30 * mm, y, str(val))
        y -= 6 * mm

    y -= 4 * mm

    # Line-item table header
    def table_header(yy):
        c.setStrokeColor(LINE)
        c.setLineWidth(1)
        c.line(left, yy, right, yy)
        yy -= 6 * mm
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(MUTED)
        c.drawString(left, yy, "BESKRIVNING")
        c.drawRightString(right, yy, "BELOPP (EXKL. MOMS)")
        yy -= 3 * mm
        c.line(left, yy, right, yy)
        return yy - 7 * mm

    y = table_header(y)

    def line_row(yy, desc, amount, bold=False):
        c.setFont("Helvetica-Bold" if bold else "Helvetica", 10)
        c.setFillColor(INK)
        c.drawString(left, yy, desc)
        c.drawRightString(right, yy, _kr(amount))
        return yy - 7 * mm

    contract = Decimal(project.contract_value or 0)
    y = line_row(y, "Kontraktssumma", contract)

    approved = [
        s for s in project.scope_items.all() if s.is_ata and s.ata_approved
    ]
    approved_total = Decimal("0")
    for s in approved:
        approved_total += s.line_total
        desc = s.description or "ÄTA"
        if not desc.upper().startswith("ÄTA"):
            desc = f"ÄTA: {desc}"
        y = line_row(y, desc, s.line_total)

    if not approved:
        c.setFont("Helvetica-Oblique", 9)
        c.setFillColor(MUTED)
        c.drawString(left, y, "Inga godkända ÄTA.")
        y -= 7 * mm

    # Totals
    y -= 2 * mm
    c.setStrokeColor(LINE)
    c.line(left, y, right, y)
    y -= 8 * mm

    subtotal = contract + approved_total
    vat = (subtotal * VAT_RATE).quantize(Decimal("0.01"))
    total = subtotal + vat

    def total_row(yy, label, amount, bold=False, big=False):
        c.setFont("Helvetica-Bold" if (bold or big) else "Helvetica", 13 if big else 10)
        c.setFillColor(INK if bold or big else MUTED)
        c.drawRightString(right - 45 * mm, yy, label)
        c.setFillColor(INK)
        c.drawRightString(right, yy, _kr(amount))
        return yy - (9 * mm if big else 7 * mm)

    y = total_row(y, "Summa exkl. moms", subtotal)
    y = total_row(y, "Moms 25 %", vat)
    y -= 1 * mm
    c.line(right - 75 * mm, y + 3 * mm, right, y + 3 * mm)
    y -= 4 * mm
    y = total_row(y, "Att fakturera (inkl. moms)", total, big=True)

    # Footer note
    c.setFont("Helvetica", 8)
    c.setFillColor(MUTED)
    note_y = 22 * mm
    c.drawString(
        left,
        note_y,
        "Detta är ett underlag, inte en faktura. ROT-avdrag är ej medräknat.",
    )
    c.drawString(
        left,
        note_y - 5 * mm,
        f"Genererat av Marginal {date.today().strftime('%Y-%m-%d')} för {company_name}.",
    )

    c.showPage()
    c.save()
    return buf.getvalue()
