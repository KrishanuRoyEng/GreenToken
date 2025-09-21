import React from 'react';
import { Trees } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Trees className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold">GreenToken</span>
            </div>
            <p className="text-gray-300 mb-4">
              Blockchain-powered Monitoring, Reporting, and Verification system 
              for blue carbon ecosystem restoration projects in India.
            </p>
            <p className="text-sm text-gray-400">
              Contributing to climate action through transparent and verifiable 
              coastal ecosystem restoration.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-300">
              <li>National Centre for Coastal Research</li>
              <li>Chennai, Tamil Nadu</li>
              <li>Email: info@bluecarbon-mrv.gov.in</li>
              <li>Phone: +91-44-XXXX-XXXX</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 GreenToken. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;