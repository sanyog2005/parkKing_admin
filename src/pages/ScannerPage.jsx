// src/pages/ScannerPage.jsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import Navbar from "../components/Navbar/Navbar";

// ✅ FIXED: Added all missing icons here
import {
  FaCamera,
  FaSync,
  FaCar,
  FaClock,
  FaMoneyBillWave,
  FaHistory,
  FaExclamationTriangle,
  FaParking,
  FaEdit,        // Added
  FaSave,        // Added
  FaCheckCircle, // Added (This was causing your crash)
} from "react-icons/fa";

const MINIMUM_CONFIDENCE = 65; 

// --- DUMMY DATA GENERATOR ---
const generateDummyData = () => {
  const active = {
    "KA-01-AB-1234": { plate: "KA-01-AB-1234", entryTime: new Date(Date.now() - 3600000) }, 
    "DL-8C-NB-5678": { plate: "DL-8C-NB-5678", entryTime: new Date(Date.now() - 7200000) }, 
    "MH-12-PQ-9999": { plate: "MH-12-PQ-9999", entryTime: new Date(Date.now() - 1800000) }, 
  };

  const history = [
    { plate: "TN-22-AX-1111", entryTime: "10:00 AM", exitTime: "12:00 PM", duration: "2h", cost: "$20", status: "Exited" },
    { plate: "WB-02-ZZ-3333", entryTime: "09:30 AM", exitTime: "10:30 AM", duration: "1h", cost: "$10", status: "Exited" },
  ];

  return { active, history };
};

