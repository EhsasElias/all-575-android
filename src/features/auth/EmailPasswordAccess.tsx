import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { errorCode, http, isApiError, type Data, type Schemas } from '@/shared/api';
import { useSession } from '@/shared/session';
import { Button, useToast } from '@/shared/ui';
import { SignInSteps } from './SignInSteps';
import { currentDeviceName } from './deviceName';
import { EmailPasswordForm } from './EmailPasswordForm';
import { useConsentVersions } from './useConsentVersions';
import styles from './StepLayout.module.css';

type LoginReply = {
  token: string;
  user: Schemas['UserResource'];
  is_new_user: boolean;
};
type Challenge = { challenge_id: string; expires_in: number; resend_after: number };
type Stage = 'form' | 'verify' | 'reset';
type Props = { createAccount: boolean };

/**
 * Primary email/password UI backed entirely by Laravel/MySQL and Sanctum.
 * New email accounts require the existing single-use email OTP before login.
 * The existing OTP sign-in UI remains available for recovery or phone login.
 */
export function EmailPasswordAccess({ createAccount }: Props) {
  const { t, i18n } = useTranslation('auth');
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  const session = useSession();
  const { showToast } = useToast();
  const legal = useConsentVersions(null);
  const [useOtp, setUseOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp] = useState('');

  const showFailure = (error: unknown) => {
    if (isApiError(error)) {
      const code = errorCode(error);
      if (code === 'email_exists') {
        setFailure(tr('البريد مسجل بالفعل. سجّل الدخول أو استعد الحساب.', 'This email is already registered. Sign in or recover your account.'));
      } else if (code === 'invalid_credentials') {
        setFailure(tr('بيانات الدخول غير صحيحة أو البريد غير مؤكد. يمكنك التحقق باستخدام OTP.', 'Incorrect credentials or unverified email. Try email OTP.'));
      } else if (code === 'consent_required') {
        setFailure(createAccount
          ? tr('تغير إصدار الشروط أو الخصوصية على الخادم. حدّثي الصفحة ثم وافقي على النسخ الحالية.', 'The server requires newer Terms or Privacy versions. Refresh the page, then accept the current versions.')
          : tr('يلزم قبول الشروط الحالية. استخدمي تسجيل الدخول بالرمز لاستكمال الموافقة.', 'Updated consent is required. Use OTP sign-in to accept current terms.'));
      } else if (code === 'otp_delivery_unavailable') {
        setFailure(tr('خدمة إرسال الرمز غير متاحة. تحققي من إعدادات SMTP في Laravel.', 'Email verification delivery is unavailable. Check Laravel SMTP settings.'));
      } else if (code === 'otp_cooldown' || error.kind === 'rate-limited') {
        setFailure(tr('طلبات التحقق كثيرة. انتظري قليلًا ثم حاولي مجددًا.', 'Too many verification requests. Wait before retrying.'));
      } else if (error.kind === 'validation') {
        const firstFieldError = Object.values(error.fieldErrors).flat()[0];
        setFailure(firstFieldError ?? tr('تحققي من البيانات المطلوبة وصحة البريد وكلمة المرور.', 'Check your email, password and required fields.'));
      } else if (error.kind === 'network' || error.kind === 'timeout') {
        setFailure(tr('تعذر الوصول إلى خادم Laravel. تأكدي أن API يعمل وأن العنوان صحيح.', 'Could not reach the Laravel API. Check that it is running and configured correctly.'));
      } else if (error.kind === 'server') {
        setFailure(tr('حدث خطأ على خادم Laravel. راجعي سجل laravel.log لمعرفة السبب.', 'Laravel reported a server error. Check laravel.log for the cause.'));
      } else {
        setFailure(tr('تعذر إكمال الطلب. رمز الاستجابة: ', 'Request failed. HTTP status: ') + String(error.status ?? 'unknown'));
      }
    } else {
      setFailure(tr('تعذر إكمال العملية. حاول مجددًا.', 'Unable to complete the request. Try again.'));
    }
  };

  const complete = async (reply: LoginReply) => {
    await session.signIn(reply.token, reply.user);
    showToast({ message: t(reply.is_new_user ? 'welcome.newAccount' : 'welcome.returning'), variant: 'success' });
  };

  async function submit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;
    setFailure(''); setNotice('');
    if (createAccount && (legal.status !== 'ready' || !legalAccepted)) {
      setFailure(t('emailPassword.acceptLegal'));
      return;
    }
    if (createAccount && password.length < 12) {
      setFailure(t('emailPassword.weakPassword'));
      return;
    }
    setPending(true);
    try {
      if (createAccount) {
        if (legal.status !== 'ready') return;
        const response = await http.post<Data<Challenge>>('/auth/email/register', {
          email: email.trim().toLowerCase(), password,
          consents: {
            terms_version: legal.versions.terms,
            privacy_version: legal.versions.privacy,
            marketing,
          },
        });
        setChallengeId(response.data.challenge_id);
        setStage('verify');
        setPassword('');
        setNotice(tr('أرسلنا رمز التحقق إلى بريدك. أدخليه لتفعيل الحساب.', 'We sent a verification code to your email. Enter it to activate your account.'));
      } else {
        const response = await http.post<Data<LoginReply>>('/auth/email/login', {
          email: email.trim().toLowerCase(), password, device_name: currentDeviceName(),
        });
        await complete(response.data);
      }
    } catch (error) { showFailure(error); }
    finally { setPending(false); }
  }

  async function sendCode(recovery: boolean): Promise<void> {
    if (pending) return;
    if (!email.trim()) { setFailure(t('emailPassword.enterEmail')); return; }
    setPending(true); setFailure('');
    try {
      const response = await http.post<Data<Challenge>>('/auth/otp/request', {
        channel: 'email', destination: email.trim().toLowerCase(),
      });
      setChallengeId(response.data.challenge_id);
      setStage(recovery ? 'reset' : 'verify');
      setOtp('');
      setNotice(tr('تم إرسال رمز إلى البريد الإلكتروني.', 'A code was sent to your email.'));
    } catch (error) { showFailure(error); }
    finally { setPending(false); }
  }

  async function verifyCode(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending || !challengeId || !/^[0-9]{6}$/.test(otp)) return;
    setPending(true); setFailure('');
    try {
      if (stage === 'reset') {
        if (password.length < 12) {
          setFailure(t('emailPassword.weakPassword'));
          return;
        }
        const response = await http.post<Data<LoginReply>>('/auth/email/password-reset', {
          challenge_id: challengeId, code: otp, password, device_name: currentDeviceName(),
        });
        await complete(response.data);
      } else {
        const response = await http.post<Data<LoginReply>>('/auth/otp/verify', {
          challenge_id: challengeId, code: otp, device_name: currentDeviceName(),
        });
        await complete(response.data);
      }
    } catch (error) { showFailure(error); }
    finally { setPending(false); }
  }

  if (useOtp) {
    return (
      <div className={styles.step}>
        <Button variant="ghost" onClick={() => setUseOtp(false)}>{t('emailPassword.backToEmail')}</Button>
        <SignInSteps />
      </div>
    );
  }

  if (stage !== 'form') {
    return (
      <div className={styles.step}>
        <h2 className={styles.stepTitle}>
          {stage === 'reset' ? tr('استعادة كلمة المرور', 'Reset password') : tr('تأكيد البريد الإلكتروني', 'Verify your email')}
        </h2>
        <p>{email}</p>
        {notice && <p role="status">{notice}</p>}
        {failure && <p role="alert" className={styles.alert}>{failure}</p>}
        <form className={styles.form} onSubmit={(event) => void verifyCode(event)}>
          <label>
            {tr('رمز التحقق المكون من 6 أرقام', 'Six-digit verification code')}
            <input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}"
              maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value)} />
          </label>
          {stage === 'reset' && (
            <label>
              {tr('كلمة المرور الجديدة (12 حرفًا على الأقل)', 'New password (at least 12 characters)')}
              <input type="password" minLength={12} required autoComplete="new-password" value={password}
                onChange={(event) => setPassword(event.target.value)} />
            </label>
          )}
          <Button type="submit" size="lg" fullWidth loading={pending}>
            {stage === 'reset' ? tr('تغيير كلمة المرور والدخول', 'Reset password and sign in') : tr('تأكيد البريد والدخول', 'Verify email and sign in')}
          </Button>
        </form>
        <Button variant="ghost" disabled={pending}
          onClick={() => void sendCode(stage === 'reset')}>
          {tr('إعادة إرسال الرمز بعد دقيقة', 'Resend code after one minute')}
        </Button>
        <Button variant="ghost" onClick={() => { setStage('form'); setFailure(''); setNotice(''); }}>
          {tr('العودة', 'Back')}
        </Button>
      </div>
    );
  }

  return (
    <EmailPasswordForm
      createAccount={createAccount}
      verificationRequested={false}
      email={email}
      password={password}
      pending={pending}
      failure={failure}
      notice={notice}
      legal={legal}
      legalAccepted={legalAccepted}
      marketing={marketing}
      onEmail={setEmail}
      onPassword={setPassword}
      onLegal={setLegalAccepted}
      onMarketing={setMarketing}
      onSubmit={(event) => { void submit(event); }}
      onReset={() => { void sendCode(true); }}
      onOtp={() => setUseOtp(true)}
    />
  );
}
