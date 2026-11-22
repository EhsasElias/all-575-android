import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scannerFrench } from './scannerFrench';

type BarcodeHit = { rawValue: string; format?: string };
type Detector = { detect(source: ImageBitmapSource): Promise<BarcodeHit[]> };
type DetectorClass = new (options?: { formats: string[] }) => Detector;
type DetectorWindow = Window & { BarcodeDetector?: DetectorClass };

function scannerText(
  ar: boolean,
  fr: boolean,
  arabic: string,
  english: keyof typeof scannerFrench,
): string {
  return ar ? arabic : fr ? scannerFrench[english] : english;
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const callback = useRef(onRead);
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState('');
  const [ready, setReady] = useState(false);
  const [busyImage, setBusyImage] = useState(false);

  useEffect(() => {
    callback.current = onRead;
  }, [onRead]);

  useEffect(() => {
    const Detector = (window as DetectorWindow).BarcodeDetector;
    if (!Detector) {
      setMessage(
        scannerText(
          ar,
          fr,
          'هذا المتصفح لا يدعم قراءة الرموز مباشرة بالكاميرا. استخدم Chrome حديثًا على Android أو أدخل الرمز يدويًا.',
          'This browser cannot decode barcodes directly. Try current Chrome on Android or type the code.',
        ),
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        scannerText(
          ar,
          fr,
          'الكاميرا غير متاحة. افتح الموقع عبر HTTPS أو استخدم الإدخال اليدوي.',
          'Camera unavailable. Use HTTPS or enter the code manually.',
        ),
      );
      return;
    }

    let stopped = false;
    let stream: MediaStream | null = null;
    let frame = 0;
    const detector = new Detector();
    let detecting = false;
    let lastScan = 0;

    async function scan(timestamp: number) {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !detecting && timestamp - lastScan > 250) {
        lastScan = timestamp;
        detecting = true;
        try {
          const hits = await detector.detect(video);
          const hit = hits.find((item) => item.rawValue.trim());
          if (hit && !stopped) {
            stopped = true;
            callback.current(hit.rawValue, hit.format);
            return;
          }
        } catch {
          // A temporary frame decode failure is normal; retry on the next frame.
        } finally {
          detecting = false;
        }
      }
      if (!stopped) frame = requestAnimationFrame(scan);
    }

    void (async () => {
      try {
        const camera = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        });
        if (stopped) {
          camera.getTracks().forEach((track) => {
            track.stop();
          });
          return;
        }
        stream = camera;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = camera;
        await video.play();
        if (stopped) return;
        setReady(true);
        frame = requestAnimationFrame(scan);
      } catch {
        if (!stopped)
          setMessage(
            scannerText(
              ar,
              fr,
              'تعذر تشغيل الكاميرا. تأكد من منح الإذن ثم أعد فتح الماسح، أو أدخل الرمز يدويًا.',
              'Camera could not start. Allow camera permission and retry, or type the code.',
            ),
          );
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [ar, fr]);

  const fromPhoto = async (file: File | undefined) => {
    if (!file || busyImage) return;
    const Detector = (window as DetectorWindow).BarcodeDetector;
    if (!Detector) {
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
        const result = await new Detector().detect(bitmap);
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
      {message && (
        <p role="status" className="seller-form-message">
          {message}
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
