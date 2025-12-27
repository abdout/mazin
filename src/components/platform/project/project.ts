// export interface Option {
//     label: string;
//     value: string;
//   }
  
//   export interface VoltageOptions {
//     lvSwgr: Option[];
//     lvTrafo: Option[];
//     lvCable: Option[];
//     lvRmu: Option[];
//     mvSwgr: Option[];
//     mvTrafo: Option[];
//     mvCable: Option[];
//     mvRmu: Option[];
//     hvSwgr: Option[];
//     hvTrafo: Option[];
//     hvCable: Option[];
//     hvRmu: Option[];
//     evSwgr: Option[];
//     evTrafo: Option[];
//     evCable: Option[];
//     evRmu: Option[];
//   }
  
//   export interface Voltages {
//     LV: boolean;
//     MV: boolean;
//     HV: boolean;
//     EV: boolean;
//   }
  
//   export interface Project {
//     _id?: string;
//     customer: string;
//     description: string;
//     location: string;
//     client: string;
//     consultant: string;
//     status: "neutral" | "on_progress" | "done" | "stuck";
//     priority: "high" | "medium" | "low" | "neutral";
//     phase: "approved" | "start" | "half_way" | "almost_done" | "handover";
//     team: string[];
//     teamLead: string;
//     systems: string[];
//     activities: Array<{
//       system: string;
//       category: string;
//       subcategory: string;
//       activity: string;
//     }>;
//     mobilization: string;
//     accommodation: string;
//     kits: string[];
//     cars: string[];
//     startDate?: Date;
//     endDate?: Date;
//     createdAt?: Date;
//     updatedAt?: Date;
//   }
  
//   export interface ProjectContextProps {
//     project: Project | null;
//     projects: Project[]; // Add this line
//     fetchProject: (id: string) => void;
//     fetchProjects: () => void; // Add this line
//     refreshProjects: () => void; // Add this line
//   }