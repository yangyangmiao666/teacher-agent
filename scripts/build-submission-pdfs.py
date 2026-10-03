"""可选：Python + ReportLab + 可嵌入的中文 TrueType 字体生成两套可打印说明书。"""
import argparse
import hashlib
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

parser = argparse.ArgumentParser()
parser.add_argument('--font-file', required=True, help='Chinese TrueType TTF/TTC file with document embedding permission')
args = parser.parse_args()
pdfmetrics.registerFont(TTFont('JZX', args.font_file, subfontIndex=0))
body = ParagraphStyle('body', fontName='JZX', fontSize=10.5, leading=17.5, wordWrap='CJK', spaceAfter=8, textColor=HexColor('#203452'))
heading = ParagraphStyle('heading', parent=body, fontSize=14, leading=22, textColor=HexColor('#2F55D4'), spaceBefore=13, spaceAfter=9, keepWithNext=True)
title = ParagraphStyle('title', parent=body, fontSize=21, leading=29, spaceAfter=18)
Path('output/pdf').mkdir(parents=True, exist_ok=True)
for kind, directory in [('original', 'docs/submission'), ('anonymous', 'docs/submission-anonymous')]:
    source = Path(directory, '建设说明书.md').read_bytes()
    output = Path('output/pdf', f'jiaozhixing-manual-{kind}.pdf')
    story = []
    for block in source.decode('utf8').split('\n\n'):
        block = block.strip()
        if not block:
            continue
        if block.startswith('## 三'):
            story.append(PageBreak())
        style = title if block.startswith('# ') else heading if block.startswith('## ') else body
        block = block.removeprefix('## ').removeprefix('# ')
        story.append(Paragraph(escape(block).replace('\n', '<br/>'), style))
    def footer(canvas, doc):
        canvas.setFont('JZX', 9)
        canvas.setFillColor(HexColor('#68758A'))
        canvas.drawString(48, 28, '教智星 · 待学校审核草稿 · ' + ('原始审核版' if kind == 'original' else '匿名评审版'))
        canvas.drawRightString(A4[0] - 48, 28, str(doc.page))
    doc = SimpleDocTemplate(str(output), pagesize=A4, leftMargin=48, rightMargin=48, topMargin=42, bottomMargin=45,
        title='教智星教学智能体建设说明书', author='教智星项目', subject='source-sha256:' + hashlib.sha256(source).hexdigest())
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    Path(directory, '建设说明书.pdf').write_bytes(output.read_bytes())
    print(output)
