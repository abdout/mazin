import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X } from "lucide-react";
import { type Control } from "react-hook-form";
import { type ProjectFormValues } from "./validation";
import { TEAM_MEMBERS, TEAM_LEADS } from "./constant";
import { cn } from "@/lib/utils";

interface ResourcesTabProps {
  control: Control<ProjectFormValues>;
}

export function ResourcesTab({ control }: ResourcesTabProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 pb-2 border-b">Team Resources</h2>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="teamLead"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium">Team Lead</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between bg-muted/30",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? TEAM_LEADS.find(lead => lead.id === field.value)?.name
                          : "Select team lead"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search team leads..." />
                      <CommandEmpty>No team lead found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {TEAM_LEADS.map((lead) => (
                            <CommandItem
                              key={lead.id}
                              value={lead.name}
                              onSelect={() => {
                                field.onChange(lead.id);
                              }}
                            >
                              {lead.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="team"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Team Members</FormLabel>
                <div className="space-y-3">
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((memberId) => {
                        const member = TEAM_MEMBERS.find(m => m.id === memberId);
                        return (
                          <Badge key={memberId} variant="secondary" className="px-3 py-1">
                            {member?.name}
                            <button
                              type="button"
                              className="ml-2 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                const newValue = field.value?.filter(id => id !== memberId) || [];
                                field.onChange(newValue);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full justify-between bg-muted/30"
                        >
                          <span>Select team members</span>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search team members..." />
                        <CommandEmpty>No member found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {TEAM_MEMBERS
                              .filter(member => !field.value?.includes(member.id))
                              .map((member) => (
                                <CommandItem
                                  key={member.id}
                                  value={member.name}
                                  onSelect={() => {
                                    const newValue = [...(field.value || []), member.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  {member.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </section>
  );
}
