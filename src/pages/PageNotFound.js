
import '../PageNotFound.css';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';


function Security404() {
  const [scanProgress, setScanProgress] = useState(0);
  const [scanActive, setScanActive] = useState(false);

  useEffect(() => {
    let interval;
    if (scanActive && scanProgress < 100) {
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    } else if (scanProgress >= 100) {
      setTimeout(() => {
        setScanActive(false);
        setScanProgress(0);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [scanActive, scanProgress]);

  const startScan = () => {
    setScanActive(true);
    setScanProgress(0);
  };

  return (
    <Container fluid className="security-404-container">
      {/* Animated background elements */}
      <div className="background-elements">
        <div className="floating-shield"></div>
        <div className="floating-lock"></div>
        <div className="floating-key"></div>
        <div className="grid-overlay"></div>
      </div>
      
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} md={10} lg={8} xl={6}>
          <Card className="security-card">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="security-icon">
                  <i className="bi bi-shield-exclamation"></i>
                </div>
                <h1 className="security-title mt-3">404 Page Not Found</h1>
                {/* <p className="security-subtitle">
                  Access to this sector is not authorized. The page you're attempting to reach 
                  is either classified or does not exist in our security database.
                </p> */}
              </div>
              
              <Alert variant="warning" className="security-alert">
                <Alert.Heading>
                  <i className="bi bi-exclamation-triangle-fill"></i> Security Protocol Activated
                </Alert.Heading>
                <p>
                  Your attempt to access a restricted area has been logged. Please verify your 
                  credentials or return to a secure zone.
                </p>
              </Alert>
              
              <div className="scan-section text-center my-4">
                <div className="fingerprint-scanner">
                  <div className="scanner-container">
                    <div className="scanner-overlay" style={{ height: `${scanProgress}%` }}></div>
                    <div className="fingerprint-image">
                      <i className="bi bi-fingerprint"></i>
                    </div>
                  </div>
                  <div className="scan-progress">
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${scanProgress}%` }}
                        aria-valuenow={scanProgress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        {scanProgress}%
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={scanActive ? "outline-secondary" : "outline-primary"} 
                    className="scan-btn mt-3"
                    onClick={startScan}
                    disabled={scanActive}
                  >
                    {scanActive ? (
                      <>Scanning <i className="bi bi-arrow-repeat ms-2"></i></>
                    ) : (
                      <>Verify Identity <i className="bi bi-fingerprint ms-2"></i></>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="security-actions mt-4">
                <Row>
                  <Col sm={6} className="mb-3 mb-sm-0">
                    <Button 
                      variant="primary" 
                      className="w-100 security-btn"
                      onClick={() => window.history.back()}
                    >
                      <i className="bi bi-arrow-left-circle me-2"></i>Return to Safety
                    </Button>
                  </Col>
                  <Col sm={6}>
                    <Button 
                      variant="outline-primary" 
                      className="w-100 security-btn"
                      href="/"
                    >
                      <i className="bi bi-shield-lock me-2"></i>Back to Home
                    </Button>
                  </Col>
                </Row>
              </div>
              
              <div className="security-tip mt-4 text-center">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i> 
                  If you believe this is an error, contact your security administrator with reference code: 
                  <span className="security-code"> SEC-404-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Security404;