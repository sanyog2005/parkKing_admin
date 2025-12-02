import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaUserFriends,
  FaGasPump,
  FaTachometerAlt,
  FaCheckCircle,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaCreditCard,
  FaMapMarkerAlt,
  FaCar,
  FaEdit,
  FaChevronDown,
  FaSearch,
  FaFilter,
  FaSync,
  FaCity,
  FaGlobeAsia,
  FaMapPin,
} from "react-icons/fa";
import axios from "axios";

// Constants and configuration
const baseURL = "http://localhost:1000";
const api = axios.create({ baseURL, headers: { Accept: "application/json" } });

// Utility functions (UNCHANGED)
const formatDate = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d)
    ? ""
    : `${d.getDate()}`.padStart(2, "0") +
        "/" +
        `${d.getMonth() + 1}`.padStart(2, "0") +
        "/" +
        d.getFullYear();
};

const makeImageUrl = (filename) =>
  filename ? `${baseURL}/uploads/${filename}` : "";

const normalizeDetails = (d = {}, car = {}) => ({
  seats: d.seats ?? d.numSeats ?? car.seats ?? "",
  fuel: String(d.fuelType ?? d.fuel ?? car.fuelType ?? car.fuel ?? ""),
  mileage: d.mileage ?? d.miles ?? car.mileage ?? car.miles ?? "",
  transmission: String(d.transmission ?? car.transmission ?? d.trans ?? ""),
});

const extractCarInfo = (b) => {
  const snap =
    b.carSnapshot &&
    typeof b.carSnapshot === "object" &&
    Object.keys(b.carSnapshot).length
      ? b.carSnapshot
      : null;
  const car = snap || (b.car && typeof b.car === "object" ? b.car : null);

  if (car)
    return {
      title:
        `${car.make || ""} ${car.model || ""}`.trim() ||
        car.make ||
        car.model ||
        "",
      make: car.make || "",
      model: car.model || "",
      year: car.year ?? "",
      dailyRate: car.dailyRate ?? 0,
      seats: car.seats ?? "",
      transmission: car.transmission ?? "",
      fuel: car.fuelType ?? car.fuel ?? "",
      mileage: car.mileage ?? "",
      image: car.image || b.carImage || b.image || "",
    };

  return typeof b.car === "string"
    ? { title: b.car, image: b.carImage || b.image || "" }
    : {
        title: b.carName || b.vehicle || "",
        image: b.carImage || b.image || "",
      };
};

// --- NEW STYLING CONSTANTS ---
const statusStyles = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  default: "bg-gray-700/50 text-gray-400 border-gray-600",
};

// --- REUSABLE UI COMPONENTS ---

