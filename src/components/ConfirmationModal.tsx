import { CheckCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfirmationModal({ isOpen, onClose }: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="sr-only">Success</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-auto -mt-2 -mr-2 p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="text-center py-6">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-lg text-green-800 mb-2">Success!</h3>
          <p className="text-gray-600 mb-6">
            Data successfully recorded on blockchain. Your contribution to coastal restoration has been verified and logged.
          </p>
          
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 mb-6">
            <p className="text-sm text-teal-700">
              <strong>Transaction ID:</strong> 0x{Math.random().toString(16).substr(2, 8)}...
            </p>
            <p className="text-xs text-teal-600 mt-1">
              Verification complete • Carbon credits pending
            </p>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}