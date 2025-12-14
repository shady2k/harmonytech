/**
 * QR Code - Generate QR codes for invite links
 */

import QRCode from 'qrcode'

/**
 * Generate QR code as data URL for use in <img src="">
 *
 * @param data - Data to encode in QR code
 * @param size - Width/height in pixels (default 200)
 * @returns Promise resolving to data URL string
 */
export async function generateQRCode(data: string, size = 200): Promise<string> {
  return QRCode.toDataURL(data, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

/**
 * Generate QR code as SVG string
 *
 * @param data - Data to encode in QR code
 * @returns Promise resolving to SVG string
 */
export async function generateQRCodeSVG(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
  })
}
