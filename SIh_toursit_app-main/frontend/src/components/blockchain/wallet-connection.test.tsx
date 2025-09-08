import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnection } from '@/components/blockchain/wallet-connection';
import { ethers } from 'ethers';

// Mock ethers library
const mockSend = jest.fn();
jest.mock('ethers', () => ({
  ethers: {
    providers: {
      Web3Provider: jest.fn().mockImplementation(() => ({
        send: mockSend,
      })),
    },
  },
}));

// Mock window.ethereum
const mockRequest = jest.fn();
Object.defineProperty(window, 'ethereum', {
  value: {
    request: mockRequest,
  },
  writable: true,
});

describe('WalletConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: mockRequest,
      },
      writable: true,
    });
  });

  it('renders connect button when disconnected', () => {
    render(<WalletConnection />);
    expect(screen.getByRole('button', { name: /connect metaMask wallet/i })).toBeInTheDocument();
    expect(screen.getByText(/You'll need to sign a message to verify your identity on the blockchain/)).toBeInTheDocument();
  });

  it('shows connecting state when button is clicked', async () => {
    mockSend.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
    render(<WalletConnection />);
    
    fireEvent.click(screen.getByRole('button', { name: /connect metaMask wallet/i }));
    
    expect(screen.getByText('Connecting to your wallet... Please confirm in MetaMask')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Wallet Connected')).toBeInTheDocument());
  });

  it('shows connected state after successful connection', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    mockSend.mockResolvedValue([mockAddress]);
    const handleWalletConnected = jest.fn();

    render(<WalletConnection onWalletConnected={handleWalletConnected} />);
    
    fireEvent.click(screen.getByRole('button', { name: /connect metaMask wallet/i }));

    await waitFor(() => {
      expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument(); // Short address
      expect(screen.getByRole('button', { name: /disconnect wallet/i })).toBeInTheDocument();
      expect(handleWalletConnected).toHaveBeenCalledWith(mockAddress, expect.any(Object));
    });
  });

  it('handles disconnect', async () => {
    mockSend.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
    render(<WalletConnection />);
    
    fireEvent.click(screen.getByRole('button', { name: /connect metaMask wallet/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /disconnect wallet/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /disconnect wallet/i }));

    expect(screen.getByRole('button', { name: /connect metaMask wallet/i })).toBeInTheDocument();
  });

  it('shows error when MetaMask is not installed', () => {
    Object.defineProperty(window, 'ethereum', { value: undefined, writable: true });
    render(<WalletConnection />);
    fireEvent.click(screen.getByRole('button', { name: /connect metaMask wallet/i }));
    expect(screen.getByText('MetaMask is not installed. Please install MetaMask to continue.')).toBeInTheDocument();
  });

  it('shows error when no accounts are found', async () => {
    mockSend.mockResolvedValue([]);
    render(<WalletConnection />);
    fireEvent.click(screen.getByRole('button', { name: /connect metaMask wallet/i }));

    await waitFor(() => {
      expect(screen.getByText("No accounts found. Please make sure you're logged into MetaMask.")).toBeInTheDocument();
    });
  });
  
  it('allows retrying connection after an error', async () => {
    mockSend.mockRejectedValueOnce(new Error('User rejected request'));
    render(<WalletConnection />);
    fireEvent.click(screen.getByRole('button', { name: /connect metaMask wallet/i }));

    await waitFor(() => expect(screen.getByText('User rejected request')).toBeInTheDocument());
    
    // User clicks "Try Again"
    mockSend.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => expect(screen.getByText('Wallet Connected')).toBeInTheDocument());
  });
});
