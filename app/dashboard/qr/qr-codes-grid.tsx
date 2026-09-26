'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DiningTable } from '@/types/domain'

interface QrCodesGridProps {
  tables: DiningTable[]
  restaurantId: string
  restaurantSlug: string
  restaurantName: string
  appUrl: string
  highlightTableId?: string
}

export function QrCodesGrid({
  tables,
  restaurantId,
  restaurantSlug,
  restaurantName,
  appUrl,
  highlightTableId,
}: QrCodesGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table) => (
        <QrCard
          key={table.id}
          table={table}
          restaurantId={restaurantId}
          restaurantSlug={restaurantSlug}
          restaurantName={restaurantName}
          appUrl={appUrl}
          highlighted={table.id === highlightTableId}
        />
      ))}
    </div>
  )
}

interface QrCardProps {
  table: DiningTable
  restaurantId: string
  restaurantSlug: string
  restaurantName: string
  appUrl: string
  highlighted: boolean
}

function QrCard({ table, restaurantId, restaurantSlug, restaurantName, appUrl, highlighted }: QrCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // QR URL encodes: restaurantId + tableId so the session API knows exactly
  // which restaurant and table to create a session for.
  const qrUrl = `${appUrl}/restaurant/${restaurantSlug}?restaurantId=${restaurantId}&tableId=${table.id}`

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, qrUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch((err) => console.error('QR generation failed', err))
  }, [qrUrl])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a print-ready version with restaurant name and table label
    const printCanvas = document.createElement('canvas')
    const PADDING = 20
    const LABEL_HEIGHT = 60
    printCanvas.width = canvas.width + PADDING * 2
    printCanvas.height = canvas.height + LABEL_HEIGHT + PADDING * 2

    const ctx = printCanvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height)
    ctx.drawImage(canvas, PADDING, PADDING)

    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(restaurantName, printCanvas.width / 2, canvas.height + PADDING + 20)
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#666'
    ctx.fillText(table.name, printCanvas.width / 2, canvas.height + PADDING + 38)

    const link = document.createElement('a')
    link.download = `qr-${restaurantSlug}-${table.name.toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = printCanvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 flex flex-col items-center gap-3 transition-shadow',
        highlighted ? 'border-orange-400 shadow-md shadow-orange-100' : 'border-gray-200'
      )}
    >
      <canvas ref={canvasRef} className="rounded-lg" aria-label={`QR code for ${table.name}`} />

      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900">{table.name}</p>
        <p className="text-xs text-gray-400">Capacity {table.capacity}</p>
      </div>

      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={handleDownload}
        >
          <Download className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
          Download
        </Button>
        <a href={qrUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Preview customer URL">
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Preview {table.name} URL</span>
          </Button>
        </a>
      </div>
    </div>
  )
}
