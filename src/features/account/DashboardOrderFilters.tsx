import { useState } from 'react';
import { useNavigate } from 'react-router';
import { routePaths } from '@/shared/lib';
import styles from './CustomerDashboard.module.css';

export function DashboardOrderFilters() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    product: '', status: '', min_price: '', max_price: '',
    from: '', to: '', seller: '', branch: '', payment_method: '',
  });
  const set = (key: keyof typeof values, value: string) =>
    setValues(previous => ({ ...previous, [key]: value }));
  const valid = (!values.from || !values.to || values.from <= values.to) &&
    (!values.min_price || !values.max_price ||
      Number(values.min_price) <= Number(values.max_price));
  return (
    <section className={styles.section} aria-label="Customer order filters">
      <h2>Order filters / تصفية الطلبات</h2>
      <form className={styles.filterGrid} onSubmit={event => {
        event.preventDefault();
        if (!valid) return;
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(values)) {
          if (value.trim()) query.set(key, value.trim());
        }
        void navigate(routePaths.orders + (query.size ? '?' + query.toString() : ''));
      }}>
        <label>Product name / اسم المنتج<input type="search" value={values.product} onChange={e => set('product', e.target.value)} maxLength={120}/></label>
        <label>Status / الحالة<select value={values.status} onChange={e => set('status', e.target.value)}>
          <option value="">All / الكل</option>
          <option value="pending_payment">Pending payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select></label>
        <label>Min price (SAR) / أقل سعر<input type="number" min="0" step=".01" value={values.min_price} onChange={e => set('min_price', e.target.value)}/></label>
        <label>Max price (SAR) / أعلى سعر<input type="number" min="0" step=".01" value={values.max_price} onChange={e => set('max_price', e.target.value)}/></label>
        <label>From date / من تاريخ<input type="date" value={values.from} onChange={e => set('from', e.target.value)}/></label>
        <label>To date / إلى تاريخ<input type="date" value={values.to} onChange={e => set('to', e.target.value)}/></label>
        <label>Company name / اسم الشركة<input type="search" maxLength={120} value={values.seller} onChange={e => set('seller', e.target.value)}/></label>
        <label>Branch name / اسم الفرع<input type="search" maxLength={120} value={values.branch} onChange={e => set('branch', e.target.value)}/></label>
        <label>Payment type / نوع الدفع<select value={values.payment_method} onChange={e => set('payment_method', e.target.value)}>
          <option value="">All / الكل</option>
          <option value="mada">Mada</option>
          <option value="card">Card (Visa / Mastercard)</option>
          <option value="apple_pay">Apple Pay</option>
          <option value="cash_on_delivery">Cash on delivery</option>
        </select></label>
        {!valid && <p role="alert">Check date and price ranges / تحقق من نطاق التاريخ والسعر</p>}
        <button type="submit" className={styles.filterSubmit} disabled={!valid}>Search orders / بحث الطلبات</button>
        <button type="reset" className={styles.filterReset} onClick={() => setValues({
          product: '', status: '', min_price: '', max_price: '',
          from: '', to: '', seller: '', branch: '', payment_method: '',
        })}>Clear / مسح الفلاتر</button>
      </form>
    </section>
  );
}
