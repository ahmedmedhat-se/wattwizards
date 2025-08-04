import { useState } from 'react';
import logo from '../assets/logo.png';

const CircuitBreaker = () => {
    const [form, setForm] = useState({
        inputType: 'watt',
        inputValue: '',
        voltage: '',
        pf: '0.95',
        currentType: 'ac',
        phaseType: '1',
        cableMaterial: 'copper',
        insulation: 'PVC',
        installation: 'open',
        cableCross: '',
        ambientTemp: '30'
    });

    const [results, setResults] = useState({
        loadCurrent: '',
        minBreakerSize: '',
        recommendedBreaker: '',
        cableCapacity: '',
        voltageDrop: '',
        validationMessage: '',
        calculationsValid: false
    });

    const [materialInfo, setMaterialInfo] = useState({
        show: false,
        title: '',
        content: ''
    });

    // Material information handmaded-database
    const materialDatabase = {
        PVC: {
            title: "PVC (Polyvinyl Chloride) Insulation",
            content: "Common insulation material with good electrical properties and flame retardancy. Operating temperature typically up to 70°C. Cost-effective but less durable than XLPE at higher temperatures."
        },
        XLPE: {
            title: "XLPE (Cross-Linked Polyethylene) Insulation",
            content: "Superior to PVC with higher temperature resistance (up to 90°C), better moisture resistance, and higher current capacity. More expensive but longer lifespan. Ideal for harsh environments."
        },
        copper: {
            title: "Copper Conductors",
            content: "Higher conductivity (58 MS/m) than aluminum, better corrosion resistance, more durable but more expensive. Preferred for most residential and commercial applications."
        },
        aluminum: {
            title: "Aluminum Conductors",
            content: "Lighter and cheaper than copper but lower conductivity (35 MS/m). Requires larger cross-section for same current. Prone to oxidation. Common in large power distribution."
        }
    };

    // Input validation
    const validateInput = (value, type) => {
        if (!value) return false;
        
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        
        switch(type) {
            case 'voltage':
                return num > 0 && num <= 1000;
            case 'pf':
                return num > 0 && num <= 1;
            case 'cableCross':
                return num > 0 && num <= 1000;
            case 'ambientTemp':
                return num >= -20 && num <= 60;
            default:
                return num > 0;
        }
    };

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        // Validate before updating
        if (type === 'number' || type === 'text') {
            if (id === 'voltage' || id === 'pf' || id === 'cableCross' || id === 'ambientTemp') {
                if (!validateInput(value, id)) return;
            }
        }
        
        setForm(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    // Parse multiple values (e.g., "10+20+30")
    const parseMultiInput = (input) => {
        return input.split("+").reduce((acc, val) => {
            const n = parseFloat(val.trim());
            return acc + (isNaN(n) ? 0 : n);
        }, 0);
    };

    // Cable current capacity lookup with temperature correction
    const getCableCapacity = (section, material, insulation, method, ambientTemp) => {
        // Base ampacity tables (simplified - should reference IEC 60364-5-52)
        const baseAmpacity = {
            copper: {
                PVC: {
                    '1.5': 18, '2.5': 24, '4': 32, '6': 41, '10': 57, '16': 76,
                    '25': 101, '35': 125, '50': 151, '70': 192, '95': 232, '120': 269
                },
                XLPE: {
                    '1.5': 21, '2.5': 28, '4': 37, '6': 47, '10': 68, '16': 89,
                    '25': 119, '35': 146, '50': 177, '70': 225, '95': 272, '120': 316
                }
            },
            aluminum: {
                PVC: {
                    '2.5': 19, '4': 25, '6': 32, '10': 44, '16': 59, '25': 78,
                    '35': 97, '50': 117, '70': 149, '95': 180, '120': 209
                },
                XLPE: {
                    '2.5': 22, '4': 29, '6': 37, '10': 51, '16': 68, '25': 91,
                    '35': 112, '50': 136, '70': 173, '95': 209, '120': 243
                }
            }
        };

        // Installation method correction factors
        const methodFactors = {
            'open': 1.0,         // Open air
            'conduit': 0.8,      // In conduit
            'underground': 0.7,  // Buried underground
            'tray': 0.9          // Cable tray
        };

        // Temperature correction factors (simplified)
        const tempCorrection = (ambient) => {
            const temp = parseFloat(ambient);
            if (temp <= 30) return 1.0;
            if (temp <= 40) return 0.91;
            if (temp <= 50) return 0.82;
            return 0.71;
        };

        const sectionKey = parseFloat(section).toFixed(1);
        const base = baseAmpacity[material]?.[insulation]?.[sectionKey] || 0;
        const methodFactor = methodFactors[method] || 1.0;
        const tempFactor = tempCorrection(ambientTemp);

        return base * methodFactor * tempFactor;
    };

    // Calculate voltage drop
    const calculateVoltageDrop = (current, section, length=10, material, phaseType) => {
        // Resistivity (Ω·mm²/m)
        const resistivity = {
            copper: 0.0172,
            aluminum: 0.0282
        };
        
        const r = resistivity[material] || 0.0172;
        const resistance = (r * length) / section;
        
        // For 3-phase: Vdrop = √3 × I × R
        // For 1-phase: Vdrop = 2 × I × R (go and return)
        const factor = phaseType === '3' ? Math.sqrt(3) : 2;
        const voltageDrop = factor * current * resistance;
        
        return voltageDrop;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate all required fields
        if (!form.inputValue || !form.voltage || !form.cableCross) {
            setResults(prev => ({
                ...prev,
                validationMessage: "⚠️ Please fill all required fields",
                calculationsValid: false
            }));
            return;
        }

        // Parse inputs
        const totalInput = parseMultiInput(form.inputValue);
        const voltage = parseFloat(form.voltage);
        const pf = parseFloat(form.pf);
        const cableCross = parseFloat(form.cableCross);
        const ambientTemp = parseFloat(form.ambientTemp);

        // Convert input to watts if needed
        let totalWatts;
        switch(form.inputType) {
            case 'watt':
                totalWatts = totalInput;
                break;
            case 'kw':
                totalWatts = totalInput * 1000;
                break;
            case 'hp':
                totalWatts = totalInput * 746;
                break;
            case 'ampere':
                // For current input, calculate power first
                if (form.currentType === 'dc') {
                    totalWatts = totalInput * voltage;
                } else {
                    totalWatts = totalInput * voltage * pf * (form.phaseType === '3' ? Math.sqrt(3) : 1);
                }
                break;
            default:
                totalWatts = 0;
        }

        // Calculate load current
        let loadCurrent;
        if (form.inputType === 'ampere') {
            loadCurrent = totalInput;
        } else {
            if (form.currentType === 'dc') {
                loadCurrent = totalWatts / voltage;
            } else {
                const denom = voltage * pf * (form.phaseType === '3' ? Math.sqrt(3) : 1);
                loadCurrent = totalWatts / denom;
            }
        }

        // Minimum breaker size (125% of continuous load)
        const minBreakerSize = loadCurrent * 1.25;

        // Standard breaker sizes (IEC 60898-1)
        const standardBreakers = [
            6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 
            100, 125, 160, 200, 250, 315, 400, 630, 
            800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300
        ];

        // Find next standard breaker size
        let recommendedBreaker = standardBreakers.find(size => size >= minBreakerSize) || "Custom required";

        // Get cable capacity
        const cableCapacity = getCableCapacity(
            form.cableCross, 
            form.cableMaterial, 
            form.insulation, 
            form.installation,
            form.ambientTemp
        );

        // Calculate voltage drop (assuming 10m length for example)
        const voltageDrop = calculateVoltageDrop(
            loadCurrent,
            cableCross,
            10,
            form.cableMaterial,
            form.phaseType
        );
        const voltageDropPercent = (voltageDrop / voltage) * 100;

        // Validation messages
        let validationMessage = "";
        if (cableCapacity < minBreakerSize) {
            validationMessage = `⚠️ Cable (${cableCapacity.toFixed(1)}A) too small for load (needs ≥${minBreakerSize.toFixed(1)}A)`;
        } else if (voltageDropPercent > 5) {
            validationMessage = `⚠️ Voltage drop (${voltageDropPercent.toFixed(1)}%) exceeds 5% limit`;
        } else {
            validationMessage = `✅ Valid design (Cable: ${cableCapacity.toFixed(1)}A, Drop: ${voltageDropPercent.toFixed(1)}%)`;
        }

        // Set results
        setResults({
            loadCurrent: `${loadCurrent.toFixed(2)} A`,
            minBreakerSize: `${minBreakerSize.toFixed(2)} A`,
            recommendedBreaker: typeof recommendedBreaker === 'number' 
                ? `${recommendedBreaker} A` 
                : recommendedBreaker,
            cableCapacity: `${cableCapacity.toFixed(1)} A`,
            voltageDrop: `${voltageDropPercent.toFixed(2)}%`,
            validationMessage,
            calculationsValid: cableCapacity >= minBreakerSize && voltageDropPercent <= 5
        });
    };

    // Show material information
    const showMaterialInfo = (material) => {
        setMaterialInfo({
            show: true,
            ...materialDatabase[material]
        });
    };

    return (
        <>
            <div className="cards-lg-containers-card">
                <img src="https://images.thdstatic.com/productImages/57bdcbb9-bed9-4c5c-a471-d118cfeee9b4/svn/renogy-solar-power-accessories-sundccb160mc2p-us-64_600.jpg" 
                     alt="circuit breaker" 
                     className="img-fluid" />
                <div className="category">
                    <div className="subject">
                        <h3>Software/Electricity</h3>
                    </div>
                    <img src={logo} alt="Logo" className="logo-img" />
                </div>
                <h2 className="course-title">Circuit Breaker Sizing Calculator</h2>
                <div className="button-group">
                    <button className="btn btn-dark" data-bs-toggle="modal" data-bs-target="#CBModal">
                        <i className="bi bi-info-circle"></i> Info
                    </button>
                    <button className="btn btn-dark" data-bs-toggle="modal" data-bs-target="#CBModalProj">
                        <i className="bi bi-calculator"></i> Program
                    </button>
                </div>
            </div>

            <div className="modal fade" id="CBModal" tabIndex="-1" aria-labelledby="CBModalLabel">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header bg-dark text-white">
                            <h5 className="modal-title" id="CBModalLabel">Circuit Breaker Sizing Guide</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <h4 className="text-primary">Circuit Breaker Basics</h4>
                                    <p>
                                        Circuit breakers protect electrical circuits from overload or short circuits. 
                                        Unlike fuses, they can be reset after tripping.
                                    </p>
                                    <div className="alert alert-info">
                                        <strong>Key Formula:</strong><br />
                                        Load Current (I<sub>b</sub>) = Power / (Voltage × PF × √3 for 3-phase)<br />
                                        Breaker Size (I<sub>n</sub>) ≥ 1.25 × I<sub>b</sub><br />
                                        Cable Capacity (I<sub>z</sub>) ≥ I<sub>n</sub>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h4 className="text-primary">Material Properties</h4>
                                    <ul className="list-group">
                                        <li className="list-group-item" onClick={() => showMaterialInfo('copper')} style={{cursor: 'pointer'}}>
                                            <strong>Copper</strong>: Higher conductivity, more expensive
                                        </li>
                                        <li className="list-group-item" onClick={() => showMaterialInfo('aluminum')} style={{cursor: 'pointer'}}>
                                            <strong>Aluminum</strong>: Lighter, cheaper, lower conductivity
                                        </li>
                                        <li className="list-group-item" onClick={() => showMaterialInfo('PVC')} style={{cursor: 'pointer'}}>
                                            <strong>PVC Insulation</strong>: Common, cost-effective
                                        </li>
                                        <li className="list-group-item" onClick={() => showMaterialInfo('XLPE')} style={{cursor: 'pointer'}}>
                                            <strong>XLPE Insulation</strong>: Higher temperature resistance
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-3">
                                <h4 className="text-primary">Standards Compliance</h4>
                                <p>
                                    This tool follows IEC 60898-1 (circuit breakers) and IEC 60364-5-52 (cable sizing) standards.
                                    Always verify with local electrical codes.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <a href="https://webstore.iec.ch/publication/21972" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="btn btn-primary">
                                IEC Standards
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="CBModalProj" tabIndex="-1" aria-labelledby="CBModalProjLabel">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header bg-dark text-white">
                            <h5 className="modal-title" id="CBModalProjLabel">Circuit Breaker Sizing Calculator</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label htmlFor="inputType" className="form-label">Input Type</label>
                                        <select id="inputType" value={form.inputType} onChange={handleChange} className="form-select">
                                            <option value="watt">Power (W)</option>
                                            <option value="kw">Power (kW)</option>
                                            <option value="hp">Power (HP)</option>
                                            <option value="ampere">Current (A)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="inputValue" className="form-label">
                                            {form.inputType === 'watt' ? 'Power (W)' : 
                                             form.inputType === 'kw' ? 'Power (kW)' : 
                                             form.inputType === 'hp' ? 'Power (HP)' : 'Current (A)'}
                                        </label>
                                        <input 
                                            type="text" 
                                            id="inputValue" 
                                            className="form-control" 
                                            value={form.inputValue} 
                                            onChange={handleChange}
                                            placeholder="e.g., 1500 or 500+1000 for multiple loads"
                                        />
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label htmlFor="currentType" className="form-label">Current Type</label>
                                        <select id="currentType" value={form.currentType} onChange={handleChange} className="form-select">
                                            <option value="ac">AC</option>
                                            <option value="dc">DC</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="phaseType" className="form-label">Phase</label>
                                        <select 
                                            id="phaseType" 
                                            value={form.phaseType} 
                                            onChange={handleChange} 
                                            className="form-select"
                                            disabled={form.currentType === 'dc'}
                                        >
                                            <option value="1">Single Phase</option>
                                            <option value="3">Three Phase</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="voltage" className="form-label">Voltage (V)</label>
                                        <input 
                                            type="number" 
                                            id="voltage" 
                                            className="form-control" 
                                            value={form.voltage} 
                                            onChange={handleChange}
                                            min="1"
                                            max="1000"
                                            step="0.1"
                                        />
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label htmlFor="pf" className="form-label">Power Factor</label>
                                        <input 
                                            type="number" 
                                            id="pf" 
                                            className="form-control" 
                                            value={form.pf} 
                                            onChange={handleChange}
                                            min="0.1"
                                            max="1"
                                            step="0.01"
                                            disabled={form.currentType === 'dc'}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="cableMaterial" className="form-label">Cable Material</label>
                                        <select 
                                            id="cableMaterial" 
                                            value={form.cableMaterial} 
                                            onChange={handleChange} 
                                            className="form-select"
                                        >
                                            <option value="copper">Copper</option>
                                            <option value="aluminum">Aluminum</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="ambientTemp" className="form-label">Ambient Temp (°C)</label>
                                        <input 
                                            type="number" 
                                            id="ambientTemp" 
                                            className="form-control" 
                                            value={form.ambientTemp} 
                                            onChange={handleChange}
                                            min="-20"
                                            max="60"
                                            step="1"
                                        />
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label htmlFor="insulation" className="form-label">Insulation Type</label>
                                        <select 
                                            id="insulation" 
                                            value={form.insulation} 
                                            onChange={handleChange} 
                                            className="form-select"
                                        >
                                            <option value="PVC">PVC</option>
                                            <option value="XLPE">XLPE</option>
                                        </select>
                                        <small className="text-muted" onClick={() => showMaterialInfo(form.insulation)} style={{cursor: 'pointer'}}>
                                            <i className="bi bi-info-circle"></i> About {form.insulation}
                                        </small>
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="installation" className="form-label">Installation Method</label>
                                        <select 
                                            id="installation" 
                                            value={form.installation} 
                                            onChange={handleChange} 
                                            className="form-select"
                                        >
                                            <option value="open">Open Air</option>
                                            <option value="conduit">In Conduit</option>
                                            <option value="tray">Cable Tray</option>
                                            <option value="underground">Underground</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="cableCross" className="form-label">Cable Size (mm²)</label>
                                        <input 
                                            type="number" 
                                            id="cableCross" 
                                            className="form-control" 
                                            value={form.cableCross} 
                                            onChange={handleChange}
                                            min="0.5"
                                            max="1000"
                                            step="0.5"
                                        />
                                    </div>
                                </div>

                                <div className="d-grid mb-4">
                                    <button type="submit" className="btn btn-dark btn-lg">
                                        <i className="bi bi-lightning-charge"></i> Calculate
                                    </button>
                                </div>

                                {results.loadCurrent && (
                                    <div className={`results-card ${results.calculationsValid ? 'valid' : 'invalid'}`}>
                                        <h5 className="results-header">
                                            <i className="bi bi-clipboard-data"></i> Calculation Results
                                        </h5>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="result-item">
                                                    <span className="result-label me-2">Load Current:</span>
                                                    <span className="result-value">{results.loadCurrent}</span>
                                                </div>
                                                <div className="result-item">
                                                    <span className="result-label me-2">Min. Breaker Size:</span>
                                                    <span className="result-value">{results.minBreakerSize}</span>
                                                </div>
                                                <div className="result-item">
                                                    <span className="result-label me-2">Recommended Breaker:</span>
                                                    <span className="result-value highlight">{results.recommendedBreaker}</span>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="result-item">
                                                    <span className="result-label me-2">Cable Capacity:</span>
                                                    <span className="result-value">{results.cableCapacity}</span>
                                                </div>
                                                <div className="result-item">
                                                    <span className="result-label me-2">Voltage Drop:</span>
                                                    <span className="result-value">{results.voltageDrop}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`validation-message ${results.calculationsValid ? 'valid' : 'invalid'}`}>
                                            {results.validationMessage}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-info" onClick={() => showMaterialInfo(form.cableMaterial)}>
                                <i className="bi bi-info-circle"></i> {form.cableMaterial === 'copper' ? 'Copper' : 'Aluminum'} Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {materialInfo.show && (
                <div className="modal fade show" id="materialInfoModal" tabIndex="-1" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title">{materialInfo.title}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setMaterialInfo({show: false})}></button>
                            </div>
                            <div className="modal-body">
                                <p>{materialInfo.content}</p>
                                <div className="alert alert-light mt-3">
                                    <strong>Technical Note:</strong> Always consult cable manufacturer specifications for exact ratings.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-info" onClick={() => setMaterialInfo({show: false})}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default CircuitBreaker;