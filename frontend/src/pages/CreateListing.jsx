import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PRESET_CATEGORIES, normalizeCategory } from '../utils/categories';
import {
  ALL_CAMPUSES,
  getHostelsForCampus,
  CAMPUS_NAMES,
} from '../utils/nitpLocations';
import {
  Plus,
  ArrowLeft,
  Loader2,
  Building,
  Hash,
  Phone,
  Sparkles,
  Tag,
  Upload,
  MapPin,
  Camera,
  SwitchCamera,
  X,
} from 'lucide-react';

const CreateListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // If passed an existing product to edit
  const editingProduct = location.state?.editProduct;

  const defaultCampus = editingProduct?.campus || user?.campus || CAMPUS_NAMES.PATNA;
  const initialHostels = getHostelsForCampus(defaultCampus);
  const defaultHostel =
    editingProduct?.hostel ||
    editingProduct?.hostelName ||
    user?.hostel ||
    user?.hostelName ||
    (initialHostels.length > 0 ? initialHostels[0].name : 'Brahmaputra Hostel');

  const [formData, setFormData] = useState({
    title: editingProduct?.title || '',
    description: editingProduct?.description || '',
    price: editingProduct?.price !== undefined ? editingProduct.price : '',
    category: editingProduct?.category ? normalizeCategory(editingProduct.category) : PRESET_CATEGORIES[0].id,
    condition: editingProduct?.condition || 'Gently Used',
    campus: defaultCampus,
    hostel: defaultHostel,
    roomNumber: editingProduct?.roomNumber || user?.roomNumber || '',
    contactNumber: editingProduct?.contactNumber || user?.phoneNumber || '',
    pickupLocation:
      editingProduct?.pickupLocation ||
      `${defaultCampus} • ${defaultHostel}${user?.roomNumber ? ` - Rm ${user.roomNumber}` : ''}`,
  });

  const [images, setImages] = useState(editingProduct?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInputRef = useRef(null);

  const startCamera = async (mode = facingMode) => {
    // If browser doesn't support getUserMedia (e.g. non-secure origin), fallback directly to native camera input
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera stream error, falling back to device camera input:', err);
      // Fallback directly to native camera capture
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImages((prev) => [...prev, dataUrl]);
    stopCamera();
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle campus switch & dynamically reset hostel
  const handleCampusChange = (e) => {
    const newCampus = e.target.value;
    const available = getHostelsForCampus(newCampus);
    const newHostel = available.length > 0 ? available[0].name : '';
    setFormData((prev) => ({
      ...prev,
      campus: newCampus,
      hostel: newHostel,
      pickupLocation: `${newCampus} • ${newHostel}${prev.roomNumber ? ` - Rm ${prev.roomNumber}` : ''}`,
    }));
  };

  const handleHostelChange = (e) => {
    const newHostel = e.target.value;
    setFormData((prev) => ({
      ...prev,
      hostel: newHostel,
      pickupLocation: `${prev.campus} • ${newHostel}${prev.roomNumber ? ` - Rm ${prev.roomNumber}` : ''}`,
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('Please choose image files only');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const resolvedCategory = formData.category || 'Others';

    if (!formData.title || !formData.description || formData.price === '') {
      setError('Please fill in title, description, and price');
      return;
    }

    if (!resolvedCategory) {
      setError('Please select or specify a category');
      return;
    }

    if (!formData.campus || !formData.hostel) {
      setError('Both Campus and Hostel are required');
      return;
    }

    if (!formData.roomNumber || !formData.contactNumber) {
      setError('Room Number and Contact Number are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        category: resolvedCategory,
        condition: formData.condition,
        campus: formData.campus,
        hostel: formData.hostel,
        hostelName: formData.hostel,
        roomNumber: formData.roomNumber,
        contactNumber: formData.contactNumber,
        pickupLocation: formData.pickupLocation,
        images: images.length > 0 ? images : undefined,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        navigate(`/products/${editingProduct._id}`);
      } else {
        const { data } = await api.post('/products', payload);
        navigate(`/products/${data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  const currentHostels = getHostelsForCampus(formData.campus);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {editingProduct ? 'Edit Product Listing' : 'List Item on Campus'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editingProduct
                ? 'Update price, pickup location, or description'
                : 'Hostellers can find and purchase your item directly'}
            </p>
          </div>
        </div>

        {error && (
          <div className="my-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Item Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Cello 1L Water Bottle, Milton Hot Kettle, Scientific Calculator"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              required
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              required
            >
              {PRESET_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Condition *
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              >
                <option value="Brand New">Brand New (Unopened/Unused)</option>
                <option value="Like New">Like New (Used once or twice)</option>
                <option value="Gently Used">Gently Used (Good working condition)</option>
                <option value="Heavily Used">Heavily Used (Functional, noticeable wear)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 150"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                required
              />
            </div>
          </div>

          {/* Product Pickup Location & Hostel Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Actual Product Pickup Location</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Prefilled from profile (editable)
              </span>
            </div>

            {/* Campus & Dynamic Hostel Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pickup Campus *
                </label>
                <select
                  name="campus"
                  value={formData.campus}
                  onChange={handleCampusChange}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                >
                  {ALL_CAMPUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pickup Hostel *
                </label>
                <select
                  name="hostel"
                  value={formData.hostel}
                  onChange={handleHostelChange}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                >
                  {currentHostels.map((h) => (
                    <option key={h.name} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room No. & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Room No. *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 214"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specific Pickup Spot Note
              </label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                placeholder="e.g. Hostel Gate, Mess Common Hall, 2nd floor balcony"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Item Description *
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe condition, working status, or reason for selling..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              required
            />
          </div>

          {/* Image Upload Feature */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Product Images (Upload Photo or Take Picture)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-4 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                <Upload className="w-6 h-6 text-indigo-500 mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Upload Photo from Device
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => startCamera()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-4 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors group"
              >
                <Camera className="w-6 h-6 text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Take Picture with Camera
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Use camera directly</span>
              </button>

              {/* Direct camera fallback input for mobile */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-xs"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute inset-0 bg-rose-900/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Listing...</span>
              </>
            ) : (
              <span>{editingProduct ? 'Update Product Listing' : 'Publish Listing Now'}</span>
            )}
          </button>
        </form>
      </div>

      {/* Live Camera Viewfinder Modal */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden max-w-md w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Take Product Photo</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 pointer-events-none border border-white/25 rounded-2xl flex items-center justify-center">
                <span className="text-[11px] text-white/60 bg-black/40 px-2 py-0.5 rounded-md">
                  Align product inside frame
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-900 flex items-center justify-between gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center space-x-1.5 text-xs font-semibold"
                title="Switch between front and back camera"
              >
                <SwitchCamera className="w-4 h-4" />
                <span className="hidden sm:inline">Flip</span>
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/40 flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" />
                <span>Capture</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  cameraInputRef.current?.click();
                }}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs font-semibold"
                title="Open system camera app"
              >
                Native
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateListing;
