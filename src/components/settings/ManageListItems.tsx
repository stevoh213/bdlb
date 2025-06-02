import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // For displaying items
import { Trash2, Plus, Edit, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManageListItemsProps {
  items: string[];
  onAddItem: (item: string) => void;
  onDeleteItem: (item: string) => void;
  onEditItem: (originalItem: string, newItem: string) => void;
  itemName: string; // e.g., "Location", "Skill"
  itemNounPlural: string; // e.g., "locations", "skills"
  inputPlaceholder: string;
  itemDisplayClass?: string; // Optional Tailwind classes for item badge styling
  allowEditing?: boolean; // If editing is supported for these items
}

const ManageListItems = ({
  items,
  onAddItem,
  onDeleteItem,
  onEditItem,
  itemName,
  itemNounPlural,
  inputPlaceholder,
  itemDisplayClass = "border-gray-300 text-gray-700 bg-gray-50",
  allowEditing = true,
}: ManageListItemsProps) => {
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<{ originalValue: string; currentValue: string } | null>(null);

  const handleAddItem = () => {
    if (newItem.trim()) {
      onAddItem(newItem.trim());
      setNewItem('');
    }
  };

  const handleStartEdit = (item: string) => {
    if (!allowEditing) return;
    setEditingItem({ originalValue: item, currentValue: item });
  };

  const handleSaveEdit = () => {
    if (editingItem && editingItem.currentValue.trim()) {
      onEditItem(editingItem.originalValue, editingItem.currentValue.trim());
      setEditingItem(null);
    }
  };

  const renderItemDisplay = (item: string, index: number) => (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer relative group pr-2 py-1 text-sm", // Adjusted padding for edit/delete
        itemDisplayClass
      )}
      onClick={() => allowEditing && handleStartEdit(item)}
    >
      {item}
      {allowEditing && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation(); // Prevent Badge onClick if allowEditing is true
            handleStartEdit(item);
          }}
          className={cn(
            "absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 p-0",
            "opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
          )}
          title={`Edit ${itemName}`}
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteItem(item);
        }}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 p-0",
           "opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
        )}
         title={`Delete ${itemName}`}
      >
        <Trash2 className="h-3 w-3 text-red-500" />
      </Button>
    </Badge>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={inputPlaceholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          className="flex-1"
        />
        <Button onClick={handleAddItem} disabled={!newItem.trim()}>
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
      
      {items.length === 0 && (
        <p className="text-sm text-stone-500 text-center py-2">No {itemNounPlural} saved yet.</p>
      )}

      <div className={cn("flex flex-wrap gap-2", items.length > 0 && "mt-2")}>
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="relative">
            {editingItem?.originalValue === item && allowEditing ? (
              <div className="flex gap-1 items-center p-1 border border-blue-500 rounded-md bg-white">
                <Input
                  value={editingItem.currentValue}
                  onChange={(e) => setEditingItem({ ...editingItem, currentValue: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setEditingItem(null);
                  }}
                  className="h-8 text-sm flex-1 min-w-[100px]" // Ensure input is not too small
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-7 w-7">
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingItem(null)} className="h-7 w-7">
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              renderItemDisplay(item, index)
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageListItems;