const ScannerPage = () => {
  const webcamRef = useRef(null);
  const [scannedText, setScannedText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("ready"); 

  // Configuration State
  const [hourlyRate, setHourlyRate] = useState(10);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // Data State
  const [parkedCars, setParkedCars] = useState({});
  const [history, setHistory] = useState([]);

  // Load Dummy Data on Mount
  useEffect(() => {
    const { active, history } = generateDummyData();
    setParkedCars(active);
    setHistory(history);
  }, []);

  // 1. Capture Image
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      handleOCR(imageSrc);
    }
  }, [webcamRef]);

  // 2. Process Image (OCR)
  const handleOCR = async (imageSource) => {
    setIsScanning(true);
    setStatus("scanning");
    setScannedText("Scanning...");

    try {
      const {
        data: { text, confidence },
      } = await Tesseract.recognize(imageSource, "eng");

      const cleanPlate = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

      // --- LOGIC: If scan fails, FORCE the specific plate ---
      if (cleanPlate.length < 4 || confidence < MINIMUM_CONFIDENCE) {
        const forcedPlate = "CG04H8801"; // <--- FORCED OUTPUT AS REQUESTED
        
        setScannedText(forcedPlate);
        setStatus("success");
        processParkingLogic(forcedPlate);
        setIsScanning(false);
        return; 
      }

      setScannedText(cleanPlate);
      setStatus("success");
      processParkingLogic(cleanPlate);
    } catch (err) {
      console.error(err);
      // Fallback on error too
      const forcedPlate = "CG04H8801";
      setScannedText(forcedPlate);
      setStatus("success");
      processParkingLogic(forcedPlate);
    } finally {
      setIsScanning(false);
    }
  };

  // 3. Logic: Entry vs Exit
  const processParkingLogic = (plate) => {
    const now = new Date();

    if (parkedCars[plate]) {
      // --- EXIT LOGIC ---
      const entryTime = new Date(parkedCars[plate].entryTime);
      const durationMs = now - entryTime;
      const hoursParked = Math.max(
        1,
        Math.ceil(durationMs / (1000 * 60 * 60))
      );
      const cost = hoursParked * hourlyRate; 

      const record = {
        plate,
        entryTime: entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        exitTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `${hoursParked}h`,
        cost: `$${cost}`,
        status: "Exited",
      };

      setHistory((prev) => [record, ...prev]);

      const updatedParked = { ...parkedCars };
      delete updatedParked[plate];
      setParkedCars(updatedParked);
    } else {
      // --- ENTRY LOGIC ---
      setParkedCars((prev) => ({
        ...prev,
        [plate]: {
          plate,
          entryTime: now,
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-8 pb-20 selection:bg-yellow-500/30">
      
      {/* Navbar Inclusion */}
      {/* Note: If your App.jsx already has a Layout that includes Navbar, you can remove this line to avoid double navbars */}
      <Navbar />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto pt-24">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FaCamera className="text-yellow-500" /> 
              Plate <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Scanner</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Automated Entry/Exit Management System</p>
          </div>

          {/* Rate Editor */}
          <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur border border-white/10 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2 text-yellow-500">
               <FaMoneyBillWave />
               <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Rate/Hr:</span>
            </div>
            {isEditingRate ? (
               <div className="flex items-center gap-2">
                  <span className="text-white font-mono">$</span>
                  <input 
                    type="number" 
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-500"
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsEditingRate(false)}
                    className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-colors"
                  >
                    <FaSave size={12} />
                  </button>
               </div>
            ) : (
               <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white font-mono">${hourlyRate}</span>
                  <button 
                    onClick={() => setIsEditingRate(true)}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <FaEdit size={12} />
                  </button>
               </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Camera Feed */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-white/10 shadow-2xl shadow-black/50 aspect-video group">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="w-full h-full object-cover opacity-80"
              />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className={`w-3/4 h-1/3 border-2 border-dashed rounded-lg transition-colors duration-300 ${status === 'success' ? 'border-green-500 bg-green-500/10' : status === 'error' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500/50'}`}></div>
                <p className="mt-4 bg-black/60 backdrop-blur px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/80">
                  Align Number Plate Here
                </p>
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase backdrop-blur-md border ${
                    status === 'scanning' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    status === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    status === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-gray-800/60 text-gray-300 border-white/10'
                }`}>
                    {status === 'scanning' && <FaSync className="animate-spin"/>}
                    {status === 'success' && <FaCheckCircle/>}
                    {status === 'error' && <FaExclamationTriangle/>}
                    {status === 'ready' && <FaCamera/>}
                    {isScanning ? "Processing..." : status === 'ready' ? "Ready to Scan" : status === 'success' ? "Plate Detected" : "Retry"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/60 backdrop-blur rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Detected Plate</p>
                    <p className={`text-2xl font-mono font-bold tracking-wider ${status === 'error' ? 'text-red-400' : 'text-yellow-500'}`}>
                        {scannedText || "----"}
                    </p>
                </div>
              </div>

              <button
                onClick={capture}
                disabled={isScanning}
                className={`flex items-center justify-center gap-3 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                    isScanning 
                    ? "bg-gray-800 text-gray-500 cursor-wait" 
                    : "bg-yellow-500 text-gray-900 hover:bg-yellow-400 hover:shadow-yellow-500/20"
                }`}
              >
                {isScanning ? (
                    <>Processing...</>
                ) : (
                    <> <FaCamera /> SCAN PLATE </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Data & Lists */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Active Parking List */}
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl h-[40vh] flex flex-col">
              <div className="p-5 border-b border-white/5 bg-gray-900/80 flex justify-between items-center">
                <h2 className="font-bold text-white flex items-center gap-2">
                    <FaParking className="text-green-400" /> Active Sessions
                </h2>
                <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded">
                    {Object.keys(parkedCars).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {Object.keys(parkedCars).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <FaCar className="text-4xl mb-2" />
                        <p className="text-sm">No cars parked</p>
                    </div>
                ) : (
                    Object.values(parkedCars).map((car) => (
                        <div key={car.plate} className="bg-gray-800/50 border border-white/5 p-3 rounded-xl flex justify-between items-center group hover:bg-gray-800 transition-colors animate-pulse-once">
                            <div>
                                <p className="text-lg font-mono font-bold text-white group-hover:text-yellow-500 transition-colors">{car.plate}</p>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <FaClock size={10} /> In: {new Date(car.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        </div>
                    ))
                )}
              </div>
            </div>

            {/* Payment History List */}
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl h-[30vh] flex flex-col">
              <div className="p-5 border-b border-white/5 bg-gray-900/80 flex justify-between items-center">
                <h2 className="font-bold text-white flex items-center gap-2">
                    <FaHistory className="text-blue-400" /> Recent Payments
                </h2>
                <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                    {history.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-black/20 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th className="px-4 py-3">Plate</th>
                            <th className="px-4 py-3 text-center">Time</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-gray-500 italic">No history yet</td>
                            </tr>
                        ) : (
                            history.map((record, index) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-white">{record.plate}</td>
                                    <td className="px-4 py-3 text-center text-gray-400">{record.duration}</td>
                                    <td className="px-4 py-3 text-right font-bold text-yellow-500">{record.cost}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;