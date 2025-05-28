"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Bars3Icon as MenuIcon,
    XMarkIcon as XIcon,
    HomeModernIcon as HomeIcon,
    DocumentPlusIcon as DocumentAddIcon,
    MagnifyingGlassIcon as SearchIcon,
    ArrowLeftOnRectangleIcon as LogoutIcon,
    ChatBubbleBottomCenterTextIcon as ContactIcon,
    ClipboardDocumentListIcon as RequestIcon,
    UserGroupIcon as UsersIcon
} from '@heroicons/react/24/outline'
import SeoProvider from "@/components/seo-provider";
import Papa from 'papaparse';


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [vendors, setVendors] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingVendors, setIsLoadingVendors] = useState(false);

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [updateMessage, setUpdateMessage] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const [contactSubmissions, setContactSubmissions] = useState<any[]>([]);
    const [searchRequests, setSearchRequests] = useState<any[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isProcessingCSV, setIsProcessingCSV] = useState(false);
    const [processingProgress, setProcessingProgress] = useState('');
    const [csvError, setCsvError] = useState('');
    const [processingRows, setProcessingRows] = useState<Array<{
        data: any;
        status: 'pending' | 'processing' | 'completed' | 'error';
        srno?: string;
        error?: string;
    }>>([]);

    const [totalVendors, setTotalVendors] = useState(0);
    const [totalContacts, setTotalContacts] = useState(0);
    const [totalRequests, setTotalRequests] = useState(0);

    // Add clear handler
    const handleClearHistory = () => {
        setProcessingRows([]);
        setProcessingProgress('');
        setCsvError('');
    };

    // Add CSV upload handler
    const handleCSVUpload = async () => {
        if (!csvFile) return;

        setIsProcessingCSV(true);
        setCsvError('');
        setProcessingRows([]);

        try {
            Papa.parse(csvFile, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const { data, errors } = results;

                    if (errors.length > 0) {
                        throw new Error(`CSV parsing error: ${errors[0].message}`);
                    }

                    // Validate CSV headers (removed Srno from required columns)
                    const requiredColumns = ['Chemicalname', 'Category', 'Casno', 'Suppliername',
                        'Email&link', 'Phoneno', 'Businessstatus', 'Country'];
                    const csvHeaders = Object.keys(data[0] || {});

                    if (!requiredColumns.every(col => csvHeaders.includes(col))) {
                        throw new Error('CSV file is missing required columns');
                    }

                    // Initialize processing rows without Srno
                    setProcessingRows(data.map(row => ({
                        data: row,
                        status: 'pending'
                    })));

                    // Insert data in batches
                    const BATCH_SIZE = 50;
                    for (let i = 0; i < data.length; i += BATCH_SIZE) {
                        const batch = data.slice(i, i + BATCH_SIZE);

                        setProcessingRows(prev => prev.map((item, index) =>
                            (index >= i && index < i + BATCH_SIZE)
                                ? { ...item, status: 'processing' }
                                : item
                        ));
                        setProcessingProgress(`Processing rows ${i + 1}-${Math.min(i + BATCH_SIZE, data.length)}`);

                        const { error } = await supabase
                            .from('vendors_data')
                            .insert(batch);

                        if (error) throw error;

                        setProcessingRows(prev => prev.map((item, index) =>
                            (index >= i && index < i + BATCH_SIZE)
                                ? { ...item, status: 'completed' }
                                : item
                        ));
                    }

                    setProcessingProgress('All rows processed successfully!');
                },
                error: (error: any) => {
                    throw new Error(`CSV parsing failed: ${error.message}`);
                }
            });
        } catch (error: any) {
            console.error('CSV processing error:', error);
            setCsvError(error.message);
            setProcessingRows(prev => prev.map(item =>
                item.status === 'processing' ? { ...item, status: 'error', error: error.message } : item
            ));
        } finally {
            setIsProcessingCSV(false);
            setCsvFile(null);
        }
    };


    // Add useEffect for fetching dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (activeTab !== 'dashboard') return;

            try {
                // Fetch vendors count
                const { count: vendorsCount } = await supabase
                    .from('vendors_data')
                    .select('*', { count: 'exact', head: true });

                // Fetch contact submissions count
                const { count: contactsCount } = await supabase
                    .from('contact_submissions')
                    .select('*', { count: 'exact', head: true });

                // Fetch search requests count
                const { count: requestsCount } = await supabase
                    .from('search_requests')
                    .select('*', { count: 'exact', head: true });

                setTotalVendors(vendorsCount || 0);
                setTotalContacts(contactsCount || 0);
                setTotalRequests(requestsCount || 0);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setTotalVendors(0);
                setTotalContacts(0);
                setTotalRequests(0);
            }
        };

        fetchDashboardData();
    }, [activeTab]); // Refresh when dashboard tab is activated

    // All users fetching
    useEffect(() => {
        const fetchUsers = async () => {
            if (activeTab !== 'all-users') return;

            setIsLoadingUsers(true);
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const formattedData = data.map(user => ({
                    ...user,
                    created_at: convertToIST(user.created_at),
                    updated_at: convertToIST(user.updated_at)
                }));

                setUsers(formattedData);
            } catch (error) {
                console.error('Error fetching users:', error);
                setUsers([]);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [activeTab]);

    // Helper conversion in IST
    const convertToIST = (utcDate: string) => {
        const date = new Date(utcDate);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    const navigation = [
        {
            name: 'Dashboard',
            id: 'dashboard',
            icon: HomeIcon,
            current: activeTab === 'dashboard'
        },
        {
            name: 'All Users',
            id: 'all-users',
            icon: UsersIcon,
            current: activeTab === 'all-users'
        },
        {
            name: 'Add Vendor',
            id: 'add-vendor',
            icon: DocumentAddIcon,
            current: activeTab === 'add-vendor'
        },
        {
            name: 'Vendor Search',
            id: 'vendor-search',
            icon: SearchIcon,
            current: activeTab === 'vendor-search'
        },
        {
            name: 'Contact Submissions',
            id: 'contact-submissions',
            icon: ContactIcon,
            current: activeTab === 'contact-submissions'
        },
        {
            name: 'Requests',
            id: 'requests',
            icon: RequestIcon,
            current: activeTab === 'requests'
        },
    ];

    // Fetching contact submission
    useEffect(() => {
        const fetchContacts = async () => {
            if (activeTab !== 'contact-submissions') return;

            setIsLoadingContacts(true);
            try {
                const { data, error } = await supabase
                    .from('contact_submissions')
                    .select('*')
                    .order('submitted_at', { ascending: false });

                if (error) throw error;

                const formattedData = data.map(item => ({
                    ...item,
                    submitted_at: convertToIST(item.submitted_at)
                }));

                setContactSubmissions(formattedData);
            } catch (error) {
                console.error('Error fetching contacts:', error);
                setContactSubmissions([]);
            } finally {
                setIsLoadingContacts(false);
            }
        };

        fetchContacts();
    }, [activeTab]);

    // Search Requests
    useEffect(() => {
        const fetchRequests = async () => {
            if (activeTab !== 'requests') return;

            setIsLoadingRequests(true);
            try {
                const { data, error } = await supabase
                    .from('search_requests')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const formattedData = data.map(item => ({
                    ...item,
                    requested_at: convertToIST(item.requested_at),
                    created_at: convertToIST(item.created_at)
                }));

                setSearchRequests(formattedData);
            } catch (error) {
                console.error('Error fetching requests:', error);
                setSearchRequests([]);
            } finally {
                setIsLoadingRequests(false);
            }
        };

        fetchRequests();
    }, [activeTab]);

    // Add this useEffect for fetching vendors
    useEffect(() => {
        const fetchVendors = async () => {
            setIsLoadingVendors(true);
            try {
                const itemsPerPage = 10;
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage - 1;

                let query = supabase
                    .from('vendors_data') // Changed from vendors_list
                    .select('*', { count: 'exact' });

                if (searchQuery) {
                    query = query.or(
                        `Casno.ilike.%${searchQuery}%,Chemicalname.ilike.%${searchQuery}%,Suppliername.ilike.%${searchQuery}%`
                    );
                }

                const { data, error, count } = await query
                    .range(start, end)
                    .order('Srno', { ascending: true });

                if (error) throw error;

                setVendors(data || []);
                setTotalPages(Math.ceil((count || 0) / itemsPerPage));
            } catch (error) {
                console.error('Error fetching vendors:', error);
                setVendors([]);
            } finally {
                setIsLoadingVendors(false);
            }
        };

        const debounceTimer = setTimeout(fetchVendors, 500);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, currentPage]);

    // Add delete vendor handler
    const handleDelete = async (srNo: number) => { // Changed to number type
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;

        try {
            const { error } = await supabase
                .from('vendors_data') // Changed from vendors_list
                .delete()
                .eq('Srno', srNo);

            if (error) throw error;

            setVendors(prev => prev.filter(vendor => vendor.Srno !== srNo));
            setMessage('Vendor deleted successfully!');
        } catch (error) {
            console.error('Delete error:', error);
            setMessage('Error deleting vendor');
        }
    };

    // Add delete contac submm handler
    const handleDeleteContact = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this contact submission?')) return;

        try {
            const { error } = await supabase
                .from('contact_submissions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setContactSubmissions(prev => prev.filter(sub => sub.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Add delete request handler
    const handleDeleteRequest = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;

        try {
            const { error } = await supabase
                .from('search_requests')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSearchRequests(prev => prev.filter(req => req.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Add delete user handler
    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setUsers(prev => prev.filter(user => user.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Add this helper component
    const PageButton = ({ page }: { page: number }) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${currentPage === page
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
                }`}
        >
            {page}
        </button>
    )

    // Add update handler
    const handleUpdateClick = (vendor: any) => {
        setSelectedVendor(vendor);
        setShowUpdateModal(true);
    };

    // Add update submission handler
    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateMessage('');

        try {
            const { error } = await supabase
                .from('vendors_data') // Changed from vendors_list
                .update({
                    Chemicalname: selectedVendor.Chemicalname,
                    Category: selectedVendor.Category,
                    Casno: selectedVendor.Casno,
                    Suppliername: selectedVendor.Suppliername,
                    "Email&link": selectedVendor["Email&link"],
                    Phoneno: selectedVendor.Phoneno,
                    Businessstatus: selectedVendor.Businessstatus,
                    Country: selectedVendor.Country
                })
                .eq('Srno', selectedVendor.Srno);

            if (error) throw error;

            setUpdateMessage('Vendor updated successfully!');
            // Refresh vendor list
            const { data } = await supabase
                .from('vendors_data') // Changed from vendors_list
                .select('*')
                .eq('Srno', selectedVendor.Srno)
                .single();

            setVendors(prev =>
                prev.map(vendor =>
                    vendor.Srno === selectedVendor.Srno ? data : vendor
                )
            );

            setTimeout(() => setShowUpdateModal(false), 1500);
        } catch (error) {
            console.error('Update error:', error);
            setUpdateMessage('Error updating vendor. Please try again.');
        }
    };

    // Download all vendor data
    const handleDownloadCSV = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vendors_data') // Changed from vendors_list
                .select('*')
                .order('Srno', { ascending: true });

            if (error) throw error;
            if (!data || data.length === 0) {
                setMessage('No vendors found to download');
                return;
            }

            const csv = Papa.unparse(data, {
                columns: [
                    'Srno',
                    'Chemicalname',
                    'Category',
                    'Casno',
                    'Suppliername',
                    'Email&link',
                    'Phoneno',
                    'Businessstatus',
                    'Country'
                ],
                header: true
            });

            // Rest of the download logic remains same
            // ...
        } catch (error: any) {
            console.error('Download error:', error);
            setMessage('Error downloading CSV: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SeoProvider>
            <div className="min-h-screen bg-gray-100">
                {/* Mobile menu button */}
                <button
                    type="button"
                    className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-md text-gray-700 bg-white shadow-lg"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <span className="sr-only">Open sidebar</span>
                    <MenuIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-40 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out bg-gray-800`}>
                    <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
                        <h1 className="text-white text-xl font-bold">Elate Chem</h1>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden text-gray-400 hover:text-white"
                        >
                            <XIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                    <nav className="mt-4 px-2 space-y-1">
                        {navigation.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab(item.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${item.current
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                                {item.name}
                            </a>
                        ))}
                        <form action="/api/logout" method="POST" className="border-t border-gray-700 pt-4">
                            <button
                                type="submit"
                                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
                            >
                                <LogoutIcon className="h-5 w-5 mr-3" aria-hidden="true" />
                                Logout
                            </button>
                        </form>
                    </nav>
                </div>

                {/* Main content */}
                <div className="md:pl-64">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Header */}
                        <div className="md:flex md:items-center md:justify-between mb-8">
                            <h1 className="text-2xl font-bold text-gray-800">Dashboard, Welcome Archana</h1>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-8">
                            {/* Add Vendor Section */}
                            <section id="add-vendor" className={`${activeTab === 'add-vendor' ? 'block' : 'hidden'}`}>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h2 className="text-2xl font-semibold mb-6">Add New Vendor</h2>

                                    {/* CSV Upload Section */}
                                    {/* CSV Upload Section */}
                                    <div className="mb-6">
                                        <label className="block text-gray-700 mb-2">Upload CSV File</label>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            disabled={isProcessingCSV}
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            CSV should contain columns: Chemicalname, Category, Casno, Suppliername,
                                            Email&amp;link, Phoneno, Businessstatus, Country
                                        </p>
                                    </div>


                                    {csvError && (
                                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{csvError}</div>
                                    )}

                                    {processingProgress && (
                                        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
                                            {processingProgress}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCSVUpload}
                                        disabled={!csvFile || isProcessingCSV}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                    >
                                        {isProcessingCSV ? 'Processing...' : 'Upload CSV'}
                                    </button>

                                    {/* Processing Status Section */}
                                    {processingRows.length > 0 && (
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-medium">Processing History</h3>
                                                <button
                                                    onClick={handleClearHistory}
                                                    disabled={isProcessingCSV}
                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <XIcon className="h-4 w-4" />
                                                    Clear History
                                                </button>
                                            </div>

                                            {processingProgress && (
                                                <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
                                                    {processingProgress}
                                                </div>
                                            )}

                                            {csvError && (
                                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{csvError}</div>
                                            )}

                                            <div className="overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left py-2">SrNo</th>
                                                            <th className="text-left py-2">Chemical Name</th>
                                                            <th className="text-left py-2">Status</th>
                                                            <th className="text-left py-2">Error</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {processingRows.map((row, index) => (
                                                            <tr key={index} className="border-t">
                                                                <td className="py-2">{row.srno}</td>
                                                                <td className="py-2">{row.data.Chemicalname}</td>
                                                                <td className="py-2">
                                                                    <span className={`px-2 py-1 rounded ${row.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                        row.status === 'error' ? 'bg-red-100 text-red-800' :
                                                                            row.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {row.status}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 text-red-600">{row.error}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Vendor Search Section */}
                            <section id="vendor-search" className={`${activeTab === 'vendor-search' ? 'block' : 'hidden'}`}>
                                {/* Search Section */}
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h2 className="text-2xl font-semibold mb-6">Vendor Search</h2>

                                    <div className="mb-6">
                                        <input
                                            type="text"
                                            placeholder="Search by CAS Number, Chemical Name & Supplier Name"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            // onClick={handleDownloadCSV}
                                            disabled={isLoadingVendors}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            Download button coming soon
                                        </button>
                                    </div>

                                    {isLoadingVendors ? (
                                        <div className="text-center py-4">Loading vendors...</div>
                                    ) : vendors.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">No vendors found</div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {vendors.map((vendor) => (
                                                    <div key={vendor.Srno} className="border rounded-lg p-4 shadow-sm">
                                                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                                                            <span className="font-semibold">Sr No:</span>
                                                            <span className="truncate">{vendor.Srno}</span>

                                                            <span className="font-semibold">Chemical Name:</span>
                                                            <span className="truncate">{vendor.Chemicalname}</span>

                                                            <span className="font-semibold">Category:</span>
                                                            <span className="truncate">{vendor.Category}</span>

                                                            <span className="font-semibold">CAS No:</span>
                                                            <span className="truncate">{vendor.Casno}</span>

                                                            <span className="font-semibold">Supplier:</span>
                                                            <span className="truncate">{vendor.Suppliername}</span>

                                                            <span className="font-semibold">Contact:</span>
                                                            <div className="min-w-0">
                                                                <a
                                                                    className="truncate hover:text-clip hover:overflow-visible hover:whitespace-normal"
                                                                >
                                                                    {vendor["Email&link"]}
                                                                </a>
                                                            </div>

                                                            <span className="font-semibold">Phone No:</span>
                                                            <span className="truncate">{vendor.Phoneno}</span>

                                                            <span className="font-semibold">Business Status:</span>
                                                            <span className="truncate">{vendor.Businessstatus}</span>

                                                            <span className="font-semibold">Country:</span>
                                                            <span className="truncate">{vendor.Country}</span>
                                                        </div>

                                                        <div className="mt-4 flex gap-2">
                                                            <button
                                                                onClick={() => handleUpdateClick(vendor)}
                                                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                                            >
                                                                Update
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(vendor.Srno)}
                                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pagination */}
                                            <div className="mt-6 flex flex-col items-center gap-4">
                                                <div className="flex items-center gap-2 w-full max-w-lg">
                                                    <button
                                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                                    >
                                                        Previous
                                                    </button>

                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max={totalPages}
                                                            value={currentPage}
                                                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="text-center text-sm mt-1">
                                                            Page {currentPage} of {totalPages}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                                    >
                                                        Next
                                                    </button>
                                                </div>

                                                {/* Direct Page Input */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">Go to page:</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={totalPages}
                                                        value={currentPage}
                                                        onChange={(e) => {
                                                            const page = Math.min(Math.max(1, Number(e.target.value)), totalPages)
                                                            setCurrentPage(page)
                                                        }}
                                                        className="w-20 px-2 py-1 border rounded"
                                                    />
                                                    <span className="text-sm">of {totalPages}</span>
                                                </div>

                                                {/* Compact Page Numbers (for medium screens+) */}
                                                <div className="hidden md:flex items-center gap-1 flex-wrap justify-center">
                                                    {currentPage > 3 && <PageButton page={1} />}
                                                    {currentPage > 4 && <span className="px-2">...</span>}

                                                    {[
                                                        currentPage - 2,
                                                        currentPage - 1,
                                                        currentPage,
                                                        currentPage + 1,
                                                        currentPage + 2,
                                                    ]
                                                        .filter(page => page > 0 && page <= totalPages)
                                                        .map((page) => (
                                                            <PageButton key={page} page={page} />
                                                        ))}

                                                    {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                                                    {currentPage < totalPages - 2 && <PageButton page={totalPages} />}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* Contact Submissions Section */}
                            <section id="contact-submissions" className={`${activeTab === 'contact-submissions' ? 'block' : 'hidden'}`}>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h2 className="text-2xl font-semibold mb-6">Contact Submissions</h2>

                                    {isLoadingContacts ? (
                                        <div className="text-center py-4">Loading submissions...</div>
                                    ) : contactSubmissions.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">No submissions found</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Submitted At (IST)</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {contactSubmissions.map((submission, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{submission.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{submission.email}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm max-w-xs truncate">{submission.message}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{submission.submitted_at}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <button
                                                                    onClick={() => handleDeleteContact(submission.id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Requests Section */}
                            <section id="requests" className={`${activeTab === 'requests' ? 'block' : 'hidden'}`}>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h2 className="text-2xl font-semibold mb-6">Search Requests</h2>

                                    {isLoadingRequests ? (
                                        <div className="text-center py-4">Loading requests...</div>
                                    ) : searchRequests.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">No requests found</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Chemical Name</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">CAS Number</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Searched Query</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Requested At (IST)</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Created At (IST)</th>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {searchRequests.map((request, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.chemical_name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.cas_number}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.contact_info}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.searched_query}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.requested_at}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.created_at}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <button
                                                                    onClick={() => handleDeleteRequest(request.id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* All Users Section */}
                            <section id="all-users" className={`${activeTab === 'all-users' ? 'block' : 'hidden'}`}>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h2 className="text-2xl font-semibold mb-6">All Users</h2>

                                    {isLoadingUsers ? (
                                        <div className="text-center py-4">Loading users...</div>
                                    ) : users.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">No users found</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {users.map((user, index) => (
                                                <div key={index} className="border rounded-lg p-4 shadow-sm">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <h3 className="font-semibold text-lg">{user.company_name}</h3>
                                                            <p className="text-sm text-gray-600">{user.full_name}</p>
                                                        </div>
                                                        <div className="text-sm">
                                                            <p className="break-all">
                                                                <span className="font-medium">Email:</span> {user.email}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">Mobile:</span> {user.mobile}
                                                            </p>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            <p>
                                                                <span className="font-medium">Created:</span> {user.created_at}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">Updated:</span> {user.updated_at}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Dashboard Overview */}
                            <section id="dashboard" className={`${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-medium text-gray-500">Total Vendors</h3>
                                        <p className="mt-2 text-3xl font-bold text-gray-900">{totalVendors}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-medium text-gray-500">Active Vendors</h3>
                                        <p className="mt-2 text-3xl font-bold text-green-600">{totalVendors}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-medium text-gray-500">Contact Enquiries</h3>
                                        <p className="mt-2 text-3xl font-bold text-yellow-600">{totalContacts}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-medium text-gray-500">Chemical Enquiries</h3>
                                        <p className="mt-2 text-3xl font-bold text-blue-600">{totalRequests}</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {showUpdateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
                            <button
                                onClick={() => setShowUpdateModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>

                            <h2 className="text-2xl font-semibold mb-4">Update Vendor Info</h2>

                            {updateMessage && (
                                <div className={`mb-4 p-3 rounded ${updateMessage.includes('success')
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {updateMessage}
                                </div>
                            )}

                            <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Disabled Sr No */}
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Sr No</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Srno || ''}
                                        disabled
                                        className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                                    />
                                </div>

                                {/* Editable Fields */}
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Chemical Name</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Chemicalname || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            Chemicalname: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Repeat for other fields following the same pattern */}
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Category</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Category || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            Category: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">CAS No</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Casno || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            Casno: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Supplier Name</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Suppliername || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            Suppliername: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Email & Link</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.["Email&link"] || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            ["Email&link"]: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Phone No.</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Phoneno || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            Phoneno: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Business Status</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Businessstatus || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            Businessstatus: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Country</label>
                                    <input
                                        type="text"
                                        value={selectedVendor?.Country || ''}
                                        onChange={(e) => setSelectedVendor({
                                            ...selectedVendor,
                                            Country: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
                                    >
                                        Update Vendor Info
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SeoProvider>
    );
}