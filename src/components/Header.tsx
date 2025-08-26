import { Waves } from "lucide-react";

export function Header() {
  return (
    <header className="ocean-gradient text-white px-4 py-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
          <Waves className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white text-xl font-medium">Green Token</h1>
          <p className="text-white/80 text-sm">Monitoring, Reporting, Verification</p>
        </div>
      </div>
    </header>
  );
}