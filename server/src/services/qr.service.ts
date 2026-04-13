import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: '#1A1B1F', light: '#FFFFFF' },
  });
}

export async function generateQRBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, { width: 300, margin: 2 });
}
