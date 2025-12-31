import { useState } from 'react';
import { Printer, FileImage, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type ExportFormat = 'pdf' | 'jpg' | 'png';
type LayoutType = 'landscape' | 'portrait';

interface PrintToolProps {
  mapContainerId: string;
}

export function PrintTool({ mapContainerId }: PrintToolProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [layout, setLayout] = useState<LayoutType>('landscape');
  const [title, setTitle] = useState('Peta Aset Properti');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const mapElement = document.getElementById(mapContainerId);
    if (!mapElement) return;

    setIsExporting(true);

    try {
      // Capture the map
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
      });

      const timestamp = new Date().toLocaleString('id-ID');

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: layout,
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        // Header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, margin + 8);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Dicetak: ${timestamp}`, margin, margin + 14);

        // Map image
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxImgHeight = pageHeight - margin * 2 - 25;
        const finalHeight = Math.min(imgHeight, maxImgHeight);
        const finalWidth = (finalHeight / imgHeight) * imgWidth;

        pdf.addImage(imgData, 'JPEG', margin, margin + 20, finalWidth, finalHeight);

        // Footer
        pdf.setFontSize(8);
        pdf.text('PT. Suparma, Tbk. - WebGIS Aset Properti', margin, pageHeight - margin);

        pdf.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      } else {
        // Image export (JPG or PNG)
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d')!;
        
        const headerHeight = 60;
        const footerHeight = 30;
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height + headerHeight + footerHeight;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Header
        ctx.fillStyle = '#0f2d5a';
        ctx.fillRect(0, 0, exportCanvas.width, headerHeight);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(title, 20, 35);
        ctx.font = '14px Arial';
        ctx.fillText(`Dicetak: ${timestamp}`, 20, 52);

        // Map
        ctx.drawImage(canvas, 0, headerHeight);

        // Footer
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, exportCanvas.height - footerHeight, exportCanvas.width, footerHeight);
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.fillText('PT. Suparma, Tbk. - WebGIS Aset Properti', 20, exportCanvas.height - 12);

        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
        link.href = exportCanvas.toDataURL(mimeType, 0.95);
        link.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
        <Printer className="w-4 h-4" />
        Cetak / Ekspor Peta
      </h3>

      {/* Title Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Judul</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-muted border-0 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Masukkan judul..."
        />
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Format</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'pdf' as ExportFormat, label: 'PDF', icon: FileText },
            { id: 'jpg' as ExportFormat, label: 'JPG', icon: FileImage },
            { id: 'png' as ExportFormat, label: 'PNG', icon: FileImage },
          ].map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setFormat(opt.id)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                  ${format === opt.id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Selection (PDF only) */}
      {format === 'pdf' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Layout</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLayout('landscape')}
              className={`
                p-3 rounded-lg border-2 transition-all text-sm font-medium
                ${layout === 'landscape' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              Landscape
            </button>
            <button
              onClick={() => setLayout('portrait')}
              className={`
                p-3 rounded-lg border-2 transition-all text-sm font-medium
                ${layout === 'portrait' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              Portrait
            </button>
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Mengekspor...</span>
          </>
        ) : (
          <>
            <Printer className="w-5 h-5" />
            <span>Ekspor Peta</span>
          </>
        )}
      </button>
    </div>
  );
}
