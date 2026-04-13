import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, ScanLine, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import type { ScanResult } from '../../types';

export function ScannerPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    setResult(null);
    setError('');
    setScanning(true);

    try {
      const scanner = new Html5Qrcode('scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Stop scanner on successful read
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);

          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }

          // Validate ticket
          try {
            const res = await api.post('/scan', { qrCode: decodedText });
            setResult(res.data);
          } catch {
            setResult({ valid: false, reason: 'not_found' });
          }
        },
        () => {
          // QR not detected, keep scanning
        },
      );
    } catch (err) {
      setError('Camera access denied or not available');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Already stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const reasonText: Record<string, string> = {
    not_found: 'Ticket not found',
    refunded: 'VOIDED — Ticket has been refunded',
    already_scanned: 'Already scanned',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine size={24} />
          Scanner
        </h1>
      </div>

      {/* Camera view */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-md mx-auto">
        <div id="scanner-container" ref={containerRef} className="w-full h-full" />
        {!scanning && !result && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-card">
            <Button onClick={startScanner} size="lg">
              <ScanLine size={20} />
              Start Scanner
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-500 text-center">
          {error}
        </div>
      )}

      {/* Result display */}
      {result && (
        <div className={`rounded-xl p-6 text-center space-y-3 ${
          result.valid
            ? 'bg-emerald-500/10 border-2 border-emerald-500'
            : 'bg-red-500/10 border-2 border-red-500'
        }`}>
          <div className="flex justify-center">
            {result.valid ? (
              <CheckCircle size={64} className="text-emerald-500" />
            ) : (
              <XCircle size={64} className="text-red-500" />
            )}
          </div>

          <h2 className="text-2xl font-bold">
            {result.valid ? 'VALID' : 'DENIED'}
          </h2>

          {result.valid && result.customerName && (
            <div className="space-y-1">
              <p className="text-lg font-medium">{result.customerName}</p>
              <p className="text-text-secondary">{result.ticketType}</p>
            </div>
          )}

          {!result.valid && result.reason && (
            <p className="text-lg font-medium text-red-500">
              {reasonText[result.reason] || result.reason}
            </p>
          )}

          {!result.valid && result.reason === 'already_scanned' && result.scannedAt && (
            <p className="text-sm text-text-secondary">
              Scanned at: {new Date(result.scannedAt).toLocaleString()}
            </p>
          )}

          <Button onClick={() => { setResult(null); startScanner(); }} variant="secondary">
            <RefreshCw size={18} />
            Scan Another
          </Button>
        </div>
      )}
    </div>
  );
}
