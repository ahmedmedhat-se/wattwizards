import { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { InfoCircle, LightningCharge, Calculator } from 'react-bootstrap-icons';
import logo from '../assets/logo.png';

const CableCrossSection = () => {
  // Material database with technical specifications
  const MATERIALS = {
    PVC: {
      name: "PVC (Polyvinyl Chloride)",
      description: "Most common insulation material with good electrical properties and flame retardancy.",
      temperature: "70°C max operating temperature",
      advantages: [
        "Cost-effective",
        "Good mechanical strength",
        "Resistant to acids and alkalis"
      ],
      disadvantages: [
        "Lower temperature rating than XLPE",
        "Less resistant to oils and solvents"
      ],
      applications: "Residential wiring, control cables, indoor installations"
    },
    XLPE: {
      name: "XLPE (Cross-Linked Polyethylene)",
      description: "Superior insulation with molecular cross-linking for enhanced performance.",
      temperature: "90°C max operating temperature",
      advantages: [
        "Higher current capacity",
        "Better moisture resistance",
        "Superior thermal characteristics"
      ],
      disadvantages: [
        "More expensive than PVC",
        "Requires special stripping tools"
      ],
      applications: "Power distribution, underground cables, industrial applications"
    },
    copper: {
      name: "Copper Conductor",
      description: "Premium conductor material with excellent electrical properties.",
      conductivity: "58 MS/m",
      temperature: "90°C max operating temperature",
      advantages: [
        "Highest conductivity",
        "Better corrosion resistance",
        "More durable connections"
      ],
      disadvantages: [
        "More expensive",
        "Heavier than aluminum"
      ],
      applications: "Residential wiring, commercial buildings, sensitive equipment"
    },
    aluminum: {
      name: "Aluminum Conductor",
      description: "Lightweight conductor alternative to copper.",
      conductivity: "35 MS/m",
      temperature: "90°C max operating temperature",
      advantages: [
        "Lower cost",
        "Lighter weight",
        "Good for large conductors"
      ],
      disadvantages: [
        "Lower conductivity",
        "Oxidation issues",
        "Requires larger size for same current"
      ],
      applications: "Power transmission, large feeders, overhead lines"
    }
  };

  // Standard cable sizes (mm²)
  const standardSizes = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

  const [form, setForm] = useState({
    currentType: 'ac',
    phase: '1',
    voltage: '',
    length: '',
    insulation: 'PVC',
    material: 'copper',
    temperature: '30',
    loadType: 'current',
    loadValue: '',
    powerFactor: '0.9',
    installation: 'conduit'
  });

  const [results, setResults] = useState({
    cableSize: '',
    voltageDrop: '',
    loadVoltage: '',
    maxCurrent: '',
    isValid: false,
    message: ''
  });

  const [materialInfo, setMaterialInfo] = useState({
    show: false,
    title: '',
    content: ''
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showMaterialInfo = (material) => {
    setMaterialInfo({
      show: true,
      title: MATERIALS[material].name,
      content: (
        <div>
          <h4>{MATERIALS[material].name}</h4>
          <p>{MATERIALS[material].description}</p>

          <Row className="mt-4">
            <Col md={6}>
              <h5>Advantages</h5>
              <ul>
                {MATERIALS[material].advantages.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Col>
            <Col md={6}>
              <h5>Disadvantages</h5>
              <ul>
                {MATERIALS[material].disadvantages.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Col>
          </Row>

          <div className="mt-3">
            <h5>Typical Applications</h5>
            <p>{MATERIALS[material].applications}</p>
          </div>

          {MATERIALS[material].conductivity && (
            <div className="alert alert-info mt-3">
              <strong>Conductivity:</strong> {MATERIALS[material].conductivity}
            </div>
          )}
        </div>
      )
    });
  };

  // Simplified cable current capacity lookup
  const getMaxCurrent = (size, material, insulation, installation) => {
    // Base ampacity tables (simplified from IEC 60364-5-52)
    const baseAmpacity = {
      copper: {
        PVC: {
          1: 15, 1.5: 18, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76,
          25: 101, 35: 125, 50: 151, 70: 192, 95: 232, 120: 269
        },
        XLPE: {
          1: 18, 1.5: 21, 2.5: 28, 4: 37, 6: 47, 10: 68, 16: 89,
          25: 119, 35: 146, 50: 177, 70: 225, 95: 272, 120: 316
        }
      },
      aluminum: {
        PVC: {
          2.5: 19, 4: 25, 6: 32, 10: 44, 16: 59, 25: 78,
          35: 97, 50: 117, 70: 149, 95: 180, 120: 209
        },
        XLPE: {
          2.5: 22, 4: 29, 6: 37, 10: 51, 16: 68, 25: 91,
          35: 112, 50: 136, 70: 173, 95: 209, 120: 243
        }
      }
    };

    // Installation method correction factors
    const methodFactors = {
      'open': 1.0,      // In free air
      'conduit': 0.8,   // In conduit
      'tray': 0.9,      // Cable tray
      'buried': 0.7     // Direct buried
    };

    // Temperature correction factors
    const tempCorrection = {
      30: 1.0,
      35: 0.94,
      40: 0.87,
      45: 0.79,
      50: 0.71,
      55: 0.61,
      60: 0.5
    };

    const sizeKey = standardSizes.find(s => s >= size) || 240;
    const base = baseAmpacity[material]?.[insulation]?.[sizeKey] || 0;
    const methodFactor = methodFactors[installation] || 1.0;
    const temp = Math.floor(parseFloat(form.temperature) / 5) * 5;
    const tempFactor = tempCorrection[temp] || 0.5;

    return base * methodFactor * tempFactor;
  };

  const calculateCableSize = (e) => {
    e.preventDefault();

    // Input validation
    if (!form.voltage || !form.length || !form.loadValue) {
      setResults({
        ...results,
        message: 'Please fill all required fields',
        isValid: false
      });
      return;
    }

    const voltage = parseFloat(form.voltage);
    const length = parseFloat(form.length);
    let current, power;

    // Calculate current based on input type
    if (form.loadType === 'current') {
      current = parseFloat(form.loadValue);
      power = form.currentType === 'dc'
        ? current * voltage
        : current * voltage * (form.phase === '3' ? Math.sqrt(3) : 1) * parseFloat(form.powerFactor);
    } else {
      power = parseFloat(form.loadValue) * (form.loadType === 'kw' ? 1000 : 1);
      current = form.currentType === 'dc'
        ? power / voltage
        : power / (voltage * (form.phase === '3' ? Math.sqrt(3) : 1) * parseFloat(form.powerFactor));
    }

    // Calculate voltage drop (simplified)
    const resistivity = form.material === 'copper' ? 0.0172 : 0.0282; // Ω·mm²/m
    const tempFactor = 1 + 0.004 * (parseFloat(form.temperature) - 20);

    // Iterative calculation to find minimum cable size
    let cableSize = 1; // Start with 1mm²
    let voltageDrop, loadVoltage, maxCurrent;

    do {
      // Calculate voltage drop
      const resistance = (resistivity * length * tempFactor) / cableSize;
      voltageDrop = form.currentType === 'dc' || form.phase === '1'
        ? 2 * current * resistance
        : Math.sqrt(3) * current * resistance;

      loadVoltage = voltage - voltageDrop;
      const dropPercent = (voltageDrop / voltage) * 100;

      maxCurrent = getMaxCurrent(cableSize, form.material, form.insulation, form.installation);
      if (dropPercent <= 5 && maxCurrent >= current * 1.25) {
        break;
      }

      cableSize += 0.5;
    } while (cableSize <= 240);
    let recommendedSize = standardSizes.find(size => size >= cableSize) || 240;

    // Final voltage drop calculation
    const finalResistance = (resistivity * length * tempFactor) / recommendedSize;
    const finalVoltageDrop = form.currentType === 'dc' || form.phase === '1'
      ? 2 * current * finalResistance
      : Math.sqrt(3) * current * finalResistance;
    const finalDropPercent = (finalVoltageDrop / voltage) * 100;
    const finalLoadVoltage = voltage - finalVoltageDrop;
    const finalMaxCurrent = getMaxCurrent(recommendedSize, form.material, form.insulation, form.installation);

    // Validation
    const isValid = finalDropPercent <= 5 && finalMaxCurrent >= current * 1.25;
    const message = isValid
      ? `✅ Valid design (Drop: ${finalDropPercent.toFixed(2)}%, Current capacity: ${finalMaxCurrent.toFixed(2)}A)`
      : `⚠️ Warning: Voltage drop (${finalDropPercent.toFixed(2)}%) exceeds 5% or cable undersized`;

    setResults({
      cableSize: recommendedSize,
      voltageDrop: finalDropPercent.toFixed(2),
      loadVoltage: finalLoadVoltage.toFixed(2),
      maxCurrent: finalMaxCurrent.toFixed(2),
      isValid,
      message
    });
  };

  return (
    <>
      <div className="cards-lg-containers-card">
        <img
          src="https://www.ricable.com/wp-content/uploads/2020/09/cavi-elettrici-fase-controfase-scaled-e1600425828245.jpg"
          alt="Electrical cable cross-sections"
          className="img-fluid"
        />
        <div className="category">
          <div className="subject">
            <h3>Electrical Engineering</h3>
          </div>
          <img src={logo} alt="Logo" className="logo-img" />
        </div>
        <h2 className="course-title">Cable Size Calculator</h2>
        <div className="button-group">
          <button className="btn btn-dark" onClick={() => setShowInfoModal(true)}>
            <i className="bi bi-info-circle"></i> Info
          </button>
          <button className="btn btn-dark" onClick={() => setShowCalcModal(true)}>
            <i className="bi bi-calculator"></i> Program
          </button>
        </div>
      </div>

      <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} size="lg">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Electrical Material Properties</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <h4 className="text-primary">Cable Sizing Basics</h4>
              <p>
                Proper cable sizing is critical for electrical safety and efficiency.
                It ensures cables can handle the current without excessive voltage drop or overheating.
              </p>
              <div className="alert alert-info">
                <strong>Key Formula:</strong><br />
                Voltage Drop = (2 × I × R × L) / 1000 (for single phase)<br />
                Voltage Drop = (√3 × I × R × L) / 1000 (for three phase)<br />
                Where I=Current, R=Resistance, L=Length
              </div>
            </div>
            <div className="col-md-6">
              <h4 className="text-primary">Material Properties</h4>
              <ul className="list-group">
                <li className="list-group-item" onClick={() => showMaterialInfo('copper')} style={{ cursor: 'pointer' }}>
                  <strong>Copper</strong>: Higher conductivity, more expensive
                </li>
                <li className="list-group-item" onClick={() => showMaterialInfo('aluminum')} style={{ cursor: 'pointer' }}>
                  <strong>Aluminum</strong>: Lighter, cheaper, lower conductivity
                </li>
                <li className="list-group-item" onClick={() => showMaterialInfo('PVC')} style={{ cursor: 'pointer' }}>
                  <strong>PVC Insulation</strong>: Common, cost-effective
                </li>
                <li className="list-group-item" onClick={() => showMaterialInfo('XLPE')} style={{ cursor: 'pointer' }}>
                  <strong>XLPE Insulation</strong>: Higher temperature resistance
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-primary">Standards Compliance</h4>
            <p>
              This tool follows IEC 60364-5-52 standards for cable sizing.
              Always verify with local electrical codes and manufacturer specifications.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInfoModal(false)}>
            Close
          </Button>
          <a
            href="https://webstore.iec.ch/publication/21972"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            IEC Standards
          </a>
        </Modal.Footer>
      </Modal>

      <Modal show={showCalcModal} onHide={() => setShowCalcModal(false)} size="lg">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Cable Size Calculator</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={calculateCableSize}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Current Type</Form.Label>
                  <Form.Select
                    name="currentType"
                    value={form.currentType}
                    onChange={handleChange}
                  >
                    <option value="ac">AC</option>
                    <option value="dc">DC</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phase</Form.Label>
                  <Form.Select
                    name="phase"
                    value={form.phase}
                    onChange={handleChange}
                    disabled={form.currentType === 'dc'}
                  >
                    <option value="1">Single Phase</option>
                    <option value="3">Three Phase</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Voltage (V)</Form.Label>
                  <Form.Control
                    type="number"
                    name="voltage"
                    value={form.voltage}
                    onChange={handleChange}
                    min="1"
                    step="0.1"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cable Length (m)</Form.Label>
                  <Form.Control
                    type="number"
                    name="length"
                    value={form.length}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Load Type</Form.Label>
                  <Form.Select
                    name="loadType"
                    value={form.loadType}
                    onChange={handleChange}
                  >
                    <option value="current">Current (A)</option>
                    <option value="watt">Power (W)</option>
                    <option value="kw">Power (kW)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Load Value</Form.Label>
                  <Form.Control
                    type="number"
                    name="loadValue"
                    value={form.loadValue}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {form.currentType === 'ac' && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Power Factor</Form.Label>
                    <Form.Control
                      type="number"
                      name="powerFactor"
                      value={form.powerFactor}
                      onChange={handleChange}
                      min="0.1"
                      max="1"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Conductor Material</Form.Label>
                  <Form.Select
                    name="material"
                    value={form.material}
                    onChange={handleChange}
                  >
                    <option value="copper">Copper</option>
                    <option value="aluminum">Aluminum</option>
                  </Form.Select>
                  <Form.Text className="text-muted" style={{ cursor: 'pointer' }} onClick={() => showMaterialInfo(form.material)}>
                    <i className="bi bi-info-circle"></i> {form.material === 'copper' ? 'Copper' : 'Aluminum'} properties
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Insulation Type</Form.Label>
                  <Form.Select
                    name="insulation"
                    value={form.insulation}
                    onChange={handleChange}
                  >
                    <option value="PVC">PVC</option>
                    <option value="XLPE">XLPE</option>
                  </Form.Select>
                  <Form.Text className="text-muted" style={{ cursor: 'pointer' }} onClick={() => showMaterialInfo(form.insulation)}>
                    <i className="bi bi-info-circle"></i> {form.insulation} properties
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ambient Temperature (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    name="temperature"
                    value={form.temperature}
                    onChange={handleChange}
                    min="-20"
                    max="60"
                    step="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Installation Method</Form.Label>
                  <Form.Select
                    name="installation"
                    value={form.installation}
                    onChange={handleChange}
                  >
                    <option value="open">Open Air</option>
                    <option value="conduit">In Conduit</option>
                    <option value="tray">Cable Tray</option>
                    <option value="buried">Buried Underground</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-grid mb-4">
              <Button variant="dark" type="submit" size="lg">
                <i className="bi bi-lightning-charge"></i> Calculate Cable Size
              </Button>
            </div>

            {results.cableSize && (
              <div className={`results-card ${results.isValid ? 'valid' : 'invalid'}`}>
                <h5 className="results-header">
                  <i className="bi bi-clipboard-data"></i> Calculation Results
                </h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="result-item">
                      <span className="result-label me-2">Recommended Cable Size:</span>
                      <span className="result-value">{results.cableSize} mm²</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label me-2">Voltage Drop:</span>
                      <span className="result-value">{results.voltageDrop}%</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="result-item">
                      <span className="result-label me-2">Voltage at Load:</span>
                      <span className="result-value">{results.loadVoltage} V</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label me-2">Max Current Capacity:</span>
                      <span className="result-value">{results.maxCurrent} A</span>
                    </div>
                  </div>
                </div>
                <div className={`validation-message ${results.isValid ? 'valid' : 'invalid'}`}>
                  {results.message}
                </div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCalcModal(false)}>
            Close
          </Button>
          <Button variant="info" onClick={() => showMaterialInfo(form.material)}>
            <i className="bi bi-info-circle"></i> {form.material === 'copper' ? 'Copper' : 'Aluminum'} Info
          </Button>
        </Modal.Footer>
      </Modal>

      {materialInfo.show && (
        <Modal show={materialInfo.show} onHide={() => setMaterialInfo({ ...materialInfo, show: false })}>
          <Modal.Header closeButton className="bg-info text-white">
            <Modal.Title>{materialInfo.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {materialInfo.content}
            <div className="alert alert-light mt-3">
              <strong>Technical Note:</strong> Always consult cable manufacturer specifications for exact ratings.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="info" onClick={() => setMaterialInfo({ ...materialInfo, show: false })}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default CableCrossSection;