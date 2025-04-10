"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Bars3Icon as MenuIcon,
    XMarkIcon as XIcon,
    HomeModernIcon as HomeIcon,
    UserGroupIcon,
    DocumentPlusIcon as DocumentAddIcon,
    MagnifyingGlassIcon as SearchIcon,
    ArrowLeftOnRectangleIcon as LogoutIcon
} from '@heroicons/react/24/outline'

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

    const [srNo, setSrNo] = useState('');
    const [formData, setFormData] = useState({
        chemicalName: '',
        category: '',
        casNo: '',
        supplierName: '',
        contactInfo: '',
        phoneNumber: '',
        businessStatus: '',
        country: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const navigation = [
        {
            name: 'Dashboard',
            id: 'dashboard',
            icon: HomeIcon,
            current: activeTab === 'dashboard'
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
    ];

    // Add this useEffect for fetching vendors
    useEffect(() => {
        const fetchVendors = async () => {
            setIsLoadingVendors(true);
            try {
                const itemsPerPage = 10;
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage - 1;

                let query = supabase
                    .from('vendors_list')
                    .select('*', { count: 'exact' });

                if (searchQuery) {
                    query = query.or(`Casno.ilike.%${searchQuery}%,Chemicalname.ilike.%${searchQuery}%`);
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

    // Add delete handler
    const handleDelete = async (srNo: string) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;

        try {
            const { error } = await supabase
                .from('vendors_list')
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

    // Checking Unique SR.NO
    useEffect(() => {
        const fetchMaxSrNo = async () => {
            try {
                const { data, error } = await supabase
                    .from('vendors_list')
                    .select('Srno');

                if (error) throw error;

                const maxSrno = data.reduce((max, item) => {
                    const current = parseInt(item.Srno);
                    return current > max ? current : max;
                }, 0);

                setSrNo((maxSrno + 1).toString());
            } catch (error) {
                console.error('Error generating SrNo:', error);
                setSrNo('1');
            }
        };

        fetchMaxSrNo();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('vendors_list')
                .insert([{
                    Srno: srNo,
                    Chemicalname: formData.chemicalName,
                    Category: formData.category,
                    Casno: formData.casNo,
                    Suppliername: formData.supplierName,
                    "Email&link": formData.contactInfo,
                    Phoneno: formData.phoneNumber,
                    Businessstatus: formData.businessStatus,
                    Country: formData.country
                }]);

            if (error) throw error;

            setMessage('Vendor added successfully!');
            // Reset form and generate new SrNo
            setFormData({
                chemicalName: '',
                category: '',
                casNo: '',
                supplierName: '',
                contactInfo: '',
                phoneNumber: '',
                businessStatus: '',
                country: ''
            });
            setSrNo(prev => (parseInt(prev) + 1).toString());
        } catch (error) {
            console.error('Submission error:', error);
            setMessage('Error submitting form. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                .from('vendors_list')
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
                .from('vendors_list')
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

    return (
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
                            {/* Vendor Form Section */}
                            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                                <h2 className="text-2xl font-semibold mb-6">Add New Vendor</h2>

                                {message && (
                                    <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {message}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Sr No</label>
                                        <input
                                            type="text"
                                            value={srNo}
                                            disabled
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Chemical Name</label>
                                        <input
                                            type="text"
                                            value={formData.chemicalName}
                                            onChange={(e) => setFormData({ ...formData, chemicalName: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    {/* Repeat similar pattern for other fields */}
                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Cas No</label>
                                        <input
                                            type="text"
                                            value={formData.casNo}
                                            onChange={(e) => setFormData({ ...formData, casNo: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Supplier Name</label>
                                        <input
                                            type="text"
                                            value={formData.supplierName}
                                            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Email & Links</label>
                                        <input
                                            type="text"
                                            value={formData.contactInfo}
                                            onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Phone No.</label>
                                        <input
                                            type="text"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Business Status</label>
                                        <input
                                            type="text"
                                            value={formData.businessStatus}
                                            onChange={(e) => setFormData({ ...formData, businessStatus: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 mb-2">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
                                        >
                                            {loading ? 'Submitting...' : 'Add Vendor'}
                                        </button>
                                    </div>
                                </form>
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
                                        placeholder="Search by CAS Number or Chemical Name"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                    />
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

                        {/* Dashboard Overview */}
                        <section id="dashboard" className={`${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-500">Vendors Data</h3>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">1,234</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-500">Vendors</h3>
                                    <p className="mt-2 text-3xl font-bold text-green-600">1,024</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-500">Contact Enquiries</h3>
                                    <p className="mt-2 text-3xl font-bold text-yellow-600">12</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-medium text-gray-500">Chemical Enquiries</h3>
                                    <p className="mt-2 text-3xl font-bold text-blue-600">24</p>
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
    );
}