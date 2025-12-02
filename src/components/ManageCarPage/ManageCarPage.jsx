// src/pages/ManageCarPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FaCar,
  FaGasPump,
  FaTachometerAlt,
  FaUsers,
  FaEdit,
  FaTrash,
  FaFilter,
  FaCog,
  FaTimes,
  FaParking,
  FaSearch,
} from "react-icons/fa";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Constants and configuration (UNCHANGED)
const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://parking-backend-3tgb.onrender.com";
const api = axios.create({
  baseURL: BASE,
  headers: { Accept: "application/json" },
});

// Utility functions (UNCHANGED)
const makeImageUrl = (img) => {
  if (!img) return "";
  const s = String(img).trim();
  return /^https?:\/\//i.test(s)
    ? s
    : `${BASE}/uploads/${s.replace(/^\/+/, "").replace(/^uploads\//, "")}`;
};

const sanitizeImageForBackend = (img) => {
  if (!img) return "";
  let s = String(img).trim();
  if (/^https?:\/\//i.test(s)) {
    const idx = s.lastIndexOf("/uploads/");
    s =
      idx !== -1
        ? s.slice(idx + "/uploads/".length)
        : s.slice(s.lastIndexOf("/") + 1);
  }
  return s.replace(/^\/+/, "").replace(/^uploads\//, "");
};

const buildSafeCar = (raw = {}, idx = 0) => {
  const _id = raw._id || raw.id || null;
  return {
    _id,
    id: _id || raw.id || raw.localId || `local-${idx + 1}`,
    make: raw.make || "",
    model: raw.model || "",
    year: raw.year ?? "",
    category: raw.category || "Sedan",
    seats: raw.seats ?? 4,
    transmission: raw.transmission || "Automatic",
    fuelType: raw.fuelType || raw.fuel || "Gasoline",
    mileage: raw.mileage ?? 0,
    dailyRate: raw.dailyRate ?? raw.price ?? 0,
    status: raw.status || "available",
    _rawImage: raw.image ?? raw._rawImage ?? "",
    image: raw.image
      ? makeImageUrl(raw.image)
      : raw._rawImage
      ? makeImageUrl(raw._rawImage)
      : "",
  };
};

// --- UI SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="relative overflow-hidden bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 group hover:border-yellow-500/30 transition-all duration-300">
    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/10 transition-all"></div>
    
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
          {title}
        </h3>
        <p className="text-3xl font-extrabold text-white">{value}</p>
      </div>
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const CarCard = ({ car, onEdit, onDelete }) => {
  const statusColors = {
    available: "bg-green-500/10 text-green-400 border-green-500/20",
    rented: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    maintenance: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="group relative bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/5 transition-all duration-300 hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10" />
        <img
          src={car.image}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
             e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />
        <div className="absolute top-4 right-4 z-20">
          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border backdrop-blur-sm ${statusColors[car.status] || "bg-gray-700 text-gray-300"}`}>
            {car.status}
          </span>
        </div>
        <div className="absolute top-4 left-4 z-20">
             <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-900/80 backdrop-blur text-gray-300 rounded-lg border border-white/10">
                {car.category}
             </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white truncate pr-2">
              {car.make} 
            </h3>
            <p className="text-xs text-gray-500 font-medium">{car.year} • ID: {car.id.toString().slice(-4)}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-500">${car.dailyRate}</div>
            <div className="text-[10px] text-gray-500 uppercase">per day</div>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <FaGasPump className="text-yellow-500 text-xs" />
            <span className="text-xs text-gray-300 font-medium truncate">{car.fuelType}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <FaTachometerAlt className="text-blue-400 text-xs" />
            <span className="text-xs text-gray-300 font-medium truncate">{(car.mileage || 0).toLocaleString()} mi</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <FaUsers className="text-green-400 text-xs" />
            <span className="text-xs text-gray-300 font-medium truncate">{car.seats} seats</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <FaCog className="text-purple-400 text-xs" />
            <span className="text-xs text-gray-300 font-medium truncate">{car.transmission}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            onClick={() => onEdit(car)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-gray-900 text-xs font-bold uppercase tracking-wide transition-all"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={() => onDelete(car._id ?? car.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold uppercase tracking-wide transition-all"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ car, onClose, onSubmit, onChange }) => {
  const mapToBackend = (c) => ({
    make: c.make,
    model: c.model,
    year: Number(c.year || 0),
    category: c.category || "Sedan",
    seats: Number(c.seats || 0),
    transmission: c.transmission || "Automatic",
    fuelType: c.fuelType,
    mileage: Number(c.mileage || 0),
    dailyRate: Number(c.dailyRate || 0),
    status: c.status || "available",
    image: sanitizeImageForBackend(c.image || c._rawImage || ""),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!car?.make || !car?.model)
      return toast.error("Make and Model required");
    onSubmit(mapToBackend(car));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({
      ...car,
      [name]: ["year", "dailyRate", "mileage", "seats"].includes(name)
        ? value === ""
          ? ""
          : Number(value)
        : value,
    });
  };

  const inputField = (label, name, type = "text", options = {}) => (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      {type === "select" ? (
        <div className="relative">
            <select
            name={name}
            value={car[name] || ""}
            onChange={handleInputChange}
            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all appearance-none cursor-pointer text-sm"
            required={options.required}
            >
            {options.items?.map((opt) => (
                <option key={opt} value={opt}>
                {opt}
                </option>
            ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={car[name] || ""}
          onChange={handleInputChange}
          className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-sm placeholder-gray-600"
          required={options.required}
          min={options.min}
          max={options.max}
          step={options.step}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/10 rounded-3xl shadow-2xl">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900/95 backdrop-blur border-b border-white/5">
          <h2 className="text-xl font-bold text-white">
            {car._id ? `Edit Slot` : "Add New Slot"}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputField("Space Name / Make", "make", "text", { required: true })}
            {inputField("Location / Model", "model", "text", { required: true })}
            
            {inputField("Category", "category", "select", {
              required: true,
              items: ["Sedan", "SUV", "Sports", "Coupe", "Hatchback", "Luxury"],
            })}
            
            {inputField("Status", "status", "select", {
              required: true,
              items: ["available", "rented", "maintenance"],
            })}

            {inputField("Hourly Rate ($)", "dailyRate", "number", {
              required: true,
              min: 1,
              step: 0.01,
            })}
            
            {inputField("Max Hours", "mileage", "number", {
              required: true,
              min: 0,
            })}

            {inputField("Protection Type", "transmission", "select", {
              required: true,
              items: ["Automatic", "Manual", "CVT", "Gated", "Covered"],
            })}

            {inputField("Vehicle Type", "fuelType", "select", {
              required: true,
              items: ["Gasoline", "Diesel", "Hybrid", "Electric", "Any"],
            })}
            
             {inputField("Year Established", "year", "number", {
              required: true,
              min: 1900,
              max: 2099,
            })}
             
             {inputField("Max Vehicles", "seats", "number", {
                required: true,
                min: 1,
                max: 100,
            })}
          </div>

          {inputField("Image URL (or filename)", "image", "text", {
            required: true,
          })}

          {car.image && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-700">
              <img
                src={makeImageUrl(car.image)}
                alt="preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="bg-black/50 text-white px-3 py-1 rounded text-xs font-bold backdrop-blur">Preview</span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl bg-yellow-500 text-gray-900 text-sm font-bold hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 transition-all"
            >
              {car._id ? "Save Changes" : "Add Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NoCarsView = ({ onResetFilter }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl text-center">
    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 mb-6">
      <FaSearch size={32} />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">No parking slots found</h3>
    <p className="text-gray-400 mb-6">Try adjusting your category filter or add a new slot.</p>
    <button 
        onClick={onResetFilter} 
        className="inline-flex items-center gap-2 text-yellow-500 font-bold hover:text-yellow-400 transition-colors"
    >
      <FaFilter /> Show All Categories
    </button>
  </div>
);

const FilterSelect = ({ value, onChange, categories }) => (
  <div className="relative min-w-[200px]">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
        <FaFilter size={12} />
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-950 border border-gray-700 text-gray-300 text-sm rounded-xl py-2.5 pl-9 pr-8 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all appearance-none cursor-pointer"
    >
      {categories.map((c) => (
        <option key={c} value={c}>
          {c === "all" ? "All Categories" : c}
        </option>
      ))}
    </select>
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
        <FaCog className="rotate-90" size={12} />
    </div>
  </div>
);

// Main component
const ManageCarPage = () => {
  const [cars, setCars] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingCar, setEditingCar] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchCars = useCallback(async () => {
    try {
      const res = await api.get("/api/cars?limit=100");
      const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
      setCars(
        raw.map((c, i) => ({
          ...buildSafeCar(c, i),
          image: c.image ? makeImageUrl(c.image) : buildSafeCar(c, i).image,
          _rawImage: c.image ?? c._rawImage ?? "",
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load parking slots");
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(new Set(cars.map((c) => c.category || "Economy"))),
    ],
    [cars]
  );

  const filteredCars = useMemo(
    () =>
      cars.filter(
        (car) => categoryFilter === "all" || car.category === categoryFilter
      ),
    [cars, categoryFilter]
  );

  const handleDelete = async (identifier) => {
    const car = cars.find((c) => c._id === identifier || c.id === identifier);
    if (!car) return toast.error("Car not found");
    if (!window.confirm("Are you sure you want to delete this car?")) return;

    try {
      if (!car._id) {
        setCars((prev) => prev.filter((p) => p.id !== car.id));
        toast.success("Car removed locally");
        return;
      }
      await api.delete(`/api/cars/${car._id}`);
      toast.success("Car deleted");
      fetchCars();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete car");
    }
  };

  const openEdit = (car) => {
    setEditingCar({
      ...car,
      image: car._rawImage ?? car.image ?? "",
      _id: car._id ?? null,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (payload) => {
    try {
      if (!editingCar._id) {
        await api.post("/api/cars", payload);
        toast.success("Car added");
      } else {
        await api.put(`/api/cars/${editingCar._id}`, payload);
        toast.success("Car updated");
      }
      setShowEditModal(false);
      setEditingCar(null);
      fetchCars();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save car");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 selection:bg-yellow-500/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 text-xs font-bold tracking-widest uppercase">
            Admin Console
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Parking <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Management</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg">
            View, edit, and manage your entire inventory of parking slots from one centralized dashboard.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <StatCard title="Total Slots" value={cars.length} icon={FaParking} />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <FilterSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                categories={categories}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {filteredCars.length === 0 && (
          <NoCarsView onResetFilter={() => setCategoryFilter("all")} />
        )}

        {/* Edit Modal */}
        {showEditModal && editingCar && (
          <EditModal
            car={editingCar}
            onClose={() => {
              setShowEditModal(false);
              setEditingCar(null);
            }}
            onSubmit={handleEditSubmit}
            onChange={setEditingCar}
          />
        )}

        <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            toastStyle={{ backgroundColor: 'transparent', boxShadow: 'none' }} 
        />
      </div>
    </div>
  );
};

export default ManageCarPage;