const Panel = ({ title, icon, children }) => (
  <div className="bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-yellow-500/20 transition-all duration-300">
    <h3 className="flex items-center gap-3 text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">
      <span className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 text-sm">
        {icon}
      </span>
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const Detail = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
    <div className="mt-1 text-gray-500 group-hover:text-yellow-500 transition-colors">
        {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-200 truncate">{value || "—"}</div>
    </div>
  </div>
);

const Spec = ({ icon, label, value }) => (
  <div className="bg-gray-950/50 rounded-xl p-3 border border-white/5 flex items-center gap-3">
    <div className="p-2 rounded-lg bg-gray-800 text-yellow-500 text-lg">
        {icon}
    </div>
    <div>
        <p className="text-[10px] text-gray-500 uppercase font-bold">{label}</p>
        <p className="text-sm font-medium text-white">{value || "—"}</p>
    </div>
  </div>
);

const StatusIndicator = ({ status, isEditing, newStatus, onStatusChange }) => {
  const currentStatus = status?.toLowerCase() || "default";
  
  if (isEditing) {
    return (
      <div className="relative">
        <select
          value={newStatus}
          onChange={onStatusChange}
          className="appearance-none bg-gray-950 border border-yellow-500/50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50 cursor-pointer"
        >
          {["pending", "confirmed", "active", "completed", "cancelled"].map((opt) => (
            <option key={opt} value={opt}>
              {opt.toUpperCase()}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-yellow-500">
            <FaChevronDown size={10} />
        </div>
      </div>
    );
  }

  const styleClass = statusStyles[currentStatus] || statusStyles.default;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styleClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
      {status}
    </span>
  );
};

const BookingCardHeader = ({ booking, onToggleDetails, isExpanded }) => (
  <div className="flex items-center gap-4 flex-1 min-w-0">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-yellow-500 shadow-lg">
      <FaCalendarAlt size={20} />
    </div>
    <div className="min-w-0">
      <h3 className="text-white font-bold text-lg truncate pr-4">
        {booking.customer || "Unknown Customer"}
      </h3>
      <p className="text-gray-500 text-sm truncate flex items-center gap-2">
         <FaEnvelope size={10} /> {booking.email || "No email"}
      </p>
    </div>
  </div>
);

const BookingCardInfo = ({ booking, isEditing, newStatus, onStatusChange }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full md:w-auto mt-4 md:mt-0 items-center">
    
    <div className="flex flex-col md:items-center">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Vehicle</span>
      <span className="text-gray-200 font-medium text-sm truncate max-w-[120px]">{booking.car || "—"}</span>
    </div>

    <div className="flex flex-col md:items-center">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Pickup</span>
      <span className="text-gray-200 font-medium text-sm">{formatDate(booking.pickupDate)}</span>
    </div>

    <div className="flex flex-col md:items-center">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total</span>
      <span className="text-yellow-500 font-bold text-sm">${booking.amount}</span>
    </div>

    <div className="flex flex-col md:items-end">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 md:hidden">Status</span>
      <StatusIndicator
        status={booking.status}
        isEditing={isEditing}
        newStatus={newStatus}
        onStatusChange={onStatusChange}
      />
    </div>
  </div>
);

const BookingCardActions = ({
  isEditing,
  onEditStatus,
  onSaveStatus,
  onCancelEdit,
  isExpanded,
}) => (
  <div className="flex items-center gap-3 md:ml-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto justify-end">
    
    <div className={`hidden md:flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${isExpanded ? "text-yellow-500" : "text-gray-500"}`}>
        <span>{isExpanded ? "Less" : "More"}</span>
        <FaChevronDown className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
    </div>

    {isEditing ? (
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveStatus}
          className="px-4 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider hover:bg-green-500 hover:text-white transition-all"
        >
          Save
        </button>
        <button
          onClick={onCancelEdit}
          className="px-4 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-xs font-bold uppercase tracking-wider hover:bg-gray-700 hover:text-white transition-all"
        >
          Cancel
        </button>
      </div>
    ) : (
      <button
        onClick={onEditStatus}
        className="p-2 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 transition-all"
        title="Edit Status"
      >
        <FaEdit size={16} />
      </button>
    )}
  </div>
);

const BookingCardDetails = ({ booking }) => (
  <div className="border-t border-white/5 bg-gray-950/30 p-6 animate-fadeIn">
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      
      {/* Customer Panel */}
      <Panel title="Customer" icon={<FaUser />}>
        <Detail icon={<FaUser />} label="Full Name" value={booking.customer} />
        <Detail icon={<FaEnvelope />} label="Email" value={booking.email} />
        <Detail icon={<FaPhone />} label="Phone" value={booking.phone} />
      </Panel>

      {/* Booking Panel */}
      <Panel title="Timeline & Cost" icon={<FaCalendarAlt />}>
        <Detail icon={<FaCalendarAlt />} label="Pickup Date" value={formatDate(booking.pickupDate)} />
        <Detail icon={<FaCalendarAlt />} label="Return Date" value={formatDate(booking.returnDate)} />
        <Detail icon={<FaCalendarAlt />} label="Booking Date" value={formatDate(booking.bookingDate)} />
        <Detail icon={<FaCreditCard />} label="Total Amount" value={`$${booking.amount}`} />
      </Panel>

      {/* Address Panel */}
      <Panel title="Location" icon={<FaMapMarkerAlt />}>
        <Detail icon={<FaMapMarkerAlt />} label="Street" value={booking.address.street} />
        <Detail icon={<FaCity />} label="City" value={booking.address.city} />
        <Detail icon={<FaGlobeAsia />} label="State" value={booking.address.state} />
        <Detail icon={<FaMapPin />} label="ZIP Code" value={booking.address.zipCode} />
      </Panel>

      {/* Car Panel */}
      <Panel title="Vehicle" icon={<FaCar />}>
        <div className="mb-4 rounded-xl overflow-hidden aspect-video border border-white/10 relative group">
          <img
            src={makeImageUrl(booking.carImage)}
            alt={booking.car || "car image"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
                e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-end">
            <span className="text-white font-bold truncate">{booking.car}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Spec icon={<FaUserFriends />} label="Seats" value={booking.details.seats} />
          <Spec icon={<FaGasPump />} label="Type" value={booking.details.fuel} />
          <Spec icon={<FaTachometerAlt />} label="Max Time" value={booking.details.mileage} />
          <Spec icon={<FaCheckCircle />} label="security" value={booking.details.transmission} />
        </div>
      </Panel>

    </div>
  </div>
);

const BookingCard = ({
  booking,
  isExpanded,
  isEditing,
  newStatus,
  onToggleDetails,
  onEditStatus,
  onStatusChange,
  onSaveStatus,
  onCancelEdit,
}) => (
  <div 
    className={`bg-gray-900/60 backdrop-blur-md border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/5' : 'border-white/5 hover:border-white/10'}`}
  >
    <div className="p-5 cursor-pointer" onClick={onToggleDetails}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <BookingCardHeader
          booking={booking}
          onToggleDetails={onToggleDetails}
          isExpanded={isExpanded}
        />
        <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <BookingCardInfo
            booking={booking}
            isEditing={isEditing}
            newStatus={newStatus}
            onStatusChange={onStatusChange}
            />
            <BookingCardActions
            isEditing={isEditing}
            onEditStatus={onEditStatus}
            onSaveStatus={onSaveStatus}
            onCancelEdit={onCancelEdit}
            onToggleDetails={onToggleDetails}
            isExpanded={isExpanded}
            />
        </div>
      </div>
    </div>
    {isExpanded && <BookingCardDetails booking={booking} />}
  </div>
);

const SearchFilterBar = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  totalBookings,
}) => (
  <div className="bg-gray-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 mb-8 shadow-xl">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
      
      {/* Search Input */}
      <div className="md:col-span-5 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-yellow-500 transition-colors">
          <FaSearch />
        </div>
        <input
          type="text"
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full bg-gray-950/50 text-white border border-gray-700 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder-gray-600"
        />
      </div>

      {/* Status Filter */}
      <div className="md:col-span-4 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-yellow-500 transition-colors">
          <FaFilter />
        </div>
        <select
          value={statusFilter}
          onChange={onStatusChange}
          className="w-full bg-gray-950/50 text-white border border-gray-700 rounded-xl py-3 pl-11 pr-10 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all appearance-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {["pending", "confirmed", "active", "completed", "cancelled"].map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
             <FaChevronDown size={12} />
        </div>
      </div>

      {/* Total Count */}
      <div className="md:col-span-3 flex justify-end">
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-xl px-5 py-2 text-right w-full md:w-auto">
          <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Total Bookings</div>
          <div className="text-2xl font-extrabold text-white">{totalBookings}</div>
        </div>
      </div>

    </div>
  </div>
);

const NoBookingsView = ({ onResetFilters }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 mb-6">
      <FaSearch size={32} />
    </div>
    <h3 className="text-2xl font-bold text-white mb-2">No bookings found</h3>
    <p className="text-gray-400 max-w-sm mb-8">
      We couldn't find any bookings matching your current search or filters.
    </p>
    <button
      onClick={onResetFilters}
      className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-500/20 active:scale-95"
    >
      <FaSync /> Reset Filters
    </button>
  </div>
);

const PageHeader = () => (
  <div className="text-center mb-12 space-y-4 pt-10 relative z-10">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold tracking-wide uppercase">
        <FaCalendarAlt className="text-yellow-500" /> Admin Dashboard
    </div>
    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
      Booking <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Overview</span>
    </h1>
    <p className="max-w-2xl mx-auto text-gray-400 text-lg">
      Monitor, manage, and update all customer bookings in real-time.
    </p>
  </div>
);

// Main component
const BookingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get("/api/bookings?limit=200");
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.bookings || [];
      const mapped = raw.map((b, i) => {
        const id = b._id || b.id || `local-${i + 1}`;
        const carInfo = extractCarInfo(b);
        const details = normalizeDetails(b.details || {}, carInfo);
        return {
          id,
          _id: b._id || b.id || null,
          customer: b.customer || b.customerName || "",
          email: b.email || "",
          phone: b.phone || "",
          car: carInfo.title || "",
          carImage: carInfo.image || "",
          pickupDate: b.pickupDate || b.pickup || b.startDate || "",
          returnDate: b.returnDate || b.return || b.endDate || "",
          bookingDate: b.bookingDate || b.createdAt || "",
          status: (b.status || "pending").toString(),
          amount: b.amount ?? b.total ?? 0,
          details,
          address: {
            street:
              (b.address && (b.address.street || b.address.addressLine)) || "",
            city: (b.address && (b.address.city || "")) || "",
            state: (b.address && (b.address.state || "")) || "",
            zipCode:
              (b.address && (b.address.zipCode || b.address.postalCode)) || "",
          },
        };
      });
      setBookings(mapped);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      window.alert("Failed to load bookings from server.");
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    const stringForSearch = (v) =>
      v === null || v === undefined ? "" : String(v).toLowerCase();

    return bookings.filter((b) => {
      const matchesSearch =
        !q ||
        stringForSearch(b.customer).includes(q) ||
        stringForSearch(b.car).includes(q) ||
        stringForSearch(b.email).includes(q);
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const updateStatus = async (id) => {
    try {
      const booking = bookings.find((b) => b.id === id || b._id === id);
      if (!booking || !booking._id) {
        setEditingStatus(null);
        setNewStatus("");
        return;
      }
      if (!newStatus) {
        window.alert("Please select a status before saving.");
        return;
      }
      await api.patch(`/api/bookings/${booking._id}/status`, {
        status: newStatus,
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      setEditingStatus(null);
      setNewStatus("");
    } catch (err) {
      console.error("Failed to update status:", err);
      window.alert(
        err.response?.data?.message || "Failed to update booking status"
      );
    }
  };

  const handleToggleDetails = (id) =>
    setExpandedBooking(expandedBooking === id ? null : id);
  const handleEditStatus = (id, currentStatus) => {
    setEditingStatus(id);
    setNewStatus(currentStatus);
  };
  const handleCancelEdit = () => {
    setEditingStatus(null);
    setNewStatus("");
  };
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-yellow-500/30 pb-20">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader />

        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          statusFilter={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          totalBookings={bookings.length}
        />

        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isExpanded={expandedBooking === booking.id}
              isEditing={editingStatus === booking.id}
              newStatus={newStatus}
              onToggleDetails={() => handleToggleDetails(booking.id)}
              onEditStatus={(e) => {
                e.stopPropagation();
                handleEditStatus(booking.id, booking.status);
              }}
              onStatusChange={(e) => setNewStatus(e.target.value)}
              onSaveStatus={(e) => {
                e.stopPropagation();
                updateStatus(booking.id);
              }}
              onCancelEdit={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
            />
          ))}

          {filteredBookings.length === 0 && (
            <NoBookingsView onResetFilters={handleResetFilters} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;