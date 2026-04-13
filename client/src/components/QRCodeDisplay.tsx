interface QRCodeDisplayProps {
  dataUrl: string;
  size?: number;
  label?: string;
}

export function QRCodeDisplay({ dataUrl, size = 200, label }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded-lg" />
      {label && <p className="text-sm text-text-secondary font-mono">{label}</p>}
    </div>
  );
}
