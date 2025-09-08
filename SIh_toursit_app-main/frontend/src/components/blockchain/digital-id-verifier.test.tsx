import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DigitalIDVerifier } from './digital-id-verifier';

describe('DigitalIDVerifier', () => {
  const mockVerify = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders verification interface correctly', () => {
    render(<DigitalIDVerifier onVerify={mockVerify} />);

    // Check main title
    expect(screen.getByText(/Digital ID Verification/)).toBeInTheDocument();
    
    // Check scan/manual input buttons
    expect(screen.getByText(/Scan QR Code/)).toBeInTheDocument();
    expect(screen.getByText(/Manual Input/)).toBeInTheDocument();
    
    // Check verify button
    expect(screen.getByText(/Verify Digital ID/)).toBeInTheDocument();
  });

  it('allows manual input of QR data', () => {
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    // Switch to manual input
    fireEvent.click(screen.getByText(/Manual Input/));
    
    // Find input and enter data
    const input = screen.getByPlaceholderText(/Enter digital ID data/);
    fireEvent.change(input, { target: { value: '0xtest123' } });
    
    expect(input).toHaveValue('0xtest123');
  });

  it('shows scan interface by default', () => {
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    // Should show camera frame text
    expect(screen.getByText(/Position the QR code within the camera frame/)).toBeInTheDocument();
    
    // Should have paste input
    expect(screen.getByPlaceholderText(/Paste digital ID data here/)).toBeInTheDocument();
  });

  it('calls onVerify when verification is triggered', async () => {
    const mockResult = {
      isValid: true,
      userData: {
        name: 'John Doe',
        nationality: 'India',
        documentType: 'Passport',
        documentNumber: 'P1234567',
        registrationDate: '2024-01-15',
        blockchainAddress: '0xtest123'
      }
    };
    
    mockVerify.mockResolvedValue(mockResult);
    
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    // Enter QR data
    const input = screen.getByPlaceholderText(/Paste digital ID data here/);
    fireEvent.change(input, { target: { value: '0xtest123' } });
    
    // Click verify
    fireEvent.click(screen.getByText(/Verify Digital ID/));
    
    // Should call onVerify with the data
    expect(mockVerify).toHaveBeenCalledWith('0xtest123');
    
    // Wait for result to appear
    await waitFor(() => {
      expect(screen.getByText(/Digital ID Verified/)).toBeInTheDocument();
    });
  });

  it('shows verification success with user data', async () => {
    const mockResult = {
      isValid: true,
      userData: {
        name: 'John Doe',
        nationality: 'India',
        documentType: 'Passport',
        documentNumber: 'P1234567',
        registrationDate: '2024-01-15',
        blockchainAddress: '0x1234567890123456789012345678901234567890'
      }
    };
    
    mockVerify.mockResolvedValue(mockResult);
    
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    // Enter and verify data
    const input = screen.getByPlaceholderText(/Paste digital ID data here/);
    fireEvent.change(input, { target: { value: '0xtest123' } });
    fireEvent.click(screen.getByText(/Verify Digital ID/));
    
    await waitFor(() => {
      // Check success status
      expect(screen.getByText(/Digital ID Verified/)).toBeInTheDocument();
      expect(screen.getByText(/Valid/)).toBeInTheDocument();
      
      // Check user data display
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('India')).toBeInTheDocument();
      expect(screen.getByText(/\*\*\*4567/)).toBeInTheDocument(); // Masked document number
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument(); // Short address
    });
  });

  it('shows verification failure with error message', async () => {
    const mockResult = {
      isValid: false,
      error: 'Invalid QR code format'
    };
    
    mockVerify.mockResolvedValue(mockResult);
    
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    // Enter and verify data
    const input = screen.getByPlaceholderText(/Paste digital ID data here/);
    fireEvent.change(input, { target: { value: 'invalid-data' } });
    fireEvent.click(screen.getByText(/Verify Digital ID/));
    
    await waitFor(() => {
      // Check failure status
      expect(screen.getByText(/Verification Failed/)).toBeInTheDocument();
      expect(screen.getByText('Invalid QR code format')).toBeInTheDocument();
    });
  });

  it('uses mock verification when no onVerify prop is provided', async () => {
    render(<DigitalIDVerifier />);
    
    // Enter valid data format (starts with 0x)
    const input = screen.getByPlaceholderText(/Paste digital ID data here/);
    fireEvent.change(input, { target: { value: '0xtest123' } });
    fireEvent.click(screen.getByText(/Verify Digital ID/));
    
    await waitFor(() => {
      expect(screen.getByText(/Digital ID Verified/)).toBeInTheDocument();
    });
  });

  it('shows mock failure for invalid format when no onVerify prop', async () => {
    render(<DigitalIDVerifier />);
    
    // Enter invalid data format (doesn't start with 0x)
    const input = screen.getByPlaceholderText(/Paste digital ID data here/);
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText(/Verify Digital ID/));
    
    await waitFor(() => {
      expect(screen.getByText(/Verification Failed/)).toBeInTheDocument();
      expect(screen.getByText('Invalid QR code format')).toBeInTheDocument();
    });
  });

  it('resets form when reset button is clicked', () => {
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    // Enter data first using the scan input (default mode)
    const scanInput = screen.getByPlaceholderText(/Paste digital ID data here/);
    fireEvent.change(scanInput, { target: { value: '0xtest123' } });
    
    // Click reset
    fireEvent.click(screen.getByText(/Reset/));
    
    // Should clear input and stay in scan mode
    expect(scanInput).toHaveValue('');
    expect(screen.getByText(/Position the QR code within the camera frame/)).toBeInTheDocument();
  });

  it('disables verify button when no data is entered', () => {
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    const verifyButton = screen.getByText(/Verify Digital ID/);
    expect(verifyButton).toBeDisabled();
  });

  it('enables verify button when data is entered', () => {
    render(<DigitalIDVerifier onVerify={mockVerify} />);
    
    const input = screen.getByPlaceholderText(/Paste digital ID data here/);
    fireEvent.change(input, { target: { value: '0xtest123' } });
    
    const verifyButton = screen.getByText(/Verify Digital ID/);
    expect(verifyButton).not.toBeDisabled();
  });
});
