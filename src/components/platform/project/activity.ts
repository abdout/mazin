export const activities = {
  "MV SWGR": {
    items: {
      General: {
        activities: [
          "Sec. Injection",
          "Pri. Injection",
          "Settings Verif.",
          "Communication",
          "Contact Resist.",
        ],
      },
      Overcurrent: {
        activities: [
          "Pickup",
          "Timing",
          "Char. Curve",
          "Ins. Resist.",
          "Burden",
        ],
      },
      Differential: {
        activities: [
          "Rat/Ph Angle",
          "Slope Char.",
          "Harm. Restr.",
          "Ins. Resist.",
          "Functional",
        ],
      },
      Distance: {
        activities: ["Impedance", "Zone Timing", "Directional", "Polarization"],
      },
      "Earth Fault": { activities: ["Pickup", "Timing", "Ins. Resist."] },
      "Directional OC": { activities: ["Discrimination", "Pickup", "Timing"] },
      Underfreq: { activities: ["Pickup", "Timing", "Change Rate"] },
      Undervolt: { activities: ["Pickup", "Timing"] },
      "Motor Prot.": {
        activities: [
          "Starting Time",
          "Stall Prot.",
          "Thermal OL",
          "Unbal./Ph Loss",
        ],
      },
      "Trafo Diff.": {
        activities: ["CT Polarity", "Inrush Restraint", "Bias Charact."],
      },
      "Gen. Prot.": { activities: ["Exc. Loss", "Reverse Power", "Stator EF"] },
      Recloser: {
        activities: ["Reclose Interval", "No. of Reclose", "Lockout"],
      },
      Synchronizing: {
        activities: ["Volt. Matching", "Phase Angle", "Freq. Matching"],
      },
      Check: { activities: ["Voltage Presence", "Synch. Check"] },
      "Circuit Breaker": {
        activities: [
          "Contact Resist.",
          "Timing Open-Close",
          "Ins. Resist.",
          "Coil Pickup",
          "SF6 Gas Press.-Purity",
          "Vacuum Integrity",
          "Mech. Operation",
        ],
      },
      "Lockout Relay": {
        activities: ["Func. Trip-Reset", "Contact Resist.", "Coil Pickup"],
      },
      Contactor: {
        activities: [
          "Pickup-Dropout",
          "Contact Resist.",
          "Ins. Resist.",
          "Mech. Endurance",
        ],
      },
      MCB: {
        activities: ["Trip Time SC-OL", "Ins. Resist.", "Mech. Operation"],
      },
      "Disconnect Switch": {
        activities: ["Contact Resist.", "Ins. Resist.", "Mech. Interlock"],
      },
      "Current Transformer": {
        activities: [
          "Ratio",
          "Polarity Verif.",
          "Burden",
          "Ins. Resist.",
          "Sat. Curve",
        ],
      },
      "Voltage Transformer": {
        activities: [
          "Ratio",
          "Polarity Verif.",
          "Burden",
          "Ins. Resist.",
          "Sat. Curve",
        ],
      },
      "Metering Devices": { activities: ["Acc. Calibration", "Func. Verif."] },
      "Surge Arrester": { activities: ["Ins. Resist.", "Leak. Current"] },
    },
  },
  "HV SWGR": {
    items: {
      General: {
        activities: [
          "Sec. Injection",
          "Pri. Injection",
          "Settings Verif.",
          "Communication",
          "Contact Resist.",
        ],
      },
      Overcurrent: {
        activities: [
          "Pickup",
          "Timing",
          "Char. Curve",
          "Ins. Resist.",
          "Burden",
        ],
      },
      Differential: {
        activities: [
          "Rat/Ph Angle",
          "Slope Char.",
          "Harm. Restr.",
          "Ins. Resist.",
          "Functional",
        ],
      },
      Distance: {
        activities: ["Impedance", "Zone Timing", "Directional", "Polarization"],
      },
      "Earth Fault": { activities: ["Pickup", "Timing", "Ins. Resist."] },
      "Directional OC": { activities: ["Discrimination", "Pickup", "Timing"] },
      Underfreq: { activities: ["Pickup", "Timing", "Change Rate"] },
      Undervolt: { activities: ["Pickup", "Timing"] },
      "Motor Prot.": {
        activities: [
          "Starting Time",
          "Stall Prot.",
          "Thermal OL",
          "Unbal./Ph Loss",
        ],
      },
      "Trafo Diff.": {
        activities: ["CT Polarity", "Inrush Restraint", "Bias Charact."],
      },
      "Gen. Prot.": { activities: ["Exc. Loss", "Reverse Power", "Stator EF"] },
      Recloser: {
        activities: ["Reclose Interval", "No. of Reclose", "Lockout"],
      },
      Synchronizing: {
        activities: ["Volt. Matching", "Phase Angle", "Freq. Matching"],
      },
      Check: { activities: ["Voltage Presence", "Synch. Check"] },
      "Circuit Breaker": {
        activities: [
          "Contact Resist.",
          "Timing Open-Close",
          "Ins. Resist.",
          "Coil Pickup",
          "SF6 Gas Press.-Purity",
          "Vacuum Integrity",
          "Mech. Operation",
        ],
      },
      "Lockout Relay": {
        activities: ["Func. Trip-Reset", "Contact Resist.", "Coil Pickup"],
      },
      Contactor: {
        activities: [
          "Pickup-Dropout",
          "Contact Resist.",
          "Ins. Resist.",
          "Mech. Endurance",
        ],
      },
      MCB: {
        activities: ["Trip Time SC-OL", "Ins. Resist.", "Mech. Operation"],
      },
      "Disconnect Switch": {
        activities: ["Contact Resist.", "Ins. Resist.", "Mech. Interlock"],
      },
      "Current Transformer": {
        activities: [
          "Ratio",
          "Polarity Verif.",
          "Burden",
          "Ins. Resist.",
          "Sat. Curve",
        ],
      },
      "Voltage Transformer": {
        activities: [
          "Ratio",
          "Polarity Verif.",
          "Burden",
          "Ins. Resist.",
          "Sat. Curve",
        ],
      },
      "Metering Devices": { activities: ["Acc. Calibration", "Func. Verif."] },
      "Surge Arrester": { activities: ["Ins. Resist.", "Leak. Current"] },
    },
  },
  "LV SWGR": {
    items: {
      "Distribution Board": {
        activities: [
          "Ins. Resist.",
          "Busbar Tightness",
          "Volt. Stability",
          "Phase Seq. Verif.",
          "Func. Breaker-RCD Coord.",
        ],
      },
      MCCB: {
        activities: [
          "Trip Time SC-OL",
          "Ins. Resist.",
          "Contact Resist.",
          "Mech. Operation",
        ],
      },
      ACB: {
        activities: [
          "Contact Resist.",
          "Timing Open-Close",
          "Ins. Resist.",
          "Trip Unit Cal.",
        ],
      },
      "Capacitor Bank": {
        activities: [
          "Cap. Measurement",
          "Harm. Dist. Analysis",
          "Switch. Transient",
          "Ins. Resist.",
        ],
      },
      UPS: {
        activities: [
          "Battery Capacity",
          "Trans. Time Grid-Batt.",
          "Out. Volt. Stability",
          "Harm. Analysis",
        ],
      },
      "Earth Fault": {
        activities: ["Earth Fault Pickup", "Trip Timing", "Ins. Resist."],
      },
      "Distribution Board2": {
        activities: ["Circuit ID", "Load Bal. Verif.", "Func. MCB-RCD Op."],
      },
      "Motor Control Center": {
        activities: ["Starter Cont. Op.", "OL Relay Cal.", "Phase Loss Det."],
      },
      "Surge Device": {
        activities: ["Leak. Current", "Ins. Resist.", "Func. Surge Suppr."],
      },
      Metering: { activities: ["Acc. Cal.", "Func. V-I-PF Meas."] },
      "Earthing System": {
        activities: ["Ground Resist.", "Cont. Equip. Bonding"],
      },
    },
  },
  "POWER TRAFO": {
    items: {
      "Power Transformer": {
        activities: [
          "Ins. Resist.",
          "Wind. Resist.",
          "Turns Ratio",
          "Mag. Current",
          "Dielec. Absorp.",
          "Diss. Gas Analysis",
          "Sweep Freq. Resp.",
        ],
      },
      Bushing: {
        activities: ["Tan Delta", "Cap. Measurement", "Ins. Resist."],
      },
      "Tap Changer (OLTC/De-Energized)": {
        activities: [
          "Contact Resist.",
          "Timing Op.",
          "Func. Sequence",
          "Oil Quality",
        ],
      },
      "Cooling System": {
        activities: ["Pump-Fan Op.", "Oil Flow Verif.", "Temp. Control"],
      },
      "Protection Devices": {
        activities: ["Buchholz Alarm", "Press. Relief ", "Wind. Temp. Alarm"],
      },
      "Neutral Grounding": { activities: ["Ground Resist.", "Continuity"] },
      "Surge Arrester": { activities: ["Ins. Resist.", "Leak. Current"] },
      "Control Panel": {
        activities: ["Alarm Indic.", "Trip Circuit", "Volt. Regulation"],
      },
      "Oil Management": {
        activities: ["Moist. Content", "Dielec. Strength", "Acidity"],
      },
      General: {
        activities: ["Visual Insp.", "Tight. Check", "Polarity Verif."],
      },
    },
  },
  "DIST. TRAFO": {
    items: {
      "Power Transformer": {
        activities: [
          "Ins. Resist.",
          "Wind. Resist.",
          "Turns Ratio",
          "Mag. Current",
          "Dielec. Absorp.",
          "Diss. Gas Analysis",
          "Sweep Freq. Resp.",
        ],
      },
      Bushing: {
        activities: ["Tan Delta", "Cap. Measurement", "Ins. Resist."],
      },
      "Tap Changer (OLTC/De-Energized)": {
        activities: [
          "Contact Resist.",
          "Timing Op.",
          "Func. Sequence",
          "Oil Quality",
        ],
      },
      "Cooling System": {
        activities: ["Pump-Fan Op.", "Oil Flow Verif.", "Temp. Control"],
      },
      "Protection Devices": {
        activities: ["Buchholz Alarm", "Press. Relief ", "Wind. Temp. Alarm"],
      },
      "Neutral Grounding": { activities: ["Ground Resist.", "Continuity"] },
      "Surge Arrester": { activities: ["Ins. Resist.", "Leak. Current"] },
      "Control Panel": {
        activities: ["Alarm Indic.", "Trip Circuit", "Volt. Regulation"],
      },
      "Oil Management": {
        activities: ["Moist. Content", "Dielec. Strength", "Acidity"],
      },
      General: {
        activities: ["Visual Insp.", "Tight. Check", "Polarity Verif."],
      },
    },
  },
  COMPONENT: {
    items: {
      "Circuit Breaker": {
        activities: [
          "Contact Resist.",
          "Timing Open-Close",
          "Ins. Resist.",
          "Coil Pickup",
          "SF6 Gas Press.-Purity",
          "Vacuum Integrity",
          "Mech. Operation",
        ],
      },
      "Lockout Relay": {
        activities: ["Func. Trip-Reset", "Contact Resist.", "Coil Pickup"],
      },
      Contactor: {
        activities: [
          "Pickup-Dropout",
          "Contact Resist.",
          "Ins. Resist.",
          "Mech. Endurance",
        ],
      },
      MCB: {
        activities: ["Trip Time SC-OL", "Ins. Resist.", "Mech. Operation"],
      },
      "Disconnect Switch": {
        activities: ["Contact Resist.", "Ins. Resist.", "Mech. Interlock"],
      },
      "Current Transformer": {
        activities: [
          "Ratio",
          "Polarity Verif.",
          "Burden",
          "Ins. Resist.",
          "Sat. Curve",
        ],
      },
      "Voltage Transformer": {
        activities: [
          "Ratio",
          "Polarity Verif.",
          "Burden",
          "Ins. Resist.",
          "Sat. Curve",
        ],
      },
      "Metering Devices": { activities: ["Acc. Calibration", "Func. Verif."] },
      "Surge Arrester": { activities: ["Ins. Resist.", "Leak. Current"] },
    },
  },
  RELAY: {
    items: {
      Overcurrent: {
        activities: [
          "Pickup",
          "Timing",
          "Characteristic Curve",
          "Insulation Resistance",
        ],
      },
      Differential: {
        activities: [
          "Ratio/Phase Angle",
          "Slope Characteristic",
          "Harmonic Restraint",
          "Insulation Resistance",
        ],
      },
      Distance: {
        activities: ["Impedance", "Zone Timing", "Directional", "Polarization"],
      },
    },
  },
  RMU: {
    items: {
      "Main Unit": {
        activities: [
          "Insulation Resistance",
          "Timing Open-Close",
          "Contact Resistance",
          "Gas Pressure",
          "Functional Interlock",
        ],
      },
      Protection: { activities: ["Pickup", "Timing", "Insulation Resistance"] },
    },
  },
  "LOW CURRENT": {
    items: {
      SCADA: {
        activities: [
          "Point-to-Point Communication",
          "Time Synchronization",
          "Failover Redundancy",
          "Alarm-Trip Integration",
        ],
      },
      "Fault Recorder": {
        activities: [
          "Time Synchronization",
          "Event Sequence",
          "Data Retrieval",
          "Storage Capacity",
        ],
      },
      "Battery Bank": {
        activities: [
          "Capacity Discharge",
          "Voltage Stability",
          "Float-Charge Efficiency",
          "Ground Fault Detection",
        ],
      },
    },
  },
};
