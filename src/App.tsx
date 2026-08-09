import React, { useState, useEffect } from 'react';
import { I18nProvider } from '../lib/i18n';
import { AuthProvider, useAuth } from '../lib/auth/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

// Pages
import { HomePage } from '../components/pages/HomePage';
import { ServicesPage } from '../components/pages/ServicesPage';
import { AboutPage } from '../components/pages/AboutPage';
import { BookingWizard } from '../components/booking/BookingWizard';
import { HowToUsePage } from '../components/pages/HowToUsePage';
import { TermsPage } from '../components/pages/TermsPage';
import { ContactPage } from '../components/pages/ContactPage';
import { LoginPage } from '../components/pages/LoginPage';

// Dashboards
import { CustomerDashboardView } from '../components/dashboard/CustomerDashboardView';
import { BarberDashboardView } from '../components/dashboard/BarberDashboardView';
import { OwnerDashboardView } from '../components/dashboard/OwnerDashboardView';

const MainContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [bookingInitialServiceId, setBookingInitialServiceId] = useState<string | undefined>(undefined);
  const { role, user } = useAuth();

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute]);

  const navigate = (route: string, serviceId?: string) => {
    if (serviceId) setBookingInitialServiceId(serviceId);
    else setBookingInitialServiceId(undefined);
    setCurrentRoute(route);
  };

  const renderView = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage navigate={navigate} />;
      case '/services':
        return <ServicesPage navigate={navigate} />;
      case '/about':
        return <AboutPage navigate={navigate} />;
      case '/booking':
        return (
          <div className="py-10 px-4">
            <BookingWizard
              initialServiceId={bookingInitialServiceId}
              onSuccessNavigate={() => {
                if (role === 'owner') navigate('/owner/dashboard');
                else if (role === 'barber') navigate('/barber/dashboard');
                else navigate('/account/dashboard');
              }}
            />
          </div>
        );
      case '/how-to-use':
        return <HowToUsePage navigate={navigate} />;
      case '/terms':
        return <TermsPage />;
      case '/contact':
        return <ContactPage />;
      case '/login':
        return <LoginPage navigate={navigate} />;

      // Protected Role Portals
      case '/account/dashboard':
        return <CustomerDashboardView navigate={navigate} />;
      case '/barber/dashboard':
        return <BarberDashboardView navigate={navigate} />;
      case '/owner/dashboard':
        return <OwnerDashboardView navigate={navigate} />;

      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      <Header currentRoute={currentRoute} navigate={navigate} />
      <main className="flex-1">{renderView()}</main>
      <Footer navigate={navigate} />
    </div>
  );
};

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
