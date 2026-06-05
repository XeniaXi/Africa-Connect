'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchForm.module.css';

interface SearchFormProps {
  defaultIntent?: string;
  defaultCategory?: string;
  defaultCity?: string;
}

export default function SearchForm({
  defaultIntent = '',
  defaultCategory = '',
  defaultCity = '',
}: SearchFormProps) {
  const router = useRouter();
  const [intent, setIntent] = useState(defaultIntent);
  const [category, setCategory] = useState(defaultCategory);
  const [city, setCity] = useState(defaultCity);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (intent) params.set('intent', intent);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    router.push('/search?' + params.toString());
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        name="intent"
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="e.g. AC repair near me, nearby hospital"
        aria-label="Search intent"
      />
      <div className={styles.row}>
        <select
          className={styles.select}
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
        >
          <option value="">All Categories</option>
          <option value="artisan">Artisan</option>
          <option value="healthcare">Healthcare</option>
          <option value="education">Education</option>
          <option value="logistics">Logistics</option>
          <option value="food">Food</option>
          <option value="retail">Retail</option>
        </select>
        <input
          className={styles.input}
          type="text"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Lagos, Abuja, Port Harcourt..."
          aria-label="City"
        />
        <button type="submit" className={styles.submitBtn}>
          Search
        </button>
      </div>
    </form>
  );
}
