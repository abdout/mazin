import React, { useState } from 'react'
import { Icon } from "@iconify/react";
import { 
  MapPin, 
  Clock, 
  Phone, 
  HardHat, 
  Timer, 
  CalendarClock,
  Info as InfoIcon,
  Utensils,
  Wifi,
  BatteryCharging,
  DoorOpen,
  ShieldAlert,
  Car as ParkingIcon,
  Moon,
  ShowerHead,
  Droplet,
  Heart,
  ClipboardCheck,
  Hourglass,
  CalendarRange,
  Activity
} from "lucide-react";
import {  Calendar,  Shield, Car, ChevronDown, ChevronUp, Clock2, AlertTriangle } from "lucide-react";

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  action?: React.ReactNode;
}

const InfoItem = ({ icon, label, value, action }: InfoItemProps) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 text-primary">{icon}</div>
    <div className="flex-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
    {action && <div className="ml-2">{action}</div>}
  </div>
);

interface FacilityIconProps {
  icon: React.ReactNode;
  label: string;
  location?: string;
}

const FacilityIcon = ({ icon, label, location }: FacilityIconProps) => (
  <div className="flex flex-col items-center max-w-[120px] text-center">
    <div className="p-3 bg-accent/20 rounded-full mb-1">
      {icon}
    </div>
    <span className="text-xs font-medium">{label}</span>
    {location && (
      <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{location}</span>
    )}
  </div>
);

const Info = () => {
  const [showSiteInfo, setShowSiteInfo] = useState(false);
  
  return (
    <div className="my-6">
      <div>
        {/* <button 
          onClick={() => setShowSiteInfo(!showSiteInfo)}
          className="w-full flex items-center justify-between p-3 hover:bg-accent text-left"
        >
          <span className="font-medium">Site Information & Access Details</span>
          {showSiteInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button> */}
        
        {/* {showSiteInfo && ( */}
          <div className="p-10 pt-4 bg-accent/10 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem 
                icon={<MapPin size={18} />} 
                label="Site Location" 
                value="Dhahran Jubail Expy, Al Jubail 35417"
              />
              <InfoItem 
                icon={<Phone size={18} />} 
                label="Site Contact" 
                value="Ahmed Al-Mansour (+971 50 123 4567)"
              />
              <InfoItem 
                icon={<Calendar size={18} />} 
                label="Access Hours" 
                value="Sunday-Thursday, 7:00 AM - 5:00 PM" 
              />
              <InfoItem 
                icon={<ClipboardCheck size={18} />} 
                label="Check-in Process" 
                value="Security gate check-in, 30 min processing time" 
              />
              <InfoItem 
                icon={<HardHat size={18} />} 
                label="Required PPE" 
                value="Safety helmet, steel-toe boots, high-vis vest" 
              />
              <InfoItem 
                icon={<Shield size={18} />} 
                label="Security Clearance" 
                value="Passport/Emirates ID, Company ID, Site Permit" 
              />

              <InfoItem 
                icon={<Car size={18} />} 
                label="Parking Information" 
                value="Visitor parking at Gate B, vehicle pass required" 
              />
               <InfoItem 
                icon={<Activity size={18} />} 
                label="Current Status" 
                value='In progress, 45% completion rate achieved'
                
              />
              <InfoItem 
                icon={<Timer size={18} />} 
                label="Estimated Time" 
                value="Two months to go, expected by September 15" 
              />
              <InfoItem 
                icon={<Clock2 size={18} />} 
                label="Testing Window" 
                value="System shutdown: 10 PM - 4 AM on scheduled dates" 
              />
              <InfoItem 
                icon={<AlertTriangle size={18} />} 
                label="Special Requirements" 
                value="DEWA certified personnel only, pre-registration 48h" 
              />
            </div>
          </div>
        {/* )} */}
      </div>
      {/* <h2 className="text-lg font-heading font-medium mb-4">Site Information</h2> */}
      
      <div className="px-10 pt-4 pb-20 bg-accent/10 rounded-lg">
        <div className="flex items-center gap-2 mb-6 px-[1px]">
          <InfoIcon size={18} className="text-primary" />
          <h3 className="font-medium text-base">On-site Facilities</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-6 gap-x-4 pl-6">
          <FacilityIcon 
            icon={<Moon size={24} />} 
            label="Prayer Room"
            location="Near Gate A, Building 2, Ground Floor"
          />
          <FacilityIcon 
            icon={<ShowerHead size={24} />} 
            label="Restrooms"
            location="All buildings, near main entrance"
          />
          <FacilityIcon 
            icon={<Droplet size={24} />} 
            label="Drinking Water"
            location="Each floor, next to restrooms"
          />
          <FacilityIcon 
            icon={<Heart size={24} />} 
            label="First Aid"
            location="Security office at Gate B, Reception"
          />
          <FacilityIcon 
            icon={<Utensils size={24} />} 
            label="Cafeteria"
            location="Building 3, Ground Floor, 6:30-2:00 PM"
          />
          <FacilityIcon 
            icon={<Wifi size={24} />} 
            label="Wi-Fi"
            location="All buildings, password at reception"
          />
          <FacilityIcon 
            icon={<BatteryCharging size={24} />} 
            label="Charging Station"
            location="Main lobby and cafeteria areas"
          />
          <FacilityIcon 
            icon={<ParkingIcon size={24} />} 
            label="Parking"
            location="Visitor lot at Gate B, staff at Gate C"
          />
          <FacilityIcon 
            icon={<DoorOpen size={24} />} 
            label="Emergency Exits"
            location="Marked with green signs throughout"
          />
          <FacilityIcon 
            icon={<ShieldAlert size={24} />} 
            label="Safety Office"
            location="Building 1, Room 104, near entrance"
          />
        </div>
      </div>
    </div>
  )
}

export default Info