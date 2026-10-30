import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
    title: 'Chemical Price Index | Elate Chem',
    description:
        'Date-wise pricing for bulk chemicals, solvents, and intermediates from India. Search by material to view historical price trends.',
    openGraph: {
        title: 'Chemical Price Index | Elate Chem',
        description:
            'Date-wise pricing for bulk chemicals, solvents, and intermediates.',
    },
    robots: { index: true, follow: true },
};

export default function PricingPage() {
    return <PricingClient />;
}