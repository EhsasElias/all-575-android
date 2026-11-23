import { useEffect, useRef, useState } from 'react';
import { scannerFrench } from './scannerFrench';

type BarcodeHit = { rawValue: string; format?: string };
type Detector = { detect(source: ImageBitmapSource): Promise<BarcodeHit[]> };
type DetectorClass = new (options?: { formats: string[] }) => Detector;
type CameraDevices = Pick<MediaDevices, 'getUserMedia'>;

declare global {
  interface Window {
    BarcodeDetector?: DetectorClass;
  }
}

function getDetectorClass(): DetectorClass | undefined {
  return typeof window === 'undefined' ? undefined : window.BarcodeDetector;
}

function isCameraDevices(value: unknown): value is CameraDevices {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getUserMedia' in value &&
    typeof value.getUserMedia === 'function'
  );
}

function getCameraDevices(): CameraDevices | null {
  if (typeof navigator === 'undefined') return null;
  const candidate: unknown = Reflect.get(navigator, 'mediaDevices');
  return isCameraDevices(candidate) ? candidate : null;
}

export function scannerText(
  ar: boolean,
  fr: boolean,
  arabic: string,
  english: keyof typeof scannerFrench,
): string {
  return ar ? arabic : fr ? scannerFrench[english] : english;
}

export function useProductCamera(onRead: (text: string, format?: string) => void, ar: boolean, fr: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callback = useRef(onRead);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);

  const Detector = getDetectorClass();
  const cameraDevices = getCameraDevices();
  const unavailableMessage = !Detector
    ? scannerText(
        ar,
        fr,
        'هذا المتصفح لا يدعم قراءة الرموز مباشرة بالكاميرا. استخدم Chrome حديثًا على Android أو أدخل الرمز يدويًا.',
        'This browser cannot decode barcodes directly. Try current Chrome on Android or type the code.',
      )
    : !cameraDevices
      ? scannerText(
          ar,
          fr,
          'الكاميرا غير متاحة. افتح الموقع عبر HTTPS أو استخدم الإدخال اليدوي.',
          'Camera unavailable. Use HTTPS or enter the code manually.',
        )
      : '';

  useEffect(() => {
    callback.current = onRead;
  }, [onRead]);

  useEffect(() => {
    if (!Detector || !cameraDevices) return;

    // Capture the mounted video node once. Cleanup must not read a changing ref.
    const video = videoRef.current;
    if (!video) return;

    let stopped = false;
    let stream: MediaStream | null = null;
    let frame = 0;
    let lastScan = 0;

    const stopCamera = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
      video.srcObject = null;
    };

    void (async () => {
      try {
        const detector = new Detector();
        const camera = await cameraDevices.getUserMedia({
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
        video.srcObject = camera;
        await video.play();
        if (stopped) return;
        setReady(true);

        const scan = (timestamp: number): void => {
          if (stopped) return;
          if (video.readyState < 2 || timestamp - lastScan <= 250) {
            frame = requestAnimationFrame(scan);
            return;
          }
          lastScan = timestamp;
          void detector
            .detect(video)
            .then((hits) => {
              const hit = hits.find((item) => item.rawValue.trim());
              if (hit && !stopped) {
                stopCamera();
                callback.current(hit.rawValue, hit.format);
              }
            })
            .catch(() => {
              // An individual frame can be undecodable; retry another frame.
            })
            .finally(() => {
              if (!stopped) frame = requestAnimationFrame(scan);
            });
        };

        frame = requestAnimationFrame(scan);
      } catch {
        if (!stopped) {
          stopCamera();
          setMessage(
            scannerText(
              ar,
              fr,
              'تعذر تشغيل الكاميرا. تأكد من منح الإذن ثم أعد فتح الماسح، أو أدخل الرمز يدويًا.',
              'Camera could not start. Allow camera permission and retry, or type the code.',
            ),
          );
        }
      }
    })();

    return stopCamera;
  }, [Detector, cameraDevices, ar, fr]);

  return { videoRef, ready, message, setMessage, unavailableMessage };
}
