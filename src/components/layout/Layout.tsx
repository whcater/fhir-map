import React, { ReactNode, useState } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} />
      <main className="flex-grow py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 