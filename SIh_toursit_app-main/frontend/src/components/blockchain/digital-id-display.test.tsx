import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DigitalIDDisplay } from './digital-id-display';

// Mock qrcode.react to avoid actual QR code rendering in tests
jest.mock('qrcode.react', () => ({
  __esModule: true,
  default: jest.fn(({ value }) => <div data-testid="qrcode-mock">{value}</div>),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('DigitalIDDisplay', () => {
  const mockUserAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const mockDigitalIDData = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  const mockUserData = {
    name: 'John Doe',
    nationality: 'India',
    documentType: 'Passport',
    documentNumber: 'P1234567',
    registrationDate: '2024-01-15',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    render(
      <DigitalIDDisplay
        userAddress={mockUserAddress}
        digitalIDData={mockDigitalIDData}
      />
    );

    // Check if the title text is rendered (icon is mocked as "User" text)
    expect(screen.getByText(/User/)).toBeInTheDocument();
    expect(screen.getByText(/Your Digital ID/)).toBeInTheDocument();

    // Check if the short address is displayed
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();

    // Check if the QR code mock is rendered with the correct value
    expect(screen.getByTestId('qrcode-mock')).toHaveTextContent(mockDigitalIDData);

    // Check for descriptive text
    expect(screen.getByText('Digital ID QR Code')).toBeInTheDocument();
  });

  it('renders with user data and verification status', () => {
    render(
      <DigitalIDDisplay
        userAddress={mockUserAddress}
        digitalIDData={mockDigitalIDData}
        userData={mockUserData}
        isVerified={true}
      />
    );

    // Check user data fields
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('***4567')).toBeInTheDocument(); // Last 4 chars of document

    // Check verification badge (mocked icon shows as "Shield" text + "Verified")
    expect(screen.getByText(/Verified/)).toBeInTheDocument();

    // Check registration date
    expect(screen.getByText('15/1/2024')).toBeInTheDocument(); // Locale format
  });

  it('handles copy functionality', async () => {
    render(
      <DigitalIDDisplay
        userAddress={mockUserAddress}
        digitalIDData={mockDigitalIDData}
      />
    );

    // Find and click copy data button (mocked icon shows as "Copy" text + "Copy Data")
    const copyDataButton = screen.getByText(/Copy Data/);
    fireEvent.click(copyDataButton);

    // Check if clipboard.writeText was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockDigitalIDData);

    // Wait for the async state update and check if button text changes
    await screen.findByText(/Copied!/);
  });

  it('displays full address if it\'s short', () => {
    const shortAddress = '0xabc';
    render(
      <DigitalIDDisplay
        userAddress={shortAddress}
        digitalIDData={mockDigitalIDData}
      />
    );
    expect(screen.getByText(shortAddress)).toBeInTheDocument();
  });

  it('does not show user data section when userData is not provided', () => {
    render(
      <DigitalIDDisplay
        userAddress={mockUserAddress}
        digitalIDData={mockDigitalIDData}
      />
    );

    // Should not find user data fields
    expect(screen.queryByText('Name:')).not.toBeInTheDocument();
    expect(screen.queryByText('Nationality:')).not.toBeInTheDocument();
  });

  it('does not show verification badge when isVerified is false', () => {
    render(
      <DigitalIDDisplay
        userAddress={mockUserAddress}
        digitalIDData={mockDigitalIDData}
        isVerified={false}
      />
    );

    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });
});
