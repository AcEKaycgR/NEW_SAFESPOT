import TouristLayout from '@/components/safespot/tourist-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TouristLayout>{children}</TouristLayout>;
}
