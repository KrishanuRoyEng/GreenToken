import { useState } from "react";
import { Calendar, Upload, Camera, TreePine } from "lucide-react"; // Removed Drone
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface DataFormProps {
  onSubmit: (data: any) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function DataForm({ onSubmit, isUploading, uploadProgress }: DataFormProps) {
  const [formData, setFormData] = useState({
    plantationType: "",
    areaRestored: "",
    plantationDate: "",
    communityName: "",
    photos: [] as File[]
    // Removed droneData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...Array.from(e.target.files)]
      }));
    }
  };

  // Removed handleDroneUpload

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TreePine className="w-5 h-5 text-green-600" />
        <h3 className="text-green-800">Restoration Data</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plantation Type */}
        <div className="space-y-2">
          <Label htmlFor="plantation-type">Plantation Type</Label>
          <Select
            value={formData.plantationType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, plantationType: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select ecosystem type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mangroves">Mangroves</SelectItem>
              <SelectItem value="seagrass">Seagrass</SelectItem>
              <SelectItem value="salt-marsh">Salt Marsh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Area Restored */}
        <div className="space-y-2">
          <Label htmlFor="area">Area Restored (hectares)</Label>
          <Input
            id="area"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.areaRestored}
            onChange={(e) => setFormData(prev => ({ ...prev, areaRestored: e.target.value }))}
          />
        </div>

        {/* Date of Plantation */}
        <div className="space-y-2">
          <Label htmlFor="date">Date of Plantation</Label>
          <div className="relative">
            <Input
              id="date"
              type="date"
              value={formData.plantationDate}
              onChange={(e) => setFormData(prev => ({ ...prev, plantationDate: e.target.value }))}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Community/NGO Name */}
        <div className="space-y-2">
          <Label htmlFor="community">Community/NGO Name</Label>
          <Input
            id="community"
            placeholder="Enter organization name"
            value={formData.communityName}
            onChange={(e) => setFormData(prev => ({ ...prev, communityName: e.target.value }))}
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Photos</Label>
          <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
            <div className="text-center">
              <Camera className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 mb-2">Upload site photos</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-green-400 text-green-700 hover:bg-green-100"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Photos
              </Button>
            </div>
            {formData.photos.length > 0 && (
              <div className="mt-3 text-sm text-green-700">
                {formData.photos.length} photo(s) selected
              </div>
            )}
          </div>
        </div>

        {/* Removed Drone Data Upload */}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading data...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isUploading || !formData.plantationType || !formData.areaRestored}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl"
        >
          {isUploading ? "Uploading..." : "Submit Data"}
        </Button>
      </form>
    </Card>
  );
}