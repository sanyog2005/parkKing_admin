import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const baseURL = "https://parking-backend-3tgb.onrender.com";
const api = axios.create({ baseURL });

const AddCarPage = () => {
  const initialFormData = {
    carName: "",
    dailyPrice: "",
    seats: "",
    fuelType: "4 wheel",
    mileage: "",
    transmission: "Covered",
    year: "",
    model: "",
    description: "",
    category: "Affordable",
    image: null,
    imagePreview: null,
  };

  const [data, setData] = useState(initialFormData);
  const fileRef = useRef(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) =>
      setData((prev) => ({
        ...prev,
        image: file,
        imagePreview: evt.target.result,
      }));
    reader.readAsDataURL(file);
  }, []);

  const resetForm = useCallback(() => {
    setData(initialFormData);
    if (fileRef.current) fileRef.current.value = "";
  }, [initialFormData]);

  const showToast = useCallback((type, title, message, icon) => {
    // Defined Tailwind classes locally instead of importing
    const toastClasses = {
      success: {
        container: "bg-gray-900 border border-green-500/30 rounded-xl shadow-2xl p-4",
        body: "text-green-50 font-sans",
      },
      error: {
        container: "bg-gray-900 border border-red-500/30 rounded-xl shadow-2xl p-4",
        body: "text-red-50 font-sans",
      },
    };

    const toastConfig = {
      position: "top-right",
      className: toastClasses[type].container,
      bodyClassName: toastClasses[type].body,
      progressClassName: type === "success" ? "bg-green-500" : "bg-red-500",
    };

    if (type === "success") {
      toastConfig.autoClose = 3000;
    } else {
      toastConfig.autoClose = 4000;
    }

    toast[type](
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${type === "success" ? "text-green-400" : "text-red-400"}`}>
          {icon}
        </div>
        <div>
          <p
            className={
              type === "success"
                ? "font-bold text-lg text-white"
                : "font-semibold text-white"
            }
          >
            {title}
          </p>
          <p className="text-sm text-gray-300 mt-1">{message}</p>
        </div>
      </div>,
      toastConfig
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const carNameForToast = data.carName || "";

    try {
      const formData = new FormData();
      const fieldMappings = {
        make: data.carName,
        dailyRate: data.dailyPrice,
        seats: data.seats,
        fuelType: data.fuelType,
        mileage: data.mileage,
        transmission: data.transmission,
        year: data.year,
        model: data.model,
        description: data.description || "",
        color: "",
        category: data.category,
      };

      Object.entries(fieldMappings).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (data.image) formData.append("image", data.image);

      await api.post("/api/cars", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast(
        "success",
        "Congratulations!",
        `Your ${carNameForToast} has been listed successfully`,
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      );

      resetForm();
    } catch (err) {
      console.error("Failed to submit car:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to list car";

      showToast(
        "error",
        "Error",
        msg,
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      );
    }
  };

  const renderInputField = (field) => (
    <div key={field.name} className="relative group">
      <label
        className={`block text-sm font-medium text-gray-400 mb-2 transition-colors group-focus-within:text-yellow-500 ${
          field.icon ? "flex items-center gap-2" : ""
        }`}
      >
        {field.icon}
        {field.label}
      </label>
      <div className="relative">
        {field.prefix && <div className="absolute left-0 top-0 h-full flex items-center pl-4 pointer-events-none z-10">{field.prefix}</div>}
        <input
          required={field.required}
          name={field.name}
          value={data[field.name]}
          onChange={handleChange}
          type={field.type || "text"}
          className={`w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300 ${
            field.prefix ? "pl-10" : ""
          } ${field.props?.className || ""}`}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          {...field.props}
        />
      </div>
    </div>
  );

  const renderSelectField = (field) => (
    <div key={field.name} className="relative group">
      <label className="block text-sm font-medium text-gray-400 mb-2 transition-colors group-focus-within:text-yellow-500">
        {field.label}
      </label>
      <div className="relative">
        <select
          required={field.required}
          name={field.name}
          value={data[field.name]}
          onChange={handleChange}
          className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300 appearance-none cursor-pointer"
        >
          {field.options.map((option) =>
            typeof option === "object" ? (
              <option key={option.value} value={option.value} className="bg-gray-900">
                {option.label}
              </option>
            ) : (
              <option key={option} value={option} className="bg-gray-900">
                {option}
              </option>
            )
          )}
        </select>
        {/* Custom Chevron */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );

  const leftColumnFields = [
    {
      type: "input",
      config: {
        name: "carName",
        label: "Parking Brief Address",
        required: true,
        placeholder: "e.g., Park Central Zone A",
        icon: (
          <svg
            className="w-4 h-4 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            ></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        ),
      },
    },
    {
      type: "input",
      config: {
        name: "dailyPrice",
        label: "Hourly Price ($)",
        type: "number",
        required: true,
        min: "0",
        placeholder: "45",
        props: { className: "" }, // Handled by prefix logic now
        prefix: <span className="text-yellow-500 font-bold">$</span>,
      },
    },
    {
      type: "input",
      config: {
        name: "seats",
        label: "Overtime Charges (Per Hour)",
        required: true,
        
        type: "number",
      },
    },
    {
      type: "select",
      config: {
        name: "fuelType",
        label: "Vehicle Suitability",
        required: true,
        options: ["Large transports", "E-car", "Bi Cycle", "2 wheel", "4 wheel"],
      },
    },
    {
      type: "input",
      config: {
        name: "mileage",
        label: "Max Available Hours",
        type: "number",
        required: true,
        min: "1",
        placeholder: "24",
      },
    },
    {
      type: "input",
      config: {
        name: "category",
        label: "Available Time",
        required: true,
        type: "text",
        placeholder: "e.g., 8 AM - 10 PM",
      },
    },
  ];

  const rightColumnFields = [
    {
      type: "input",
      config: {
        name: "year",
        label: "established Year",
        type: "text",
        required: true,
        min: "",
        max: new Date().getFullYear(),
        placeholder: "2025 ",
      },
    },
    {
      type: "input",
      config: {
        name: "model",
        label: "Location Link",
        required: true,
        placeholder: "www.google.com/maps/...",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-yellow-500/30 pb-20">
      
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gray-900/50 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 text-xs font-bold tracking-widest uppercase mb-4">
            Partner Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Add Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Parking Space</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg">
            Share your secure parking spot with the world and start earning revenue today.
          </p>
        </div>

        {/* Main Form Container */}
        <div className="max-w-5xl mx-auto bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Form Header Decoration */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Left Column */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-sm font-bold">1</span>
                    Basic Details
                </h3>
                
                {leftColumnFields.map((field) => {
                  if (field.type === "input") {
                    return (
                      <div key={field.config.name}>
                        {renderInputField(field.config)}
                      </div>
                    );
                  } else if (field.type === "select") {
                    return renderSelectField(field.config);
                  }
                  return null;
                })}

                {/* Radio Buttons (Parking Protection) */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-400 mb-3">Parking Protection</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Gated Covered", "Open", "Gated Opened"].map((t) => (
                      <label
                        key={t}
                        className={`cursor-pointer relative flex items-center justify-center px-2 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                          data.transmission === t
                            ? "bg-yellow-500 border-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/20"
                            : "bg-gray-950/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="transmission"
                          value={t}
                          checked={data.transmission === t}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span className="text-center text-xs sm:text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                 <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-sm font-bold">2</span>
                    Location & Visuals
                </h3>

                <div className="space-y-6">
                  {rightColumnFields.map((field) => {
                    if (field.type === "input") {
                      return renderInputField(field.config);
                    }
                    return null;
                  })}
                </div>

                {/* Image Upload */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Space Image</label>
                  <div className="relative group">
                    <label className={`relative block w-full aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
                        data.imagePreview 
                        ? "border-yellow-500/50 bg-gray-900" 
                        : "border-gray-700 hover:border-yellow-500/50 hover:bg-gray-800/50"
                    }`}>
                      {data.imagePreview ? (
                        <div className="w-full h-full relative group-hover:opacity-75 transition-opacity">
                          <img
                            src={data.imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                             <svg
                                className="w-6 h-6 text-gray-400 group-hover:text-yellow-500 transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                ></path>
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-300">
                            Click to upload image
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        name="image"
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea
                    required
                    name="description"
                    value={data.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-300 resize-none"
                    placeholder="Describe security features, access instructions, nearby landmarks..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-12 flex justify-center pt-8 border-t border-white/5">
              <button 
                type="submit" 
                className="group relative inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-4 px-12 rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transform hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                <span>List Your Space</span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  ></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

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
  );
};

export default AddCarPage;