import { useState } from "react";
import { z } from "zod";
import { Dataset, updateDataset } from "@/db/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PencilIcon, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EditDatasetDialogProps {
  dataset: Dataset;
  onSaved: (updated: Dataset) => void;
}

// Schema for dataset validation
const datasetSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  unit: z.string().min(1, "Einheit ist erforderlich"),
  valueCO2e: z.number({
    required_error: "Emissionsfaktor ist erforderlich",
    invalid_type_error: "Emissionsfaktor muss numerisch sein",
  }),
  source: z.string().optional(),
  year: z.number().int().optional(),
  geo: z.string().optional(),
  kind: z.enum(["material", "energy", "waste", "emissions"], {
    errorMap: () => ({ message: "Art muss eine der erlaubten Optionen sein" }),
  }),
  methodId: z.number().int().optional(),
});

// Mapping of English kind values to German labels
const kindLabels: Record<string, string> = {
  material: "Material",
  energy: "Energie",
  waste: "Abfall",
  emissions: "Emissionen",
};

export function EditDatasetDialog({ dataset, onSaved }: EditDatasetDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Dataset>>(dataset);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof Dataset, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field if any
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const parseValue = (value: string, type: "number" | "string"): number | string => {
    if (type === "number") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value.trim();
  };

  const handleSubmit = async () => {
    try {
      // Parse and prepare data
      const dataToValidate = {
        ...formData,
        name: String(formData.name || "").trim(),
        unit: String(formData.unit || "").trim(),
        valueCO2e: parseValue(String(formData.valueCO2e || 0), "number") as number,
        source: String(formData.source || "").trim(),
        year: formData.year ? Number(formData.year) : undefined,
        geo: String(formData.geo || "").trim(),
        kind: String(formData.kind || "material").trim(),
        methodId: formData.methodId ? Number(formData.methodId) : undefined
      };

      // Validate using Zod
      const validatedData = datasetSchema.parse(dataToValidate);
      setErrors({});

      // Start the submission process
      setIsSubmitting(true);

      // Call the API to update dataset using the utility function
      const updatedDataset = await updateDataset(dataset.id, validatedData);

      // Notify success
      toast({
        title: "Datensatz gespeichert",
        description: "Der Datensatz wurde erfolgreich aktualisiert.",
      });

      // Call the onSaved callback with the updated dataset
      onSaved(updatedDataset);

      // Close the dialog
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path?.length) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        // Handle API or other errors
        toast({
          variant: "destructive",
          title: "Fehler beim Speichern",
          description: "Der Datensatz konnte nicht gespeichert werden. Bitte versuche es erneut."
        });
        console.error("Error saving dataset:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2 border-blue-700 text-blue-400 hover:bg-blue-900/20"
        >
          <PencilIcon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 text-white border border-neutral-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Datensatz bearbeiten</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-2" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="kind" className="text-sm font-medium">Art</Label>
            <select
              id="kind"
              value={formData.kind || "material"}
              onChange={(e) => handleChange("kind", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
            >
              <option value="material">Material</option>
              <option value="energy">Energie</option>
              <option value="waste">Abfall</option>
              <option value="emissions">Emissionen</option>
            </select>
            {errors.kind && <p className="text-xs text-red-400">{errors.kind}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className="text-sm font-medium">Einheit</Label>
            <Input
              id="unit"
              value={formData.unit || ""}
              onChange={(e) => handleChange("unit", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
            {errors.unit && <p className="text-xs text-red-400">{errors.unit}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valueCO2e" className="text-sm font-medium">Emissionsfaktor</Label>
            <Input
              id="valueCO2e"
              type="number"
              step="0.0001"
              value={formData.valueCO2e || ""}
              onChange={(e) => handleChange("valueCO2e", parseFloat(e.target.value))}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
            {errors.valueCO2e && <p className="text-xs text-red-400">{errors.valueCO2e}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source" className="text-sm font-medium">Quelle</Label>
            <Input
              id="source"
              value={formData.source || ""}
              onChange={(e) => handleChange("source", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
            {errors.source && <p className="text-xs text-red-400">{errors.source}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="year" className="text-sm font-medium">Jahr</Label>
            <Input
              id="year"
              type="number"
              value={formData.year || ""}
              onChange={(e) => handleChange("year", e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
            {errors.year && <p className="text-xs text-red-400">{errors.year}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="geo" className="text-sm font-medium">Geographie</Label>
            <Input
              id="geo"
              value={formData.geo || ""}
              onChange={(e) => handleChange("geo", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
            {errors.geo && <p className="text-xs text-red-400">{errors.geo}</p>}
          </div>

{/* Method ID Feld entfernt, da für normale Benutzer nicht relevant */}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
            >
              Abbrechen
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                'Speichern'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
