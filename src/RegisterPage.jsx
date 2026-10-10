import React, {
  useState,
} from 'react';

export default function RegisterPage({
  lang,
  api,
  setAccessToken,
  setCurrentUser,
  showToast,
  go,
}) {
  const [form, setForm] =
    useState({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    });

  const [loading, setLoading] =
    useState(false);

  function updateField(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.password_confirmation
    ) {
      showToast(
        lang === 'ar'
          ? 'أكمل جميع البيانات'
          : 'Complete all fields'
      );

      return;
    }

    if (
      form.password !==
      form.password_confirmation
    ) {
      showToast(
        lang === 'ar'
          ? 'كلمتا المرور غير متطابقتين'
          : 'Passwords do not match'
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await api.register({
          name:
            form.name,

          email:
            form.email,

          password:
            form.password,

          password_confirmation:
            form.password_confirmation,

          device_name:
            'All 5.75 Web',
        });

      if (
        !response?.token
      ) {
        throw new Error(
          lang === 'ar'
            ? 'لم يتم استلام رمز الدخول'
            : 'Login token was not returned'
        );
      }

      setAccessToken(
        response.token
      );

      let user =
        response?.user ||
        null;

      try {
        const meResponse =
          await api.me();

        user =
          meResponse?.user ||
          meResponse?.data ||
          meResponse ||
          user;
      } catch (error) {
        console.warn(
          'Could not load user:',
          error
        );
      }

      setCurrentUser(
        user
      );

      showToast(
        lang === 'ar'
          ? 'تم إنشاء الحساب بنجاح'
          : 'Account created successfully'
      );

      go(
        'settings'
      );
    } catch (error) {
      console.error(
        'Register error:',
        error
      );

      let message =
        error?.message;

      if (
        error?.errors
      ) {
        const firstError =
          Object
            .values(
              error.errors
            )
            .flat()[0];

        if (firstError) {
          message =
            firstError;
        }
      }

      showToast(
        message ||
        (
          lang === 'ar'
            ? 'تعذر إنشاء الحساب'
            : 'Could not create account'
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">

      <div className="page-title">
        <h1>
          {lang === 'ar'
            ? 'إنشاء حساب'
            : 'Create account'}
        </h1>
      </div>

      <form
        className="checkout-card"
        onSubmit={
          submit
        }
      >

        <p className="page-lead">
          {lang === 'ar'
            ? 'أنشئ حسابك للطلب وحفظ المفضلة ومتابعة طلباتك.'
            : 'Create an account to shop, save favorites and track your orders.'}
        </p>

        <label className="field">

          <span>
            {lang === 'ar'
              ? 'الاسم'
              : 'Name'}
          </span>

          <input
            type="text"
            value={
              form.name
            }
            onChange={
              (event) =>
                updateField(
                  'name',
                  event.target.value
                )
            }
            autoComplete="name"
          />

        </label>

        <label className="field">

          <span>
            {lang === 'ar'
              ? 'البريد الإلكتروني'
              : 'Email'}
          </span>

          <input
            type="email"
            value={
              form.email
            }
            onChange={
              (event) =>
                updateField(
                  'email',
                  event.target.value
                )
            }
            autoComplete="email"
          />

        </label>

        <label className="field">

          <span>
            {lang === 'ar'
              ? 'كلمة المرور'
              : 'Password'}
          </span>

          <input
            type="password"
            value={
              form.password
            }
            onChange={
              (event) =>
                updateField(
                  'password',
                  event.target.value
                )
            }
            autoComplete="new-password"
          />

        </label>

        <label className="field">

          <span>
            {lang === 'ar'
              ? 'تأكيد كلمة المرور'
              : 'Confirm password'}
          </span>

          <input
            type="password"
            value={
              form.password_confirmation
            }
            onChange={
              (event) =>
                updateField(
                  'password_confirmation',
                  event.target.value
                )
            }
            autoComplete="new-password"
          />

        </label>

        <button
          className="primary-btn"
          type="submit"
          disabled={
            loading
          }
        >
          {loading
            ? (
                lang === 'ar'
                  ? 'جاري إنشاء الحساب...'
                  : 'Creating account...'
              )
            : (
                lang === 'ar'
                  ? 'إنشاء الحساب'
                  : 'Create account'
              )}
        </button>

        <button
          type="button"
          className="auth-secondary-btn"
          onClick={() =>
            go('login')
          }
        >
          {lang === 'ar'
            ? 'لدي حساب بالفعل'
            : 'I already have an account'}
        </button>

      </form>

    </section>
  );
}