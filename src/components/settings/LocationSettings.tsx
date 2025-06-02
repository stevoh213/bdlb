import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocationSettings } from "@/hooks/useLocationSettings";
import ManageListItems from "./ManageListItems"; // Import the generic component

const LocationSettings = () => {
  const {
    savedLocations,
    addLocation,
    deleteLocation,
    editLocation,
  } = useLocationSettings();

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-stone-800">Saved Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <ManageListItems
          items={savedLocations}
          onAddItem={addLocation}
          onDeleteItem={deleteLocation}
          onEditItem={editLocation}
          itemName="Location"
          itemNounPlural="locations"
          inputPlaceholder="Add new location..."
          // Optional: pass a specific class for location badges if different from default
          // itemDisplayClass="bg-teal-50 text-teal-700 border-teal-200" 
          allowEditing={true}
        />
      </CardContent>
    </Card>
  );
};

export default LocationSettings;
