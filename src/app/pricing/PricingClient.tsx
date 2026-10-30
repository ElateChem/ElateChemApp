'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AppNavigation from '@/components/AppNavigation';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PricingRow = {
    material_name: string;
    price_date: string;
    price: number;
    port: string | null;
};

type Pivot = {
    materials: string[];
    dates: string[];
    matrix: Map<string, Map<string, PricingRow>>;
    ports: Map<string, string | null>;
};

const priceFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
});

function formatHeaderDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y.slice(2)}`;
}

async function fetchAllPricing(): Promise<PricingRow[]> {
    const pageSize = 1000;
    const all: PricingRow[] = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase
            .from('pricing_data')
            .select('material_name, price_date, price, port')
            .order('material_name', { ascending: true })
            .order('price_date', { ascending: true })
            .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...(data as PricingRow[]));
        if (data.length < pageSize) break;
        from += pageSize;
    }
    return all;
}

function buildPivot(rows: PricingRow[]): Pivot {
    const matrix = new Map<string, Map<string, PricingRow>>();
    const materials = new Set<string>();
    const dates = new Set<string>();
    const ports = new Map<string, string | null>();

    for (const row of rows) {
        materials.add(row.material_name);
        dates.add(row.price_date);
        if (!matrix.has(row.material_name)) matrix.set(row.material_name, new Map());
        matrix.get(row.material_name)!.set(row.price_date, row);
        // Keep the first non-null port per material
        if (!ports.get(row.material_name) && row.port) {
            ports.set(row.material_name, row.port);
        }
    }

    return {
        materials: [...materials].sort(),
        dates: [...dates].sort(),
        matrix,
        ports,
    };
}

export default function PricingClient() {
    const [allRows, setAllRows] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [lastNDates, setLastNDates] = useState<number | 'all'>('all');

    // Fetch all rows (paginated)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const rows = await fetchAllPricing();
                if (!cancelled) setAllRows(rows);
            } catch (err: any) {
                if (!cancelled) setError(err.message || 'Failed to load pricing data');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Pre-fill search from ?material=
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mat = params.get('material');
        if (mat) setSearch(mat);
    }, []);

    const pivot = useMemo(() => buildPivot(allRows), [allRows]);

    const visibleDates = useMemo(() => {
        if (lastNDates === 'all') return pivot.dates;
        return pivot.dates.slice(-lastNDates);
    }, [pivot.dates, lastNDates]);

    const filteredMaterials = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return pivot.materials;
        return pivot.materials.filter((m) => m.toLowerCase().includes(q));
    }, [pivot.materials, search]);

    const latestDate = pivot.dates[pivot.dates.length - 1];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
            <AppNavigation />

            <main className="flex-1">
                {/* Hero */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-10 border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Chemical Price Index
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                            Date-wise pricing for bulk chemicals, solvents, and intermediates.
                        </p>
                        {!loading && !error && pivot.materials.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <span>
                                    <b>{pivot.materials.length}</b> materials
                                </span>
                                <span>
                                    <b>{pivot.dates.length}</b> dates
                                </span>
                                {latestDate && (
                                    <span>
                                        Latest: <b>{formatHeaderDate(latestDate)}</b>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="sticky top-16 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search material..."
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={lastNDates}
                            onChange={(e) => {
                                const v = e.target.value;
                                setLastNDates(v === 'all' ? 'all' : Number(v));
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="all">All dates</option>
                            <option value="24">Last 24 dates</option>
                            <option value="12">Last 12 dates</option>
                            <option value="6">Last 6 dates</option>
                            <option value="3">Last 3 dates</option>
                            <option value="1">Latest only</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-6 rounded-lg">
                            {error}
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                            {search
                                ? `No materials match "${search}"`
                                : 'No pricing data available yet.'}
                        </div>
                    ) : (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="overflow-auto max-h-[75vh]">
                                <table className="min-w-max border-collapse text-sm">
                                    <thead className="sticky top-0 z-20">
                                        <tr>
                                            <th className="sticky left-0 z-30 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b border-r border-gray-300 dark:border-gray-600 whitespace-nowrap">
                                                Material
                                            </th>
                                            {visibleDates.map((d) => (
                                                <th
                                                    key={d}
                                                    className={`px-3 py-2 text-right text-xs font-semibold border-b border-gray-300 dark:border-gray-600 whitespace-nowrap ${d === latestDate
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                >
                                                    {formatHeaderDate(d)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMaterials.map((mat, idx) => {
                                            const port = pivot.ports.get(mat);
                                            const rowData = pivot.matrix.get(mat);
                                            const rowBg =
                                                idx % 2 === 0
                                                    ? 'bg-white dark:bg-gray-900'
                                                    : 'bg-gray-50 dark:bg-gray-900/60';
                                            return (
                                                <tr key={mat} className={rowBg}>
                                                    <td
                                                        className={`sticky left-0 z-10 px-4 py-1.5 border-b border-r border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap ${rowBg}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{mat}</span>
                                                            {port && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-normal">
                                                                    {port}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {visibleDates.map((d) => {
                                                        const cell = rowData?.get(d);
                                                        const hasPrice = cell && Number(cell.price) > 0;
                                                        return (
                                                            <td
                                                                key={d}
                                                                title={
                                                                    cell
                                                                        ? `${mat} · ${d} · ${hasPrice
                                                                            ? priceFormatter.format(Number(cell.price))
                                                                            : 'no price'
                                                                        }`
                                                                        : `${mat} · ${d} · —`
                                                                }
                                                                className={`px-3 py-1.5 text-right border-b border-gray-100 dark:border-gray-800 whitespace-nowrap ${d === latestDate
                                                                        ? 'bg-blue-50/40 dark:bg-blue-900/10'
                                                                        : ''
                                                                    }`}
                                                            >
                                                                {hasPrice ? (
                                                                    <span className="text-gray-800 dark:text-gray-200 tabular-nums">
                                                                        {priceFormatter.format(Number(cell.price))}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300 dark:text-gray-600">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white pt-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} Elate Chem. All rights reserved.
                </div>
            </footer>
        </div>
    );
}