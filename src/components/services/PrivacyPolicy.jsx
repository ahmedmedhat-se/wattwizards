import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import "../styles/privacy-policies.css";

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);
  const toggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };
  const policyData = {
    lastUpdated: "August 14, 2025",
    introduction: "XOperations is committed to protecting your privacy. This policy explains how we handle your information when you use WattWizards.",
    sections: [
      {
        id: "section1",
        title: "Information We Collect",
        content: [
          {
            subtitle: "Personal Information",
            items: ["Name", "Email address", "Contact details", "Company/organization name"]
          },
          {
            subtitle: "Usage Data",
            items: ["Login and usage times", "Pages or features accessed", "IP address and device information", "Browser type and OS"]
          },
          {
            subtitle: "Project Data",
            items: ["Electrical calculations", "Uploaded files", "Workspace metadata"]
          },
          {
            subtitle: "Support Data",
            items: ["Chat transcripts", "Feedback responses"]
          }
        ]
      },
      {
        id: "section2",
        title: "How We Use Your Information",
        items: [
          "Provide and operate WattWizards",
          "Improve accuracy and user experience",
          "Respond to support requests",
          "Analyze usage trends",
          "Ensure security and compliance"
        ]
      },
      {
        id: "section3",
        title: "Data Storage and Security",
        items: [
          "Data stored on secure encrypted servers",
          "Industry-standard protection measures",
          "Restricted access to sensitive data"
        ]
      },
      {
        id: "section4",
        title: "Data Sharing",
        note: "We do not sell your data under any reason",
        items: [
          "Service providers for hosting and support",
          "Legal authorities when required"
        ]
      },
      {
        id: "section5",
        title: "Your Rights",
        items: [
          "Access and copy your data",
          "Correct or update information",
          "Request deletion ('Right to be Forgotten')",
          "Restrict processing",
          "Data portability"
        ],
        note: "Contact us to exercise these rights."
      },
      {
        id: "section6",
        title: "Cookies and Tracking",
        items: [
          "Improve platform performance",
          "Remember login preferences",
          "Analyze user behavior"
        ],
        note: "Disabling cookies may affect functionality."
      },
      {
        id: "section7",
        title: "Third-Party Services",
        items: [
          "Cloud hosting providers",
          "Analytics and monitoring tools"
        ],
        note: "These services have their own privacy policies."
      },
      {
        id: "section8",
        title: "Data Retention",
        items: [
          "Retain while providing services",
          "Meet legal obligations",
          "Resolve disputes",
          "Enforce agreements"
        ],
        note: "Inactive accounts may be deleted after 12 months."
      },
      {
        id: "section9",
        title: "Children's Privacy",
        content: "WattWizards is not intended for children under 18. We do not knowingly collect data from minors."
      },
      {
        id: "section10",
        title: "Policy Changes",
        content: "We may update this policy. Changes will be posted here with the updated date."
      },
      {
        id: "section11",
        title: "Contact Us",
        items: [
          {
            type: "email",
            value: "xoperations.contact@gmail.com"
          }
        ]
      }
    ]
  };
  const renderSectionContent = (section) => {
    if (section.content && !Array.isArray(section.content)) {
      return <p className='text-light'>{section.content}</p>;
    }
    if (section.content && Array.isArray(section.content)) {
      return (
        <div>
          {section.content.map((group, i) => (
            <div key={i} className="mb-3">
              <h6 className="text-info">{group.subtitle}</h6>
              <ul className="list-group list-group-flush bg-transparent">
                {group.items.map((item, j) => (
                  <li key={j} className="list-group-item bg-transparent text-light border-0 d-flex align-items-start">
                    <span className="badge bg-info bg-opacity-25 me-2 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    if (section.items) {
      return (
        <ul className="list-group list-group-flush bg-transparent">
          {section.items.map((item, i) => (
            item.type === "email" ? (
              <li key={i} className="list-group-item bg-transparent text-light border-0">
                📧 <a href={`mailto:${item.value}`} className="text-info text-decoration-none fw-bold">
                  {item.value}
                </a>
              </li>
            ) : (
              <li key={i} className="list-group-item bg-transparent text-light border-0 d-flex align-items-start">
                <span className="badge bg-info bg-opacity-25 me-2 mt-1">•</span>
                {item}
              </li>
            )
          ))}
        </ul>
      );
    }

    return null;
  };

  return (
    <div className="privacy-policy bg-dark text-light min-vh-100 py-5">
      <div className="privacy-container">
        <div className="mb-5">
          <h2 className="fw-bold display-5 mb-3 text-center">Privacy Policy</h2>
          <p className="text-info mb-2 text-center">
            <strong >Last Updated:</strong> {policyData.lastUpdated}
          </p>
          <p className="lead text-center">{policyData.introduction}</p>
        </div>

        <div className="accordion accordion-flush" id="privacyAccordion">
          {policyData.sections.map((section, index) => (
            <div key={section.id} className="accordion-item border-0 bg-dark mb-3 rounded">
              <h2 className="accordion-header">
                <button
                  className={`accordion-button bg-transparent text-light ${activeSection === section.id ? '' : 'collapsed'}`}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={activeSection === section.id}
                >
                  <span className="badge bg-info me-3">{index + 1}</span>
                  {section.title}
                </button>
              </h2>
              <div
                id={section.id}
                className={`accordion-collapse collapse ${activeSection === section.id ? 'show' : ''}`}
              >
                <div className="accordion-body p-3">
                  {renderSectionContent(section)}
                  {section.note && <p className="mt-3 text-info">{section.note}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/wattwizards/" className="btn btn-dark">
            <FontAwesomeIcon icon={faArrowRight} className='text-info' /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;