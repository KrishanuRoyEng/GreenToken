import { useState } from "react";
import { Header } from "./components/Header";
import { LocationSelector } from "./components/LocationSelector";
import { DataForm } from "./components/DataForm";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { BottomNavigation } from "./components/BottomNavigation";

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLocationChange = (newLocation: { lat: number; lng: number; address: string }) => {
    setLocation(newLocation);
  };

  const handleFormSubmit = async (formData: any) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsUploading(false);
            setShowConfirmation(true);
            setUploadProgress(0);
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="px-4 space-y-4">
            <LocationSelector onLocationChange={handleLocationChange} />
            <DataForm
              onSubmit={handleFormSubmit}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>
        );
      case 'dashboard':
        return (
          <div className="px-4 py-8 text-center">
            <div className="bg-teal-50 p-8 rounded-xl border border-teal-200">
              <h2 className="text-teal-800 mb-2">Dashboard</h2>
              <p className="text-teal-600">View your restoration projects and impact metrics</p>
            </div>
          </div>
        );
      case 'credits':
        return (
          <div className="px-4 py-8 text-center">
            <div className="bg-green-50 p-8 rounded-xl border border-green-200">
              <h2 className="text-green-800 mb-2">Carbon Credits</h2>
              <p className="text-green-600">Track your earned carbon credits and trading opportunities</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="px-4 py-8 text-center">
            <div className="bg-blue-50 p-8 rounded-xl border border-blue-200">
              <h2 className="text-blue-800 mb-2">Profile</h2>
              <p className="text-blue-600">Manage your account and community information</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="py-6">
        {renderContent()}
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      />
    </div>
  );
}