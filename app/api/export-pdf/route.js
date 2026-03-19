import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    // Dynamic import to avoid edge issues
    const PDFDocument = (await import('pdfkit')).default

    const chunks = []
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: `Butterfly.gov — ${title}`,
        Author: 'Butterfly.gov',
        Subject: 'Explication citoyenne',
      },
      bufferPages: true,
    })

    doc.on('data', (chunk) => chunks.push(chunk))

    // ── Color palette ──
    const BLUE = '#3b82f6'
    const DARK = '#1a1a2e'
    const GRAY = '#94a3b8'
    const WHITE = '#ffffff'
    const GREEN = '#22c55e'
    const SECTION_COLORS = {
      default: BLUE,
      gagnants: '#22c55e',
      perdants: '#ef4444',
      papillon: '#a855f7',
    }

    const PAGE_WIDTH = 495 // A4 width minus margins

    // ── Helper: draw header on current page ──
    function drawHeader() {
      const y = 25
      doc.save()
      doc.fontSize(12).font('Helvetica-Bold').fillColor(BLUE).text('Butterfly.gov', 50, y, { continued: false })
      const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      doc.fontSize(8).font('Helvetica').fillColor(GRAY).text(dateStr, 50, y + 2, { align: 'right', width: PAGE_WIDTH })
      doc.moveTo(50, y + 20).lineTo(545, y + 20).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
      doc.restore()
    }

    // ── Helper: draw footer with page number ──
    function drawFooter(pageNum) {
      const y = doc.page.height - 40
      doc.save()
      doc.moveTo(50, y - 5).lineTo(545, y - 5).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
      doc.fontSize(7).font('Helvetica').fillColor(GRAY)
      doc.text('Butterfly.gov — Analyse citoyenne des lois', 50, y, { align: 'center', width: PAGE_WIDTH })
      doc.text(`${pageNum}`, 50, y, { align: 'right', width: PAGE_WIDTH })
      doc.restore()
    }

    // ── Page 1: Title page ──
    drawHeader()

    doc.moveDown(3)
    doc.fontSize(22).font('Helvetica-Bold').fillColor(WHITE.replace('#ffffff', '#1e293b'))
      .text(title, { align: 'center', width: PAGE_WIDTH })
    doc.moveDown(0.5)
    doc.fontSize(11).font('Helvetica').fillColor(BLUE)
      .text('Explication générée par Butterfly.gov', { align: 'center', width: PAGE_WIDTH })
    doc.moveDown(0.3)
    const dateGeneration = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    doc.fontSize(9).fillColor(GRAY)
      .text(`Générée le ${dateGeneration}`, { align: 'center', width: PAGE_WIDTH })

    doc.moveDown(2)
    doc.moveTo(150, doc.y).lineTo(395, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    doc.moveDown(1.5)

    // ── Parse and render content sections ──
    const lines = content.split('\n')
    let currentSectionType = 'default'

    for (const line of lines) {
      // Check if we need a new page (leave room for footer)
      if (doc.y > doc.page.height - 100) {
        doc.addPage()
        drawHeader()
        doc.moveDown(2)
      }

      const trimmed = line.trim()

      // Skip empty lines but add small spacing
      if (!trimmed) {
        doc.moveDown(0.3)
        continue
      }

      // Detect section headers (lines starting with emoji or ## or bold markers)
      const sectionMatch = trimmed.match(/^(?:#{1,3}\s+)?(?:[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}✅🔍📌⚖️🏆💀🦋⚡📎]\s*)?(?:\*\*)?(.+?)(?:\*\*)?$/u)
      const isHeader = trimmed.startsWith('#') || trimmed.startsWith('**') || /^[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}✅🔍📌⚖️🏆💀🦋⚡📎]/u.test(trimmed)

      if (isHeader && trimmed.length < 120) {
        // Determine section color
        const lower = trimmed.toLowerCase()
        if (lower.includes('gagnant') || lower.includes('bénéfici')) currentSectionType = 'gagnants'
        else if (lower.includes('perdant') || lower.includes('risque')) currentSectionType = 'perdants'
        else if (lower.includes('papillon') || lower.includes('long terme') || lower.includes('5 ans')) currentSectionType = 'papillon'
        else currentSectionType = 'default'

        const headerColor = SECTION_COLORS[currentSectionType] || BLUE
        // Clean header text: remove markdown markers
        let headerText = trimmed.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '')

        doc.moveDown(0.5)
        doc.fontSize(13).font('Helvetica-Bold').fillColor(headerColor)
          .text(headerText, { width: PAGE_WIDTH })
        doc.moveDown(0.3)
        continue
      }

      // Sub-headers (lines starting with -)
      if (trimmed.startsWith('- **') || trimmed.startsWith('• **')) {
        const cleaned = trimmed.replace(/^[-•]\s*/, '').replace(/\*\*/g, '')
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155')
          .text(`  •  ${cleaned}`, { width: PAGE_WIDTH - 20 })
        doc.moveDown(0.15)
        continue
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[-•*]\s+/, '')
        doc.fontSize(10).font('Helvetica').fillColor('#475569')
          .text(`  •  ${bulletText}`, { width: PAGE_WIDTH - 20 })
        doc.moveDown(0.15)
        continue
      }

      // Links / sources — render in blue
      if (trimmed.startsWith('http') || trimmed.includes('](http')) {
        // Extract URL from markdown link [text](url) or plain URL
        const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/)
        if (linkMatch) {
          doc.fontSize(9).font('Helvetica').fillColor(BLUE)
            .text(`🔗 ${linkMatch[1]}`, { width: PAGE_WIDTH, link: linkMatch[2], underline: true })
        } else {
          doc.fontSize(9).font('Helvetica').fillColor(BLUE)
            .text(`🔗 ${trimmed}`, { width: PAGE_WIDTH, link: trimmed, underline: true })
        }
        doc.moveDown(0.15)
        continue
      }

      // Regular paragraph
      // Clean markdown bold/italic
      const cleanText = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
      doc.fontSize(10).font('Helvetica').fillColor('#334155')
        .text(cleanText, { width: PAGE_WIDTH, lineGap: 2 })
      doc.moveDown(0.2)
    }

    // ── Disclaimer ──
    if (doc.y > doc.page.height - 130) {
      doc.addPage()
      drawHeader()
      doc.moveDown(2)
    }

    doc.moveDown(2)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    doc.moveDown(0.5)
    doc.fontSize(7.5).font('Helvetica-Oblique').fillColor(GRAY)
      .text("Cette explication a été générée par l'IA de Butterfly.gov. Elle ne constitue pas un avis juridique. Vérifiez les sources citées.", { align: 'center', width: PAGE_WIDTH })

    // ── Add footers to all pages ──
    const totalPages = doc.bufferedPageRange().count
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i)
      drawFooter(i + 1)
    }

    doc.end()

    // Wait for PDF to finish
    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="butterfly-explication.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[Export PDF] Error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
