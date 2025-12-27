import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Control } from "react-hook-form";
import { type ProjectFormValues } from "./validation";

interface DescriptionTabProps {
  control: Control<ProjectFormValues>;
}

export function DescriptionTab({ control }: DescriptionTabProps) {
  return (
    <div className="space-y-8">
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Project Description
            </label>
            <Textarea
              {...field}
              id="description"
              placeholder="Enter a detailed description of the project..."
              className="min-h-[300px] resize-y"
            />
          </div>
        )}
      />
    </div>
  );
} 