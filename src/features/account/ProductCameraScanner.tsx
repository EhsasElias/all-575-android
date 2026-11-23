import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scannerText, useProductCamera } from './useProductCamera';

export type ProductCameraScannerProps = {
  onRead: (text: string, format?: string) => void;
  onClose: () => void;
  ar: boolean;
};

/**
 * Camera access begins only after the seller opens the scanner.
 * No frames or scanned text are uploaded to third-party services.
 */
export function ProductCameraScanner({ onRead, onClose, ar }: ProductCameraScannerProps) {
  const { i18n } = useTranslation();
  const fr = i18n.language.startsWith('fr');
  const { videoRef, ready, message, setMessage, unavailableMessage } = useProductCamera(onRead, ar, fr);
  const [manual, setManual] = useState('');
  const [busyImage, setBusyImage] = useState(false);

  const fromPhoto = async (file: File | undefined) => {
    if (!file || busyImage) return;
    const PhotoDetector = typeof window === 'undefined' ? undefined : window.BarcodeDetector;
    if (!PhotoDetector) {
      setMessage(
        scannerText(
          ar,
          fr,
          'قراءة الصور غير مدعومة في هذا المتصفح.',
          'Photo decoding is unavailable in this browser.',
        ),
      );
      return;
    }
    setBusyImage(true);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const result = await new PhotoDetector().detect(bitmap);
        const hit = result.find((item) => item.rawValue.trim());
        if (!hit) {
          setMessage(
            scannerText(
              ar,
              fr,
              'لم يتم العثور على رمز واضح في الصورة.',
              'No readable code found in the photo.',
            ),
          );
        } else {
          onRead(hit.rawValue, hit.format);
        }
      } finally {
        bitmap.close();
      }
    } catch {
      setMessage(
        scannerText(
          ar,
          fr,
          'تعذرت قراءة الصورة. حاول تقريب الرمز أو استخدم الإدخال اليدوي.',
          'Photo could not be read. Move closer to the code or enter it manually.',
        ),
      );
    } finally {
      setBusyImage(false);
    }
  };

  return (
    <div
      className="seller-scanner"
      role="dialog"
      aria-label={scannerText(ar, fr, 'مسح باركود أو QR', 'Scan barcode or QR')}
    >
      <div className="seller-scanner-header">
        <strong>{scannerText(ar, fr, 'مسح المنتج بالكاميرا', 'Scan product with camera')}</strong>
        <button
          type="button"
          onClick={onClose}
          aria-label={scannerText(ar, fr, 'إغلاق الماسح', 'Close scanner')}
        >
          ×
        </button>
      </div>
      <div className="seller-scanner-video">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-label={scannerText(ar, fr, 'معاينة الكاميرا', 'Camera preview')}
        />
        {ready && <span className="seller-scanner-target" aria-hidden="true" />}
      </div>
      <p>
        {scannerText(
          ar,
          fr,
          'وجّه الكاميرا نحو Barcode أو QR. ستُنسخ البيانات المقروءة إلى الحقول المناسبة للمراجعة.',
          'Point the camera at a barcode or QR. Recognized fields will be filled for your review.',
        )}
      </p>
      {(message || unavailableMessage) && (
        <p role="status" className="seller-form-message">
          {message || unavailableMessage}
        </p>
      )}
      <label className="seller-scanner-photo">
        {scannerText(ar, fr, 'قراءة الرمز من صورة', 'Read code from a photo')}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={busyImage}
          onChange={(event) => {
            void fromPhoto(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </label>
      <div className="seller-scanner-manual">
        <label>
          {scannerText(ar, fr, 'أو أدخل الرمز يدويًا', 'Or enter code manually')}
          <input
            value={manual}
            maxLength={12000}
            onChange={(event) => {
              setManual(event.target.value);
            }}
          />
        </label>
        <button
          type="button"
          disabled={!manual.trim()}
          onClick={() => {
            onRead(manual.trim());
          }}
        >
          {scannerText(ar, fr, 'استخدام الرمز', 'Use code')}
        </button>
      </div>
    </div>
  );
}
