import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { Database, Check, Clock, Tag, Search, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import StatCard from '../../../components/admin/StatCard'; 

const VisionMode = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // 1. FETCH DATA FROM BACKEND
  const fetchImages = async () => {
    try {
      setLoading(true);
      // Replace with your actual endpoint
      const response = await axios.get('http://localhost:5000/api/training/vision'); 
      setImages(response.data);
    } catch (error) {
      console.error("Error fetching vision data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // 2. FILTERING LOGIC
  const filteredImages = images.filter(img => 
    img.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentImages = filteredImages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);

  // Generate Page Numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      
      {/* STATS (Dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Images" value={images.length} icon={Database} color="bg-blue-50 text-blue-600" />
        <StatCard title="Labeled" value={images.filter(i => i.status === 'Labeled').length} icon={Check} color="bg-teal-50 text-teal-600" />
        <StatCard title="Pending" value={images.filter(i => i.status === 'Unlabeled').length} icon={Clock} color="bg-orange-50 text-orange-600" />
        <StatCard title="Classes" value="8 Types" icon={Tag} color="bg-purple-50 text-purple-600" />
      </div>

      {/* WORKSPACE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800">Dataset Gallery</h3>
            <div className="flex gap-3">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search tags..." 
                      value={searchQuery}
                      onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1); // Reset to page 1 on search
                      }}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" 
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-slate-200">
                    <Plus className="w-4 h-4" /> Add Image
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-teal-500" />
                    <p className="text-sm font-semibold">Loading dataset...</p>
                </div>
            ) : currentImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Database className="w-10 h-10 mb-4 opacity-20" />
                    <p className="text-sm">No images found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {currentImages.map((item) => (
                        <div key={item._id || item.id} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-all cursor-pointer">
                            <img src={item.src || item.imageUrl} alt="Dataset" className="w-full h-full object-cover" />
                            
                            <div className="absolute top-3 left-3">
                                {item.status === 'Unlabeled' ? (
                                    <span className="bg-orange-500/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold">Pending</span>
                                ) : (
                                    <span className="bg-teal-500/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>
                                )}
                            </div>

                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                                <p className="font-bold text-sm">{item.label || 'Unknown'}</p>
                                <p className="text-xs opacity-80">{item.health || 'Unknown'}</p>
                                <div className="flex gap-2 mt-3">
                                    <button className="flex-1 bg-white text-slate-900 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-500 hover:text-white transition-colors">Edit</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* PAGINATION FOOTER */}
        {filteredImages.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl mt-auto">
                <p className="text-xs text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, filteredImages.length)}</span> of <span className="font-bold text-slate-700">{filteredImages.length}</span> images
                </p>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white hover:bg-teal-50 hover:border-teal-200 text-slate-600 hover:text-teal-600'}`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all ${
                                currentPage === number 
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600'
                            }`}
                        >
                            {number}
                        </button>
                    ))}

                    <button 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white hover:bg-teal-50 hover:border-teal-200 text-slate-600 hover:text-teal-600'}`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default VisionMode;