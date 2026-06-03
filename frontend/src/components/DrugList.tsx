import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface DrugListProps {
  drugs: string[];
  onRemoveDrug: (drug: string) => void;
  onAddDrug: (drug: string) => void;
  onSaveToCabinet?: (drugs: string[]) => Promise<number>;
  showSaveButton?: boolean;
}

export function DrugList({ drugs, onRemoveDrug, onSaveToCabinet, showSaveButton = false }: DrugListProps) {
  if (drugs.length === 0) {
    return null;
  }

  const handleSaveToCabinet = async () => {
    if (onSaveToCabinet) {
      try {
        const newCount = await onSaveToCabinet(drugs);
        if (newCount > 0) {
          toast.success(`Saved ${newCount} new drug ingredients to your Personal Medicine Cabinet.`);
        } else {
          toast.info("All of these drugs are already in your Personal Medicine Cabinet.");
        }
      } catch (error) {
        console.error("Error saving to cabinet:", error);
        toast.error("An error occurred while saving to the medicine cabinet.");
      }
    }
  };

  return (
    <Card className="border-2 shadow-lg mt-4">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Detected Active Ingredients</CardTitle>
          {showSaveButton && onSaveToCabinet && (
            <Button variant="outline" size="sm" onClick={handleSaveToCabinet} className="gap-2">
              <Save className="h-4 w-4" />
              Save to Medicine Cabinet
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3">
          {drugs.map((drug, index) => (
            <Badge
              key={`${drug}-${index}`}
              variant="secondary"
              className="text-sm px-4 py-2 flex items-center gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-200 font-medium shadow-sm"
            >
              {drug}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-primary/20 rounded-full transition-colors duration-200"
                onClick={() => onRemoveDrug(drug)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4 font-medium">
          Detected <span className="font-semibold text-primary">{drugs.length}</span> ingredients. Remove any incorrect ones.
        </p>
      </CardContent>
    </Card>
  );
}
